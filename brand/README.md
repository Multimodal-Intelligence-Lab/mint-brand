# MINT brand foundation

The single source of truth for the lab's identity — **logos, colors, fonts, icons, QR**. Every other
module under `mint-brand/` (slides, posters, videos, …) reads from here by relative path; nothing copies
an asset or hardcodes a color elsewhere.

Plain files — no build step, no dependencies.

## Logos
`logos/` — `mint-logo.png` (master), `mint-logo-white.png` (dark backgrounds), `mint-mark.png`
(symbol only), `sdsu-logo.png` (institutional). Which-one-when + the rules: **`logos/README.md`**.

## Colors
`colors.css` — the palette as CSS custom properties. `@import` it (path relative to your file,
e.g. `../brand/colors.css`) and use `var(--…)` — don't paste hex.

| Token | Hex | Use |
|---|---|---|
| `--mint-green` | `#478a2d` | Primary brand green — the M+leaf mark |
| `--mint-green-deep` | `#106f2f` | Deep green — text & strong accents |
| `--sdsu-yellow` | `#ffd100` | SDSU institutional — SDState Yellow (PMS 109) |
| `--sdsu-blue` | `#0033a0` | SDSU institutional — SDState Blue (PMS 286) |
| `--ink` | `#222222` | Body text |
| `--border` | `#cccccc` | Hairlines, dividers |
| `--paper` | `#ffffff` | Surfaces |
| `--ref-musdet-*` | (see file) | **Reference only** — example accents from the MuSDeT teaser, *not* the brand |

MINT greens are eyedropped from `logos/mint-logo.png` (the lab's own mark — the authoritative
source for its color). The SDSU primaries are the official
[SDState brand standards](https://www.sdstate.edu/university-marketing-communications/graphic-identity-standards/colors)
(PMS 109 / PMS 286) — the logo PNG renders them slightly differently, so use these published
values, not an eyedrop. The `--ref-musdet-*` set is from `../../reveal_v4/css/theme.css`.

## Design tokens
`tokens.css` — the **non-color** design tokens (currently the type-scale ratio) as CSS custom
properties; the companion to `colors.css`. `@import` it and use `var(--…)`. Values are
**unitless/ratio** so each module applies them in its own medium's units (the poster off the page
size, a slide off the viewport). Seeded minimal — grows only when a real consumer needs a token.

## Type
`fonts/` — **Inter** variable (latin + italic), OFL licensed, self-hostable:
```css
@font-face {
  font-family: "Inter";
  src: url("../brand/fonts/inter-variable-latin.woff2") format("woff2");
  font-weight: 100 900;
}
```
(The MuSDeT teaser used Helvetica Neue; Inter is the open, self-hostable default going forward.)

## Icons
`icons/` — `currentColor` SVGs: the common lab-link types (github, globe, mail, …) **plus the mint
M+leaf accent mark** (`leaf.svg` — brand it with `var(--mint-green)`; the canonical home for the
mark, so modules reference it rather than re-drawing the path). They inherit the surrounding text
color. Licenses + the full list: **`icons/LICENSES.md`**.

## QR
`qr/` — the lab QR as **SVG** (scales, use by default) + **PNG** fallback, encoding the lab GitHub
org. Plain black-on-white, high error-correction, verified to decode. Details + regenerate recipe:
**`qr/README.md`**.
