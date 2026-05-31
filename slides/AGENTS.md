# AGENTS.md — slides/

**Status: built.** A branded **conference talk deck** on the MINT brand — the presentation sibling of the
poster / demo-page / readme-header. The gold band is the **standardized, locked brand chrome**; the slide
bodies between the EDIT markers are the author's content. Full brand contract: `../AGENTS.md`. Usage: `README.md`.

This is a **talk deck**, not the `../../reveal_v4/` teaser. It reuses reveal_v4's ideas — the fixed
1280×720 stage scaled to fit, the gold band, the `.r-fade`/`.r-up` reveal primitives — but **drops** the
voiceover audio and the `TIMELINE[]` auto-play. Slides advance on keypress. (Timed, narrated teasers belong
in `videos/`, not here.)

## Filling in a deck (for agents)
You usually don't need to read anything else in this folder. To make a talk's deck: **copy `deck.html`** to
a new file and edit **only** the slides between the `↓↓↓ / ↑↑↑ EDIT FOR YOUR TALK` markers — add/remove
`<section class="slide">`s, set each slide's `data-title` (it shows in the band), and fill the title /
content / figure / results / closing slides. Everything else — the gold `.bar`, the lockup, the page
counter, the scripts — is locked brand chrome; leave it.

**Each slide is a self-contained `<section>`.** To edit, add, reorder, or remove one slide, work on its
`<section>` only — **search for its `data-title` and edit just that block; you don't need to read the other
slides** (that keeps context small even in a long deck). **Do not read `deck.css`, `deck.js`, `build.mjs`,
or `dist/` to fill content** — they're styling/engine/tooling, not content, and `dist/` vendors a ~915 KB
logo + font binaries that will needlessly bloat your context. Open `deck.html` in a browser to preview as
you go; when done, present it, or build + share per `README.md`.

## What's here
- `deck.html` — the template you copy from: one full 1280×720 deck, a **fill-in skeleton** (title · outline
  · content+fragments · figure · results · closing). The gold band is locked chrome; the slides between the
  EDIT markers are yours, each a self-contained `<section>`. **Copy, don't edit in place.**
- `deck.css` — the deck theme: brand tokens via `@import "../brand/colors.css"` + `tokens.css`, Inter
  `@font-face`, the `.bar` chrome, the single `--accent` swap, the `.stat`/`.badge` screen components, and
  the `.r-*` reveal primitives. Fixed px on the 720 stage (the stage scales as a unit).
- `deck.js` — the **engine** (~100 lines, dependency-free): `fitStage()` scaling + keyboard/click nav +
  per-slide fragment reveals. No library, no timeline, no audio.
- `build.mjs` — the **copier + verifier** (see Build). Node built-ins only; **no Chromium**.
- `assets/` — the gold band PNGs (the self-contained-module precedent; see the band note below).
- `dist/` — **not committed**; built on demand by `build.mjs`. A built `dist/<deck>/` is a fully
  self-contained copy you present from or share, then delete from here.

