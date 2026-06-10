#!/usr/bin/env node
// MINT slides — EJECT a self-contained, repo-free talk deck to any folder.
//
//   node new.mjs <dest>                  deck.html → <dest>/index.html  (+ deck.css, deck.js, brand/, assets/, docs)
//   node new.mjs <dest> <project-name>   same, with an explicit name in the README / docs
//   node new.mjs <dest> [name] --force   overwrite a non-empty <dest>
//
// WHY THIS EXISTS. The slides template references the brand single-source by relative path (../brand/…),
// so a deck authored inside this repo 404s the instant you copy it out — you feel chained to the monorepo.
// build.mjs already solves that (it vendors the brand into a self-contained dist/<deck>/), but it (a) only
// writes INSIDE the repo, (b) makes you author in-repo first, and (c) the output carries no agent docs, so
// nothing tells the next agent "you're free of the repo now." new.mjs flips all three: ONE command stamps a
// ready-to-edit, dependency-free deck at ANY external path — you edit index.html there, present from there,
// and never touch this repo again. "Eject", not "build".
//
// HOW IT DIFFERS FROM build.mjs. build.mjs discovers the exact files a finished deck references and vendors
// only those (a tight deployable). new.mjs is the START of a project — the author hasn't added figures yet —
// so it copies the WHOLE brand/ kit and the WHOLE slides/assets/ (the gold band art) wholesale: full
// independence, no per-ref vendor loop, and immune to the quote-sensitivity that bit build.mjs's scanner.
// It still runs the SAME self-containment assertions build.mjs does, so a broken eject fails loud instead of
// shipping a 404. Node built-ins only; no npm install. (deck.js holds no ../brand ref — copied verbatim.)

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, cpSync, copyFileSync } from "node:fs";
import { dirname, resolve, join, basename, sep } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);

