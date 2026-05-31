# AGENTS.md — readme-header/

**Status: built.** A branded README header on the MINT brand — the same header as the deck
(`../../reveal_v4/` `.banner`) and the poster band, rendered HTML → PNG. Full brand contract:
`../AGENTS.md`. Usage: `README.md`.

## What's here
- `header.html` — the template you edit (gold band + lockup + title/authors/affiliation + QR + corner
  triangle). Filled with the MuSDeT paper as the worked example; edit only the marked content block.
- `build.mjs` — renders `header.html` via the cached headless Chromium and **verifies** the PNG's
  exact pixel size (reads the IHDR chunk — the dependency-free analog to how `posters/` verifies PDF
  dims via poppler). Node built-ins only.
- `assets/` — the gold header band PNGs (see the band note below).
- `dist/` — the rendered `header.png` (the example output; what a consumer copies).

## Build
```bash
node build.mjs                      # header.html → dist/header.png   (re-renders the example)
node build.mjs my-project.html      # a per-project copy → dist/my-project.png
node build.mjs my-project.html 1280x80   # explicit logical size
```

## Per-project headers
The header is **per-project** — like the poster template, **copy, don't edit in place**: copy
`header.html` to a new file *in this folder* (e.g. `my-project.html`), swap the title / authors /
affiliation and the QR in your copy, render it (`node build.mjs my-project.html` → `dist/my-project.png`),
and copy *that* PNG into the project's own repo (copy the PNG, don't hotlink). No build step for the
consumer — they just embed the PNG. `header.html` stays the pristine template/example.

## Conventions
- **16:1 band** — matches the poster header exactly (the poster band is 3024×189pt = 16:1). It's a
  thin strip on purpose; don't grow it into a tall block. `.center` is overflow-clipped by the band,
  so a long title silently clips top/bottom — drop the `.title` font-size a point or two for a longer
  title rather than enlarging the band.
- **Lockup** — SDSU │ MINT per `../brand/logos/README.md`, composed at the use-site (never a baked
  combined image), SDSU optically a touch taller than MINT, divider a thin rule. On the gold band the
  divider is `--sdsu-blue` (a `--border` #ccc hairline would vanish on gold — context, not a
  contradiction with the lockup recipe's `--border`).
- **Text colour** — the brand token `var(--sdsu-blue)`, matching the *poster*, not the deck's
  reference-only `--navy`. Never paste hex (SVG triangle uses `style="fill:var(--…)"`).
- **PNG, not SVG** — GitHub strips inline SVG and drops web fonts in SVG-as-`<img>`. The opaque band
  means one PNG serves both light and dark GitHub themes (no `<picture>` needed).
- **QR** — defaults to the lab org QR (green modules read on the gold band); optional, deletable.

## Gold band art (`assets/`) — promotion is deferred
The band (`header_*_yellow.png`) is **copied here** so the module is self-contained — the same way
`posters/assets/` keeps its own copy. It is still flagged **reference-only** (the MuSDeT teaser
signature, `--ref-musdet-*`), *not* lab brand. `posters/AGENTS.md` says to promote it to `brand/`
once a second module needs it — and this is that second module — but promoting it declares gold the
lab's shared header signature (a deliberate brand call) **and** rewires the working poster build, so
it's left open. Say the word and it moves to `brand/` with the poster regression re-verified. Until
then, each module keeps its own copy; don't assert gold is lab-brand in docs.

## Rules (in addition to ../AGENTS.md)
1. **Brand by relative path.** `../brand/logos/`, `../brand/colors.css`, `../brand/fonts/`,
   `../brand/qr/`. Never copy a brand asset in or hardcode a colour.
2. **No `npm install`.** `build.mjs` uses only node built-ins + a cached/system Chromium.
3. **Edit only the marked content block** in `header.html`; the chrome (band, lockup, triangle) is
   shared layout — keep it faithful to the deck/poster header.
