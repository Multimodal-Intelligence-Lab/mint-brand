# MINT logo in 3D

The **M+leaf mark as a 3D model**, plus the machinery to show it: a branded viewer page you can
serve or deploy, a two-line snippet to embed the spinning mark in any web page, and the recorder
that renders the root README's turntable GIF. The model itself is a brand asset and lives at
**`../brand/logos/mint-mark-3d.glb`** — the single source of truth; provenance, spec and hard rules
in [`../brand/logos/README.md`](../brand/logos/README.md). This folder only consumes it.

## See it spin

Browsers block `file://` pages from `fetch()`ing the model, so the viewer needs a static server —
any one; there is still no build step:

```bash
# from the repo root
python3 -m http.server
# → open http://localhost:8000/logo-3d/viewer.html
```

Or put it on the web: enable GitHub Pages on this repo (Settings → Pages → Deploy from a branch →
`main` / `/ (root)`) and the same file — no copy, no build — is live at

```
https://multimodal-intelligence-lab.github.io/mint-brand/logo-3d/viewer.html
```

because Pages serves the repo as-is and every `../brand/…` reference resolves in place.

## Embed it in your page

Copy **two files** into your project (copying *out* of the repo is the normal template flow — the
no-copy rule is about duplicating assets *inside* `mint-brand/`):

- `logo-3d/model-viewer.min.js`
- `brand/logos/mint-mark-3d.glb`

then paste:

```html
<script type="module" src="model-viewer.min.js"></script>
<model-viewer src="mint-mark-3d.glb" alt="MINT — Multimodal Intelligence Lab"
  camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="32deg"
  style="width: 320px; height: 320px;"></model-viewer>
```

Serve over HTTP (any static host; not `file://`). Those attributes are the viewer's own defaults —
drop `auto-rotate` for a still the reader spins themselves; the full attribute reference is at
modelviewer.dev.

## Regenerating the model (the 3D mark's vector source)

`../brand/logos/mint-mark-3d.glb` is **derived from `mint-mark.png` by a deterministic recipe** —
`make-glb.html` (the trace/extrude algorithm; its header documents every stage) driven by
`make-glb.mjs` (the `record.mjs`-style on-box CDP driver). Only needed if the 2D master ever
changes:

```bash
npm i three@0.170.0 --no-save                # one-time tool, not a repo dependency
node make-glb.mjs                            # → dist/make-glb/mint-mark-3d-raw.glb + proof renders
npx -y gltfpack -i dist/make-glb/mint-mark-3d-raw.glb -o dist/make-glb/mint-mark-3d.glb -kn
# eyeball dist/make-glb/*.png, then:
cp dist/make-glb/mint-mark-3d.glb ../brand/logos/mint-mark-3d.glb
rm -rf node_modules package.json package-lock.json
```

`-kn` keeps the named parts; **never add `-c`/meshopt** (CDN WASM decoders — see
`../brand/logos/README.md`). The driver fail-louds unless the trace yields exactly the two named
slabs.

## Re-render the README GIF

```bash
node record.mjs                                    # viewer.html → dist/logo-3d.gif
cp dist/logo-3d.gif ../docs/samples/logo-3d.gif    # refresh the root-README sample
```

72 posed frames, one full turn, a seamless 3-second loop. `record.mjs` is the sibling of
`videos/record.mjs` — node built-ins driving the on-box headless Chromium + ffmpeg (runtime tools,
not repo dependencies; nothing is installed). The WebGL-forced differences and the fail-loud checks
are documented in the script header.

## What's here

- `viewer.html` — the branded viewer page: full-viewport `<model-viewer>` (orbit + auto-rotate),
  the canonical wordmark footer, tokens via `../brand/colors.css` + `wordmark.css`. Serve it,
  deploy it, or copy it as the start of a fancier page.
- `model-viewer.min.js` — Google's `<model-viewer>` web component, **vendored** (v4.3.1, one
  static file — the no-CDN rule). Apache-2.0; license text in `model-viewer-LICENSE.txt`. To
  update: replace with `dist/model-viewer.min.js` from a newer `@google/model-viewer` npm release
  (carry its `LICENSE` along), then re-verify per `AGENTS.md`.
- `record.mjs` — the turntable-GIF renderer (above).
- `make-glb.html` + `make-glb.mjs` — the **generator recipe** that derives the GLB from the 2D
  master (above). One-time tools; nothing at rest depends on them.
- `dist/` — **not committed**; `record.mjs` / `make-glb.mjs` output. Delete after copying out.
