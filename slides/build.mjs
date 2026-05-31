#!/usr/bin/env node
// MINT slides — build a self-contained, portable copy of a talk deck.
//
//   node build.mjs                      deck.html → dist/deck/      (index.html + deck.css + deck.js + vendored brand/)
//   node build.mjs my-talk.html         my-talk.html → dist/my-talk/  (project name defaults to the file stem)
//   node build.mjs my-talk.html my-proj my copy → dist/my-proj/  (explicit project name)
//
// A deck's deliverable IS the live HTML/CSS/JS you present and share — so this is a file COPIER, not a
// renderer (there is deliberately NO Chromium here; to export PDF, present in a browser and use its
// "Print to PDF" / screen-record). The authoring source references the brand single-source by relative
// path (../brand/…), which 404s the instant the deck is copied elsewhere. So the build VENDORS the brand
// files the deck actually uses into dist/<project>/brand/ (subpaths preserved) and rewrites every
// ../brand/ → brand/, then ASSERTS self-containment — the slides analog to how demo-pages verifies its
// deployable copy. Node built-ins only; no npm install.
//
// Two differences from demo-pages/build.mjs: the stylesheet is deck.css (not style.css), and deck.js is
// an EXTERNAL asset (demo-pages' script is inline). deck.js holds no ../brand ref, so it is discovered
// by refsFrom() and copied verbatim by vendor() — no rewrite needed. Never hand-edit dist/.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, resolve, join, basename } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
const STYLESHEET = "deck.css";   // written out separately (rewritten); all other refs are vendored

// Comments hold fake refs on purpose (a commented architecture.svg figure swap). Strip them before
// extracting refs, or the copier chases files that don't exist and the assertions false-fail.
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
const stripCssComments  = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

// Local, relative asset refs from html or css (comments already stripped). Skips external links
// (http/mailto/data), in-page anchors (#…), and absolute paths — none of those are vendored.
function refsFrom(text) {
  const out = new Set();
  const add = (r) => { if (r && !/^(https?:|mailto:|data:|#|\/)/.test(r)) out.add(r); };
  for (const m of text.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)) add(m[1]);
  for (const m of text.matchAll(/url\(\s*"?([^"')]+)"?\s*\)/g)) add(m[1]);
  for (const m of text.matchAll(/@import\s+"([^"]+)"/g)) add(m[1]);
  return [...out];
}

// One uniform rewrite for html and css: both land at dist/<project>/, so both reach the vendored brand
// via brand/…  (refs without ../ — deck.css, deck.js, assets/… — already resolve in place, untouched).
const rewrite = (text) => text.replaceAll("../brand/", "brand/");

// Copy one referenced file into the output, preserving its subpath (../brand/x → brand/x; assets/x → assets/x).
function vendor(ref, outDir) {
  const src = resolve(HERE, ref);
  if (!existsSync(src)) throw new Error(`referenced asset missing on disk: ${ref}`);
  const rel = ref.startsWith("../brand/") ? ref.replace("../brand/", "brand/") : ref;
  const dest = join(outDir, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  return rel;
}

function build(tplArg, nameArg) {
  const tpl = tplArg || "deck.html";
  const tplAbs = resolve(HERE, tpl);
  if (!existsSync(tplAbs)) throw new Error(`template not found: ${tpl}`);
  const project = nameArg || basename(tpl).replace(/\.html?$/i, "");
  const outDir = join(HERE, "dist", project);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const html = readFileSync(tplAbs, "utf8");
  const css  = readFileSync(resolve(HERE, STYLESHEET), "utf8");

  // Discover refs from comment-stripped text. (deck.css itself is written out separately, below;
  // deck.js IS vendored here — it has no ../brand inside, so vendor() copies it verbatim.)
  const htmlRefs = refsFrom(stripHtmlComments(html));   // deck.css, deck.js, ../brand/{logos,qr}/*
  const cssRefs  = refsFrom(stripCssComments(css));      // ../brand/{colors,tokens}.css, fonts/*, assets/*.png

  const vendored = [];
  for (const r of [...htmlRefs, ...cssRefs]) {
    if (r === STYLESHEET) continue;
    vendored.push(vendor(r, outDir));
  }

  // The deck is served at the project root → index.html (so a static host serves it at /).
  writeFileSync(join(outDir, "index.html"), rewrite(html));
  writeFileSync(join(outDir, STYLESHEET), rewrite(css));

  // ── Self-containment assertions (the "zero 404s when copied out" proof) ──────────────────────
  const outHtml = readFileSync(join(outDir, "index.html"), "utf8");
  const outCss  = readFileSync(join(outDir, STYLESHEET), "utf8");
  // 1) no ../ escape survives anywhere (the rewrite turned every ../brand/ into brand/)
  for (const [f, t] of [["index.html", outHtml], [STYLESHEET, outCss]]) {
    if (t.includes("../")) throw new Error(`${f}: a "../" path survived the rewrite`);
  }
  // 2) every referenced local file resolves inside dist/<project>/ (refs from comment-stripped output)
  const finalRefs = [...refsFrom(stripHtmlComments(outHtml)), ...refsFrom(stripCssComments(outCss))];
  for (const r of finalRefs) {
    if (!existsSync(join(outDir, r))) throw new Error(`unresolved ref in output: ${r}`);
  }

  console.log(`  ✓ ${project.padEnd(14)} ${tpl} → dist/${project}/  ` +
    `(${vendored.length} files vendored · ${finalRefs.length} refs resolve · no ../ escapes)`);
  return outDir;
}

const [, , tplArg, nameArg] = process.argv;
console.log("Building self-contained talk deck → dist/  [copier, no Chromium]:");
build(tplArg, nameArg);
console.log("Done. Copy the whole dist/<project>/ folder to present/share (it needs nothing else).");
