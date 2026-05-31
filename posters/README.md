# posters

Research-poster templates on the MINT brand — one HTML template, rendered to print-ready PDF at any
size. Same identity as the lab's CVPR poster and the MuSDeT teaser deck: gold header band, navy body
text, blue section bars, Inter type, every color single-sourced from `../brand`.

## Quick start

```bash
# 1. edit poster.html  (title, authors, sections, figures)
# 2. render every catalog size into dist/:
node build.mjs
# …or just one size:
node build.mjs poster.html 48x36
```

Each PDF is verified after rendering — exact page size, single page, fonts embedded. Open
`dist/poster-48x36.pdf` and print at 100% / "actual size".

## Sizes (`sizes.js`)

| key | size | orientation | columns |
|---|---|---|---|
| `30x40` | 30 × 40 in | portrait | 2 |
| `40x30` | 40 × 30 in | landscape | 3 |
| `48x36` | 48 × 36 in | landscape | 3 |
| `48x36-trifold` | 48 × 36 in | landscape, tabletop trifold | 3 |
| `56x36` | 56 × 36 in | landscape | 4 |
| `44x44` | 44 × 44 in | square | 3 |
| `48x48` | 48 × 48 in | square | 3 |
| `A0` | 841 × 1189 mm | portrait | 2 |

`sizes.js` is the single source — add or change a size there and `build.mjs` picks it up. Everything
(type, header, gaps, bars) scales off the page dimensions, so the template reflows to fit.

## Writing a poster

- **Sections** are `<section class="section">` = a `.bar` (blue title) over a `.panel` (slate body).
  They flow into the columns and are balanced across the page; reorder/add/remove freely. Force a
  column break with `class="break-after"`. A figure that should span all columns: `class="fig wide"`.
- **Figures: supply SVG.** Raster images blur at A0. To turn an existing figure PDF into SVG:
  ```bash
  pdftocairo -svg figure.pdf assets/figure.svg     # poppler; text becomes glyph paths, font-free
  ```
  Then `<img src="assets/figure.svg">` inside a `<figure class="fig">`. To make a **matplotlib
  chart** match the poster (Inter + brand palette + the lab's spine/grid conventions), use the chart
  system in [`figures/`](figures/) — see `figures/README.md`.
- **Emphasis (optional):** for visual hierarchy inside the dense layout, `poster.html` shows
  numbered contribution pills (`.badge`), gold-bordered hero stat cards (`.stat`), and a slim
  footer band (`.footer`, repo · authors · institution). Each is self-contained — copy or delete
  freely; the footer's grid row collapses when removed.
- **Colors:** use `var(--…)` from `../brand/colors.css` (e.g. `--sdsu-blue`, `--mint-green`). Never
  paste hex. The only poster-local colors are `--poster-ink` (MuSDeT navy) and `--panel` (slate),
  declared at the top of `poster.css`.
- **Header marks (top-right):** the QR defaults to the lab QR (green, blends into the band). To use
  your own, drop a personal QR (github.io / website) in `assets/` and point the `.qr` `src` at it.
  The conference-logo slot next to it is a placeholder — replace it with your venue's logo, or
  delete the block when presenting locally. (The lab QR's white quiet zone is gone so it can blend;
  it stays scannable on the light gold band, but do a quick print-and-phone-scan before a deadline.)

## Worked example

`examples/musdet.html` is the lab's CVPR poster rebuilt in this template — the best reference for how
to fill one in, and a regression check against the original LaTeX PDF:

```bash
node build.mjs examples/musdet.html 42x21      # → dist/musdet-42x21.pdf
```

It reproduces the original faithfully (header, sections, colors, figures). It is *not* pixel-identical:
the body uses **equal** reflowable columns rather than the original's hand-tuned wider center column.

## Printing & color

PDFs are **sRGB**, which most large-format print shops accept and often prefer. If a shop requires
CMYK, convert with ghostscript (a coarse, profile-free conversion — for accurate color let the shop
convert with their press profile):

```bash
gs -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sProcessColorModel=DeviceCMYK \
   -sColorConversionStrategy=CMYK -o dist/poster-48x36-cmyk.pdf dist/poster-48x36.pdf
```

Chromium embeds the variable Inter as Type 3 glyph outlines (sharp, but a few print RIPs are fussy
about Type 3). If a shop rejects it, flatten text to paths with ghostscript:
`gs -dBATCH -dNOPAUSE -dNoOutputFonts -sDEVICE=pdfwrite -o out-outlined.pdf in.pdf`.

## Requirements

Runs on **Linux, macOS, and Windows** — `build.mjs` finds the browser automatically on each.

- **node** (uses only built-ins — no `npm install`).
- **A Chromium**, located automatically:
  - **Linux** — `google-chrome` / `chromium` on `PATH`.
  - **macOS** — Google Chrome in `/Applications` (get it from google.com/chrome).
  - **Windows** — Chrome under `Program Files`, or **Edge** (ships with Windows — works as-is).
  - any OS — otherwise `npx playwright install chromium` (cached under the platform's ms-playwright dir).
- **poppler** (`pdfinfo`, `pdffonts`, `pdftocairo`) — for the post-render verification (page size,
  single page, fonts embedded) and `pdftocairo -svg`. **Optional**: without it `build.mjs` still
  renders the PDFs and just skips the checks (and says so). Install via `apt/dnf install
  poppler-utils` (Linux), `brew install poppler` (macOS), or `choco`/`scoop install poppler` (Windows).

## Notes

- `dist/` is build output — regenerable, safe to delete.
- Special glyphs not in the brand's Inter latin subset (e.g. → × — −) fall back to the system font;
  visually negligible (punctuation only). The brand font is not modified here.
- See `AGENTS.md` for the rules an AI agent should follow when editing here.
