# slides

A brand-consistent **conference talk deck template** on the MINT brand. The lab identity is
**standardized**: a fixed gold band (**SDSU │ MINT** lockup + the current slide's title + page number) across
the top of every slide, the same gold header as the deck/poster/demo-page. The slides between the band are a
**fill-in skeleton you edit** — title, outline, content, figure, results, closing — each a self-contained
`<section>` you can edit on its own. The deck is a fixed 1280×720 stage that scales to fit any screen,
dependency-free (no framework, no CDN) — open `deck.html` in a browser and it just works, no build needed.

This is a **talk deck**, not a timed teaser. It shares the stage + gold band + reveal animations with
`videos/` but advances on keypress (no voiceover, no timeline). Want a narrated, auto-playing
teaser? That belongs in `videos/`.

## Use it for your talk

1. **Copy the template** — copy `deck.html` to a new file in this folder, e.g. `my-talk.html` (copy it;
   don't edit `deck.html` in place — it's the pristine skeleton).
2. **Edit only the slides** — between `<!-- ↓↓↓ EDIT FOR YOUR TALK ↓↓↓ -->` and `↑↑↑`: add/remove/reorder
   `<section class="slide">`s, set each slide's `data-title` (it shows in the band), and fill the title /
   content / figure / results / closing slides. Each slide is a self-contained `<section>` — edit one
   without touching the rest. **Leave the brand chrome alone** (the gold `.bar`, lockup, page counter,
   scripts). Drop figures into `assets/` and point the `<img>`/`.figure` at them.
3. **(Optional) green accent** — add `class="accent-green"` to the `<div id="deck">` tag. That's the whole swap.
4. **Present** — just open the file in a browser (no build needed); `F` fullscreens. Keys: `→` / `Space` /
   `PageDown` next · `←` / `PageUp` back · `Home`/`End` first/last. Bullets marked `data-frag` reveal
   one-by-one; a click in the left third goes back, elsewhere forward. To export PDF, use the browser's
   **Print to PDF**, or screen-record the fullscreen deck.
5. **Build a portable copy (to present off a different machine or host it):**
   ```bash
   node build.mjs my-talk.html my-talk      # → dist/my-talk/  (self-contained)
   ```
   This vendors the brand assets your deck uses into `dist/my-talk/brand/` and rewrites the `../brand/…`
   paths to local, then verifies the result is self-contained. Needs this monorepo at build time (for
   `../brand/`); node built-ins only, no install.
6. **Share** — copy the whole `dist/my-talk/` folder anywhere; it needs nothing else. Copy the folder; don't
   hotlink across repos.

**Prefer to work outside the repo?** Eject a standalone, self-contained deck anywhere in one command, then
edit and present it there with no monorepo dependency:
```bash
node new.mjs ~/talks/my-talk my-talk     # → a ready-to-edit folder: index.html + brand/ + assets/ + agent docs
```
Where `build.mjs` packages a *finished* in-repo deck into `dist/`, `new.mjs` stamps a *fresh* deck to author
from scratch outside the repo (the brand kit, fonts, band art and QR are vendored in, so it needs nothing
else). Edit its `index.html`; present by opening it. Add `--force` to overwrite a non-empty target.

`dist/` is generated, not committed — build it on demand (step 5). Full agent/build rules: `AGENTS.md`.
