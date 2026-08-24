---
name: competitor-deep-dive
description: >
  Deep-dive competitor analysis report: given a company name or website,
  researches their ads (Meta/TikTok/Google ad libraries), SEO, GTM
  strategy, product/pricing/reviews, and synthesizes recommendations —
  deployed as a live tabbed report on here.now with a per-tab CSV
  download. Use when asked to "analyze competitor X", "do a competitor
  deep dive", "research [company] as a competitor", or "build a
  competitor report/analysis".
---

# Competitor Deep Dive

Produces one shareable report: a tabbed static site (Overview, Product
Analysis, GTM, Ads, SEO, Recommendations), each data tab backed by a
downloadable CSV, deployed to here.now.

**Input**: a company name or a website URL. If only a name is given,
resolve the canonical website first (web search); if only a URL is given,
resolve the company/brand name from the site itself (used to search the
ad libraries, which key on advertiser name, not domain).

**Scope discipline**: cap ad results at **10 per platform** (30 rows max
across Meta + TikTok + Google). This is a competitive-intelligence
snapshot, not an exhaustive archive — do not silently expand scope.

**Sequential execution** (one long agent turn, no Workflow orchestration
by default): sections build roughly in this order because later ones
reference earlier findings.

**Setup (once per machine, not per run)**: `cd
~/.claude/skills/competitor-deep-dive && npm install && npx playwright
install --with-deps chromium`. Scripts live in `scripts/`; symlink or
point `node_modules` there from any scratch working directory if running
scripts outside the skill folder itself.

## 1. Resolve identity

- Canonical website (follow redirects, prefer the marketing site over app./login. subdomains)
- Legal/advertiser name if it differs from the brand (ad libraries often
  require this — e.g. "Wise" → "WISE PAYMENTS LIMITED"). Check ad-library
  autocomplete/search suggestions to confirm the right entity before
  pulling ads.

## 2. Product Analysis tab

- Homepage: value prop headline, 3-5 headline features, hero screenshot if easy to grab
- Pricing: find `/pricing` (or nearest equivalent — `/plans`, footer link); capture tiers, prices, billing period, and whether it's self-serve or "contact sales"
- Reviews — **always check these three, every run, in this order**:
  1. **Google Business Profile** (`google.com/maps/search/<company>`) — real
     headless browser, `domcontentloaded` + a few seconds' wait. The star
     rating renders even in the signed-out "limited view"; the exact review
     *count* is gated behind sign-in — report the rating, note the count as
     unavailable rather than guess it.
  2. **App stores** (iOS App Store `?see-all=reviews&platform=iphone`, Google
     Play `play.google.com/store/apps/details?id=...`) — **use a real
     Playwright browser, not WebFetch**. WebFetch cannot execute JS, and
     both of these are client-rendered — it will report empty/truncated
     content and look like the site is bot-gated when it isn't. A plain
     `chromium.launch({headless:true})` with a desktop UA and
     `waitUntil:'domcontentloaded'` (not `'networkidle'` — App Store never
     fully idles) gets real star ratings, review counts, and review text
     with zero friction. If Play Store shows no rating widget at all, that
     itself is a real, reportable finding (not every listing has one).
  3. **G2 / Capterra / Trustpilot** — start with a web search summary
     (`"<company>" reviews site:g2.com OR site:capterra.com OR
     site:trustpilot.com`); if a real rating doesn't surface that way, try
     the same real-browser approach as the app stores before concluding
     there's no listing — don't assume bot-gating without testing it.
  - Say plainly when a source has no listing or no visible rating — never
    estimate a count or score that isn't explicitly shown.
  - Synthesize overall sentiment + 3-5 notable quotes with source links once
    the above is gathered.
- Feeds `content.json`'s `product` block (see step 10) — CSV is built automatically by `build-report.js` from `content.product.csvRows`: `source, type(feature/pricing/review), text, rating(if any), url`

## 3. GTM tab

Four signals, inferred from the site itself — do not re-collect data that
belongs in Ads/SEO, just reference it qualitatively once those tabs exist:

- **Sales motion**: self-serve signup vs. demo-gated — read the primary CTA on homepage/pricing
- **ICP / target segment**: who the copy, case studies, and customer logos are speaking to
- **Positioning & messaging**: the core value-prop headline + 2-3 differentiation claims
- **Channel mix signal**: one line synthesizing what Ads/SEO show once those tabs are built (e.g. "TikTok-heavy, UGC-style creative; thin organic footprint")

Feeds `content.json`'s `gtm` block — CSV built automatically from `content.gtm.csvRows`: `signal, observation, source_url`

## 4. Ads tab

Use the three scraper scripts — don't reimplement this by hand, every
platform-specific gotcha (bot-gating workarounds, TikTok's mandatory
country dropdown + autocomplete-only search, Google's `GetCreativeById`
trick, retry logic) is already encoded in them:

```bash
node scripts/scrape-meta-ads.js "<exact advertiser name>" <country-code> 10 <data-dir>
node scripts/scrape-google-ads.js <domain> 10 <data-dir>
node scripts/scrape-tiktok-ads.js "<advertiser name>" 10 <data-dir>
```

- **Meta**: the advertiser name must match the "Sponsored" byline
  *exactly* (often the legal entity, not the brand — e.g. "WISE PAYMENTS
  LIMITED" not "Wise"). If unsure, run a keyword search first (the script
  will report 0 matches if the name is wrong) and read a real hit's
  byline before re-running with the exact string.
