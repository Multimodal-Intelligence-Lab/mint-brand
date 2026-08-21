# AGENTS.md — logo-3d/

**Status: built.** The M+leaf mark as a 3D model — the viewer page, the two-line embed recipe, and
the turntable-GIF recorder behind the root README sample. The model itself is a **brand asset** and
lives at `../brand/logos/mint-mark-3d.glb` (provenance, spec and hard rules in
`../brand/logos/README.md`); this module only consumes it. Full brand contract: `../AGENTS.md`.
Usage: `README.md`.

## What's here
- `viewer.html` — the branded viewer: full-viewport `<model-viewer>`, the canonical `.mint-name`
  wordmark footer, tokens via `@import "../brand/colors.css"` + `wordmark.css`, the leaf path
  copied verbatim from `brand/icons/leaf.svg` per the wordmark contract. It references the GLB by
  relative path (`../brand/…`) — the single-source rule, same as every module.
- `model-viewer.min.js` — Google's `<model-viewer>` (v4.3.1, Apache-2.0 — license text vendored
  beside it as `model-viewer-LICENSE.txt`, the `brand/fonts/Inter-OFL-LICENSE.txt` precedent),
  **vendored as one static file on purpose**: the repo allows no CDN at rest and an interactive
  viewer needs its runtime — the same precedent as the font binaries in `brand/fonts/`. Never swap
  it for a CDN `<script>`.
- `record.mjs` — renders `dist/logo-3d.gif` with the on-box headless Chromium + ffmpeg over CDP;
  `videos/record.mjs`'s sibling (the WebGL-forced differences — an http server for the capture,
  `--enable-unsafe-swiftshader`, posed frames instead of a virtual clock — are documented in its
  header). Node built-ins only; **no npm install**.
- `dist/` — **not committed**; built on demand. The root-README sample is a copy at
  `docs/samples/logo-3d.gif`.

## Rules (in addition to ../AGENTS.md)
1. **The GLB lives in `brand/logos/` — never copy it into this module** and never inline it into
   the page as a data URI (that forks the asset). Never re-export or re-compress it casually: the
   compression is quantization-only ON PURPOSE — Draco/meshopt (`gltfpack -c`,
   `gltf-transform optimize`) would make every web viewer fetch a WASM decoder from a CDN, breaking
   the no-CDN rule silently and far from this folder. Recipe + rules: `../brand/logos/README.md`.
2. **The viewer stays serve-anywhere:** relative refs only, nothing fetched beyond this repo. It
   needs HTTP because browsers block `file://` pages from fetching the GLB — that is a browser
   rule; don't "fix" it by inlining the model (see rule 1).
3. **No `build.mjs` on purpose.** The embed deliverable is two files copied out
   (`model-viewer.min.js` + the GLB); a copier for that would be the over-build this repo was once
   reset for.
4. **Don't restyle the mark.** The green is the brand green baked into the model's texture; keep
   the viewer's lighting/exposure faithful and never tint, filter, or recolor the rendition.
5. **Never hand-edit `dist/`** — it is generated; re-run `record.mjs`.
