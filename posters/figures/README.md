# figures — the MINT chart system

One matplotlib stylesheet that makes a poster's charts look like the poster: same font (Inter),
same neutrals, same spine/grid conventions, transparent SVG. It is to charts what `../poster.css`
is to the page — it **applies** the brand, so it lives here in `posters/`, not in `../../brand/`
(which is tokens/assets only). **Promote** it to `brand/figures/` when a *second* real consumer
(slides, a paper) needs it — not before.

## Two layers

- **Universal (brand) — `mint.mplstyle`.** Inter, brand neutrals (`--ink`, `--border`), top/right
  spines off, a light behind-the-data grid, transparent background, and `svg.fonttype: path` so
  every exported SVG is **font-free** (text becomes glyph outlines — no font needed when the poster
  is rendered or printed). The handful of hex here are mirrored from `../../brand/colors.css` with a
  pointer comment; the brand primaries are PMS-locked and don't drift, so a mirror is the
  single-source contract — there is deliberately **no** generator to run.
- **Per-paper accent slot — `../examples/plots/mint_figs.py` `PALETTE`.** Each paper picks its own
  accent + per-modality colours. The MuSDeT example mirrors the `--ref-musdet-*` accents from
  `colors.css` (gold = "our model", `m1/m2/m3` = the three modalities, navy = the paper's ink). A
  new paper copies the plots and swaps this dict; the universal layer is untouched.

## Regenerating the example figures

The plot scripts live in `../examples/plots/`. They need only **matplotlib** (+ **fonttools** with
**brotli** for the font step) — no `npm install`, nothing left in the repo afterwards.

```bash
cd ../examples/plots
python3 plot_ablation.py        # -> ../assets/ablation_bars.svg
python3 plot_context_sweep.py   # -> ../assets/context_sweep.svg
```

SVG is the only output (matching the rest of `assets/`); to eyeball a figure, open the `.svg` or
render the poster.

**Inter at generation time.** `brand/fonts` ships Inter only as a variable **woff2**; matplotlib
needs a `.ttf`. `mint_figs.register_inter()` derives three static instances (Regular 400, Bold 700,
Italic 400) into a **transient** cache (`$TMPDIR/mint-inter-cache`) and registers them for the run —
nothing is added to the repo, exactly like the segno QR recipe. It then **verifies** Inter actually
resolved (bold included) and warns loudly if it fell back to DejaVu. To make regeneration
font-install-free on any machine, commit the two derived ttfs to `brand/fonts/` — only if you want
that; the default keeps the repo dependency-free at rest.

## Bringing your own figure (not from these scripts)

If you have a figure as a **PDF** (e.g. a TikZ diagram), convert it to a font-free SVG the same way
the template README describes:

```bash
pdftocairo -svg figure.pdf ../assets/figure.svg   # poppler; text -> glyph paths
```

## Current example status (MuSDeT)

| figure | source | status |
|---|---|---|
| `ablation_bars.svg`  | `plot_ablation.py`       | **brand-styled** (Inter + palette) |
| `context_sweep.svg`  | `plot_context_sweep.py`  | **brand-styled** (Inter + palette) |
| `seed_robustness.svg`| `plot_seed_robustness.py`| **brand-styled**, but on **illustrative synthetic** per-seed data — the real `aggregated.json` is gone; MuSDeT's WESAD mean is anchored to the published 66.9%, swap real numbers into `SEED_ACCS` |
| `architecture-cvpr-poster.svg` | `cvpr-poster-template/architecture-cvpr-poster.tex` (TikZ) | **original** — re-fonting needs the LaTeX toolchain (out of scope) |

The pre-change SVGs are backed up in `../examples/assets/.bak/`; the true originals remain the
read-only `cvpr-poster-template/plots/*.pdf`.
