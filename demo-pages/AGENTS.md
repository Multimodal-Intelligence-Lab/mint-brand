# AGENTS.md — demo-pages/

**Status: built.** A responsive project / paper demo-page template on the MINT brand — the screen
sibling of the deck/poster/readme-header. The header band + footer are the **standardized, locked
brand chrome**; the content between them is a freeform skeleton the author fills. Full brand contract:
`../AGENTS.md`. Usage: `README.md`.

A webpage is different from the other modules: its deliverable **is** the live HTML/CSS/JS (GitHub
Pages), not a rendered artifact (poster → PDF, readme-header → PNG). And the `slides/`/`videos/` stage is a fixed
1280×720 scaled by JS — **not** responsive — so this *applies* the brand tokens to a fresh,
fluid layout rather than porting stage/print CSS.

## Filling in a page (for agents)
You usually don't need to read anything else in this folder. To make a paper's page: **copy `page.html`**
to a new file and edit **only** the block between the `↓↓↓ / ↑↑↑ EDIT FOR YOUR PROJECT` markers — the
paper title (in the gold band), authors, affiliation, the action-button hrefs, the abstract,
approach + contribution badges, the result `.stat` cards, BibTeX, and acknowledgements. Everything else
is the locked brand chrome — leave it. **Do not read `style.css`, `build.mjs`, or `dist/` to fill
content** — they're styling/tooling, not content, and `dist/` vendors a ~915 KB logo + font binaries
that will needlessly bloat your context. When done, build + deploy per `README.md`.

## What's here
- `page.html` — the template you copy from: one full responsive page, a **fill-in skeleton** with a
  placeholder title and placeholder content under each section. The gold band header + footer are the
  locked chrome; the block between the EDIT markers is yours. **Copy, don't edit in place.**
- `style.css` — the web theme: brand tokens via `@import "../brand/colors.css"` + `tokens.css`,
  Inter `@font-face`, the `.band-head` chrome, the single `--accent` swap, fluid `clamp()` type off
  `--type-ratio`, screen-unit ports of the `.stat`/`.badge`, and the sticky-header + scroll-to-top bits.
- `build.mjs` — the **copier + verifier** (see Build). Node built-ins only; **no Chromium**.
- `assets/` — the gold header band PNGs (the self-contained-module precedent; see the band note below).
- `screenshots/` — `page.png`, a static header shot of the skeleton for this README only (regenerate by
  hand with a headless Chromium `--screenshot` if the design changes; not part of the build).
- `dist/` — **not committed**; built on demand by `build.mjs` (see Build). A built `dist/<project>/` is a
  fully self-contained deployable copy you copy into your repo, then delete from here.

## Build
```bash
node build.mjs                       # page.html → dist/page/      (project name defaults to file stem)
node build.mjs my-paper.html         # your copy → dist/my-paper/  (name defaults to the file stem)
node build.mjs my-paper.html my-proj # your copy → dist/my-proj/   (explicit project name)
```
`build.mjs` is a **file COPIER, not a renderer** — a webpage needs no render step, and baking Chromium
in would be the reflexive over-build this repo guards against. It vendors the `../brand/…` files the
page actually uses into `dist/<project>/brand/` (subpaths preserved; band PNGs to `dist/<project>/assets/`),
rewrites every `../brand/` → `brand/`, and writes `index.html` + `style.css`. **Verify = self-containment
assertion** (the demo-pages analog to the poster's PDF-dim / readme-header's PNG-pixel checks): no `../`
survives, and every referenced file resolves inside `dist/<project>/`. Refs are discovered by parsing the
**comment-stripped** source (the HTML comments hold deliberately-fake `architecture.svg`/`results.svg`
figure paths and the CSS comment mentions `../brand/colors.css` in prose — a raw grep would chase
non-existent files).

## Per-project pages
Like the poster/header templates: **copy** `page.html` to a new file, edit only the
marked block (title/authors/links/abstract/method/results/BibTeX/acks), `node build.mjs` it,
then **copy the whole `dist/<project>/` folder** into your repo / GitHub Pages (copy the folder, don't
hotlink). The source keeps `../brand` at rest so it honors the single-source; vendoring happens **only**
in `dist/`. **Never hand-edit `dist/`** — re-run the build.

