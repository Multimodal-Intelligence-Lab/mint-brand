# videos

A brand-consistent **auto-playing teaser template** on the MINT brand — the timed sibling of the slide
deck. The lab identity is **standardized**: the same fixed gold band (**SDSU │ MINT** lockup + the
current segment's title) as the deck/poster/demo-page, on the same fixed 1280×720 stage that scales to
fit any screen. Where `slides/` advances on keypress, the teaser **plays itself** on a timeline with an
optional synced voiceover — it shares the stage, the gold band, and the reveal animations with
`slides/` and re-adds the timeline + audio + autoplay the talk deck dropped.

The segments between the band are a **fill-in skeleton you edit** — Hook · Approach · Results · Close —
each a self-contained `<section>` you can edit on its own. Dependency-free at rest (no framework, no CDN):
open `teaser.html` in a browser and it just auto-plays, no build needed.

## Make your teaser

1. **Copy the template** — copy `teaser.html` to a new file in this folder, e.g. `my-teaser.html` (copy
   it; don't edit `teaser.html` in place — it's the pristine skeleton).
2. **Edit only the segments** — between `<!-- ↓↓↓ EDIT FOR YOUR TEASER ↓↓↓ -->` and `↑↑↑`: fill the Hook
   / Approach / Results / Close `<section class="seg">`s. For each segment and each cue element inside it,
   set **`data-at="<ms>"`** (its time from t=0); set the segment's `data-title` (shows in the band) and
   `data-band` (`hero` | `full` | `compact`); give each cue a reveal class (`r-up` / `r-fade` / `r-wipe`
   / `r-pop`). Each segment is self-contained — edit one without touching the rest (search its
   `data-seg`). **Leave the brand chrome alone** (the gold `.bar`, lockup, scripts). Drop figures into
   `assets/` and point the `<img>` at them.
3. **(Optional) green accent** — add `class="accent-green"` to the `<div id="stage">` tag.
4. **(Optional) voiceover** — record a narration track, drop it in this folder, and point the `<audio>`
   `<source src>` at it (uncomment the line near the bottom of the file). Then retune each `data-at` to
   land on your words. With no track the teaser just plays the visual timeline.
5. **Preview** — open the file in a browser; it **auto-plays** (no build). Keys: `Space`/`P` play-pause ·
   `R` restart · `←`/`→` step · `F` fullscreen.

## Turn it into a video

**Two ways — pick what you have:**

- **Screen-record (works anywhere, no tools):** open the teaser, press `F` to fullscreen, and screen-
  record the stage with your OS recorder.
- **Automated, on-box (this machine has the tools):**
  ```bash
  node record.mjs                          # teaser.html → dist/teaser.mp4
  node record.mjs my-teaser.html out.mp4   # your copy   → out.mp4
  ```
  This drives the cached headless Chromium and the on-box `ffmpeg`. It captures **deterministically** —
  stepping Chrome's virtual clock in fixed 1/30s increments and screenshotting each step, so the eased
  transitions render smoothly (every frame is genuinely drawn, none dropped or duplicated) — and encodes
  a **1280×720 / 30fps / H.264** MP4 (muxing your voiceover as AAC if you wired one). Node built-ins
  only — **no install**. If Chromium or ffmpeg is missing it tells you and falls back to the
  screen-record path (it writes no broken file). Capture is ~1000 sequential screenshots, so render
  time tracks machine load: ~1–2 min on an idle machine, longer on a busy shared box (and it aborts
  loud rather than emit a partial file if a frame stalls past 60s — just re-run when the box is quieter).

**GIF** (for a README/social): convert the MP4 with the on-box ffmpeg (two-pass palette for clean color):
```bash
ffmpeg -i dist/teaser.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,palettegen" -y /tmp/pal.png
ffmpeg -i dist/teaser.mp4 -i /tmp/pal.png -vf "fps=15,scale=960:-1:flags=lanczos,paletteuse" -y dist/teaser.gif
```

## Build a portable copy (to host or hand off the live teaser)
```bash
node build.mjs my-teaser.html my-teaser   # → dist/my-teaser/   (self-contained)
```
This vendors the brand assets your teaser uses into `dist/my-teaser/brand/`, rewrites the `../brand/…`
paths to local, then verifies the result is self-contained. Needs this monorepo at build time (for
`../brand/`); node built-ins only, no install.

`dist/` is generated, not committed — build it on demand. Full agent/build rules: `AGENTS.md`.
