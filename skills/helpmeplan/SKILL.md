---
name: helpmeplan
description: Guided planning workflow — takes a project from brainstorm to a build-ready spec/ folder (per-area plans, project structure, M0→Mn roadmap) through 5 phases (brainstorm, scope, design, mockups, architecture). Use when the user wants to plan a project, continue planning, or asks "where were we" about planning. Detects current phase from the filesystem and resumes.
argument-hint: "[status | spec | redo <phase-number>]"
---

# helpmeplan — guided planning workflow

Guide the user from raw idea to a build-ready `spec/` folder, one phase at a time.

**This skill is fully self-contained.** All phase definitions, questions, and templates live in [phases.md](phases.md) in this skill folder. Never depend on any file outside this folder for workflow rules — the project may not have a WORKFLOW.md, and that's fine.

Core model: `planning/` is the "src" of planning (working files, messy is fine); `spec/` is the "dist" (distilled build plan — per-area plans, project structure, roadmap — the only thing coding needs). **Work happens in `planning/`, conclusions get promoted to `spec/`. If it's not in the spec, it doesn't get built.**

## Invocation modes

- **(no args)** — detect state, then resume the active phase
- **`status`** — detect state, report it, stop. No work.
- **`spec`** — jump to `spec/` distillation. If phases are incomplete, list the gaps and get explicit confirmation before proceeding.
- **`redo <n>`** — reopen completed phase n: flip its status back to `in-progress` and resume it. Warn that later phases may need revisiting.

## Step 1 — Detect state (always, before anything else)

The filesystem is the state. No memory needed.

1. Look for `planning/` and `spec/` in the project root.
2. If `planning/` doesn't exist → offer to scaffold (Step 2), then start phase 1.
3. Otherwise, for each phase in [phases.md](phases.md), check its deliverable file:
   - missing → phase not started
   - exists with `Status: in-progress` line → phase active
   - exists with `Status: done` line → phase complete
4. Active phase = the first phase that is not complete.
5. Report a one-line orientation before working, e.g.:
   > Phase 3 (design) is active — brand.md started, styleguide.html not yet built. Phases 1–2 done.

## Step 2 — Scaffold (when structure is missing)

Ask once before creating files, then create whatever is missing (never overwrite existing files):

```
planning/
├── 1-brainstorm/ideas.md
├── 2-scope/scope.md
├── 3-design/brand.md          # styleguide.html gets built during phase 3, not stubbed
├── 4-mockups/                 # mockup files (one per UI surface) get built during phase 4, not stubbed
├── 5-architecture/architecture.md
└── decisions.md
```

Each stub comes from its template in [phases.md](phases.md) and starts with `Status: in-progress` (the first line of the file). Also offer to generate a `WORKFLOW.md` in the project root from [workflow-doc.md](workflow-doc.md) — human-readable documentation of this process; the skill never reads it back.

## Step 3 — Work the active phase

Read the active phase's section in [phases.md](phases.md), then:

- **Ask questions 1–2 at a time**, conversationally. Never dump the full question list. Use AskUserQuestion for discrete choices (e.g. "blend in vs. stand out"); free-form chat for open-ended ones (brainstorming).
- **Capture as you go** — write the user's answers into the phase's deliverable file continuously, in the user's voice, not at the end.
- **Log decisions** — whenever a real choice gets made, append one line to `planning/decisions.md`: `- [phase] decision — why`.
- **Build phase artifacts** where the phase calls for them (styleguide.html in phase 3, mockup pages in phase 4). Offer to publish HTML as Artifacts for click-through review. Mockups are throwaway: never upgrade mockup files into real code.

## Step 4 — Gate before advancing

Each phase has a "done when" criterion in [phases.md](phases.md). When it looks met:

1. Restate the criterion and ask the user to confirm phase exit. **The user is the gatekeeper — never self-approve.**
2. On confirmation: flip the deliverable's `Status:` line to `done`, announce the next phase in one line.
3. If the user wants to skip ahead or work out of order: **warn once** (name what's incomplete and the risk), then comply. This skill is a guide, not a cop.

## Step 5 — Distill the spec/ folder (the final step)

When all 5 phases are done (or the user forces it via `spec`):

1. Read every deliverable in `planning/`.
2. Write a `spec/` folder in the project root:

   ```
   spec/
   ├── README.md        # entry point + index
   ├── structure.md     # planned codebase layout
   ├── roadmap.md       # build order: M0, M1, M2…
   └── plans/           # one plan file per area — named for THIS project
       └── <area>.md
   ```

   - **`README.md`** — what the project is (one paragraph), the v1 feature list one sentence each (from scope), the **Not doing** list (later/no, so scope creep stays visible), and a linked index of every other spec file.
   - **`plans/<area>.md`** — one plan file per project-relevant area. Pick the split that fits *this* project (per feature, per surface, or per subsystem — e.g. a web app might get `auth.md`, `editor.md`, `sharing.md`; a CLI might get one file per command group). Don't force a fixed set. Each plan covers: what it does and why (from scope), behavior including empty/error/working states, which mockup(s) it must look like (link them + the styleguide), which architecture components it maps to, and its edge cases and open questions.
   - **`structure.md`** — the planned file/folder layout of the real codebase as an annotated tree (what lives where and why), plus naming conventions and where new code of each kind should go. Derived from architecture; `src/` is built to match this file.
   - **`roadmap.md`** — build order as milestones **M0, M1, M2…**. M0 is the walking skeleton: project scaffold matching `structure.md` plus the thinnest end-to-end slice that actually runs. Each milestone states: goal in one line, which `plans/` files it draws from, and a verifiable **done when**. Order by dependency first, then risk — put the scariest/most load-bearing work early. Every v1 feature in README.md must appear in exactly one milestone.
3. Quality bar: *a stranger could build the project from `spec/` alone, working in roadmap order.* Read it back with that test in mind; fix gaps before presenting.
4. After coding starts: if reality forces a change, update the relevant `spec/` file first, then the code.

## Rules

- Filesystem is the only state — always re-detect, never assume.
- Never overwrite user content; append and edit surgically.
- One phase at a time; questions in small doses.
- Warn on skipping, never block.
- All workflow knowledge lives in this folder — keep it portable (copying `.claude/skills/helpmeplan/` to another machine/project must be sufficient).
