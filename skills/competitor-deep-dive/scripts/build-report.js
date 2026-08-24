#!/usr/bin/env node
// Assemble the final neobrutalist tabbed report from:
//   - raw scraper outputs: <data-dir>/meta_ads.json, google_ads.json, tiktok_ads.json
//     (each optional — a missing file means "not scraped / no presence", handled gracefully)
//   - <data-dir>/content.json — the analyst-authored narrative and table
//     content (see content.example.json in this folder for the exact shape).
//     This is the part that requires judgment and is NOT auto-generated —
//     write it per-run based on what was actually found in each tab.
//
// Usage: node build-report.js <data-dir> <dist-dir>
//
// Output: <dist-dir>/index.html, ads.csv, seo.csv, product.csv, gtm.csv,
// plus copies the media/ folders from each scraper's output into
// <dist-dir>/media/{meta,google,tiktok}/ ready to publish as-is via here.now.

const fs = require('fs');
const path = require('path');

const [dataDir, distDir] = process.argv.slice(2);
if (!dataDir || !distDir) {
  console.error('Usage: node build-report.js <data-dir> <dist-dir>');
  process.exit(1);
}

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p)); } catch { return fallback; }
}
function esc(s) { return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function csvEscape(s) {
  const str = String(s ?? '');
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}
function toCsv(rows, headers) {
  return [headers.join(','), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(','))].join('\n');
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dest, f));
}

const content = readJson(path.join(dataDir, 'content.json'), null);
if (!content) {
  console.error(`Missing ${path.join(dataDir, 'content.json')} — see content.example.json for the required shape.`);
  process.exit(1);
}

const metaAds = readJson(path.join(dataDir, 'meta_ads.json'), []);
const googleAds = readJson(path.join(dataDir, 'google_ads.json'), []);
const tiktokData = readJson(path.join(dataDir, 'tiktok_ads.json'), { ads: [] });

fs.mkdirSync(distDir, { recursive: true });
copyDir(path.join(dataDir, 'meta_media'), path.join(distDir, 'media/meta'));
copyDir(path.join(dataDir, 'google_media'), path.join(distDir, 'media/google'));
copyDir(path.join(dataDir, 'tiktok_media'), path.join(distDir, 'media/tiktok'));
const metaFiles = fs.existsSync(path.join(distDir, 'media/meta')) ? fs.readdirSync(path.join(distDir, 'media/meta')) : [];
const googleFiles = fs.existsSync(path.join(distDir, 'media/google')) ? fs.readdirSync(path.join(distDir, 'media/google')) : [];

// ---------- Ad cards ----------
const metaCards = metaAds.slice(0, content.adsMetaCap || 10).map((ad) => {
  const file = metaFiles.find((f) => f.startsWith(ad.libraryId));
  const copy = esc(ad.snippet.replace(/^.*?Sponsored/, '').replace(/\s+/g, ' ').trim().slice(0, 220));
  const media = file
    ? file.endsWith('.mp4')
      ? `<video controls preload="metadata" src="media/meta/${file}"></video>`
      : `<img src="media/meta/${file}" alt="ad creative">`
    : '<p class="nomedia">No media</p>';
  const libUrl = `https://www.facebook.com/ads/library/?id=${ad.libraryId}`;
  return `<article class="card"><header><span class="badge meta">Meta</span><span class="date">${esc(ad.startedRunning || '')}</span></header><div class="media">${media}</div><p class="copy">${copy}</p><a class="lib-link" href="${libUrl}" target="_blank" rel="noopener">View in Ad Library ↗</a></article>`;
}).join('\n');

const googleCards = googleAds.map((ad) => {
  const file = googleFiles.find((f) => f.startsWith(ad.creativeId));
  let body;
  if (ad.text) {
    const lines = ad.text.split('\n').filter((l) => l && l !== 'Sponsored');
    body = `<p class="headline">${esc(lines[1] || lines[0] || '')}</p><p class="desc">${esc(lines.slice(2).join(' ').slice(0, 200))}</p>`;
  } else if (file) {
    body = `<img src="media/google/${file}" alt="ad creative">`;
  } else {
    body = '<p class="nomedia">No content captured</p>';
  }
  return `<article class="card"><header><span class="badge google">Google</span><span class="date">${esc(ad.format || '')}</span></header><div class="media">${body}</div><a class="lib-link" href="${esc(ad.url)}" target="_blank" rel="noopener">View in Transparency Center ↗</a></article>`;
}).join('\n');

