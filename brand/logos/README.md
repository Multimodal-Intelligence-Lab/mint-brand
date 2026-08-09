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
`mint-logo.png` side by side, vertically centered, separated by a thin vertical divider, each keeping
its clear space. **Compose it at the use-site** (e.g. a CSS flex row) — don't bake a combined image
file (that would duplicate the assets).

- **Divider — pick by ground.** On the **gold band** (poster, README header, deck/teaser bar,
  demo-page header) it is a 2 px rule in `var(--sdsu-blue)` at ~0.85 opacity: a `var(--border)` #ccc
  hairline is invisible on gold. On a **light/paper ground** (page footer, closing slide, teaser
  close) it is the `var(--border)` hairline. Every implementation in this repo follows that split.
- **Heights.** SDSU sits slightly taller than MINT for optical balance: set MINT to **≈90–92 % of the
  SDSU height** and keep one value per artifact. That tolerance is what the modules actually use —
  0.90 (poster), 0.913 (README header, demo-page), 0.9167 (deck/teaser bar), 0.921 (title hero).

**Where these come from:** `mint-logo*.png` and `mint-mark.png` are derived from the lab's master
logo — white is the logo's own alpha silhouette painted white; the mark
is the M+leaf crop above the wordmark. The full-color `mint-logo.png` is the faithful master.

**SDSU is a trademark** — don't alter or recolor it. It's bundled as the PNG we have; sourcing
the official SDSU vector is still an open action item.

**PNG only, on purpose** — there is no vector source and autotracing degrades the mark, so the PNG
master is authoritative (see root `../../AGENTS.md` rule 5).