## Conventions
- **The header band carries the paper title** in the gold band, deck/poster style (reflows taller on
  mobile, QR drops to the footer). Header + footer are the standardized chrome; the content between the
  EDIT markers is freeform — the author owns it.
- **The marks fill the band proportionally.** The lockup logos + QR are sized as `calc()` fractions of
  a `--band-h` token (mirroring how `poster.css` sizes its lockup off `--header-h`) so they fill the
  band like the poster/readme-header — not a fixed px that reads small. Tune the fractions against a
  render; "proportional" is a visual call. The footer lockup keeps its own smaller fixed size.
- **Sticky header + scroll-to-top.** The band is `position: sticky` on desktop (static below 720px,
  where it stacks tall); a `.to-top` button is revealed by the inline script past ~400px of scroll and
  honors `prefers-reduced-motion`. Both are dependency-free chrome — *not* VCS's Tailwind/SPA stack
  (that would break the repo's dependency-free + minimal rules; take its layout cues, not its framework).
- **The band chrome is fixed to `--sdsu-blue` in both accents** (band title text, lockup divider,
  corner triangle) — that fixed gold-band header *is* the "same header as the deck/poster" identity,
  matching `readme-header/` and `poster.css`. The accent must never touch it.
- **One `--accent` variable** drives only the web layer (links, buttons, section rules, eyebrows,
  in-text emphasis): `--sdsu-blue` by default, `--mint-green-deep` via `<body class="accent-green">`.
- **Gold (`--sdsu-yellow`) is reserved for the one headline result** — the `.stat` cards (60/30/10),
  tying back to the gold header. Never the page accent.
- **Edit only the marked block;** the chrome (band, lockup, corner triangle, footer, scroll-to-top) is
  shared layout — keep it faithful to the deck/poster header.

## Held local (promotion deferred — the user's call)
- **Gold band art (`assets/`)** — copied here so the module is self-contained, same as
  `posters/assets/` + `readme-header/assets/`. Still flagged **reference-only** (the MuSDeT teaser
  signature, `--ref-musdet-*`), *not* lab brand. Promotion to `brand/` is deferred (it would declare
  gold the lab header signature **and** rewire the working poster build). Don't assert gold is lab-brand.
- **The screen component CSS** (`.band-head` chrome, `.stat`, `.badge`, buttons, `.to-top`)
  is a fresh **screen-unit** re-implementation (no physical units, no `print-color-adjust`) — the
  cross-medium sibling of the print-tuned versions held in `poster.css`. The anticipated second screen
  consumer (`slides/`) now exists — but the overlap is **partial**: the band geometry genuinely differs
  (this page reflows with `clamp()`; `slides/` is fixed-stage px), so only `.stat`/`.badge` + the
  color/accent discipline are truly shared. The `brand/` lift is **deferred** — it would touch `brand/`
  *and* this just-locked `style.css` (regression risk for no functional gain); recorded as a candidate
  for a future minimal pass, not done now. See `slides/AGENTS.md` for the matching note.
- **Payload note (not fixed):** `../brand/logos/mint-logo.png` is ~915 KB and is loaded on every page
  view, scaled to ~67 px — heavy for the web. Trimming it means touching `brand/` (out of scope here);
  recorded so a future brand pass can produce a web-sized logo.

## Rules (in addition to ../AGENTS.md)
1. **Brand by relative path** at rest (`../brand/…`); `@import "../brand/colors.css"` + `var(--…)`,
   never paste a hex (the only locals are the commented neutral `--surface`/`--shadow`). Never copy a
   logo in; never recolor/stretch/retrace SDSU.
2. **No `npm install`.** `build.mjs` uses only node built-ins — no Chromium, no dependencies.
3. **Edit only the marked content block;** copy-to-new-file; copy the `dist/` folder, don't hotlink.
4. **Never hand-edit `dist/`** — it is generated; re-run `build.mjs`.
