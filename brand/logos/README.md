# MINT logos

Four PNGs. Pick by background and available space; never recolor, stretch, or redraw them.

| File | What | Use |
|---|---|---|
| `mint-logo.png` | Full-color master — M+leaf + wordmark | **Default.** Light backgrounds. |
| `mint-logo-white.png` | White knockout of the same silhouette | Dark backgrounds (navy, photos). Single-color *by design* — it drops the two-tone and the leaf vein; use the master wherever you want color. |
| `mint-mark.png` | The M+leaf symbol only, full color | Tight / square spots where the wordmark won't fit — favicons, avatars, watermarks. |
| `sdsu-logo.png` | SDSU institutional mark, as supplied | University / official contexts. Pair as **SDSU │ MINT** (the teaser's lockup). |

**Clear space:** keep padding of at least the cap-height of the "M" on every side; don't crowd it.

**Lockup (SDSU │ MINT):** the institutional pairing the teaser uses. Place `sdsu-logo.png` and
`mint-logo.png` side by side, vertically centered, separated by a thin vertical hairline
(`var(--border)`), each keeping its clear space. **Compose it at the use-site** (e.g. a CSS flex
row) — don't bake a combined image file (that would duplicate the assets). In the reference deck
SDSU sits slightly taller than MINT (≈96 px vs ≈86 px) for optical balance.

**Where these come from:** `mint-logo*.png` and `mint-mark.png` are derived from the lab logo
used in `../../../reveal_v4/` — white is the logo's own alpha silhouette painted white; the mark
is the M+leaf crop above the wordmark. The full-color `mint-logo.png` is the faithful master.

**SDSU is a trademark** — don't alter or recolor it. It's bundled as the PNG we have; sourcing
the official SDSU vector is still an open action item.

**PNG only, on purpose** — there is no vector source and autotracing degrades the mark, so the PNG
master is authoritative (see root `../../AGENTS.md` rule 5).
