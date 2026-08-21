# MINT logos

Four PNGs and one 3D model. Pick by background and available space; never recolor, stretch, or redraw them.

| File | What | Use |
|---|---|---|
| `mint-logo.png` | Full-color master — M+leaf + wordmark | **Default.** Light backgrounds. |
| `mint-logo-white.png` | White knockout of the same silhouette | Dark backgrounds (navy, photos). Single-color *by design* — it drops the two-tone and the leaf vein; use the master wherever you want color. |
| `mint-mark.png` | The M+leaf symbol only, full color | Tight / square spots where the wordmark won't fit — favicons, avatars, watermarks. |
| `sdsu-logo.png` | SDSU institutional mark, as supplied | University / official contexts. Pair as **SDSU │ MINT** (the teaser's lockup). |
| `mint-mark-3d.glb` | The M+leaf symbol as a 3D model | Interactive / 3D spots — spinning embeds, hero renders, teaser beats. Rules below; viewer + embed recipe in [`logo-3d/`](../../logo-3d/README.md). |

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

## The 3D mark — `mint-mark-3d.glb`

The M+leaf symbol as a solid 3D model — a **machined-sign extrusion derived from `mint-mark.png`
by a deterministic recipe**, adopted August 2026. The committed generator
(`logo-3d/make-glb.{html,mjs}`) traces the master's alpha silhouette (2× supersampled, smoothed
only enough to remove the raster's edge noise, never the shape) and extrudes it: flat faces,
dead-straight walls, a small 45° chamfer, sharp apexes. **42.5 KB, 1,464 triangles**, two named
meshes (`m-letterform`, `leaf-blade`). The PNG stays the single source of truth — the 3D master
is *derived output*, regenerable from it.

- **Exact brand color** — the material's base color is the `--mint-green` token `#478a2d`
  bit-perfect (verified in the exported `baseColorFactor`), with a clearcoat acrylic finish.
  Single green by design, like the white knockout. Never retexture, tint, or recolor it.
- **Decoder-free by design** — the file uses only `KHR_mesh_quantization` +
  `KHR_materials_clearcoat`, which three.js and `<model-viewer>` handle natively. **Never
  recompress with Draco or meshopt** (`gltfpack -c`, `gltf-transform optimize`): those make every
  web viewer fetch a WASM decoder from a CDN, silently breaking the no-CDN rule far from this file.
- **Regenerate only via the committed recipe** (`logo-3d/README.md` → "Regenerating the model") —
  never with AI image-to-3D (a predecessor of this file was Tripo-generated: 56.8 MB,
  banana-bowed, off-token color; retired for exactly those defects) and never by hand-modelling.
  The recipe is the 3D mark's vector source.

Use it via [`logo-3d/`](../../logo-3d/README.md) — the branded viewer, the two-line embed, the
turntable GIF.
