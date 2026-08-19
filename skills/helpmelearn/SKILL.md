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

## Step 5 — Offer the finish-the-book script (once, at phase 4 exit)

When phase 4's gate passes (module 1 approved, `progress.md` flipped to `learning`), offer **once** to generate `finishbook.sh` in the project root — a script the user launches before walking away. It runs Claude Code unattended in a detached tmux session to write every remaining chapter of the book, so they come back to a complete draft.

Be honest about the trade-off when offering: batch-writing the rest gives up per-module calibration — those chapters are calibrated only to the placement quiz and module 1. The learning loop compensates (the book is living until graduation, so quiz results still reshape unread chapters via surgical patches — Step 6), but a learner who wants maximum adaptivity should decline and let the loop write module by module.

What the generated script must do (same mechanics as an overnight build script):

- Run the agent in a **detached tmux session** named `writebook-<project-dir-name>` (sanitized — tmux forbids `.` and `:`); a fixed name collides when another project's script is still alive. **tmux is required** — check it's installed when generating the script; if missing, offer to install (`brew install tmux` / `apt install tmux` / `pkg install tmux` on Termux) or ask the user to. Under Termux, grab `termux-wake-lock` first.
- Launch `claude "<kickoff prompt>" --permission-mode bypassPermissions` as the **interactive TUI, not `-p` print mode** — attaching shows the live session. Capture a raw timestamped log with `tmux pipe-pane` into `learning/`.
- The kickoff prompt confines the agent to `learning/` and tells it: read `profile.md`, `assessment.md`, `syllabus.md`, `progress.md`, and every existing chapter first; write every remaining syllabus chapter matching the existing chapters' conventions exactly; **never modify chapters `progress.md` marks as read or quizzed**; after each chapter run `build.sh`, update that chapter's `progress.md` line to "written, not yet read", and append one line to `learning/WRITING-LOG.md`; when finished or blocked, write `learning/WRITING-REPORT.md` (what was written, what was skipped and why).

Template (adapt the prompt to the subject):

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock
SESSION="writebook-$(basename "$PWD" | tr -c 'a-zA-Z0-9_-' '-')"
SESSION="${SESSION%-}"
LOG="learning/writebook-$(date +%Y%m%d-%H%M).log"
PROMPT='Finish writing the book in learning/book/. First read learning/profile.md,
learning/assessment.md, learning/syllabus.md, learning/progress.md, and every
existing chapter. Then write every remaining chapter from the syllabus, matching
the existing chapters'\'' structure and conventions exactly: one NN-slug.md file
per chapter; subchapter H2 sections each running concept -> worked example (for
code, run it and include the real output — never fabricate) -> try-it exercise;
one or two "Go deeper" prompt boxes; a chapter-level Quiz with answers appended
to 99-answer-key.md; a Project section where the syllabus assigns one. Calibrate
everything to the learner profile and placement assessment. Never modify chapters
that progress.md marks as read or quizzed, and write only inside learning/. After
each chapter: run build.sh inside learning/book/, update the chapter'\''s line in
learning/progress.md to "written, not yet read", and append one line to
learning/WRITING-LOG.md. When finished or blocked, write learning/WRITING-REPORT.md:
what was written, what was skipped and why.'
command -v tmux >/dev/null 2>&1 || {
  echo "tmux is required. Install it first: brew install tmux / apt install tmux / pkg install tmux (Termux)" >&2
  exit 1
}
tmux has-session -t "=$SESSION" 2>/dev/null && {
  echo "Session '$SESSION' already exists — attach: tmux attach -t $SESSION, or kill it first: tmux kill-session -t $SESSION" >&2
  exit 1
}
# resolve claude to an absolute path — tmux spawns a non-login shell whose PATH
# may not include ~/.local/bin
CLAUDE_BIN="$(command -v claude || true)"
[ -z "$CLAUDE_BIN" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE_BIN="$HOME/.local/bin/claude"
[ -z "$CLAUDE_BIN" ] && { echo "claude CLI not found (checked PATH and ~/.local/bin)" >&2; exit 1; }
# interactive TUI (not -p print mode): attaching shows the live session
CMD="$(printf %q "$CLAUDE_BIN") $(printf %q "$PROMPT") --permission-mode bypassPermissions"
tmux new-session -d -s "$SESSION" "$CMD"
tmux pipe-pane -t "=$SESSION" -o "cat >> $(printf %q "$PWD/$LOG")"
echo "Agent running in tmux session '$SESSION' — watch: tmux attach -t $SESSION (detach: Ctrl+B d)"
echo "Raw log: $LOG · readable record: learning/WRITING-LOG.md · report: learning/WRITING-REPORT.md"
```

After writing the file, make it executable — `chmod +x finishbook.sh` (skip on Windows). The `chmod` may trigger a permission prompt — tell the user it's coming and ask them to approve it; if blocked, tell them to run `chmod +x finishbook.sh` themselves. Then give the exact command: `./finishbook.sh`.

When offering, **warn plainly**: `bypassPermissions` means the agent runs commands without asking. The user should commit/push everything first and only run it in a directory (and on a machine) they're comfortable handing over. Generate the script and stop — **never launch it yourself**; it's the user's to run.

## Step 6 — The learning loop (phase 5 rhythm)

Every session in phase 5 follows the same rhythm, driven by `progress.md`:

1. **Orient** — one line: where they are, last quiz score, standing weak spots.
2. **Review first** — if weak spots exist, offer to re-quiz 1–2 old items before new material (spaced repetition). Log the result; an item answered correctly twice across different sessions comes off the list.
3. **Offer both study modes** for the current chapter, every time:
   - **Self-study** — "read the chapter (open `book/dist/book.html` or the PDF), come back with questions." Answer questions against the chapter's content, going deeper than the book where needed.
   - **Active mode** — for when they don't feel like reading: teach the chapter conversationally, Socratic back-and-forth — short explanation, then a probing question, adjust from their answer — until the ideas land.
4. **Quiz the chapter** when the user feels ready. Score it into `progress.md`; wrong answers become weak-spot entries (concept, not question).
5. **Project checkpoints** — when the syllabus puts a project here: set it up, let the user build it themselves, review their work honestly, and only mark it done when it actually works. Don't build it for them — hints before answers.
6. **Keep the writing ahead of the reading** — when the user *starts* the last chapter of module N, write all of module N+1 in one batch, calibrated to module N's quiz history (shaky prerequisites → open with a bridging recap; consistently strong → tighten the pace). Batching per module means the next module is always waiting when the current one finishes — the user never sits through generation. If a quiz result contradicts an assumption in an already-written unread chapter, patch that chapter surgically before the user reads it. Re-run `build.sh` after any writing. (When `finishbook.sh` already wrote the whole book, this beat is patch-only — no new chapters to write, but the calibration duty stands.)

When every syllabus chapter is quizzed and every project is done, offer graduation (phase 6). Not before — but if the user wants to graduate early, warn once and comply.

## Step 7 — Graduation (phase 6)

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
