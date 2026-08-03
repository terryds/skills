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

Then `spec/` is distilled from all of it — quality bar: *a stranger could build the project from it alone, in roadmap order.* Once the spec ships, the skill offers to generate an `overnight.sh` that launches Claude Code unattended (detached tmux, `bypassPermissions` mode) to build the spec while you sleep, leaving a `MORNING-REPORT.md` to check the next morning.

## License

[MIT](LICENSE)
