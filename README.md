# Skills

[![skills.sh](https://skills.sh/b/terryds/skills)](https://skills.sh/terryds/skills)

My collection of [agent skills](https://code.claude.com/docs/en/skills) for Claude Code and other coding agents. Each skill lives in its own directory under [skills/](skills/) with a `SKILL.md`.

## Install

Via [skills.sh](https://skills.sh) (works with Claude Code, Codex, and other agents — copies editable skill files into your project):

```bash
# all skills
npx skills@latest add terryds/skills

# a single skill
npx skills@latest add terryds/skills --skill helpmeplan

# several at once, or user-wide (~/.claude) instead of the current project
npx skills@latest add terryds/skills --skill helpmeplan helpmelearn
npx skills@latest add terryds/skills --skill pty-oauth-login --global

# see what's available without installing
npx skills@latest add terryds/skills --list
```

Or install a single skill manually by copying its folder:

```bash
git clone https://github.com/terryds/skills.git /tmp/my-skills
cp -r /tmp/my-skills/skills/helpmeplan ~/.claude/skills/helpmeplan
```

> The folder name determines the command name in Claude Code, so keep each skill's directory name as-is.

## Skills

| Skill | What it does |
|-------|--------------|
| [helpmeplan](skills/helpmeplan/) | Guided planning workflow — takes a project from brainstorm to a build-ready `spec/` folder through 5 phases: brainstorm, scope, design, mockups, architecture. Filesystem is the state; it detects where you left off and resumes. |
| [buildlandingpage](skills/buildlandingpage/) | Guided landing-page workflow — takes a product idea to a finished, self-contained landing page through 5 phases: brainstorm, branding, hero section, page structure, full page. Generates style and hero options (WebGL shaders, inline SVG) for you to pick from. Filesystem is the state; it resumes where you left off. |
| [helpmelearn](skills/helpmelearn/) | Guided learning workflow — takes a subject from "I want to learn X" to a personalized Pandoc-built textbook and a tutored learning loop through 6 phases: intake, placement quiz, syllabus, book bootstrap, learning loop, graduation. Quizzes interactively, tracks weak spots, exports HTML/EPUB/PDF. Filesystem is the state; it resumes where you left off. |
| [pty-oauth-login](skills/pty-oauth-login/) | Completes interactive CLI login/OAuth flows (`claude mcp login`, `gh auth login`, …) from a headless session — no SSH, no local terminal. Wraps the login command in a real pty, relays the authorize URL to you (approve on any device, even your phone), and feeds the pasted redirect URL back through a FIFO. |
| [competitor-deep-dive](skills/competitor-deep-dive/) | Deep-dive competitor analysis — given a company name or URL, researches their ads (Meta/TikTok/Google ad libraries via bundled Playwright scrapers), SEO, GTM, product/pricing/reviews, and synthesizes recommendations. Output is a live tabbed report on here.now with a CSV download per data tab. |

### helpmeplan

Planning happens in a `planning/` folder (the messy "src"), and conclusions get distilled into a `spec/` folder (the clean "dist" — the only thing coding needs): a `README.md` overview, per-area plan files in `plans/`, a `structure.md` for the planned codebase layout, and a `roadmap.md` with the build order from M0 (walking skeleton) onward.

```
/helpmeplan            # detect state, resume the active phase (or scaffold on first run)
/helpmeplan status     # report where planning stands, do no work
/helpmeplan spec       # jump to spec/ distillation
/helpmeplan redo 3     # reopen a completed phase
```

| # | Phase | Deliverable | Done when |
|---|-------|-------------|-----------|
| 1 | Brainstorm | `ideas.md` | Ideas run dry |
| 2 | Scope | `scope.md` | v1 fits in one sentence per feature |
| 3 | Design & branding | `brand.md` + `styleguide.html` | Styleguide looks right in light *and* dark mode |
| 4 | Mockups | One mockup file per UI surface | "I'd be happy if the real thing looked like this" |
| 5 | Architecture | `architecture.md` | Every mockup element maps to a component/API |

Then `spec/` is distilled from all of it — quality bar: *a stranger could build the project from it alone, in roadmap order.* Once the spec ships, the skill offers to generate an `overnight.sh` that launches Claude Code unattended (detached tmux, `bypassPermissions` mode) to build the spec while you sleep — everything lands in a `build/` directory (code, per-milestone `BUILD-LOG.md`, and a `MORNING-REPORT.md` to check the next morning), keeping the project root clean.

### buildlandingpage

Landing-page work happens in a `landing/` folder, one numbered phase directory each. Phases 2 and 3 are option-driven: the skill generates 2–3 genuinely distinct variants (published as Artifacts for side-by-side review) and you pick one — or reject them all and steer a new round. The final deliverable is `landing/5-page/index.html`: one self-contained file (inline CSS/JS, system fonts, inline SVG, optional WebGL shader with reduced-motion and no-WebGL fallbacks).

```
/buildlandingpage           # detect state, resume the active phase (or scaffold on first run)
/buildlandingpage status    # report where things stand, do no work
/buildlandingpage redo 2    # reopen a completed phase
```

| # | Phase | Deliverable | Done when |
|---|-------|-------------|-----------|
| 1 | Brainstorm | `pitch.md` | The pitch fits in one sentence and the selling point is sharp |
| 2 | Branding & style guide | `brand.md` + `styleguide.html` (picked from 2–3 options) | Chosen style looks right in light *and* dark mode |
| 3 | Hero section | 2–3 hero variants + `hero.md` | "That's the one" |
| 4 | Page structure | `structure.md` | You agree to the section list and order |
| 5 | Full page | `index.html` | "I'd ship this" |

Anti-slop is a hard rule throughout: no filler copy, no decorative ornament, no fake trust badges — every word and pixel serves the pitch.

### helpmelearn

Learning happens in a `learning/` folder — one subject per project directory. The book adapts to the learner, not the other way around: a placement quiz shapes the syllabus (skip what you know, target the gaps), and each chapter's quiz results calibrate the next chapter. The book is a Pandoc project (pandoc is a hard dependency; PDF needs a LaTeX engine like `tectonic`, otherwise it builds HTML + EPUB) written module-by-module, always a module ahead of where you're reading: subchapters with concept → worked example → try-it beats, real code with real output, "Go deeper" prompt boxes, chapter quizzes (answers in a separate answer key so print doesn't spoil itself), and a project per module.

```
/helpmelearn                  # detect state, resume the active phase (or scaffold on first run)
/helpmelearn status           # report where learning stands, do no work
/helpmelearn next             # advance the loop: study, quiz, or write the next chapter
/helpmelearn quiz             # quiz the current chapter
/helpmelearn review           # spaced review of weak spots
/helpmelearn deepdive <topic> # deep, level-calibrated explanation of one topic
/helpmelearn build            # re-export the book (HTML/EPUB/PDF)
/helpmelearn redo 2           # reopen a completed phase
```

| # | Phase | Deliverable | Done when |
|---|-------|-------------|-----------|
| 1 | Intake | `profile.md` | You could brief a human tutor on this learner in three sentences |
| 2 | Placement quiz | `assessment.md` | Level + known/unknown map written, and you say "that's about right" |
| 3 | Syllabus | `syllabus.md` | You approve the table of contents — nothing is written before this gate |
| 4 | Book bootstrap | `book/` scaffold + all of module 1 + `progress.md` | Build runs clean and you like the shape of the book |
| 5 | Learning loop | `progress.md` kept current | Every chapter quizzed, every project verified |
| 6 | Graduation | Polished book in `book/dist/` | Final quiz scored, closing chapter + journey appendix in, export clean |

The loop offers two study modes every session — self-study ("read the chapter, come back with questions") or active Socratic back-and-forth for days you won't read — plus spaced review of weak spots before new material. Once module 1 ships, the skill offers once to generate a `finishbook.sh` (same pattern as helpmeplan's `overnight.sh`): a detached-tmux, `bypassPermissions` Claude Code run that writes the whole remaining book unattended — trading per-module calibration for a complete draft now, with the loop patching unread chapters as your quiz results come in. Graduation is the finish line: a final comprehensive quiz, a closing chapter written with hindsight, your quiz journey as an appendix, and the finished personalized textbook as the artifact you walk away with.

### pty-oauth-login

Interactive logins (`claude mcp login <name>`, `claude auth login`, `gh auth login`, …) are raw-mode TUIs that bail with `stdin isn't a terminal` when run from a headless agent session. This skill drives their manual "paste the redirect URL" fallback without SSH:

1. Runs the login command through the bundled [pty-bridge.py](skills/pty-oauth-login/scripts/pty-bridge.py) (a small `pty.fork()` wrapper) so the CLI thinks it has a real terminal, with a FIFO as stdin so input can arrive in a later turn.
2. Extracts the authorize URL from the log and hands it to you as a tappable link — open it on *any* device (your phone is fine), approve, and the redirect to `localhost:<port>` will fail to load. That's expected.
3. You paste back the full failed-redirect URL (it still carries `?code=...&state=...`); the skill writes it into the FIFO (with the Enter keystroke as a separate write — raw-mode inputs won't submit otherwise) and verifies the credential actually stuck.

Only works for CLIs that offer a manual paste fallback; a login that *only* supports automatic local-browser redirect genuinely needs a terminal and browser on the same machine.

### competitor-deep-dive

Input is a company name or website; the skill resolves the other (ad libraries key on the *advertiser/legal* name, not the domain — e.g. "Wise" is "WISE PAYMENTS LIMITED"). It then builds six tabs in order, each grounded in the one before:

| Tab | What's in it | CSV |
|-----|--------------|-----|
| Product Analysis | Value prop, features, pricing tiers, reviews from Google Business, App Store / Play Store (real headless browser — these pages are client-rendered), and G2/Capterra/Trustpilot | `product.csv` |
| GTM | Sales motion (self-serve vs demo-gated), ICP, positioning, channel-mix signal | `gtm.csv` |
| Ads | Up to 10 ads per platform from Meta, Google, and TikTok ad libraries, with media downloaded locally (CDN URLs expire) | `ads.csv` |
| SEO | Sitemap size and section breakdown, title/meta/H1s, on-page keyword signals (explicitly *not* rank data) | `seo.csv` |
| Recommendations | "Where we can win" — every item tied to a specific finding above | — |
| Overview | One-paragraph summary, one snippet per tab, plus founders, year founded, and employee count, each hyperlinked to its source | — |

The scrapers in [scripts/](skills/competitor-deep-dive/scripts/) encode the platform gotchas (Meta's exact-byline matching, TikTok's country dropdown + autocomplete-only search, Google's `GetCreativeById` trick); `build-report.js` assembles `content.json` + scraper output into a neobrutalist static site and the CSVs, and the result is published with the `here-now` skill and verified in a real browser before it's reported done. Sourcing rule throughout: if a fact can't be linked to a source, it isn't stated as fact — no guessed review counts or headcounts.

**Setup (once):** `cd ~/.claude/skills/competitor-deep-dive && npm install && npx playwright install --with-deps chromium`.

## License

[MIT](LICENSE)