const tiktokBlock = tiktokData.autocompleteMatch === false || tiktokData.ads.length === 0
  ? `<p class="finding">${esc(content.adsTiktokNote || 'No advertiser match found on TikTok Commercial Content Library.')}</p>`
  : `<div class="grid">${tiktokData.ads.map((ad) => {
      const media = ad.videoFile
        ? `<video controls preload="metadata" poster="media/tiktok/${esc(ad.thumbFile)}" src="media/tiktok/${esc(ad.videoFile)}"></video>`
        : ad.thumbFile ? `<img src="media/tiktok/${esc(ad.thumbFile)}" alt="ad thumbnail">` : '<p class="nomedia">No media</p>';
      return `<article class="card"><header><span class="badge tiktok">TikTok</span><span class="date">${esc(ad.reach || '')} users</span></header><div class="media">${media}</div><p class="copy">First shown ${esc(ad.firstShown || '?')} · Last shown ${esc(ad.lastShown || '?')}</p></article>`;
    }).join('\n')}</div>`;

const adsHtml = `
  <div class="platform-block">
    <h3>Meta (Facebook/Instagram) — ${esc(String(metaAds.length))} active ads found${content.adsMetaCap ? `, ${content.adsMetaCap} shown` : ''}</h3>
    <div class="grid">${metaCards || '<p class="finding">No ads found.</p>'}</div>
  </div>
  <div class="platform-block">
    <h3>Google Ads Transparency — ${esc(content.adsGoogleSummary || `${googleAds.length} sampled`)}</h3>
    <div class="grid">${googleCards || '<p class="finding">No ads found.</p>'}</div>
  </div>
  <div class="platform-block">
    <h3>TikTok Commercial Content Library — ${esc(content.adsTiktokSummary || `${tiktokData.ads.length} active ads`)}</h3>
    ${tiktokBlock}
  </div>`;

