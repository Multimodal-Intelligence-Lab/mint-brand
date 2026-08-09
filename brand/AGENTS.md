# AGENTS.md — brand/ (the source of truth)

Everything here is consumed by other modules via relative path. **Editing an asset here changes it
everywhere** — be deliberate. Full rules: `../AGENTS.md`.

| Folder / file | What an agent does with it |
|---|---|
| `logos/` | Pick a logo per `logos/README.md`. PNG only — no SVG, never autotrace, never recolor. SDSU is a trademark. |
| `colors.css` | `@import` it; use `var(--…)`. Never paste hex. `--ref-musdet-*` are **reference-only**, not the brand. |
| `tokens.css` | `@import` it; use `var(--…)`. Non-color design tokens (type-scale ratio). Unitless — each module applies them in its own units. |
| `wordmark.css` | `@import` it (with `colors.css`) and use the `.mint-name` / `.g` / `.leaf` classes. The one canonical lab-name treatment — never re-declare it locally. Canonical HTML is in its header comment. |
| `fonts/` | Inter (variable, latin + italic), OFL. `@font-face` snippet in `README.md`. |
| `icons/` | `currentColor` SVGs — set CSS `color:`/`fill` to brand them. Includes `leaf.svg`, the mint M+leaf accent (brand with `var(--mint-green)`; inline it in print). Licenses in `icons/LICENSES.md`. |
| `qr/` | Lab GitHub-org QR (SVG + PNG). Regenerate via `qr/README.md`; don't hand-edit. |

Don't add new brand assets unless a module actually needs one; document a recipe over baking a file.
