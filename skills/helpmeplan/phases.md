# Phase definitions

Each phase: folder, deliverable, "done when" gate, guiding questions, and the stub template used at scaffold time. Questions are prompts to shake answers loose — ask 1–2 at a time, adapt wording to the project, skip ones that don't apply.

The questions are project-type-agnostic. Before asking, translate them into the project's vocabulary — a browser extension has popups and host pages, a CLI has flags and stdout, a web app has routes and screens, an API has endpoints and consumers. Occasional *e.g.* hints below show what that translation looks like; they're examples, not a checklist.

---

## Phase 1 — Brainstorm

- **Folder:** `planning/1-brainstorm/`
- **Deliverable:** `ideas.md`
- **Done when:** ideas run dry — nothing new is coming.

Questions:

- What annoys you *every time* in this problem space?
- What do you do manually/repeatedly that could be one click?
- What info do you wish you could see but can't — what do existing tools show badly or hide?
- What do existing tools/competitors do badly or charge for?
- What would make you *better* at this, not just faster?
- Who is this for — just you, or others too?

Template:

```markdown
Status: in-progress

# Brainstorm

Raw ideas. No filtering, no judging. Quantity over quality.

## Ideas

## Annoyances

## Wild / someday
```

---

## Phase 2 — Scope

- **Folder:** `planning/2-scope/`
- **Deliverable:** `scope.md`
- **Done when:** the v1 list fits in one sentence per feature.

Questions:

- If only ONE feature could ship, which one? (that's the core — everything else is optional)
- What can ship in a weekend? If v1 can't, cut until it can.
- Which features have scary costs — permissions, accounts, servers, moderation, compliance? Prefer ones that don't.
- Which features depend on things you don't control and that change under you? (*e.g.* a third-party API, a site's DOM, an OS behavior)
- One product or several small ones?
- What will you *actually* use daily vs. what just sounds cool?

Template:

```markdown
Status: in-progress

# Scope

## v1 — building now
<!-- one sentence per feature -->

## Later — parked

## No — rejected (and why)
```

---

## Phase 3 — Design & branding

- **Folder:** `planning/3-design/`
- **Deliverables:** `brand.md` + `styleguide.html` (built during the phase)
- **Done when:** the styleguide page looks right in light AND dark mode.

Questions:

- Name & tagline? (searchable, not trademark-y, survives as "the ___ tool")
- Tone of UI text — playful, minimal, technical?
- Blend in or stand out? If any UI lives inside a host environment (a site, an editor, an OS), that part usually blends in; surfaces you fully own carry the brand.
- What's the one accent color? (test it on dark backgrounds)
- Logo concept that survives at 16px?

`styleguide.html` must show: color swatches (light + dark), type scale, spacing/radius, button + input states. It is the visual proof of `brand.md` and the reference for all later UI.

If the project ships through a store or marketplace, also plan its required assets (icon sizes, screenshots, promo images) in the asset checklist — look up the platform's current specs rather than guessing.

Template (`brand.md`):

```markdown
Status: in-progress

# Brand & design system

## Name & tagline

## Voice / tone

## Palette
<!-- primary, accent, neutrals, semantic; light + dark values -->

## Typography
<!-- one font or system stack, 3–4 sizes max -->

## Spacing / radius / shadow
<!-- base unit, corner radius, elevation style -->

## Blend in vs. stand out

## Asset checklist
```

---

## Phase 4 — Mockups

- **Folder:** `planning/4-mockups/`
- **Deliverables:** one file per UI surface — `.html` for visual surfaces, `.md`/`.txt` transcripts for text ones (no stubs — built during the phase)
- **Done when:** the user says "I'd be happy if the real thing looked like this."

Questions:

- What surfaces exist? (*e.g.* web app: pages/routes + key dialogs; extension: popup, injected overlay, options; CLI: help text, command output, error output; mobile: screens)
- What's the empty state? The error state? The "it's working" state?
- What does the user see 5 seconds after installing/opening?
- For UI embedded in something you don't own (a host page, an editor, a feed): where exactly does it live, and what does it displace? Mock a fake host around it so it's seen in context. (For non-visual surfaces like a CLI, "mockup" means sample transcripts of real sessions.)

Rules: build with the phase-3 styleguide. Iterate fast and dirty — moving a button costs nothing here. Offer Artifacts for click-through review. **Mockups are throwaway** — never upgraded into real code, only used as reference.

---

## Phase 5 — Architecture

- **Folder:** `planning/5-architecture/`
- **Deliverable:** `architecture.md`
- **Done when:** every mockup element maps to a component/API.

Questions:

- What are the moving parts, and what talks to what? (*e.g.* frontend/backend/jobs; extension: content script vs. popup vs. background worker; CLI: commands vs. core lib)
- What's stored, and where? Does anything need to sync across devices or users?
- What's the minimum set of permissions, accounts, and dependencies? Fewer = easier install, less to maintain, less to trust.
- What's fragile — what breaks when things you don't control change, and how is it contained?

Template:

```markdown
Status: in-progress

# Architecture

## Components
<!-- each mockup element maps to something here -->

## Data & storage

## Permissions / dependencies

## Communication map

## Fragility & containment
```

---

## decisions.md (cross-phase)

Template:

```markdown
# Decisions

One line per decision + why. Append-only.

<!-- - [phase] chose X over Y — because Z -->
```

---

## spec/ (the "dist" — see SKILL.md Step 5)

A folder, not a single file:

- `README.md` — what + v1 features + **Not doing** + index of the other files
- `plans/<area>.md` — one plan per project-relevant area (feature / surface / subsystem — whatever split fits the project)
- `structure.md` — planned codebase layout, annotated
- `roadmap.md` — build order M0 → Mn; M0 = walking skeleton; each milestone has a verifiable "done when"

Quality bar: a stranger could build the project from `spec/` alone, in roadmap order. No `Status:` lines — the folder's existence means planning shipped.
