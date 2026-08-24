#!/usr/bin/env node
// Scrape active ads for one advertiser from Google Ads Transparency Center.
// Works with a plain headless browser — no proxy needed.
//
// Usage: node scrape-google-ads.js <domain> <cap> <output-dir>
//   domain: the advertiser's website domain (e.g. nimbusdesk.example) — searching by
//   domain is more reliable than by advertiser/brand name, since Google's
//   autocomplete often doesn't surface an advertiser entity by brand name
//   even when real ad activity exists under it. Domain search resolves the
//   legal entity (e.g. "NIMBUS DESK TECHNOLOGIES INC") automatically.
//
// Output: <output-dir>/google_ads.json and <output-dir>/media/*.png
//
// Extraction strategy, in priority order:
//   1. Capture the GetCreativeById XHR response and read the pre-rendered
//      snapshot image from field "1"."5" — covers Image ads and
//      multi-variant Text ads without any DOM scraping.
//   2. Single-variant Text ads render inside a googlesyndication.com
//      iframe — read its innerText directly.
//   3. Video ads: screenshot the iframe[src*="googlesyndication"] element
//      (no direct video URL is exposed by this platform).
//   4. Anything still empty after the first pass gets ONE serial retry with
//      longer waits — this recovers most stragglers that just needed more
//      time under load.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [domain, capArg, outDir] = process.argv.slice(2);
if (!domain || !outDir) {
  console.error('Usage: node scrape-google-ads.js <domain> <cap> <output-dir>');
  process.exit(1);
}
const cap = parseInt(capArg, 10) || 10;
const mediaDir = path.join(outDir, 'google_media');
fs.mkdirSync(mediaDir, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

async function findAdvertiserId(browser) {
  const page = await browser.newPage({ userAgent: UA });
  await page.goto(`https://adstransparency.google.com/?region=anywhere&domain=${encodeURIComponent(domain)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/advertiser/"]')).map((a) => a.href)
  );
  await page.close();
  const m = links[0] && links[0].match(/advertiser\/(AR\w+)/);
  return m ? m[1] : null;
}

async function getCreativeLinks(browser, advertiserId) {
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 1400, height: 2000 } });
  await page.goto(`https://adstransparency.google.com/advertiser/${advertiserId}?region=anywhere`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1000);
  }
  const links = await page.evaluate(() =>
    [...new Set(Array.from(document.querySelectorAll('a[href*="/creative/"]')).map((a) => a.getAttribute('href')))]
  );
  await page.close();
  return links;
}

async function processOne(browser, link, retry) {
  const creativeId = link.match(/creative\/(CR\w+)/)[1];
  const url = `https://adstransparency.google.com${link}`;
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 900, height: 900 } });
  let apiData = null;
  page.on('response', async (res) => {
    if (res.url().includes('GetCreativeById')) {
      try { apiData = JSON.parse(await res.text()); } catch {}
    }
  });
  const entry = { creativeId, url };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForFunction(() => /Format:\s*\w+/.test(document.body.innerText), { timeout: 20000 });
    await page.waitForTimeout(retry ? 3500 : 2000);
    for (let i = 0; i < 8 && !apiData; i++) await page.waitForTimeout(500);

    const bodyText = await page.evaluate(() => document.body.innerText);
    entry.format = (bodyText.match(/Format:\s*(\w+)/) || [])[1] || 'Unknown';
    entry.lastShown = (bodyText.match(/Last shown:\s*([A-Za-z]+ \d+, \d+)/) || [])[1] || null;

    const snapshotUrls = apiData && apiData['1'] && apiData['1']['5']
      ? apiData['1']['5'].map((e) => e['3'] && e['3']['2']).filter(Boolean)
          .map((html) => (html.match(/src="([^"]+)"/) || [])[1]).filter(Boolean)
      : [];

    if (entry.format === 'Text') {
      const adFrame = page.frames().find((f) => f.url().includes('googlesyndication'));
      if (adFrame) entry.text = await adFrame.evaluate(() => document.body.innerText).catch(() => null);
      if (!entry.text && snapshotUrls.length) {
        const res = await page.request.get(snapshotUrls[0]);
        const dest = path.join(mediaDir, `${creativeId}.png`);
        fs.writeFileSync(dest, await res.body());
        entry.imageFile = dest;
      }
    } else if (entry.format === 'Image') {
      if (snapshotUrls.length) {
        const res = await page.request.get(snapshotUrls[0]);
        const dest = path.join(mediaDir, `${creativeId}.png`);
        fs.writeFileSync(dest, await res.body());
        entry.imageFile = dest;
      }
    } else if (entry.format === 'Video') {
      const frameEl = await page.$('iframe[src*="googlesyndication"]');
      if (frameEl) {
        const shotPath = path.join(mediaDir, `${creativeId}.png`);
        await frameEl.screenshot({ path: shotPath }).catch(() => {});
        if (fs.existsSync(shotPath)) entry.screenshot = shotPath;
      }
    }
  } catch (err) {
    entry.error = err.message;
  }
  await page.close();
  return entry;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const advertiserId = await findAdvertiserId(browser);
  if (!advertiserId) {
    console.log(`No Google Ads Transparency advertiser found for domain "${domain}" — report this as a real 0-ads finding, don't retry indefinitely.`);
    fs.writeFileSync(path.join(outDir, 'google_ads.json'), '[]');
    await browser.close();
    return;
  }
  console.log('Advertiser ID:', advertiserId);

  const links = await getCreativeLinks(browser, advertiserId);
  console.log(`Found ${links.length} creative links, processing up to ${cap}`);

  const results = [];
  for (const link of links.slice(0, cap)) {
    const r = await processOne(browser, link, false);
    results.push(r);
    console.log(r.creativeId, r.format || 'ERROR', r.text ? 'text' : r.imageFile ? 'image' : r.screenshot ? 'screenshot' : r.error || 'NONE');
  }

  for (const entry of results) {
    if (entry.text || entry.imageFile || entry.screenshot) continue;
    console.log('retrying', entry.creativeId);
    const r = await processOne(browser, `/advertiser/${advertiserId}/creative/${entry.creativeId}?region=anywhere`, true);
    Object.assign(entry, r);
    console.log(entry.creativeId, 'retry ->', entry.text ? 'text' : entry.imageFile ? 'image' : entry.screenshot ? 'screenshot' : 'still missing');
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'google_ads.json'), JSON.stringify(results, null, 2));
  console.log(`Done. ${results.filter((r) => r.text || r.imageFile || r.screenshot).length}/${results.length} recovered.`);
})();