- **Google**: search by domain, not advertiser name — far more reliable,
  and resolves the legal entity automatically.
- **TikTok**: if the advertiser name has no autocomplete match, the
  script falls back to a plain keyword search to get a definitive
  "Total ads: 0" confirmation before reporting no presence — don't
  conclude absence from autocomplete alone.
- Each script downloads media locally (images/video) rather than linking
  platform CDN URLs directly — those are signed and expire in days;
  self-hosting keeps the report durable for its here.now lifetime.
- Outputs land in `<data-dir>/{meta,google,tiktok}_ads.json` and
  `<data-dir>/{meta,google,tiktok}_media/` — `build-report.js` (step 10)
  reads these directly.

CSV (`ads.csv`, built automatically): `platform, creative_id_or_url, format, headline_or_copy, media_filename, first_shown, last_shown, reach(TikTok only), library_url`

## 5. SEO tab

- Fetch `/sitemap.xml` (or `/sitemap_index.xml`); count URLs, bucket by
  path segment (blog/, product pages, docs/, etc.)
- Homepage `<title>`, meta description, H1s, and (rare but check) meta
  keywords
- "Top keywords" here means **on-page keyword signals** — repeated terms
  in title/meta/headings/body copy — not real search-ranking data. State
  this scoping explicitly in the report; this skill has no access to an
  actual rank-tracking tool (Ahrefs/SEMrush/etc.), so never imply these
  numbers reflect real search volume or rank.

Feeds `content.json`'s `seo` block — CSV built automatically from `content.seo.csvRows`: `keyword_or_phrase, source(title/meta/h1/body), count_or_context`

## 6. Recommendations tab (narrative, no CSV)

Synthesize across every tab above into concrete "where we can win"
opportunities — gaps in their ads (platforms/formats they're not using),
SEO (thin sections, missing keywords), product (pricing gaps, review
complaints), and GTM (underserved segments). Ground every recommendation
in a specific finding from an earlier tab, not generic advice.

## 7. Overview tab (narrative, no CSV, built last)

One-paragraph company summary + one key snippet pulled from each of the
5 tabs above (e.g. "5,000 active TikTok ads", "self-serve PLG motion",
"142 indexed URLs, thin blog presence", "4.3★ average sentiment across
review sites", "top opportunity: no Google Search presence").

Also always research and include, each with its own hyperlinked source
(web search — Crunchbase, LinkedIn, press coverage, the company's own
About/press page are the usual finds):
- **Founders** (names; link to the source that names them)
- **Year founded**
- **Estimated employee count** (LinkedIn's "N employees" figure is usually
  the most reliable single source)

If any of the three genuinely can't be found after a real search, say so
explicitly in that spot — never estimate or guess a plausible-sounding
number.

## 8. Sourcing discipline (applies to every tab, not just Overview)

Every factual claim that came from a specific external page — reviews,
founder/employee info, academic or press citations, ad-library entries —
gets a real `<a href>` hyperlink to that source directly in the report
prose/table, not just buried in a CSV column. If you can name where a
fact came from, link it; if you can't name a specific source, don't
state it as fact.

## 9. Design

Neobrutalist by default: bold 2-3px black borders, hard offset
box-shadows (no blur — `5px 5px 0 #000` pattern), flat vibrant accent
colors (no gradients), a subtle dotted background texture, chunky
"pressed" tab-switcher buttons, numbered/badged callout cards. This is
baked into `scripts/build-report.js`'s HTML template — don't reinvent it
per run; only edit that script's CSS if the user asks for a different
look (and if they do, that's a permanent change to make there, not a
one-off tweak in a throwaway file).

## 10. Build and deploy

1. Write `<data-dir>/content.json` — the analyst-authored narrative and
   table content (Overview paragraph + facts + snippets, Product
   positioning/pricing/reviews, GTM signal rows, SEO on-page/sitemap
   rows, Recommendations). **See `scripts/content.example.json` for the
   exact required shape** — copy it and fill in real findings, don't
   improvise the schema from memory.
2. Run `node scripts/build-report.js <data-dir> <dist-dir>` — this reads
   `content.json` plus the three `*_ads.json` scraper outputs, copies
   media into `<dist-dir>/media/{meta,google,tiktok}/`, and writes
   `index.html` + all four CSVs. Don't hand-write the HTML/CSVs — this
   script is the single source of truth for both content assembly and
   the neobrutalist template together.
3. Publish via the `here-now` skill (`bash
   ~/.claude/skills/here-now/scripts/publish.sh <dist-dir> --title
   "<Company> Competitor Analysis"`)
4. **Verify before reporting done** — load the published URL with a real
   headless browser, check for JS console errors, confirm ad
   media/videos actually loaded (`readyState`/`naturalWidth`), and click
   through at least one tab switch. Don't just trust that the build
   script ran without throwing.
5. Report the live URL, the claim URL (24h anonymous expiry — mention
   this explicitly), and a one-line summary of what's in each tab.
6. **After every user-requested change to the report** (design, new
   fields, new sourcing rules, anything), update the relevant script(s)
   and/or this SKILL.md in the same turn so the next run starts from the
   improved baseline — don't let fixes live only in one report's
   throwaway build script.