function csvDownload(name, label) {
  return `<a class="csv-dl" href="${name}" download>⬇ Download ${label} (.csv)</a>`;
}
function factsRow(c) {
  const founders = (c.founders || []).map((f) => f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)} ↗</a>` : esc(f.name)).join(' &amp; ');
  const year = c.yearFounded ? `${esc(c.yearFounded.value)}${c.yearFounded.sourceUrl ? ` (<a href="${esc(c.yearFounded.sourceUrl)}" target="_blank" rel="noopener">${esc(c.yearFounded.sourceLabel || 'source')} ↗</a>)` : ''}` : 'Not found';
  const employees = c.employees ? `${esc(c.employees.value)}${c.employees.sourceUrl ? ` (<a href="${esc(c.employees.sourceUrl)}" target="_blank" rel="noopener">${esc(c.employees.sourceLabel || 'source')} ↗</a>)` : ''}` : 'Not found';
  return `<table>
      <tr><th>Founders</th><th>Year founded</th><th>Estimated employees</th></tr>
      <tr><td>${founders || 'Not found'}</td><td>${year}</td><td>${employees}</td></tr>
    </table>`;
}
function snippetGrid(snippets) {
  return `<div class="snippet-grid">${snippets.map((s) => `<div class="snippet"><div class="label">${esc(s.label)}</div><div class="value">${esc(s.value)}</div></div>`).join('\n')}</div>`;
}
function rowsToTable(headers, rows, urlKey) {
  const th = `<tr>${headers.map((h) => `<th>${esc(h.label)}</th>`).join('')}</tr>`;
  const trs = rows.map((r) => `<tr>${headers.map((h) => {
    if (h.key === urlKey && r.url) return `<td><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r[h.key])} ↗</a></td>`;
    return `<td>${esc(r[h.key])}</td>`;
  }).join('')}</tr>`).join('\n');
  return `<table>${th}${trs}</table>`;
}
function recList(items) {
  return `<ol class="rec-list">${items.map((r) => `<li>${r}</li>`).join('\n')}</ol>`;
}

// ---------- CSVs ----------
const adsCsvRows = [
  ...metaAds.slice(0, content.adsMetaCap || 10).map((ad) => {
    const file = metaFiles.find((f) => f.startsWith(ad.libraryId));
    return {
      platform: 'Meta', creative_id_or_url: ad.libraryId, format: file && file.endsWith('.mp4') ? 'Video' : 'Image',
      headline_or_copy: ad.snippet.replace(/^.*?Sponsored/, '').replace(/\s+/g, ' ').trim().slice(0, 250),
      media_filename: file ? `media/meta/${file}` : '', first_shown: ad.startedRunning || '', last_shown: '', reach: '',
      library_url: `https://www.facebook.com/ads/library/?id=${ad.libraryId}`,
    };
  }),
  ...googleAds.map((ad) => {
    const file = googleFiles.find((f) => f.startsWith(ad.creativeId));
    return {
      platform: 'Google', creative_id_or_url: ad.creativeId, format: ad.format || '',
      headline_or_copy: ad.text ? ad.text.replace(/\s+/g, ' ').trim().slice(0, 250) : '',
      media_filename: file ? `media/google/${file}` : '', first_shown: '', last_shown: ad.lastShown || '', reach: '', library_url: ad.url,
    };
  }),
  ...tiktokData.ads.map((ad) => ({
    platform: 'TikTok', creative_id_or_url: `ad${ad.index}`, format: 'Video', headline_or_copy: '',
    media_filename: ad.videoFile ? `media/tiktok/${ad.videoFile}` : '', first_shown: ad.firstShown || '', last_shown: ad.lastShown || '',
    reach: ad.reach || '', library_url: 'https://library.tiktok.com/ads',
  })),
];
if (tiktokData.autocompleteMatch === false || tiktokData.ads.length === 0) {
  adsCsvRows.push({ platform: 'TikTok', creative_id_or_url: '', format: '', headline_or_copy: content.adsTiktokNote || 'No active ads found', media_filename: '', first_shown: '', last_shown: '', reach: '', library_url: 'https://library.tiktok.com/ads' });
}
fs.writeFileSync(path.join(distDir, 'ads.csv'), toCsv(adsCsvRows, ['platform', 'creative_id_or_url', 'format', 'headline_or_copy', 'media_filename', 'first_shown', 'last_shown', 'reach', 'library_url']));
fs.writeFileSync(path.join(distDir, 'seo.csv'), toCsv(content.seo.csvRows, ['keyword_or_phrase', 'source', 'count_or_context']));
fs.writeFileSync(path.join(distDir, 'product.csv'), toCsv(content.product.csvRows, ['source', 'type', 'text', 'rating', 'url']));
fs.writeFileSync(path.join(distDir, 'gtm.csv'), toCsv(content.gtm.csvRows, ['signal', 'observation', 'source_url']));

