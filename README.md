![MINT — Multimodal Intelligence Lab](docs/samples/hero.png)

# MINT

The Multimodal Intelligence Lab (MINT) brand kit — one place for the SDSU lab's visual identity and
the things built from it. `brand/` holds the identity (logos, colors, fonts, icons, QR) and is the
**single source of truth**; every other folder is a template **built on it**. No build step to *use*
the brand, no dependencies at rest — plain files you open in a browser.

```
mint-brand/
  brand/          ← the foundation — logos · colors.css · fonts · icons · qr   (single source of truth)
  posters/        ← HTML→PDF research-poster templates   — many sizes, one template
  readme-header/  ← branded README header (HTML→PNG)      — the banner at the top of this file
  slides/         ← conference slide decks               — 1280×720 stage, scaled to fit
  videos/         ← auto-playing teasers → MP4/GIF        — timeline + optional voiceover, on-box render
  demo-pages/     ← responsive project / paper pages      — the same brand chrome, built for the web
  docs/samples/   ← the showcase images below             — regenerable; not source
```

## What you can make
One template per artifact — copy it, edit your content, render. Each folder has a `README.md` with the
full steps; the one command that produces the artifact is shown here.

<table>
<tr>
  <td width="42%"><img src="docs/samples/header.png" alt="README header"></td>
  <td><b>README header</b> — a branded PNG banner for a repo or paper.<br><br>
  <code>cd readme-header && node build.mjs my-header.html</code><br>
  → <code>dist/my-header.png</code> · see <a href="readme-header/README.md">readme-header/</a></td>
</tr>
<tr>
  <td><img src="docs/samples/poster.png" alt="research poster"></td>
  <td><b>Research poster</b> — HTML → print-ready PDF, any conference size.<br><br>
  <code>cd posters && node build.mjs my-poster.html 48x36</code><br>
  → <code>dist/my-poster-48x36.pdf</code> · see <a href="posters/README.md">posters/</a></td>
</tr>
<tr>
  <td><img src="docs/samples/slide.png" alt="slides"></td>
  <td><b>Slides</b> — a branded 1280×720 slide deck that scales to fit any screen.<br><br>
  Copy <code>slides/deck.html</code>, edit your slides, open it in a browser (no build).<br>
  → see <a href="slides/README.md">slides/</a></td>
</tr>
<tr>
  <td><img src="docs/samples/teaser.gif" alt="teaser video"></td>
  <td><b>Teaser video</b> — an auto-playing timeline (the timed sibling of the slides) → MP4/GIF.<br><br>
  <code>cd videos && node record.mjs</code><br>
  → <code>dist/teaser.mp4</code> · see <a href="videos/README.md">videos/</a></td>
</tr>
<tr>
  <td><img src="docs/samples/demo-page.png" alt="demo page"></td>
  <td><b>Demo page</b> — a responsive, branded project / paper page for the web.<br><br>
  Copy <code>demo-pages/page.html</code>, edit your content, open it in a browser (no build).<br>
  → see <a href="demo-pages/README.md">demo-pages/</a></td>
</tr>
<tr>
  <td><img src="brand/logos/mint-logo.png" alt="brand foundation" width="180"></td>
  <td><b>brand/</b> — logos, <code>colors.css</code>, fonts, icons, QR: the single source every module
  is built on. You reference it (<code>../brand/…</code>); you never copy or recolor it.<br><br>
  → see <a href="brand/logos/README.md">brand/logos/</a></td>
</tr>
</table>

## The reference
`../reveal_v4/` is the **MuSDeT teaser** — a finished, working deck. It is the *reference* this brand
was extracted from (the logos, the colors, the SDSU │ MINT lockup) and the seed for `slides/` and
`videos/`. It is not part of this repo and is never modified.

## Principle
`brand/` is minimal and dependency-free — plain files, no build step. Modules reference it by relative
path (`../brand/…`); nothing duplicates a logo or hardcodes a color. Keep new modules the same way.

## For AI agents
People will paste this README to an agent, so: the two prime directives are **`brand/` is the single
source of truth** (reference `../brand/…`; never copy a logo or paste a hex) and **stay dependency-free
at rest** (no `node_modules`, no CDN; build steps use on-box tools only). Before doing anything, read the
full contract in **[`AGENTS.md`](AGENTS.md)** (the root rules) and the **`AGENTS.md`** in the folder you're
working in (the task-specific rules). Every folder has one. Don't reinvent the rules from this overview —
follow the contract.

## Authors
- [Mukhtiar Ali](https://github.com/GitAliGator)
- [Harsh Dubey](https://github.com/hdubey-debug)
