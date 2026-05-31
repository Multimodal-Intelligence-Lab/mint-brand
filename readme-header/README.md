# readme-header

A standardized branded header for lab project READMEs — the **same header** as the deck
(`reveal_v4`) and the poster: a gold band with the **SDSU │ MINT** lockup, the paper title /
authors / affiliation, and the lab QR. So a project's README opens with the same look as its
poster, slides, or teaser video — whether or not any of those are embedded.

![MINT README header](dist/header.png)

It renders to a **PNG** on purpose: GitHub strips inline SVG and drops web fonts from SVG-as-`<img>`,
but a PNG always renders. The band is opaque, so the **one** image reads the same on GitHub's light
*and* dark themes — no `<picture>` / dark variant needed.

## Use it for your project

1. **Copy** `header.html` to a new file *in this folder*, e.g. `my-project.html` (it starts filled in
   with the MuSDeT paper as a worked example — copy it, don't edit the template in place).
2. **Edit** the marked block in your copy — `title`, `authors`, `affiliation`, and the QR (swap for
   your project QR or delete the line). Leave the brand chrome above it alone. (A longer title can
   clip the thin band — drop the `.title` font-size a point or two if yours runs longer.)
3. **Render:** `node build.mjs my-project.html` → writes `dist/my-project.png` (verified to the exact
   pixel size; Inter embedded). Needs a Chromium and this monorepo (for `../brand/`); see `AGENTS.md`.
   (Bare `node build.mjs` re-renders the `header.html` example shown above.)
4. **Copy `dist/my-project.png` into your repo** (e.g. `header.png` or `.github/header.png`) and embed
   it at the top of your README — copy the PNG, don't hotlink across repos:

   ```markdown
   ![Project header](header.png)
   ```

The proportions match the poster exactly (a 16:1 band — the poster header is 3024×189pt), so it's a
thin strip, not a tall block.

Full agent/build rules: `AGENTS.md`.
