# AGENTS.md — videos/

**Status: built.** A branded, auto-playing **teaser** on the MINT brand — the timed sibling of the
slide deck. The gold band is the **standardized, locked brand chrome**; the segment bodies between the
EDIT markers are the author's content. Full brand contract: `../AGENTS.md`. Usage: `README.md`.

This **is** the `../../reveal_v4/` teaser lineage: the same fixed 1280×720 stage scaled to fit
(`fitStage()`), the same gold band, the same `.r-*` reveal primitives that `slides/` uses — **plus** the
two things the talk deck deliberately dropped: a millisecond **timeline** and a synced **voiceover**,
driven by an auto-play clock. So where `slides/` advances on keypress, the teaser plays itself.

**Timeline-from-DOM (the one design improvement over reveal_v4).** reveal_v4 kept a hand-maintained
`TIMELINE[]` array in the engine that had to stay in sync with the markup. Here the timeline **is** the
markup: every element with `data-at="<ms>"` is a cue; `teaser.js` scans them in document order, stable-
sorts by time, and fires them on the clock. So re-timing or adding a beat is a **local edit to one
`<section>`** — there is no central list to keep in sync, which is exactly the "edit one segment,
the engine stays fixed" design goal.

## Authoring a teaser (for agents)
You usually don't need to read anything else in this folder. To make a teaser: **copy `teaser.html`** to
a new file and edit **only** the segments between the `↓↓↓ / ↑↑↑ EDIT FOR YOUR TEASER` markers. Each beat
is a self-contained `<section class="seg" data-seg="…">` — **search for its `data-seg` and edit just
that block; you don't need to read the other segments.** For each segment set:
- `data-at="<ms>"` on the `<section>` (when it becomes the active segment) and on each cue element
  inside it (when that element reveals). Times are milliseconds from t=0.
- `data-title` (shows in the band) and `data-band` (`hero` | `full` | `compact` — the band state).
- a reveal class on each cue: `r-up` / `r-fade` / `r-wipe` / `r-pop` (a cue with none defaults to fade).

To narrate: record a voiceover, drop the file in this folder, point the `<audio>` `<source src>` at it
(uncomment the line at the bottom of `teaser.html`), and retune each `data-at` to your words. The engine
is **audio-optional** — with no source it just plays the visual timeline. Everything else — the gold
`.bar`, the lockup, the scripts — is locked brand chrome; leave it. **Do not read `teaser.css`,
`teaser.js`, `build.mjs`, `record.mjs`, or `dist/` to fill content** — they're styling/engine/tooling.
Open `teaser.html` in a browser to preview as you go (it auto-plays, no build); when done, record + share
per `README.md`.

## What's here
- `teaser.html` — the template you copy from: one auto-playing teaser, a **fill-in skeleton** (Hook
  hero · Approach · Results · Close). The gold band is locked chrome; the segments between the EDIT
  markers are yours, each a self-contained `<section>`. **Copy, don't edit in place.**
- `teaser.css` — the teaser theme: brand tokens via `@import "../brand/colors.css"` + `tokens.css`, Inter
  `@font-face`, the `.bar` chrome (+ `hero`/`full`/`compact` band states), the **full** `.r-*` reveal set,
  the `.stat`/`.badge` screen components. Fixed px on the 720 stage (the stage scales as a unit).
- `teaser.js` — the **engine** (dependency-free, adapted from `../../reveal_v4/js/deck.js`): `fitStage()`
  scaling + timeline-from-DOM + an rAF play clock + audio sync + keys + the band-state toggle. Auto-plays
  on load. Exposes `window.TEASER_MS` / `window.TEASER_DONE` so `record.mjs` knows when to stop.
- `build.mjs` — the **copier + verifier** (see Build). Node built-ins only; **no Chromium**.
- `record.mjs` — the **renderer**: drives the on-box headless Chromium over CDP and encodes with the
  on-box ffmpeg to an MP4 (see Record). Node built-ins only; **no npm install**.
- `assets/` — the gold band PNGs (the self-contained-module precedent; see the band note below).
- `dist/` — **not committed**; built on demand by `build.mjs`/`record.mjs`. Delete after sharing.

## Build (portable copy — a file copier, no Chromium)
```bash
node build.mjs                       # teaser.html → dist/teaser/       (name defaults to file stem)
node build.mjs my-teaser.html        # your copy   → dist/my-teaser/
node build.mjs my-teaser.html proj   # your copy   → dist/proj/         (explicit project name)
```
`build.mjs` is the `slides`/`demo-pages` copier verbatim (only the stylesheet name differs): it vendors
the `../brand/…` files the teaser uses (+ `teaser.js`, + a wired voiceover if present) into
`dist/<project>/brand/`, rewrites `../brand/` → `brand/`, and **asserts self-containment** (no `../`
survives; every ref resolves). The live HTML/CSS/JS is the deliverable you open and share.

