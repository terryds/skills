# Phase definitions

Each phase: folder, deliverable, "done when" gate, guiding questions, and the stub template used at scaffold time. Questions are prompts to shake answers loose — ask 1–2 at a time, adapt wording to the product, skip ones that don't apply.

---

## Phase 1 — Brainstorm

- **Folder:** `landing/1-brainstorm/`
- **Deliverable:** `pitch.md`
- **Done when:** the pitch fits in one sentence, the selling point is sharp, and the user says "yes, that's it."

The goal is not a list of ideas — it's *the highlights*: what the product actually is, why anyone should care, and what makes it different. Dig. Push back on vague answers ("it's an AI tool" is not a pitch). Reflect the pitch back in your own words until the user confirms it lands.

Questions:

- What is it, in one sentence a stranger would understand?
- Who exactly is it for, and what are they doing *today* instead?
- What's the one thing it does that nothing else does — the actual selling point?
- Why should the visitor believe you? (demo, numbers, names, screenshots — what proof exists?)
- What should the visitor *do* after reading — sign up, install, book a call, star the repo? (that's the primary CTA; there is only one)
- What's the emotional register — does this product save time, save money, remove fear, grant status, spark delight?
- What do competitors' landing pages get wrong that yours must not?

Template:

```markdown
Status: in-progress

# Pitch

## One-liner
<!-- the product in one sentence -->

## Audience
<!-- who it's for + what they do today instead -->

## Selling point
<!-- the ONE thing that makes it different -->

## Proof
<!-- why believe it: demo, numbers, names -->

## Primary CTA
<!-- the single action the page drives toward -->

## Emotional register

## Raw notes
<!-- everything else that came up -->
```

---

## Phase 2 — Branding & style guide

- **Folder:** `landing/2-branding/`
- **Deliverables:** `brand.md` + 2–3 style option pages (`style-a.html`, `style-b.html`, …) built during the phase; the chosen one becomes `styleguide.html`
- **Done when:** the user has picked a style (or shaped a custom one) and `styleguide.html` looks right in light AND dark mode.

Process:

1. Ask the positioning questions below first — they constrain which directions are worth generating.
2. Build 2–3 **genuinely distinct** style directions (not three shades of the same idea — e.g. brutalist mono vs. warm editorial vs. dark technical). Each option page shows: palette swatches (light + dark), type scale, spacing/radius, button + input states, and one sample hero-ish block so the vibe is judgeable.
3. Publish each as an Artifact, then use AskUserQuestion: option A / B / C / "none — here's what I want". Iterate until one lands.
4. Promote the winner to `styleguide.html`, record every token in `brand.md`. All later phases build from these tokens only.

Questions:

- Tone — playful, minimal, technical, luxurious, loud?
- Should it feel like anything the user admires? (name 1–2 sites/brands as reference points, then translate — never copy)
- One accent color, or does the user have brand colors already? (test on dark backgrounds)
- Serif, sans, or mono personality? (system stacks only — no external fonts)
- Dark-first, light-first, or truly both?

Template (`brand.md`):

```markdown
Status: in-progress

# Brand & style guide

## Direction chosen
<!-- which option won and why; rejected directions in one line each -->

## Palette
<!-- primary, accent, neutrals, semantic; light + dark values -->

## Typography
<!-- system stack, 3–4 sizes max, weights -->

## Spacing / radius / shadow
<!-- base unit, corner radius, elevation style -->

## Motion
<!-- how things move, if at all; respect prefers-reduced-motion -->

## Voice
<!-- how UI text and headlines sound -->
```

---

## Phase 3 — Hero section

- **Folder:** `landing/3-hero/`
- **Deliverables:** 2–3 hero variant pages (`hero-a.html`, `hero-b.html`, …) built during the phase + `hero.md` recording the choice
- **Done when:** the user has picked a hero and says "that's the one."

The hero is the page's first 5 seconds: headline (the pitch from phase 1), subline, primary CTA, and one visual moment. Build 2–3 variants that differ in *concept* (e.g. type-driven vs. shader-backdrop vs. product-shot with SVG framing), all obeying the phase-2 styleguide.

Hard rules:

- **No slop.** No unnecessary text, badges, decorative icons, fake logos-of-trust rows, or ornament that doesn't serve the pitch. If an element can be removed without weakening the message, remove it.
- Headline is the selling point, not a pun about it. Subline earns its place or dies.
- Exactly one primary CTA (a secondary ghost link is allowed only if phase 1 justified it).
- **Prefer real graphics work**: an inline WebGL fragment shader and/or purpose-built inline SVG assets (marks, diagrams, product framing). At least one variant should carry a shader unless the chosen style direction argues against motion. Never a canned particle library.
- **The shader is the spectacle, not wallpaper.** Bold, unmistakably animated — a visitor must notice it moving within the first second without looking for it. No barely-drifting gradients or 2%-opacity noise; if a screenshot of frame 1 and frame 60 look the same, it's too subtle — turn it up. Be creative and write a real effect: raymarched forms, liquid/flow fields, interference patterns, plasma, warped geometry, reactive to cursor or scroll — invent something that fits the product's pitch, in the palette's colors at full confidence.
- Bold backdrop, legible headline: solve the conflict with contrast treatment (a scrim, a type plate, shader dimmed *behind the text block only*) — never by muting the whole shader into wallpaper.
- Shader/motion etiquette: self-contained (no libraries), cheap on GPU (one fullscreen fragment pass is plenty), paused when `prefers-reduced-motion`, with a static-but-striking gradient/SVG fallback when WebGL is unavailable — the hero must still look intentional with the canvas dead.
- Self-contained files, correct in light AND dark mode.

Publish each variant as an Artifact, then AskUserQuestion to pick. Record the choice and *why* in `hero.md` — the reasoning steers phase 5.

Questions (before building variants):

- What's the one visual moment — abstract atmosphere (shader), the product itself (screenshot/mock), or a concept illustration (SVG)?
- Motion or still? (default is bold motion — go still only if the style direction demands it)
- Should the CTA scroll to content or leave the page (sign-up, install, repo)?

Template (`hero.md`):

```markdown
Status: in-progress

# Hero

## Chosen variant
<!-- which file won and why; rejected variants in one line each -->

## Headline / subline / CTA
<!-- final copy -->

## Visual
<!-- what the moment is: shader (describe it), SVG assets, imagery; fallback behavior -->
```

---

## Phase 4 — Page structure

- **Folder:** `landing/4-structure/`
- **Deliverable:** `structure.md`
- **Done when:** the user agrees to the section list and order.

This phase is a plan, not code. Lay out the page top to bottom as a narrative: every section must answer a question the visitor actually has at that scroll depth, in the order they'd ask it (what is this → why care → why believe → what does it cost → what now). Derive sections from the phase-1 pitch — don't paste a template of "Features / Testimonials / Pricing / FAQ" if the pitch doesn't need them. Fewer, stronger sections beat many thin ones.

For each section, state: its job (the visitor question it answers), its content (real copy direction, not lorem), and its visual treatment (which styleguide tokens, any SVG/graphic asset it needs). End with the closing CTA — the page's last word repeats the primary CTA.

Present the structure, then iterate until the user agrees. Log cut sections in `decisions.md` so scope creep stays visible.

Questions:

- What objections does the visitor have, in order? (each objection ≈ one section)
- What proof from phase 1 goes where?
- Pricing on the page or behind the CTA?
- FAQ, or is that a sign the page above failed?
- Footer: what's legally/socially required (links, contact) vs. clutter?

Template:

```markdown
Status: in-progress

# Page structure

<!-- one block per section, in scroll order -->

## 1. Hero
- Job: <!-- visitor question it answers -->
- Content: <!-- from phase 3 -->
- Visual: <!-- from phase 3 -->

## 2. <section>
- Job:
- Content:
- Visual:

## N. Closing CTA
- Job: last chance to convert
- Content:
- Visual:

## Cut
<!-- sections considered and rejected, one line each -->
```

---

## Phase 5 — Full page

- **Folder:** `landing/5-page/`
- **Deliverable:** `index.html` (built during the phase — no stub)
- **Done when:** the user says "I'd ship this."

Assemble the real thing: the chosen hero (phase 3) plus every section from `structure.md`, built entirely from the phase-2 styleguide tokens, with final copy in the phase-1 voice. One self-contained file.

Rules:

- The hero is transplanted from the chosen variant, not rebuilt from memory — same shader, same assets, same copy unless the user revised them.
- Same anti-slop bar as phase 3, applied to every section. Real copy everywhere; if a section's copy can't be written from the pitch, the section shouldn't exist — flag it instead of padding it.
- Responsive (mobile-first breakpoints), correct in light and dark mode, `prefers-reduced-motion` respected page-wide.
- Semantic HTML (`header/main/section/footer`, one `h1`), accessible contrast per the styleguide, alt text on meaningful graphics.
- Section-level SVG/graphic assets planned in `structure.md` get built here, in-palette, inline.

Publish as an Artifact for review. Iterate section by section on feedback — surgical edits, never a from-scratch rebuild that loses approved work. When the user is happy, remind them where the file lives and stop; deploying is theirs.

---

## decisions.md (cross-phase)

Template:

```markdown
# Decisions

One line per decision + why. Append-only.

<!-- - [phase] chose X over Y — because Z -->
```