// ── ref scanning (quote-agnostic — the fixed version of build.mjs's refsFrom; single- AND double-quoted
//    and bare refs all caught, so a silent 404 can't slip past the assertions). ───────────────────────
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
const stripCssComments  = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
function refsFrom(text) {
  const out = new Set();
  const add = (r) => { if (r && !/^(https?:|mailto:|data:|#|\/)/.test(r)) out.add(r); };
  for (const m of text.matchAll(/(?:src|href)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/g))
    add(m[1] ?? m[2] ?? m[3]);
  for (const m of text.matchAll(/url\(\s*['"]?([^'"()]+)['"]?\s*\)/g)) add(m[1]);
  for (const m of text.matchAll(/@import\s+['"]([^'"]+)['"]/g)) add(m[1]);
  return [...out];
}

// index.html and deck.css both land at <dest>/, reaching the vendored kit via brand/… (refs without ../ —
// deck.js, assets/… — already resolve in place, untouched).
const rewrite = (text) => text.replaceAll("../brand/", "brand/");

// dest contains the template dir? (dest === slides/, the repo root, or any ancestor). Guards the --force
// path: `node new.mjs . --force` from inside slides/ would otherwise rmSync the template itself.
const contains = (dir, child) => (child + sep).startsWith(dir.replace(/\/$/, "") + sep);

// ── project-local agent docs (adapted, NOT copied — the repo's slides/ docs say "../brand/" + "copy,
//    don't edit in place" + "node build.mjs", none of which is true in an ejected, build-free folder) ──
const AGENTS_MD = (name) => `# AGENTS.md — ${name} (talk deck)

A self-contained, brand-consistent **SDSU │ MINT conference talk deck**. It was *ejected* from the MINT
brand monorepo with \`slides/new.mjs\`, so everything it needs is in THIS folder — the brand kit, fonts,
gold band art and QR are all local under \`brand/\` and \`assets/\`. **There is no monorepo dependency and
no build step.** You edit one file, \`index.html\`, and present it.

## Editing the deck (for agents)
Edit **\`index.html\` in place** — it is both the source and the deliverable. (Do NOT copy it to a new
file; that was the in-repo template's rule and it does not apply here.) Edit **only** the slides between
the \`↓↓↓ / ↑↑↑ EDIT FOR YOUR TALK\` markers:
- add / remove / reorder \`<section class="slide">\`s,
- set each slide's \`data-title\` (it shows in the gold band),
- fill the title / outline / content / figure / results / closing slides.

**Each slide is a self-contained \`<section>\`.** To edit, add, reorder, or remove one slide, work on its
\`<section>\` only — **search for its \`data-title\` and edit just that block; you don't need to read the
other slides** (that keeps your context small even in a long deck). **Do not read \`deck.css\` or
\`deck.js\` to fill content** — they are styling/engine, not content, and \`brand/\` holds ~1 MB of logo +
font binaries that would needlessly bloat your context. Drop figures into \`assets/\` and point an
\`<img src="assets/your-figure.png">\` at them.

Everything outside the markers — the gold \`.bar\`, the SDSU │ MINT lockup, the page counter, the scripts —
is **locked brand chrome**. Leave it. Add \`class="accent-green"\` to \`<div id="deck">\` for the green deck
voice (the one allowed swap). Bullets marked \`data-frag\` (optionally \`.r-up\` / \`.r-fade\`) reveal
one-by-one as you advance.

## Brand rules (local, frozen)
- The brand kit lives in **\`brand/\`** and the band art in **\`assets/\`** — both are vendored copies,
  frozen with this deck. Reference them **locally** (\`brand/logos/…\`, \`assets/…\`); **never** write
  \`../brand/…\` (there is no parent repo here) and **never** paste a raw hex — colors come from
  \`brand/colors.css\` via \`var(--…)\`.
- **Never recolor, stretch, retrace, or redraw a logo**, and never touch the SDSU mark — it is a
  trademark. The closing slide's QR (\`brand/qr/mint-lab-qr.png\`) points at the lab GitHub by default;
  swap it for your project/paper QR only if you have one.

## Present & share
- **Present** — open \`index.html\` in a browser. \`F\` fullscreens; \`→\` / \`Space\` / \`PageDown\`
  advance, \`←\` / \`PageUp\` back, \`Home\` / \`End\` jump to first/last. **No build, no \`npm install\`** —
  it is plain HTML/CSS/JS.
- **Export a PDF** — use the browser's **Print to PDF**, or screen-record the fullscreen deck.
- **Share** — copy this whole folder anywhere; it needs nothing else.

## What's here
- \`index.html\` — the deck you edit (the only file you edit).
- \`deck.css\` — the theme (brand tokens + the gold band + reveal primitives). Don't edit to fill content.
- \`deck.js\` — the ~100-line engine (stage scaling + keyboard/click nav + fragment reveals).
- \`brand/\` — the vendored brand kit (logos, \`colors.css\`, \`tokens.css\`, fonts, QR, icons), frozen.
- \`assets/\` — the gold band art (\`header_*.png\`) + your figures.
- \`CLAUDE.md\` / \`GEMINI.md\` — tool bridges that point back here (one contract, no drift).
`;

const CLAUDE_MD = (name) => `# CLAUDE.md — ${name}

The agent contract for this deck is **AGENTS.md** (tool-agnostic — shared by Claude Code, Codex, …).
Imported below so there is one source of truth, not two copies to drift apart.

@AGENTS.md
`;

const GEMINI_MD = (name) => `# GEMINI.md — ${name}

This deck's full contract for AI agents is **AGENTS.md** — read it before editing. (The Gemini CLI does
not auto-load \`AGENTS.md\` or \`CLAUDE.md\`, so this pointer carries you there; Claude Code and Codex bridge
via their own files. One contract, no drift.)

→ See **AGENTS.md**.
`;

const README_MD = (name) => `# ${name}

A self-contained **SDSU │ MINT** conference talk deck — ejected from the MINT brand monorepo, with the
brand kit, fonts, gold band art and QR all vendored locally. No monorepo dependency, no build step, no
\`npm install\`.

- **Edit** — open \`index.html\` and edit the slides between the \`↓↓↓ / ↑↑↑ EDIT FOR YOUR TALK\` markers
  (set each slide's \`data-title\`; drop figures in \`assets/\`). Leave the gold band chrome alone. Full
  rules for you and your AI agent: \`AGENTS.md\`.
- **Present** — open \`index.html\` in a browser; \`F\` fullscreens, \`→\` / \`Space\` advance, \`←\` back.
  Export a PDF via the browser's **Print to PDF**, or screen-record the fullscreen deck.
- **Share** — copy this whole folder anywhere; it needs nothing else.
`;

// ── eject ────────────────────────────────────────────────────────────────────────────────────────────
function eject(argv) {
  const force = argv.includes("--force");
  const positional = argv.filter((a) => a !== "--force");
  const destArg = positional[0];
  if (!destArg) {
    console.error("usage: node new.mjs <dest-path> [project-name] [--force]");
    process.exit(1);
  }
  const dest = resolve(process.cwd(), destArg);
  const name = positional[1] || basename(dest);

  // Refuse to eject onto the template itself (or any ancestor). This is the safety on --force: without it,
  // `node new.mjs . --force` from inside slides/ would rmSync the pristine template.
  if (contains(dest, HERE))
    throw new Error(`refusing to eject onto the repo (dest contains the template): ${dest}`);

  // Clobber guard — fail loud, never prompt (agents run this non-interactively). A non-empty external
  // folder is never silently destroyed: it takes an explicit --force.
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    if (!force) throw new Error(`dest exists and is not empty: ${dest}  (use --force to overwrite)`);
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });

  // 1) Vendor the WHOLE brand kit + the WHOLE band-art assets/ (full independence; subpaths preserved).
  cpSync(resolve(HERE, "../brand"), join(dest, "brand"), { recursive: true });
  cpSync(resolve(HERE, "assets"),   join(dest, "assets"), { recursive: true });

  // 2) Entry deck: deck.html → index.html with ../brand/ → brand/ (stable name; both source AND deliverable
  //    since there's no further build — it sheds deck.html's "copy-don't-edit" rule, which inverts here).
  const html = readFileSync(resolve(HERE, "deck.html"), "utf8");
  const css  = readFileSync(resolve(HERE, "deck.css"),  "utf8");
  writeFileSync(join(dest, "index.html"), rewrite(html));
  writeFileSync(join(dest, "deck.css"),   rewrite(css));
  copyFileSync(resolve(HERE, "deck.js"),  join(dest, "deck.js"));   // no ../brand ref — copied verbatim

  // 3) Project-local agent docs (adapted to the ejected, build-free folder).
  writeFileSync(join(dest, "AGENTS.md"), AGENTS_MD(name));
  writeFileSync(join(dest, "CLAUDE.md"), CLAUDE_MD(name));
  writeFileSync(join(dest, "GEMINI.md"), GEMINI_MD(name));
  writeFileSync(join(dest, "README.md"), README_MD(name));

  // 4) Self-containment assertions — the SAME proof build.mjs runs, so a broken eject fails loud.
  const outHtml = readFileSync(join(dest, "index.html"), "utf8");
  const outCss  = readFileSync(join(dest, "deck.css"),   "utf8");
  // (a) no ../ escape survives anywhere (the rewrite turned every ../brand/ into brand/)
  for (const [f, t] of [["index.html", outHtml], ["deck.css", outCss]])
    if (t.includes("../")) throw new Error(`${f}: a "../" path survived the rewrite`);
  // (b) every referenced local file resolves inside <dest>/ (refs from comment-stripped output)
  const finalRefs = [...refsFrom(stripHtmlComments(outHtml)), ...refsFrom(stripCssComments(outCss))];
  for (const r of finalRefs)
    if (!existsSync(join(dest, r))) throw new Error(`unresolved ref in ejected deck: ${r}`);

  // 5) Report.
  console.log(`  ✓ ejected "${name}" → ${dest}`);
  console.log(`    index.html · deck.css · deck.js · brand/ · assets/ · AGENTS.md · CLAUDE.md · GEMINI.md · README.md`);
  console.log(`    ${finalRefs.length} refs resolve locally · no ../ escapes · self-contained`);
  return dest;
}

const [, , ...argv] = process.argv;
console.log("Ejecting a self-contained, repo-free talk deck:");
try {
  eject(argv);
} catch (err) {
  console.error(`  ✗ ${err.message}`);   // fail loud, but a clean line — not a raw stack trace
  process.exit(1);
}
console.log("Done. Open index.html to edit & present — this folder needs nothing else (copy it anywhere).");