## Record (teaser → MP4 — two paths)
1. **Screen-record (no tools):** open `teaser.html`, press `F` to fullscreen, and screen-record the
   stage. The simplest path; works anywhere.
2. **Automated, on-box:**
   ```bash
   node record.mjs                          # teaser.html → dist/teaser.mp4
   node record.mjs my-teaser.html out.mp4   # your copy   → out.mp4
   ```
   `record.mjs` drives the cached headless Chromium over the **Chrome DevTools Protocol** using node's
   built-in `WebSocket` (no puppeteer/playwright library — the same dependency-free spirit as
   `posters/build.mjs` shelling out to Chromium). It captures **deterministically**: it steps Chrome's
   *virtual clock* (`Emulation.setVirtualTimePolicy`) in fixed 1/30s increments and takes a
   `Page.captureScreenshot` at each step, so every frame — including the eased CSS transitions — is
   genuinely rendered (no dropped/duplicated frames), then encodes them at a constant 30fps with the
   on-box **ffmpeg** (→ 1280×720 / 30fps / H.264). If the teaser wires a voiceover, a second ffmpeg pass
   muxes it in (AAC). ffmpeg + Chromium are **runtime tools, not repo dependencies** — nothing is
   installed or vendored. A GIF is then a one-line ffmpeg conversion of the MP4 (palettegen — see
   `README.md`).

## Conventions
- **The gold `.bar` is the standardized chrome** — SDSU│MINT lockup (left), the active segment's
  `data-title` (center, filled by `teaser.js`), a live timecode (right). It is `--sdsu-blue` in **both**
  accents — that fixed gold band *is* the "same header as the poster/deck" identity. The accent must
  never touch it.
- **Band states** follow the active segment's `data-band`: `hero` hides the band (the Hook is a
  full-bleed gold hero that carries the lockup itself — no gold-on-gold seam); `full` is the default
  84px band; `compact` shrinks it to a 56px watermark for later segments (reveal_v4's pattern). `--bar-h`
  drives both the bar height and the body offset, so the shrink reflows in one go.
- **Gold (`--sdsu-yellow`) is reserved for the headline result** — the `.stat` cards — and the hook hero
  ground. Never the teaser accent.
- **One `--accent`** drives the web-layer bits (heading rule, links, badges, stat qualifiers):
  `--sdsu-blue` by default, `--mint-green-deep` via `<div id="stage" class="accent-green">`.
- **Audio is optional.** No `<source>` → the engine plays the visual timeline alone; add one and it syncs
  the track to the clock (`VO.currentTime = elapsed/1000`).
- **Timeline-from-DOM.** Cues are `[data-at]` elements scanned in document order — no central timeline
  array. Edit/add/re-time a beat by editing its `<section>` only.
- **Fixed-stage px, not responsive.** The stage is 1280×720 and `teaser.js` scales it as one unit, so
  sizes are plain px against the 720 height (the screen-unit chrome shared with `slides/`).

## Held local (promotion deferred — the user's call)
- **Gold band art (`assets/`)** — copied here so the module is self-contained, same as `posters/assets/`,
  `readme-header/assets/`, `slides/assets/`. Still flagged **reference-only** (the MuSDeT teaser
  signature, `--ref-musdet-*`), *not* lab brand. Promotion to `brand/` is deferred.
- **The screen component CSS** (`.bar` chrome, `.stat`, `.badge`, the `.r-*` reveal set) is duplicated
  from `slides/`/`demo-pages/` because each module is self-contained (the copier's no-`../`-escape
  assertion depends on it; importing `slides/deck.css` would couple the modules and touch the locked
  `slides/`). **`videos/` is now the 3rd screen consumer**, which strengthens the long-flagged "lift
  shared screen CSS to `brand/`" case (see `slides/AGENTS.md` and `demo-pages/AGENTS.md`). Still
  **deferred**: the lift would touch `brand/` *and* the just-locked `slides/`, risking a regression
  there. Recorded as a candidate for a future minimal `brand/` pass, not done now.

## Rules (in addition to ../AGENTS.md)
1. **Brand by relative path** at rest (`../brand/…`); `@import "../brand/colors.css"` + `var(--…)`, never
   paste a hex (the only locals are the commented neutral `--backdrop`/`--surface`/`--shadow`). Never copy
   a logo in; never recolor/stretch/retrace SDSU.
2. **No `npm install`.** `build.mjs` uses only node built-ins (no Chromium). `record.mjs` uses node
   built-ins and may shell out to the **on-box** ffmpeg + Chromium via `child_process` — those are
   runtime tools, never a repo dependency; no puppeteer/playwright library, no node_modules.
3. **`../../reveal_v4/` is read-only** — study the seed, never modify it. Same for the other modules.
4. **Edit only the segments between the markers;** copy-to-new-file; copy the `dist/` folder, don't
   hotlink.
5. **Never hand-edit `dist/`** — it is generated; re-run `build.mjs` / `record.mjs`.
