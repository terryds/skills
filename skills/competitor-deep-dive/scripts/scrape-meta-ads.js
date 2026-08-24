#!/usr/bin/env node
// Scrape active ads for one advertiser from Meta Ad Library.
// Works with a plain headless browser + realistic UA — no proxy needed.
//
// Usage: node scrape-meta-ads.js "<Advertiser Name>" <country-code> <cap> <output-dir>
//   country-code: 2-letter ISO code Meta's Ad Library uses (e.g. US, ID, GB)
//   cap: max ads to download media for (search results themselves aren't capped —
//        the advertiser's full active count is reported regardless)
//
// Output: <output-dir>/meta_ads.json (all matched ads' metadata) and
//         <output-dir>/media/*.{jpg,mp4} (media for the first <cap> ads)
//
// IMPORTANT: the advertiser name must match EXACTLY what Meta shows as the
// "Sponsored" byline on the ad card (often the legal entity, not the brand —
// e.g. "WISE PAYMENTS LIMITED" not "Wise"). Run a keyword search first if
// unsure, read the "Sponsored" byline on real hits, then re-run with that
// exact string.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [advertiserName, countryCode, capArg, outDir] = process.argv.slice(2);
if (!advertiserName || !countryCode || !outDir) {
  console.error('Usage: node scrape-meta-ads.js "<Advertiser Name>" <country-code> <cap> <output-dir>');
  process.exit(1);
}
const cap = parseInt(capArg, 10) || 10;
const mediaDir = path.join(outDir, 'meta_media');
fs.mkdirSync(mediaDir, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 1400, height: 2000 } });

  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${encodeURIComponent(countryCode)}&q=${encodeURIComponent(advertiserName)}&search_type=keyword_unordered`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(1500);

  const ads = await page.evaluate((targetAdvertiser) => {
    const countLibraryIds = (el) => (el.textContent.match(/Library ID:/g) || []).length;
    const markers = Array.from(document.querySelectorAll('*')).filter(
      (el) => el.children.length === 0 && /Library ID:/.test(el.textContent || '')
    );
    const cards = [];
    for (const marker of markers) {
      let node = marker;
      while (node.parentElement && countLibraryIds(node.parentElement) === 1) node = node.parentElement;
      cards.push(node);
    }
    const seen = new Set();
    const results = [];
    for (const card of cards) {
      const text = card.textContent || '';
      const libIdMatch = text.match(/Library ID:\s*(\d+)/);
      if (!libIdMatch) continue;
      const id = libIdMatch[1];
      if (seen.has(id)) continue;
      seen.add(id);
      const advertiserMatch = text.match(/(?:See ad details|See summary details)([A-Za-z0-9 .,&'’!\-]+?)Sponsored/);
      const advertiser = advertiserMatch ? advertiserMatch[1].trim() : null;
      if (advertiser !== targetAdvertiser) continue;
      const startedMatch = text.match(/Started running on ([A-Za-z]+ \d+, \d+)/);
      const imgs = Array.from(card.querySelectorAll('img'))
        .map((i) => i.src)
        .filter((s) => s && s.startsWith('http') && !s.includes('static.xx.fbcdn'));
      const videos = Array.from(card.querySelectorAll('video')).map((v) => v.src || v.currentSrc).filter(Boolean);
      const sources = Array.from(card.querySelectorAll('video source')).map((s) => s.src).filter(Boolean);
      results.push({
        libraryId: id,
        startedRunning: startedMatch ? startedMatch[1] : null,
        images: [...new Set(imgs)],
        videos: [...new Set([...videos, ...sources])],
        snippet: text.slice(0, 500),
      });
    }
    return results;
  }, advertiserName);

  console.log(`Found ${ads.length} ads for "${advertiserName}"`);
  fs.writeFileSync(path.join(outDir, 'meta_ads.json'), JSON.stringify(ads, null, 2));

  for (const ad of ads.slice(0, cap)) {
    const imgFiles = ad.images.slice(1); // skip the small advertiser-avatar thumbnail
    for (let i = 0; i < imgFiles.length; i++) {
      try {
        const res = await page.request.get(imgFiles[i]);
        fs.writeFileSync(path.join(mediaDir, `${ad.libraryId}_img${i}.jpg`), await res.body());
      } catch (e) { console.log(`  ${ad.libraryId} image ${i} download failed: ${e.message}`); }
    }
    for (let i = 0; i < ad.videos.length; i++) {
      try {
        const res = await page.request.get(ad.videos[i]);
        fs.writeFileSync(path.join(mediaDir, `${ad.libraryId}_video${i}.mp4`), await res.body());
      } catch (e) { console.log(`  ${ad.libraryId} video ${i} download failed: ${e.message}`); }
    }
  }
  console.log(`Downloaded media for first ${Math.min(cap, ads.length)} ads -> ${mediaDir}`);

  await browser.close();
})();
