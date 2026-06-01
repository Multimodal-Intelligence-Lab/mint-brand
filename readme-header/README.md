# readme-header

A standardized branded header for lab project READMEs — the **same brand identity** as the deck
(`slides/`) and the poster, ported to a GitHub-friendly **1280×160 banner**: flat gold with the
**SDSU │ MINT** lockup, a big project title, the affiliation, and the lab QR. So a project's README
opens with the same look as its poster, slides, or teaser video — whether or not any of those are
embedded.

![MINT README header](dist/header.png)

It renders to a **PNG** on purpose: GitHub strips inline SVG and drops web fonts from SVG-as-`<img>`,
but a PNG always renders. The band is opaque, so the **one** image reads the same on GitHub's light
*and* dark themes — no `<picture>` / dark variant needed.

## Use it for your project

1. **Copy** `header.html` to a new file *in this folder*, e.g. `my-project.html` (it starts filled in
   with the MuSDeT paper as a worked example — copy it, don't edit the template in place).
2. **Edit** the marked block in your copy — `title`, `affiliation`, the third `extras` line (a short
   middot-separated descriptor; or your authors), and the QR (swap for your project QR or delete the
   line). Leave the brand chrome above it alone. Keep the **title short** — the big type is the point;
   for a longer title, drop the `.title` font-size a few px (`.center` is clipped by the band).
3. **Render:** `node build.mjs my-project.html` → writes `dist/my-project.png` (verified to the exact
   pixel size; Inter embedded). Needs a Chromium and this monorepo (for `../brand/`); see `AGENTS.md`.
   (Bare `node build.mjs` re-renders the `header.html` example shown above.)
4. **Copy `dist/my-project.png` into your repo** (e.g. `header.png` or `.github/header.png`) and embed
   it at the top of your README — copy the PNG, don't hotlink across repos:

   ```markdown
   ![Project header](header.png)
   ```

It's a **1280×160 banner** (8:1) — sized so the title stays legible at GitHub's rendered README width,
not the thin poster strip. It carries the same brand identity (gold, SDSU │ MINT lockup, blue title,
corner triangle, QR) as the deck and poster, ported to that width.

Full agent/build rules: `AGENTS.md`.
