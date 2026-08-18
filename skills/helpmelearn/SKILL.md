---
name: helpmelearn
description: Guided learning workflow — takes a subject from "I want to learn X" to a personalized Pandoc-built textbook and a tutored learning loop, through 6 phases (intake, placement quiz, syllabus, book bootstrap, learning loop, graduation). Quizzes interactively, tracks progress and weak spots, exports HTML/PDF/EPUB. Use when the user wants to learn something, continue learning, or asks "where were we" about learning. Detects current phase from the filesystem and resumes.
argument-hint: "[status | next | quiz | review | deepdive <topic> | build | redo <phase-number>]"
---

# helpmelearn — guided learning workflow

Guide the user from "I want to learn X" to a finished, personalized textbook they've actually worked through — one phase at a time.

**This skill is fully self-contained.** All phase definitions, quiz mechanics, and templates live in [phases.md](phases.md) in this skill folder. Never depend on any file outside this folder for workflow rules.

Core model: `learning/` is the study workspace for **one subject per project directory**. The book inside it is a Pandoc project that accretes module by module, and **the book adapts to the learner, not the other way around** — the placement quiz shapes the syllabus, and each module's quiz results calibrate the next module. Writing stays ahead of reading (the next module lands before the current one is finished), so the learner never waits on generation. `progress.md` is the learner's record; if a chapter isn't quizzed there, it isn't learned.

**Pandoc is a hard dependency.** Check for it before scaffolding (Step 2) and again on entering phase 4. If missing, offer to install (`brew install pandoc` / `apt install pandoc` / `pkg install pandoc` on Termux) or ask the user to. PDF output additionally needs a PDF engine (`tectonic`, `pdflatex`, or `wkhtmltopdf`) — if none is found, offer to install `tectonic`, and until one exists build HTML + EPUB only and say so; never let a missing LaTeX stack block the workflow.

## Invocation modes

- **(no args)** — detect state, then resume the active phase
- **`status`** — detect state, report it (phase, chapter, last quiz score, weak spots), stop. No work.
- **`next`** — advance the loop: study the current chapter, or quiz it, or write the next one — whatever `progress.md` says comes next.
- **`quiz`** — quiz the current chapter (or a named one: `quiz 3`).
- **`review`** — spaced review: re-quiz items from the weak-spots list.
- **`deepdive <topic>`** — deep, personalized explanation of one topic, in the book's voice and calibrated to the learner's level. This is the in-session version of the book's Prompt boxes.
- **`build`** — re-run `book/build.sh` to refresh `book/dist/`.
- **`redo <n>`** — reopen completed phase n: flip its status back and resume it. Warn that later phases may need revisiting (a redone placement quiz can invalidate the syllabus; a redone syllabus can orphan chapters).

## Step 1 — Detect state (always, before anything else)

The filesystem is the state. No memory needed.

1. Look for `learning/` in the project root. Missing → offer to scaffold (Step 2), then start phase 1.
2. Otherwise check deliverables in order (see [phases.md](phases.md)):
   - `profile.md` / `assessment.md` / `syllabus.md` — missing → phase not started; `Status: in-progress` → phase active; `Status: done` → complete.
   - `progress.md` — missing → phase 4 not started. Its `Status:` line tracks the rest: `bootstrapping` → phase 4 active; `learning` → phase 5 active; `graduating` → phase 6 active; `graduated` → the workflow is complete.
3. Active phase = the first phase that is not complete.
4. Report a one-line orientation before working, e.g.:
   > Phase 5 (learning loop) is active — chapter 4 of 9 is next; chapter 3 quizzed at 6/10, recursion flagged as a weak spot. Want to review it before moving on?

## Step 2 — Scaffold (when structure is missing)

Check pandoc first (see above). Then ask once before creating files, and create whatever is missing (never overwrite existing files):

```
learning/
├── profile.md       # phase 1 — who's learning, and what for
├── assessment.md    # phase 2 — placement quiz record + verdict
└── syllabus.md      # phase 3 — approved table of contents
```

Each stub comes from its template in [phases.md](phases.md) and starts with `Status: in-progress`. `book/` and `progress.md` are **not** stubbed — they get built during phase 4.

## Step 3 — Work the active phase

Read the active phase's section in [phases.md](phases.md), then:

