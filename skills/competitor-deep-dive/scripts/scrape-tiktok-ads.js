#!/usr/bin/env node
// Scrape active ads for one advertiser from TikTok Commercial Content Library.
//
// Usage: node scrape-tiktok-ads.js "<Advertiser Name>" <cap> <output-dir>
//
// Quirks this script already handles (don't rediscover them):
//   - The country dropdown is a REQUIRED field before search will run at
//     all — this script always selects "All countries".
//   - The advertiser MUST be picked from the autocomplete suggestion list,
//     not just typed and submitted — the advertiser ID lives in client-side
//     session state, not the URL, so a constructed/reused URL alone will
//     not reproduce a real search on a fresh page load.
//   - If no autocomplete suggestion appears for the given name, try 2-3
//     obvious variants (with/without Inc./Ltd, with/without punctuation)
//     before concluding there's genuinely no TikTok presence — that
//     absence is itself a valid, reportable finding once actually confirmed
//     (a full keyword search returning "Total ads: 0" is the confirmation).
//   - Thumbnails are CSS background-image on .video_player divs, not <img>
//     tags. Clicking a card triggers the real <video src> to load — no
//     separate detail page/click-through needed.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [advertiserName, capArg, outDir] = process.argv.slice(2);
if (!advertiserName || !outDir) {
  console.error('Usage: node scrape-tiktok-ads.js "<Advertiser Name>" <cap> <output-dir>');
  process.exit(1);
}
const cap = parseInt(capArg, 10) || 10;
const mediaDir = path.join(outDir, 'tiktok_media');
fs.mkdirSync(mediaDir, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 1400, height: 4000 } });

  await page.goto('https://library.tiktok.com/ads', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Country dropdown — required field, pick "All countries".
  await page.mouse.click(290, 432);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('li, [role=option]')).find((e) => e.textContent.trim() === 'All countries');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  await page.fill('input[placeholder="Search by name or keyword"]', advertiserName);
  await page.waitForTimeout(1800);

  const picked = await page.evaluate((name) => {
    const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length === 0 && e.textContent.trim() === name);
    if (!el) return false;
    el.click();
    return true;
  }, advertiserName);

  if (!picked) {
    // Fall back to a plain keyword search to get a definitive 0-ads confirmation.
    await page.click('text=Search');
    await page.waitForTimeout(4000);
    const text = await page.evaluate(() => document.body.innerText);
    const totalMatch = text.match(/Total ads:\s*([\d,]+)/);
    console.log(`No autocomplete match for "${advertiserName}". Keyword search total: ${totalMatch ? totalMatch[1] : 'unknown'}`);
    fs.writeFileSync(path.join(outDir, 'tiktok_ads.json'), JSON.stringify({ advertiserName, autocompleteMatch: false, keywordSearchTotal: totalMatch ? totalMatch[1] : null, ads: [] }, null, 2));
    await browser.close();
    return;
  }

  await page.waitForTimeout(1000);
  await page.click('text=Search');
  await page.waitForTimeout(4000);
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(1000);
  }

  const bodyText = await page.evaluate(() => document.body.innerText);
  const totalMatch = bodyText.match(/Total ads:\s*([\d,]+)/);
  console.log('Total ads reported:', totalMatch ? totalMatch[1] : 'unknown');

  const cardMeta = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.video_player'));
    return cards.map((el) => {
      let container = el.parentElement;
      for (let i = 0; i < 4 && container; i++) {
        if (/First shown/.test(container.textContent)) break;
        container = container.parentElement;
      }
      const text = container ? container.textContent : '';
      return {
        firstShown: (text.match(/First shown:(\S+)/) || [])[1] || null,
        lastShown: (text.match(/Last shown:(\S+)/) || [])[1] || null,
        reach: (text.match(/Unique users seen:([\w-]+)/) || [])[1] || null,
      };
    });
  });

  const results = [];
  const count = Math.min(cap, cardMeta.length);
  for (let i = 0; i < count; i++) {
    const el = page.locator('.video_player').nth(i);
    const bg = await el.evaluate((e) => getComputedStyle(e).backgroundImage);
    const thumbUrl = (bg.match(/url\("([^"]+)"\)/) || [])[1];

    let videoUrl = null;
    try {
      await el.click({ timeout: 5000 });
      await page.waitForTimeout(1800);
      videoUrl = await page.evaluate((idx) => {
        const players = document.querySelectorAll('.video_player');
        const v = players[idx].querySelector('video');
        return v ? v.currentSrc || v.src : null;
      }, i);
    } catch (err) {
      console.log(`card ${i}: click failed — ${err.message}`);
    }

    const entry = { index: i, ...cardMeta[i], thumbUrl, videoUrl };
    if (thumbUrl) {
      try {
        const res = await page.request.get(thumbUrl);
        fs.writeFileSync(path.join(mediaDir, `ad${i}_thumb.jpg`), await res.body());
        entry.thumbFile = `ad${i}_thumb.jpg`;
      } catch (e) { console.log(`card ${i} thumb download failed:`, e.message); }
    }
    if (videoUrl) {
      try {
        const res = await page.request.get(videoUrl);
        fs.writeFileSync(path.join(mediaDir, `ad${i}_video.mp4`), await res.body());
        entry.videoFile = `ad${i}_video.mp4`;
      } catch (e) { console.log(`card ${i} video download failed:`, e.message); }
    }
    console.log(`[${i + 1}/${count}]`, entry.thumbFile ? 'thumb OK' : 'no thumb', entry.videoFile ? 'video OK' : 'no video', entry.reach);
    results.push(entry);
  }

  fs.writeFileSync(path.join(outDir, 'tiktok_ads.json'), JSON.stringify({ advertiserName, autocompleteMatch: true, totalAds: totalMatch ? totalMatch[1] : null, ads: results }, null, 2));
  await browser.close();
})();
