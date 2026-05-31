# AGENTS.md — MINT brand monorepo

Instructions for AI coding agents (Claude Code, Codex, …) working anywhere under `mint-brand/`. This is
the contract; each subfolder has its own short `AGENTS.md` with the folder-specifics.

## What this is
`mint-brand/` is the Multimodal Intelligence Lab (MINT) brand monorepo. `brand/` is the **single source of
truth** for identity — logos, colors, fonts, icons, QR. `posters/` is **built** on it (HTML → PDF
poster templates; see `posters/AGENTS.md`), as is `readme-header/` (the branded README header,
HTML → PNG, the same header as the deck/poster; see `readme-header/AGENTS.md`), `demo-pages/`
(responsive project-page templates for the web; see `demo-pages/AGENTS.md`), `slides/` (branded
conference talk decks, a fixed 1280×720 stage; see `slides/AGENTS.md`) and `videos/` (branded auto-playing
**teasers** — the timed sibling of the deck, a timeline + optional voiceover on the same 1280×720 stage,
rendered to MP4 by an on-box headless-Chromium/ffmpeg `record.mjs`; see `videos/AGENTS.md`). Every module
is now built on `brand/`.
`docs/samples/` holds the showcase images embedded in the root `README.md` — regenerable output, not
source; safe to re-render, never hand-edited.

## Hard rules
1. **`brand/` is the only source of truth.** Reference it by relative path (`../brand/…`). Never
   copy a logo into a module; never paste a hex value. One asset, one place.
2. **Colors:** `@import "../brand/colors.css"` and use `var(--mint-green)` etc. Never hardcode hex.
3. **Logos:** pick from `brand/logos/` per `brand/logos/README.md`. Never recolor, stretch, or
   redraw any logo.
4. **SDSU is a trademark.** Never recolor, retrace, or redraw it. Only the official vector from the
   university brand office may ever replace the bundled PNG.
5. **Logos are PNG, not SVG, on purpose.** There is no vector source — the logo masters are PNG
   only. **Do not autotrace** — it degrades the mark (two-tone green, leaf vein,
   wordmark), and the previous build was reset for exactly that. The 1368 px master is high-res
   enough for slides, posters, and README headers.
6. **QR** lives in `brand/qr/` and encodes the lab GitHub org. Regenerate via its README recipe;
   don't hand-edit the SVG.
7. **Dependency-free at rest.** No `node_modules`, no build step is required to *use* the brand.
   One-time generator tools (sharp, segno) must leave only static output behind.
8. **Stay minimal.** This repo was reset once for over-building. Add assets/modules only on real
   need; prefer documenting a recipe over baking a new file.

## Before working in a folder
Read that folder's `AGENTS.md` (and `README.md`) first.

## Agent docs (`AGENTS.md` vs `CLAUDE.md`)
`AGENTS.md` is the tool-agnostic contract (Claude Code, Codex, …) — but Claude Code only auto-loads
`CLAUDE.md` by directory, never `AGENTS.md`. So a one-line `CLAUDE.md` that does `@AGENTS.md` bridges
the two: the contract auto-loads into context, with no second copy to drift. The root carries one (this
folder); a subfolder gets one **when it becomes a built module** — now that every module is built
(`posters/`, `readme-header/`, `demo-pages/`, `slides/`, `videos/`), each carries one.
