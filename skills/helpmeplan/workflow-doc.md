# Template: WORKFLOW.md

When the user accepts the offer to generate project documentation (SKILL.md Step 2), write this to `WORKFLOW.md` in the project root, adapting examples to the project type. This file is documentation for humans — the skill never reads it back; [phases.md](phases.md) stays the source of truth.

---

# Planning & Brainstorming Workflow

How this project goes from idea → design → code, guided by the `/helpmeplan` skill.
Core idea: **`planning/` is the "src", `SPEC.md` is the "dist".** Phases are working files (messy is fine); the spec is the distilled output — the only thing coding needs to read.

## Structure = timeline

```
planning/                 # "src" of planning — one folder per phase, in order
├── 1-brainstorm/ideas.md
├── 2-scope/scope.md
├── 3-design/             # brand.md + styleguide.html
├── 4-mockups/            # one mockup file per UI surface (.html, or transcripts for text UIs)
├── 5-architecture/architecture.md
└── decisions.md          # running log: one line per decision + why
SPEC.md                   # "dist" — distilled build plan, output of all 5 phases
src/                      # real code, built from SPEC.md only
```

**Work happens in `planning/`, conclusions get promoted to `SPEC.md`. If it's not in the spec, it doesn't get built.**

## Phases at a glance

| # | Phase        | Deliverable                    | Done when…                                        |
|---|--------------|--------------------------------|---------------------------------------------------|
| 1 | Brainstorm   | `ideas.md`                     | Ideas run dry                                     |
| 2 | Scope        | `scope.md` (v1 / later / no)   | v1 list fits in one sentence per feature          |
| 3 | Design       | `brand.md` + `styleguide.html` | Styleguide looks right in light AND dark          |
| 4 | Mockups      | one mockup file per UI surface | "I'd be happy if the real thing looked like this" |
| 5 | Architecture | `architecture.md`              | Every mockup element maps to a component/API      |
| — | **Spec**     | `SPEC.md`                      | A stranger could build the project from it alone  |

Each deliverable starts with a `Status: in-progress` line that flips to `done` when the phase gate is confirmed — that's how `/helpmeplan` knows where to resume.

## Rules of the road

- Work in `planning/`, promote conclusions to `SPEC.md`. The spec is the contract.
- **Mockups are throwaway.** Never upgrade mockup files into real code — rebuild cleanly with the mockup as reference.
- Log every decision in `planning/decisions.md` — one line + why.
- Don't skip phases without a reason; each has a "done when" gate.
- Once coding starts: if reality forces a change, update SPEC.md first, then the code.

## Usage

- `/helpmeplan` — resume wherever planning left off
- `/helpmeplan status` — where are we?
- `/helpmeplan spec` — distill SPEC.md now
- `/helpmeplan redo <n>` — reopen a completed phase