## Build
```bash
node build.mjs                       # deck.html → dist/deck/       (project name defaults to file stem)
node build.mjs my-talk.html          # your copy → dist/my-talk/    (name defaults to the file stem)
node build.mjs my-talk.html my-proj  # your copy → dist/my-proj/    (explicit project name)
```
`build.mjs` is a **file COPIER, not a renderer** — a deck needs no render step, and baking Chromium in would
be the reflexive over-build this repo guards against. It vendors the `../brand/…` files the deck actually
uses into `dist/<deck>/brand/` (subpaths preserved; band PNGs stay in `assets/`), copies `deck.js` verbatim
(it holds no `../brand` ref), rewrites every `../brand/` → `brand/`, and writes `index.html` + `deck.css`.
**Verify = self-containment assertion** (the slides analog to demo-pages): no `../` survives, and every
referenced file resolves inside `dist/<deck>/`. To export PDF: present in a browser and use its
"Print to PDF", or screen-record — **not** a build step (a `transform: scale()` stage doesn't print cleanly).

## Conventions
- **The gold `.bar` is the standardized chrome** — SDSU│MINT lockup (left), the active slide's `data-title`
  (center, filled by `deck.js`), the page number (right). It is `--sdsu-blue` in **both** accents — that
  fixed gold band *is* the "same header as the poster/page" identity. The accent must never touch it.
- **The title slide is the full-bleed gold hero** (`.slide--title`): flat `--sdsu-yellow` ground, big
  `--sdsu-blue` title, authors/affiliation/venue. The band is **hidden while it shows** (`deck.js` toggles
  `#deck.title-active`, so there's no gold-on-gold seam), so the hero **carries the SDSU│MINT lockup itself**
  (`.hero-lockup`). The closing slide carries the **QR** (the talk convention — the audience photographs the
  last slide; that's why the title band has no QR).
- **Fixed-stage px, not responsive.** The stage is 1280×720 and `deck.js` scales it as one unit, so sizes
  are plain px against the 720 height — the stage analog of demo-pages' `clamp()` and poster.css's mm. This
  is a fresh **screen-unit** chrome, the same way demo-pages was a fresh port of the poster header (the band
  geometry is **not** literally shared — see the lift note below).
- **One `--accent`** drives the web-layer bits (slide-heading rule, links, badges, stat qualifiers):
  `--sdsu-blue` by default, `--mint-green-deep` via `<div id="deck" class="accent-green">`.
- **Gold (`--sdsu-yellow`) is reserved for the headline result** — the `.stat` cards — and the band/title
  ground. Never the deck accent.
- **Fragments** are optional: mark a slide element `data-frag` (optionally `.r-up`/`.r-fade`) and it reveals
  on advance; once all are shown, the next press moves to the next slide. A slide with none just advances.
- **Edit only the slides between the markers;** each is a self-contained `<section>` (edit one without
  reading the others — search its `data-title`). The `.bar`, page counter and scripts are shared chrome.

## Held local (promotion deferred — the user's call)
- **Gold band art (`assets/`)** — copied here so the module is self-contained, same as `posters/assets/`,
  `readme-header/assets/`, `demo-pages/assets/`. Still flagged **reference-only** (the MuSDeT teaser
  signature, `--ref-musdet-*`), *not* lab brand. Don't assert gold is lab-brand; promotion to `brand/` is deferred.
- **The screen component CSS** (`.bar` chrome, `.stat`, `.badge`, `.r-*`) is a fresh **screen-unit**
  re-implementation, the cross-medium sibling of the print-tuned versions in `poster.css` and the responsive
  ones in `demo-pages/style.css`. **`demo-pages/AGENTS.md` flagged a possible "lift" to `brand/` once a
  second screen consumer (this) appeared.** The overlap turned out **partial** — the band geometry genuinely
  differs (this deck is fixed-stage px; demo-pages reflows with `clamp()`), so only `.stat`/`.badge` + the
  color/accent discipline are truly shared. The lift is **deferred** (it would touch `brand/` *and* the
  just-locked `demo-pages/style.css`, risking a regression there); recorded as a candidate for a future
  minimal `brand/` pass, not done now.

## Rules (in addition to ../AGENTS.md)
1. **Brand by relative path** at rest (`../brand/…`); `@import "../brand/colors.css"` + `var(--…)`, never
   paste a hex (the only locals are the commented neutral `--backdrop`/`--surface`/`--shadow`). Never copy a
   logo in; never recolor/stretch/retrace SDSU.
2. **No `npm install`.** `build.mjs` uses only node built-ins — no Chromium, no dependencies.
3. **Edit only the slides between the markers;** copy-to-new-file; copy the `dist/` folder, don't hotlink.
4. **Never hand-edit `dist/`** — it is generated; re-run `build.mjs`.