- **Ask questions 1–2 at a time**, conversationally. Never dump a full question list or a full quiz at once. Use AskUserQuestion for multiple-choice (quiz questions, discrete preferences); free-form chat for open-ended ones.
- **Capture as you go** — write answers, quiz results, and verdicts into the phase's deliverable continuously, not at the end.
- **Quizzes are honest**: never reveal an answer before the user attempts the question; after their attempt, always explain *why*, not just which option was right. Adapt difficulty live — acing it → harder, struggling → easier and slower.
- **Build phase artifacts** where the phase calls for them (the book scaffold and chapters in phase 4+; see [phases.md](phases.md)). Re-run `book/build.sh` after every chapter lands so `book/dist/` always holds a current, readable book.

## Step 4 — Gate before advancing

Each phase has a "done when" criterion in [phases.md](phases.md). When it looks met:

1. Restate the criterion and ask the user to confirm phase exit. **The user is the gatekeeper — never self-approve.** The syllabus gate (end of phase 3) is the big one: nothing gets written into the book until the user approves the table of contents.
2. On confirmation: flip the deliverable's `Status:` line, announce the next phase in one line.
3. If the user wants to skip ahead or work out of order: **warn once** (name what's incomplete and the risk — e.g. a book written without a placement quiz is calibrated blind), then comply. This skill is a guide, not a cop.

## Step 5 — The learning loop (phase 5 rhythm)

Every session in phase 5 follows the same rhythm, driven by `progress.md`:

1. **Orient** — one line: where they are, last quiz score, standing weak spots.
2. **Review first** — if weak spots exist, offer to re-quiz 1–2 old items before new material (spaced repetition). Log the result; an item answered correctly twice across different sessions comes off the list.
3. **Offer both study modes** for the current chapter, every time:
   - **Self-study** — "read the chapter (open `book/dist/book.html` or the PDF), come back with questions." Answer questions against the chapter's content, going deeper than the book where needed.
   - **Active mode** — for when they don't feel like reading: teach the chapter conversationally, Socratic back-and-forth — short explanation, then a probing question, adjust from their answer — until the ideas land.
4. **Quiz the chapter** when the user feels ready. Score it into `progress.md`; wrong answers become weak-spot entries (concept, not question).
5. **Project checkpoints** — when the syllabus puts a project here: set it up, let the user build it themselves, review their work honestly, and only mark it done when it actually works. Don't build it for them — hints before answers.
6. **Keep the writing ahead of the reading** — when the user *starts* the last chapter of module N, write all of module N+1 in one batch, calibrated to module N's quiz history (shaky prerequisites → open with a bridging recap; consistently strong → tighten the pace). Batching per module means the next module is always waiting when the current one finishes — the user never sits through generation. If a quiz result contradicts an assumption in an already-written unread chapter, patch that chapter surgically before the user reads it. Re-run `build.sh` after any writing.

When every syllabus chapter is quizzed and every project is done, offer graduation (phase 6). Not before — but if the user wants to graduate early, warn once and comply.

## Step 6 — Graduation (phase 6)

The finish line is the definitive export — the book as a *deliverable*, not just a side effect:

1. **Final comprehensive quiz** — spanning the whole syllabus, weighted toward historical weak spots. Score into `progress.md`.
2. **Closing chapter** — written with hindsight: what this learner found hard and how they got past it, what they're now equipped to build, and a concrete "learn next" path.
3. **Appendix** — the learner's journey: per-chapter quiz scores, the weak-spots history, projects built.
4. **Polished export** — finalize `metadata.yaml` (title, author = the learner, date), re-run `build.sh` for clean HTML + EPUB (+ PDF when an engine exists) in `book/dist/`.
5. Flip `progress.md` to `Status: graduated` and hand over the book — that's the artifact they walk away with.

## Rules

- Filesystem is the only state — always re-detect, never assume.
- Never overwrite user content; append and edit surgically.
- One phase at a time; questions and quiz items in small doses.
- Never reveal a quiz answer before the attempt; always explain after it.
- Calibrate constantly — the quiz history is there to be used, not just recorded.
- Projects are the user's to build — guide and review, don't do.
- Warn on skipping, never block.
- All workflow knowledge lives in this folder — keep it portable (copying `.claude/skills/helpmelearn/` to another machine/project must be sufficient).
