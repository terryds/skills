# Skills

[![skills.sh](https://skills.sh/b/terryds/skills)](https://skills.sh/terryds/skills)

My collection of [agent skills](https://code.claude.com/docs/en/skills) for Claude Code and other coding agents. Each skill lives in its own directory under [skills/](skills/) with a `SKILL.md`.

## Install

Via [skills.sh](https://skills.sh) (works with Claude Code, Codex, and other agents — copies editable skill files into your project):

```bash
npx skills@latest add terryds/skills
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

## License

[MIT](LICENSE)