// ---------- HTML ----------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(content.company.name)} — Competitor Analysis</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink: #111111; --paper: #FBF5E9; --panel: #FFFFFF;
    --yellow: #FFD23F; --pink: #FF6B9D; --blue: #4D7FFF; --green: #2ED9A0; --orange: #FF8A3D; --purple: #B084F5;
    --shadow: 5px 5px 0 var(--ink); --shadow-sm: 3px 3px 0 var(--ink);
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif; background: var(--paper);
    background-image: radial-gradient(var(--ink) 1px, transparent 1px); background-size: 22px 22px; background-attachment: fixed;
    color: var(--ink); margin: 0;
  }
  header.page { padding: 28px 32px 20px; }
  h1 {
    font-size: 2rem; font-weight: 900; margin: 0 0 8px; display: inline-block; background: var(--yellow);
    border: 3px solid var(--ink); box-shadow: var(--shadow); padding: 6px 16px; transform: rotate(-1deg);
  }
  .sub { color: var(--ink); font-size: 0.95rem; margin: 14px 0 0; font-weight: 600; }
  nav.tabs { display: flex; gap: 10px; padding: 0 32px 20px; overflow-x: auto; flex-wrap: wrap; }
  nav.tabs button {
    background: var(--panel); border: 3px solid var(--ink); color: var(--ink); padding: 10px 18px; font-size: 0.95rem;
    font-weight: 800; cursor: pointer; white-space: nowrap; box-shadow: var(--shadow-sm); transition: transform 0.08s, box-shadow 0.08s;
  }
  nav.tabs button:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
  nav.tabs button.active { background: var(--ink); color: var(--paper); transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
  main { padding: 0 32px 70px; max-width: 1200px; margin: 0 auto; }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }
  h2 { font-size: 1.5rem; font-weight: 900; margin: 0 0 18px; text-transform: uppercase; border-bottom: 4px solid var(--ink); padding-bottom: 8px; display: inline-block; }
  h3 { font-size: 1.05rem; font-weight: 800; color: var(--ink); margin: 26px 0 12px; text-transform: uppercase; letter-spacing: 0.02em; }
  .platform-block { margin-bottom: 30px; }
  .finding { color: var(--ink); background: var(--panel); border: 3px solid var(--ink); box-shadow: var(--shadow-sm); padding: 14px 18px; font-weight: 500; margin: 12px 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
  .card { background: var(--panel); border: 3px solid var(--ink); box-shadow: var(--shadow); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .card header { display: flex; justify-content: space-between; align-items: center; }
  .badge { font-size: 0.7rem; font-weight: 800; padding: 3px 10px; border: 2px solid var(--ink); text-transform: uppercase; }
  .badge.meta { background: var(--blue); color: white; }
  .badge.google { background: var(--orange); color: var(--ink); }
  .badge.tiktok { background: var(--ink); color: var(--paper); }
  .date { font-size: 0.75rem; color: var(--ink); font-weight: 700; }
  .media video, .media img { width: 100%; border: 2px solid var(--ink); background: #000; max-height: 300px; object-fit: contain; }
  .copy, .desc { font-size: 0.85rem; color: var(--ink); margin: 0; line-height: 1.45; font-weight: 500; }
  .headline { font-weight: 800; margin: 0; color: var(--ink); font-size: 0.92rem; }
  .nomedia { color: #666; font-style: italic; font-size: 0.85rem; font-weight: 600; }
  .lib-link { font-size: 0.75rem; font-weight: 800; color: var(--ink); text-decoration: none; border-bottom: 2px solid var(--ink); align-self: flex-start; }
  .lib-link:hover { background: var(--yellow); }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.88rem; border: 3px solid var(--ink); background: var(--panel); box-shadow: var(--shadow); }
  th, td { text-align: left; padding: 10px 12px; border: 1px solid var(--ink); vertical-align: top; }
  th { background: var(--ink); color: var(--paper); font-weight: 800; text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.03em; }
  td a { color: var(--ink); font-weight: 800; text-decoration: none; border-bottom: 2px solid var(--blue); }
  td a:hover { background: var(--yellow); }
  .csv-dl {
    display: inline-block; margin: 4px 0 20px; padding: 10px 18px; background: var(--green); border: 3px solid var(--ink);
    box-shadow: var(--shadow-sm); color: var(--ink); text-decoration: none; font-size: 0.85rem; font-weight: 800;
    text-transform: uppercase; transition: transform 0.08s, box-shadow 0.08s;
  }
  .csv-dl:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
  .csv-dl:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
  .snippet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 18px; }
  .snippet { background: var(--panel); border: 3px solid var(--ink); box-shadow: var(--shadow-sm); padding: 16px; }
  .snippet:nth-child(6n+1) { border-top: 8px solid var(--pink); }
  .snippet:nth-child(6n+2) { border-top: 8px solid var(--blue); }
  .snippet:nth-child(6n+3) { border-top: 8px solid var(--orange); }
  .snippet:nth-child(6n+4) { border-top: 8px solid var(--green); }
  .snippet:nth-child(6n+5) { border-top: 8px solid var(--purple); }
  .snippet:nth-child(6n+6) { border-top: 8px solid var(--yellow); }
  .snippet .label { font-size: 0.72rem; color: var(--ink); text-transform: uppercase; font-weight: 900; letter-spacing: 0.06em; margin-bottom: 8px; }
  .snippet .value { font-size: 0.98rem; color: var(--ink); font-weight: 600; line-height: 1.4; }
  ol.rec-list { padding-left: 0; list-style: none; counter-reset: rec; }
  ol.rec-list li {
    counter-increment: rec; margin-bottom: 16px; line-height: 1.55; background: var(--panel); border: 3px solid var(--ink);
    box-shadow: var(--shadow-sm); padding: 14px 16px 14px 54px; position: relative; font-weight: 500;
  }
  ol.rec-list li::before {
    content: counter(rec); position: absolute; left: -3px; top: -3px; width: 40px; height: 40px; background: var(--yellow);
    border: 3px solid var(--ink); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem;
  }
  ol.rec-list b { color: var(--ink); background: var(--yellow); padding: 0 4px; }
  p { line-height: 1.5; font-weight: 500; }
</style>
</head>
<body>
<header class="page">
  <h1>${esc(content.company.name)} — Competitor Analysis</h1>
  <p class="sub">${esc(content.company.website)} · ${esc(content.company.legalEntity || '')} · ${esc(content.company.tagline || '')} · generated ${new Date().toISOString().slice(0, 10)}</p>
</header>
<nav class="tabs">
  <button class="active" data-tab="overview">Overview</button>
  <button data-tab="product">Product Analysis</button>
  <button data-tab="gtm">GTM</button>
  <button data-tab="ads">Ads</button>
  <button data-tab="seo">SEO</button>
  <button data-tab="recommendations">Recommendations</button>
</nav>
<main>

  <section id="overview" class="tab-panel active">
    <h2>Overview</h2>
    <p>${content.overview.paragraph}</p>
    ${factsRow(content.company)}
    ${snippetGrid(content.overview.snippets)}
  </section>

  <section id="product" class="tab-panel">
    <h2>Product Analysis</h2>
    ${csvDownload('product.csv', 'Product data')}
    <h3>Positioning &amp; features</h3>
    <p>${content.product.positioning}</p>
    <h3>Pricing</h3>
    ${rowsToTable(content.product.pricingHeaders, content.product.pricingRows)}
    <p class="finding">${content.product.pricingNote}</p>
    <h3>Reviews</h3>
    ${rowsToTable([{ key: 'source', label: 'Source' }, { key: 'rating', label: 'Rating' }, { key: 'notes', label: 'Notes' }], content.product.reviewsRows, 'source')}
    <p class="finding">${content.product.reviewsNote}</p>
  </section>

  <section id="gtm" class="tab-panel">
    <h2>Go-To-Market</h2>
    ${csvDownload('gtm.csv', 'GTM signals')}
    ${rowsToTable([{ key: 'signal', label: 'Signal' }, { key: 'observation', label: 'Observation' }], content.gtm.rows)}
  </section>

  <section id="ads" class="tab-panel">
    <h2>Ads</h2>
    ${csvDownload('ads.csv', 'All ads')}
    ${adsHtml}
  </section>

  <section id="seo" class="tab-panel">
    <h2>SEO</h2>
    ${csvDownload('seo.csv', 'SEO signals')}
    <p class="finding">"Keywords" below are on-page signals (title/meta/headings/sitemap structure) — not real search-ranking data; this report has no access to an actual rank-tracking tool.</p>
    <h3>On-page signals</h3>
    ${rowsToTable([{ key: 'element', label: 'Element' }, { key: 'content', label: 'Content' }], content.seo.onPageRows)}
    <h3>Sitemap structure</h3>
    ${rowsToTable([{ key: 'section', label: 'Section' }, { key: 'count', label: 'Count' }], content.seo.sitemapRows)}
  </section>

  <section id="recommendations" class="tab-panel">
    <h2>Recommendations</h2>
    <p>Where the openings are, grounded in what was actually found above:</p>
    ${recList(content.recommendations)}
  </section>

</main>
<script>
  document.querySelectorAll('nav.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav.tabs button').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
</script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Report written:', path.join(distDir, 'index.html'));
