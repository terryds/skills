# search-console

A small read-only Google Search Console client. One dependency-free
[Bun](https://bun.sh) script, `bin/gsc`, plus an agent skill ([SKILL.md](SKILL.md))
that knows how to drive it.

```bash
npx skills@latest add terryds/skills --skill search-console
```

Everything runs against the `webmasters.readonly` OAuth scope, so no command can
write, submit, or delete anything in Search Console.

## Setup

1. **Google Cloud Console** — create or pick a project, enable the **Google
   Search Console API**, create a service account, then Keys → Add key → JSON.
2. **Search Console** — open the property → Settings → Users and permissions →
   add the service account's `…@….iam.gserviceaccount.com` email with
   **Restricted** access.
3. Save the downloaded JSON as `data/gsc-credentials.json` (mode 600). It's
   gitignored. Override the location with `GSC_CREDENTIALS=/path/to/key.json`.

If `bin/gsc sites` returns no rows, step 2 was skipped: the key is valid but
isn't attached to any property.

## Usage

```bash
bin/gsc sites                     # properties and permission level
bin/gsc query <site> [flags]      # search performance rows
bin/gsc compare <site> [flags]    # this period against the one before it
bin/gsc quick-wins <site>         # high impressions, ranking just off page one
bin/gsc inspect <site> <url>      # index status for a single URL
bin/gsc sitemaps <site>           # submission dates, error and warning counts
```

`<site>` must match the property string exactly as `gsc sites` prints it —
`sc-domain:example.com` for a domain property, `https://example.com/` for a URL
prefix. A mismatch returns 403 rather than an empty result.

Shared flags: `--days N` (default 28), `--start`/`--end`, `--limit N`, `--json`,
`--type web|image|video|news|discover`.

`query` takes `--dim` (`query,page,country,device,date,searchAppearance`,
comma-separated to break down by several at once). `compare` takes `--losers` to
sort by steepest decline instead of largest absolute move; its prior window is
the same length as the current one, including with `--start`/`--end`. `quick-wins` takes
`--positions 8-20` and `--min-impressions 100`.

Filters chain with a double comma:

```bash
bin/gsc query sc-domain:example.com --filter "query:contains:flight,,country:equals:idn"
bin/gsc query sc-domain:example.com --filter "query:includingRegex:^(how|what|why)"
```

Operators: `contains`, `notContains`, `equals`, `notEquals`, `includingRegex`,
`excludingRegex`. Countries are three-letter lowercase codes (`idn`, `usa`).

## Notes on the data

- Search Console lags about two days. Windows end two days back, so `--days 28`
  means the 28 days ending then — not ending today.
- Google samples and anonymizes rows, so summing a dimension gives less than the
  property total. A dimension sum is not total site traffic.
- `compare` keeps keys that disappeared entirely (clicks drop to 0); those are
  usually the most important losses. A `—` position means absent that period.
