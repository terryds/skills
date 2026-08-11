---
name: buildlandingpage
description: Guided landing-page workflow — takes a product idea to a finished landing page design through 5 phases (brainstorm, branding, hero section, page structure, full page). Generates style and hero options for the user to pick from, including WebGL/shader and SVG assets. Use when the user wants to create a landing page, continue landing-page work, or asks "where were we" about it. Detects current phase from the filesystem and resumes.
argument-hint: "[status | redo <phase-number>]"
---

# buildlandingpage — guided landing page workflow

Guide the user from raw product idea to a finished, self-contained landing page, one phase at a time.

**This skill is fully self-contained.** All phase definitions, questions, and templates live in [phases.md](phases.md) in this skill folder. Never depend on any file outside this folder for workflow rules.

Core model: work happens in `landing/` in the project root. Each phase produces options → the user picks → the choice is recorded and carries into the next phase. **The user picks; you never pick for them.** The final deliverable is `landing/5-page/index.html` — one self-contained file.

## Invocation modes

- **(no args)** — detect state, then resume the active phase
- **`status`** — detect state, report it, stop. No work.
- **`redo <n>`** — reopen completed phase n: flip its status back to `in-progress` and resume it. Warn that later phases build on it and may need redoing too.

## Step 1 — Detect state (always, before anything else)

The filesystem is the state. No memory needed.

1. Look for `landing/` in the project root.
2. If it doesn't exist → offer to scaffold (Step 2), then start phase 1.
3. Otherwise, for each phase in [phases.md](phases.md), check its deliverable file:
   - missing → phase not started
   - exists with `Status: in-progress` line → phase active
   - exists with `Status: done` line → phase complete
4. Active phase = the first phase that is not complete.
5. Report a one-line orientation before working, e.g.:
   > Phase 3 (hero) is active — two hero variants built, none chosen yet. Phases 1–2 done.

## Step 2 — Scaffold (when structure is missing)

Ask once before creating files, then create whatever is missing (never overwrite existing files):

```
landing/
├── 1-brainstorm/pitch.md
├── 2-branding/brand.md         # styleguide option pages get built during phase 2, not stubbed
├── 3-hero/hero.md              # hero variant pages get built during phase 3, not stubbed
├── 4-structure/structure.md
├── 5-page/                     # index.html gets built during phase 5, not stubbed
└── decisions.md
```

Each stub comes from its template in [phases.md](phases.md) and starts with `Status: in-progress` (the first line of the file).

## Step 3 — Work the active phase

Read the active phase's section in [phases.md](phases.md), then:

- **Ask questions 1–2 at a time**, conversationally. Never dump the full question list. Use AskUserQuestion for discrete choices (picking a style direction, a hero variant); free-form chat for open-ended ones (brainstorming the pitch).
- **Capture as you go** — write the user's answers into the phase's deliverable file continuously, in the user's voice, not at the end.
- **Log decisions** — whenever a real choice gets made, append one line to `landing/decisions.md`: `- [phase] decision — why`.
- **Generate options, then ask** — phases 2 and 3 are option-driven: build 2–3 genuinely distinct variants, publish each as an Artifact so the user can click through them side by side, then ask which one (or "none — here's what I want instead"). If the user rejects all options, ask what's off and generate a fresh round; never argue for a variant.
- **Design bar (phases 2–5):** load the `artifact-design` skill before building any styleguide, hero, or page file. No slop: no filler copy, no lorem ipsum, no decorative elements that don't earn their place, no stock gradient-blob clichés, no icon-grid padding. Every word and pixel must serve the pitch from phase 1. When in doubt, remove.

## Step 4 — Gate before advancing

Each phase has a "done when" criterion in [phases.md](phases.md). When it looks met:

1. Restate the criterion and ask the user to confirm phase exit. **The user is the gatekeeper — never self-approve.**
2. On confirmation: flip the deliverable's `Status:` line to `done`, announce the next phase in one line.
3. If the user wants to skip ahead or work out of order: **warn once** (name what's incomplete and the risk), then comply. This skill is a guide, not a cop.

## Rules

- Filesystem is the only state — always re-detect, never assume.
- Never overwrite user content; append and edit surgically.
- One phase at a time; questions in small doses.
- Every generated page (styleguide options, hero variants, final page) is **self-contained**: inline CSS/JS, no CDN links, no external fonts or images — system font stacks and inline SVG / data URIs / generated WebGL only. This keeps every file openable from disk and publishable as an Artifact.
- Warn on skipping, never block.
- All workflow knowledge lives in this folder — keep it portable (copying `.claude/skills/buildlandingpage/` to another machine/project must be sufficient).
