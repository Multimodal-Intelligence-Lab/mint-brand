# AGENTS.md — posters/

**Status: built.** HTML → PDF research-poster templates on the MINT brand. Full brand contract:
`../AGENTS.md`. Usage: `README.md`.

## What's here
- `poster.html` — the template you edit (header + sections + a `<!--SIZE_BLOCK-->` marker).
- `poster.css` — shared styles: header port, multi-column body, scaling, `print-color-adjust`.
- `sizes.js` — the size catalog (single source of truth for dimensions/columns).
- `build.mjs` — injects each size, renders via the cached Chromium, **verifies** the PDF.
- `assets/` — the gold header band PNGs (copied here so posters are self-contained).
- `figures/` — the MINT **chart system**: `mint.mplstyle` (the brand-universal matplotlib layer) +
  recipe (`figures/README.md`). Makes a paper's charts match the poster — Inter, brand palette,
  spine/grid conventions, transparent SVG. Output is SVG only (sharp at A0).
- `examples/musdet.html` (+ `examples/assets/`) — the lab's CVPR poster rebuilt here; the worked
  reference + a regression check at 42×21.
- `examples/plots/` — that example's plot scripts (`plot_*.py` + `mint_figs.py`): apply
  `mint.mplstyle` + the **per-paper accent** `PALETTE`, writing SVGs into `examples/assets/`.

## Build
```bash
node build.mjs                      # all catalog sizes → dist/
node build.mjs poster.html 48x36    # one size
node build.mjs examples/musdet.html 42x21   # the example
```

## Per-paper posters
The template stays generic — for a real paper, **copy, don't edit in place**: duplicate `poster.html`
(or `examples/musdet.html` as a filled-in model), swap title/authors/sections/figures, drop in the
conference logo + a personal QR, and for charts copy `examples/plots/` and swap the per-paper
`PALETTE` accent. `examples/musdet.html` is the worked reference *and* the 42×21 regression check —
keep it faithful to the original LaTeX poster (`../../cvpr-poster-template/`, read-only).

## Conventions (where to look in `poster.css`)
- **Type scale** — one ratio (`--type-ratio`, from `../brand/tokens.css`) generates the `--fs-*` steps;
  elements pick a step, not a bespoke size. Spacing stays on `--margin`'s cadence; a baseline grid is
  deliberately deferred. Reported numbers use `tabular-nums` (`.stat`, and the `.num` helper).
- **Header** — gold band with a bottom-left sweep (`--band-curve`); a top-right brand-blue **corner
  triangle** (inline `<svg class="corner">`, `fill:var(--…)`, lower tip softly curved) sized off
  `--header-h`; the marks cluster (QR + conf logo) is inset past the triangle's footprint
  (`calc(--header-h*0.34 + gap)`) so it never slices the logo.
- **Footer (optional)** — slim brand-blue band with a gold top-rule that bookends the header; delete
  the `<footer>` to drop it (its grid row collapses). Not used in `examples/musdet`.
- **Hierarchy** — numbered contribution pills (`.badge`) + gold-bordered hero stat cards (`.stat`);
  gold is reserved for the one headline result.
- **Brand mark** — the mint M+leaf accent is `../brand/icons/leaf.svg`, inlined with
  `fill:var(--mint-green)`; never re-draw the path.

## Promotion ledger (→ `brand/`)
`brand/` is the single source; promote a shared piece there only on its **first real second consumer**
(the root-`AGENTS.md` rule that stops us re-over-building). Current status:
- **Promoted (medium-agnostic):** the mint leaf mark (`../brand/icons/leaf.svg`) and the type-scale
  ratio (`../brand/tokens.css`) — every artifact inherits these as-is.
- **Held here (print-tuned):** the component CSS — header band/art, section bar, panel, footer,
  figure style, `.badge`, `.stat`. They use physical units + `print-color-adjust`; a screen
  (slides/demo) or image (README-header) consumer needs a different implementation, so they stay
  local until a second consumer shows the cross-medium shape. Lift then, minimally.
  *(Update 2026-05-29: `demo-pages/` is now that screen consumer — it re-implemented `.stat`/`.badge`
  (and the band/footer) in screen units rather than sharing this code, confirming print and screen
  share the **concept, not the CSS**. Still held local — lift only when a 2nd screen consumer shows a
  genuinely shared shape. See `demo-pages/AGENTS.md`.)*

## Rules (in addition to ../AGENTS.md)
1. **Colors are single-sourced.** Use `var(--…)` from `../brand/colors.css`. The *only* raw hex
   allowed is the commented poster-local palette in `poster.css` (`--poster-ink`, `--panel`) — the
   two MuSDeT-identity colors that aren't brand primaries. Never add other literals (incl. in SVG —
   use `style="fill:var(--…)"`).
2. **Figures as SVG.** Raster blurs at A0. Vectorize PDFs with `pdftocairo -svg` (README recipe).
3. **Physical units only** (in/mm/rem) — never `px`. Type/spacing scale off `--page-w/--page-h`.
4. **`@page { size }` needs a literal**, not `var()` — `build.mjs` injects it at `<!--SIZE_BLOCK-->`.
   Add/change sizes in `sizes.js`, not by hand-editing dimensions.
5. **`print-color-adjust: exact` is load-bearing** — without it Chromium drops every CSS
   background/border (bars, panels, triangle, fold guides). Header band art is `<img>` for the same
   reason (CSS `background-image` is dropped by `--print-to-pdf`).
6. **Keep the opening `<body>` tag at the start of its line** — `build.mjs` toggles the trifold class
   on it with an anchored match.
7. **Header art stays here, not in `brand/`.** The gold band is the MuSDeT signature
   (`--ref-musdet-*`, "reference only"), not the lab brand header. Don't promote it to `brand/`
   unless a second module needs it.
8. **No `npm install`.** `build.mjs` uses only node built-ins + a cached/system Chromium. (A
   `playwright-core` fallback is documented only for older Chromes that ignore `@page size`; current
   Chrome honors it — don't add the dependency unless the verify step actually fails on dimensions.)
