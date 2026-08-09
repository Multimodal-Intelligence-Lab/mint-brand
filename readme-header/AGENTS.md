# AGENTS.md — readme-header/

**Status: built.** A branded README header on the MINT brand — the same brand identity as the deck
(`slides/`) and the poster, ported to a GitHub-friendly **1280×160 banner**, rendered HTML → PNG. Full
brand contract: `../AGENTS.md`. Usage: `README.md`.

## What's here
- `header.html` — the template you edit (flat gold banner + lockup + title/affiliation/extras + QR +
  corner triangle). Filled with a short MuSDeT example; edit only the marked content block.
- `mint-brand-hero.html` — this repo's own filled instance of the template (the banner at the top of
  the root README → `docs/samples/hero.png`); the same chrome with the brand-kit's own content.
- `build.mjs` — renders `header.html` via the cached headless Chromium and **verifies** the PNG's
  exact pixel size (reads the IHDR chunk — the dependency-free analog to how `posters/` verifies PDF
  dims via poppler). Node built-ins only.
- `dist/` — the rendered `header.png` (the example output; what a consumer copies).

There is deliberately **no `assets/`** here — this banner is flat gold, not the textured band art the
other modules carry (see "Flat gold, no band texture" below).

## Build
```bash
node build.mjs                      # header.html → dist/header.png   (re-renders the example)
node build.mjs my-project.html      # a per-project copy → dist/my-project.png
node build.mjs my-project.html 1280x160  # explicit logical size
```

## Per-project headers
The header is **per-project** — like the poster template, **copy, don't edit in place**: copy
`header.html` to a new file *in this folder* (e.g. `my-project.html`), swap the title / affiliation /
extras line and the QR in your copy, render it (`node build.mjs my-project.html` → `dist/my-project.png`),
and copy *that* PNG into the project's own repo (copy the PNG, don't hotlink). No build step for the
consumer — they just embed the PNG. `header.html` stays the pristine template/example.

## Conventions
- **1280×160 banner (8:1)** — sized so the title reads at GitHub's rendered README width, NOT the thin
  16:1 poster strip (a README is viewed on GitHub, where a tiny in-strip title looked bad). It's the
  same brand identity as the deck/poster header, ported to this medium — not byte-identical chrome.
  Keep the band height fixed and tune the title: `.center` is overflow-clipped by the band, so keep
  the title short (the big type is the point) and drop the `.title` font-size a few px for a longer one.
- **Lockup** — SDSU │ MINT per `../brand/logos/README.md`, composed at the use-site (never a baked
  combined image), SDSU optically a touch taller than MINT, divider a thin rule. On the gold band the
  divider is `--sdsu-blue` (a `--border` #ccc hairline would vanish on gold — context, not a
  contradiction with the lockup recipe's `--border`).
- **Text colour** — the brand token `var(--sdsu-blue)`, matching the *poster* band; not a navy
  (`--sdsu-navy`, or the poster-local `--poster-ink`) — those are body/ink colours, never the band.
  Never paste hex (SVG triangle uses `style="fill:var(--…)"`).
- **PNG, not SVG** — GitHub strips inline SVG and drops web fonts in SVG-as-`<img>`. The opaque band
  means one PNG serves both light and dark GitHub themes (no `<picture>` needed).
- **QR** — defaults to the lab org QR (green modules read on the gold band); optional, deletable.

## Flat gold, no band texture
This banner uses a **flat `--sdsu-yellow` ground**, not the textured gold-band art the poster /
slides / videos / demo-pages share (`header_*_yellow.png`). The texture is tuned for the 16:1 strip
and upscales poorly at 8:1, and a flat opaque fill is what makes one PNG read on both GitHub themes.
So there is no `assets/` here — nothing to promote to `brand/`; the textured band stays each
print/stage module's own copy (see `posters/AGENTS.md`).

## Rules (in addition to ../AGENTS.md)
1. **Brand by relative path.** `../brand/logos/`, `../brand/colors.css`, `../brand/fonts/`,
   `../brand/qr/`. Never copy a brand asset in or hardcode a colour.
2. **No `npm install`.** `build.mjs` uses only node built-ins + a cached/system Chromium.
3. **Edit only the marked content block** in `header.html`; the chrome (band, lockup, triangle) is
   shared layout — keep it faithful to the deck/poster header.
