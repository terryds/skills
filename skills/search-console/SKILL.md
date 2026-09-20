---
name: search-console
description: >
  Read-only Google Search Console analysis through a bundled, dependency-free
  Bun CLI (`bin/gsc`): search performance by query/page/country/device/date,
  period-over-period movers, "quick win" keywords ranking just off page one,
  URL index inspection, and sitemap health. Use when asked about a site's
  Google search traffic, clicks, impressions, CTR, or rankings — "what
  queries do we rank for", "why did organic traffic drop", "which pages lost
  clicks", "find SEO quick wins", "is this URL indexed", "check our
  sitemaps" — or anything that needs real Search Console data rather than
  guesses.
---

# Search Console

`bin/gsc` (in this skill's directory) is a single Bun script with no
dependencies. It authenticates with a Google service account and mints tokens
for the `webmasters.readonly` scope only, so no command can write, submit, or
delete anything. Run it by its full path, e.g.
`~/.claude/skills/search-console/bin/gsc sites`.

Requires [Bun](https://bun.sh) on the PATH.

## Setup

Run `bin/gsc sites` first. If it prints properties, setup is done — skip this
section. If it says `No credentials at …`, walk the user through these steps
(they need a browser; you can't do them for the user):

1. **Google Cloud Console** — create or pick a project, enable the **Google
   Search Console API**, create a service account, then Keys → Add key → JSON.
2. **Search Console** — open the property → Settings → Users and permissions →
   add the service account's `…@….iam.gserviceaccount.com` email with
   **Restricted** access.
3. Save the downloaded JSON as `data/gsc-credentials.json` inside this skill's
   directory with mode 600, or point `GSC_CREDENTIALS=/path/to/key.json` at it.

The key is a secret: never print its contents, and never commit it. The
skill's `.gitignore` covers `data/gsc-credentials.json` and the token cache,
but if the skill is installed inside a project repo, confirm with
`git check-ignore` before the user commits anything, or keep the key outside
the repo and use `GSC_CREDENTIALS`.

If `sites` succeeds but lists nothing, step 2 was skipped: the key is valid
but isn't attached to any property.

## Commands

```bash
bin/gsc sites                     # properties and permission level
bin/gsc query <site> [flags]      # search performance rows
bin/gsc compare <site> [flags]    # this period against the one before it
bin/gsc quick-wins <site>         # high impressions, ranking just off page one
bin/gsc inspect <site> <url>      # index status for a single URL
bin/gsc sitemaps <site>           # submission dates, error and warning counts
```

`<site>` must match the property string exactly as `gsc sites` prints it —
`sc-domain:example.com` for a domain property, `https://example.com/` for a
URL prefix. A mismatch returns 403, not an empty result, so always run `sites`
first instead of guessing the form.

Shared flags: `--days N` (default 28), `--start`/`--end` (YYYY-MM-DD, both
required), `--limit N` (default 25), `--type web|image|video|news|discover`,
and `--json` for raw rows when you need to post-process instead of read a
table.

- `query` takes `--dim` with any of `query,page,country,device,date,searchAppearance`,
  comma-separated to break down by several at once.
- `compare` takes `--dim` too, plus `--losers` to sort by steepest decline
  instead of largest absolute move. The prior window is always the same length
  as the current one and ends the day before it starts.
- `quick-wins` takes `--positions 8-20` and `--min-impressions 100`.

Filters chain with a double comma:

```bash
bin/gsc query sc-domain:example.com --filter "query:contains:flight,,country:equals:idn"
bin/gsc query sc-domain:example.com --filter "query:includingRegex:^(how|what|why)"
```

Operators: `contains`, `notContains`, `equals`, `notEquals`, `includingRegex`,
`excludingRegex`. Countries are three-letter lowercase codes (`idn`, `usa`).

## Recipes

**"Why did traffic drop?"** Start wide, then narrow to whatever moved:

```bash
bin/gsc query <site> --dim date --days 90 --limit 90      # when did it start?
bin/gsc compare <site> --dim page --losers                # which pages lost clicks
bin/gsc compare <site> --dim query --losers --filter "page:equals:<losing url>"
bin/gsc inspect <site> <losing url>                       # did it fall out of the index?
```

A page whose clicks fell while its position held points to demand or SERP
layout changes; a position drop points to the page or a competitor; a `—`
position means it vanished from results entirely — inspect it.

**"Where are the easy SEO wins?"** `quick-wins` lists query+page pairs with
real impressions at positions 8–20. For each one worth pursuing, check what
else that page ranks for (`query --filter "page:equals:<url>"`) before
recommending title, content, or internal-link changes. Low CTR at a good
position (`query --dim page`, then eyeball CTR vs POS) is the other cheap win:
the snippet, not the ranking, is the problem.

**Brand vs non-brand.** Split with a regex filter —
`--filter "query:excludingRegex:<brand>"` — since brand queries hide whether
SEO work is actually paying off.

## Reading the data honestly

- Search Console lags about two days. Default windows end two days back, so
  `--days 28` means the 28 days ending then — not ending today. Say which
  dates a number covers when you report it.
- Google samples and anonymizes rows, so summing a dimension gives less than
  the property total. A dimension sum is not total site traffic; don't present
  it as one.
- `position` is an impression-weighted average, not a fixed rank. Small moves
  on low-impression rows are noise.
- `compare` keeps keys that disappeared entirely (clicks drop to 0); those are
  usually the most important losses.
- `inspect` is quota-limited by Google (about 2,000 URLs per property per
  day) — inspect the handful of URLs that matter, never loop over a sitemap.
