# Phase definitions

Each phase: deliverable, "done when" gate, guiding questions or mechanics, and the templates used. Questions are prompts to shake answers loose — ask 1–2 at a time, adapt wording to the subject, skip ones that don't apply.

Everything is subject-agnostic. Translate into the subject's vocabulary before asking — a programming language has code and projects, a spoken language has dialogues and vocabulary, music theory has notation and ear training, history has sources and narratives. Code examples, "run it and show the output," and build-projects apply when the subject is technical; for non-technical subjects, substitute worked examples, exercises, and practice tasks.

---

## Phase 1 — Intake

- **Deliverable:** `learning/profile.md`
- **Done when:** you could describe this learner and their goal to a human tutor in three sentences, and the user agrees it's accurate.

Questions:

- What do you want to learn — and how would you phrase it to a friend? (scope it: "Python" vs. "Python for data analysis" are different books)
- Why now? What do you want to *do* with it? (the goal shapes every chapter's examples)
- What's your background — what do you already know that's adjacent? (*e.g.* knows JavaScript and wants Python; plays guitar and wants theory)
- Is there a deadline or event driving this — an interview, a project, a trip? And either way: do you want the fast-and-practical version or the thorough one? (this decides the syllabus's scope, not its pace — a crash course and a deep-dive are different books)
- How do you learn best — reading and trying, being walked through it, building something immediately?
- Where will you read — screen, phone, print? (affects export emphasis: HTML vs. PDF)

Template:

```markdown
Status: in-progress

# Learner profile

## Subject
<!-- one line, scoped -->

## Goal
<!-- what they want to DO with it, in their words -->

## Background
<!-- adjacent knowledge, prior attempts, self-assessed level -->

## Deadline & depth
<!-- deadline/event if any; crash-course vs. thorough -->

## Learning style
<!-- reading vs. hands-on vs. conversational; where they'll read -->
```

---

## Phase 2 — Placement quiz

- **Deliverable:** `learning/assessment.md`
- **Done when:** the verdict (level + known/unknown map) is written and the user says "yes, that's about right."

Mechanics — this is a *placement* quiz, not an exam:

- Say up front: "this is to place you, not grade you — 'I don't know' is a perfectly good answer and saves us both time."
- Start from the profile's self-assessment; open one notch *below* it (confirming a floor is fast and kind; discovering a ceiling by repeated failure is neither).
- **6–12 questions, 1–2 at a time.** Use AskUserQuestion for multiple-choice; free-form for "explain it in your own words" questions (these reveal more — an explanation exposes the shape of understanding, a guessed letter doesn't).
- **Adaptive:** correct → step up in difficulty or jump topics; wrong or "don't know" → step down and probe where the floor is. Stop early the moment the picture is clear.
- Cover breadth over depth: touch each major area of the subject once rather than drilling one area five times.
- Record every Q&A as it happens, then write the verdict.

Template:

```markdown
Status: in-progress

# Placement assessment

## Quiz record
<!-- Q, their answer, right/wrong/skipped — appended live -->

## Verdict

**Level:**
<!-- beginner / intermediate / advanced — with one line of justification -->

**Knows already:**
<!-- solid areas — the syllabus compresses or skips these -->

**Gaps / shaky:**
<!-- the syllabus targets these -->

**Misconceptions:**
<!-- actively-wrong beliefs to dismantle early — worth their own callout in chapters -->
```

---

## Phase 3 — Syllabus

- **Deliverable:** `learning/syllabus.md`
- **Done when:** the user explicitly approves the table of contents. **This is the big gate — no chapter gets written before it.**

Build it *from the assessment*, not from a generic curriculum:

- Skip or compress what the verdict says they know; go slow where it says shaky; schedule misconception-dismantling early.
- Group chapters into **modules**, each ending in a **project checkpoint** — something real the learner builds/produces with only that module's material. Small and honest beats grand and vague. A mid-module chapter can get a **mini-project** of its own when it earns one — but the default cadence is exercise-per-subchapter, quiz-per-chapter, project-per-module; don't inflate every chapter into a project.
- List each chapter's **subchapters** (2–5 per chapter, one idea each) right in the syllabus — they become the chapter's H2 sections, and they make the approval gate meaningful: the user is approving the actual shape of the book, not just chapter titles.
- Size against the profile's deadline & depth, and say the trade-off out loud: a deadline gets the crash-course syllabus (fewer chapters, only what serves the goal, projects shrunk to fit); no deadline plus "thorough" earns the full treatment. When in doubt, cut — better a short book finished than a long book abandoned.
- Order by dependency, then by motivation — get the learner to their first "I made a thing" as early as possible.
- Present the draft ToC, then iterate until approved. Log meaningful choices ("skipped X — placement showed it's solid") right in the file.

Template:

```markdown
Status: in-progress

# Syllabus

**Shape:** <!-- crash course for <deadline/event> · or · thorough, no deadline -->

## Module 1 — <name>
- [ ] Ch 1: <title> — <one-line goal>
  - <subchapter> · <subchapter> · <subchapter>
- [ ] Ch 2: <title> — <one-line goal> · 🛠 mini-project: <name>
  - <subchapter> · <subchapter>
- [ ] 🛠 Module project: <what they'll build/produce> — <done when>

## Module 2 — <name>
...

## Deliberately skipped
<!-- what the placement quiz let us skip, so the choice stays visible -->
```

---

## Phase 4 — Book bootstrap

- **Deliverables:** `learning/book/` (pandoc project: `metadata.yaml`, `build.sh`, `99-answer-key.md`, `images/`) with **all of module 1's chapters** written and built, plus `learning/progress.md` created.
- **Done when:** `build.sh` runs clean, the user has opened the built book and likes the shape of it, and `progress.md` exists. Then flip `progress.md` to `Status: learning` — and offer the `finishbook.sh` script once (SKILL.md Step 5): an unattended tmux run that writes the whole remaining book, for learners who'd rather have the complete draft now than per-module calibration.

Entry check: confirm pandoc exists (and note whether a PDF engine does — see SKILL.md). Scaffold the book, write every chapter of module 1 per the chapter template below (a complete, coherent unit — the learner starts with a whole module in hand), build, and hand the user the `dist/` paths.

### Chapter template

Files are `NN-slug.md` (e.g. `01-getting-started.md`), one per syllabus chapter, each starting with a `#` H1 (pandoc uses H1s as chapter breaks). A chapter is built from its syllabus-listed **subchapters** (H2s — the ToC shows them at `toc-depth: 2`), each carrying one idea through the same three beats. Adapt section names to the subject, but keep all the ingredients:

```markdown
# <Chapter title>

<!-- Hook — why this chapter matters for THIS learner's goal, 2–3
     sentences. Reference their profile: their goal, their background. -->

## <Subchapter — one idea>

<!-- Each subchapter (2–5 per chapter, from the syllabus) runs three beats:

     1. Concept — explained plainly. When the placement quiz flagged a
        misconception that lives here, dismantle it explicitly: "You might
        expect X — actually Y, because Z."
     2. Worked example(s) — at least one per concept. For code: the snippet
        AND its actual output (run it — never fabricate output). For
        non-code subjects: fully worked examples, not abstract statements.
     3. Try it — one small exercise before moving on; active recall beats
        rereading. Solution goes in the answer key, not here.

     Add an illustration where a diagram genuinely helps: an SVG in
     images/, referenced as ![caption](images/NN-name.svg). Simple
     hand-rolled SVG (boxes, arrows, labels) beats no diagram; skip it
     when prose is clearer. -->

> **🔍 Go deeper** — paste this into Claude, or run `/helpmelearn deepdive <topic>`:
> *"<a genuinely good prompt: names the topic, the learner's level, and
> asks for the specific angle this book didn't have room for>"*
<!-- one or two per chapter, placed after the subchapter each serves -->

## <Next subchapter>

<!-- ...same three beats... -->

## Quiz

<!-- Chapter-level: 3–5 questions spanning the subchapters, mixed
     multiple-choice and short-answer, numbered. NO answers here — they
     live in 99-answer-key.md so the printed book doesn't spoil itself.
     In-session, the real quiz is conversational (phase 5) — these printed
     ones are for self-study readers. -->
```

Module-final chapters also get a `## Project` section — what to build/produce, constraints, and a verifiable "done when" (from the syllabus). Mid-module chapters get one only when the syllabus assigned them a mini-project.

`99-answer-key.md` — one `# Answer key` H1, then per-chapter sections with each quiz question's answer *and a one-line why*. Append as chapters land.

### metadata.yaml template

```yaml
---
title: "<Book title — name it for the learner's goal, not the generic subject>"
subtitle: "A personalized guide"
author: "Written for <learner's name> by Claude"
date: "<start date>"
lang: en
toc: true
toc-depth: 2
---
```

### build.sh template

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v pandoc >/dev/null 2>&1 || {
  echo "pandoc is required. Install it: brew install pandoc / apt install pandoc / pkg install pandoc (Termux)" >&2
  exit 1
}
mkdir -p dist
CHAPTERS=$(ls [0-9][0-9]-*.md | sort)
pandoc metadata.yaml $CHAPTERS --standalone --toc --embed-resources \
  -o dist/book.html
pandoc metadata.yaml $CHAPTERS -o dist/book.epub
# PDF only if an engine exists — never let LaTeX block the build
if command -v tectonic >/dev/null 2>&1; then
  pandoc metadata.yaml $CHAPTERS --pdf-engine=tectonic -o dist/book.pdf
elif command -v pdflatex >/dev/null 2>&1; then
  pandoc metadata.yaml $CHAPTERS -o dist/book.pdf
else
  echo "note: no PDF engine (tectonic/pdflatex) — built HTML + EPUB only"
fi
echo "built: dist/book.html dist/book.epub$( [ -f dist/book.pdf ] && echo ' dist/book.pdf' )"
```

After writing it, `chmod +x build.sh` (tell the user a chmod is coming if a permission prompt may appear; if blocked, tell them to run it themselves).

### progress.md template

```markdown
Status: bootstrapping

# Progress

<!-- Status: bootstrapping → learning → graduating → graduated -->

## Chapters
<!-- one line each, updated as things happen:
- [x] Ch 1: <title> — read (active mode) · quizzed 8/10 on 2026-08-20
- [ ] Ch 4: <title> — written, not yet read
- [ ] Ch 5: <title> — not written
-->

## Projects
<!-- - [ ] Module 1 project: <name> — status / done when verified -->

## Weak spots
<!-- concept-level, not question-level; append on wrong answers, remove
     after two correct reviews in different sessions:
- recursion base cases — missed in ch. 3 quiz (2026-08-20); reviewed ✓ 08-22
-->

## Session log
<!-- one line per session: date — what happened -->
```

---

## Phase 5 — Learning loop

- **Deliverable:** `progress.md` kept current (it *is* the phase).
- **Done when:** every syllabus chapter is quizzed and every project verified — then offer graduation. The user can graduate early after one warning.

The session rhythm lives in SKILL.md Step 6. Phase-specific mechanics:

- **Conversational quizzes** are the real quizzes: 3–5 questions per chapter, 1–2 at a time, AskUserQuestion for multiple-choice and free-form for "explain it back." Score as n/total into `progress.md`; each miss becomes a *concept* on the weak-spots list, with the why explained immediately after the attempt.
- **Module-batched writing, always ahead of the reader**: when the user *starts* the last chapter of module N, write all of module N+1 in one batch — reread the quiz history first. Shaky prerequisite → open the module with a bridging recap; strong streak → tighten pace and raise exercise difficulty. Keep the chapter template's shape either way. The learner should never wait on generation: if the buffer ever runs out (e.g. they skipped ahead), write the next module immediately before continuing. If a quiz result contradicts an assumption in an already-written unread chapter, patch that chapter surgically before they reach it. Rebuild after any writing and mention the fresh `dist/` paths. (When `finishbook.sh` pre-wrote the book, this bullet is patch-only.)
- **Deepdives** (`deepdive <topic>` or questions mid-study): answer at the learner's level, in the book's voice, with the same example standards (real output, worked examples). If a deepdive reveals a chapter gap, offer to patch the chapter — the book is living until graduation.
- **Syllabus drift**: if the loop reveals the syllabus was wrong (too fast, missing a chapter, wrong order), update `syllabus.md` with the user's approval and note it in the session log — syllabus first, then chapters, same spirit as spec-first.

---

## Phase 6 — Graduation

- **Deliverable:** the polished book in `book/dist/` + `progress.md` flipped to `Status: graduated`.
- **Done when:** the final quiz is scored, the closing chapter and journey appendix are in the book, the export runs clean, and the user has the artifact.

Steps (detail in SKILL.md Step 7): final comprehensive quiz weighted toward historical weak spots → closing chapter (`NN-where-to-next.md`: what was hard and how they beat it, what they can now build, a concrete learn-next path) → journey appendix (scores, weak-spot history, projects — celebrate honestly) → finalize `metadata.yaml` (date = graduation date) → final `build.sh` run → flip status, hand over the book.

If no PDF engine ever materialized and the user wants a PDF, offer the tectonic install one last time before the final build.
