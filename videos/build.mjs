#!/usr/bin/env node
// MINT videos — build a self-contained, portable copy of a teaser.
//
//   node build.mjs                       teaser.html → dist/teaser/   (index.html + teaser.css + teaser.js + vendored brand/)
//   node build.mjs my-teaser.html        my-teaser.html → dist/my-teaser/  (project name defaults to the file stem)
//   node build.mjs my-teaser.html my-proj my copy → dist/my-proj/  (explicit project name)
//
// A teaser's LIVE deliverable is the HTML/CSS/JS you open and auto-play — so this is a file COPIER, not
// a renderer (there is deliberately NO Chromium here; to turn the teaser into an MP4, use record.mjs or
// screen-record — see README). The authoring source references the brand single-source by relative path
// (../brand/…), which 404s the instant the teaser is copied elsewhere. So the build VENDORS the brand
// files the teaser actually uses into dist/<project>/brand/ (subpaths preserved) and rewrites every
// ../brand/ → brand/, then ASSERTS self-containment — the same proof slides/ and demo-pages/ build. Node
// built-ins only; no npm install. (This is slides/build.mjs with the teaser stylesheet name; teaser.js,
// like deck.js, holds no ../brand ref, so it is discovered by refsFrom() and copied verbatim. If the
// author wires a voiceover via <audio><source src="…">, refsFrom() catches that src and vendors it too.)

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, resolve, join, basename } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
const STYLESHEET = "teaser.css";   // written out separately (rewritten); all other refs are vendored

// Comments hold fake refs on purpose (the commented <source src> voiceover example). Strip them before
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
// via brand/…  (refs without ../ — teaser.css, teaser.js, assets/…, a local voiceover — already resolve
// in place, untouched).
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
  const tpl = tplArg || "teaser.html";
  const tplAbs = resolve(HERE, tpl);
  if (!existsSync(tplAbs)) throw new Error(`template not found: ${tpl}`);
  const project = nameArg || basename(tpl).replace(/\.html?$/i, "");
  const outDir = join(HERE, "dist", project);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const html = readFileSync(tplAbs, "utf8");
  const css  = readFileSync(resolve(HERE, STYLESHEET), "utf8");

  // Discover refs from comment-stripped text. (teaser.css itself is written out separately, below;
  // teaser.js IS vendored here — it has no ../brand inside, so vendor() copies it verbatim.)
  const htmlRefs = refsFrom(stripHtmlComments(html));   // teaser.css, teaser.js, ../brand/{logos,qr}/*, audio src
  const cssRefs  = refsFrom(stripCssComments(css));      // ../brand/{colors,tokens}.css, fonts/*, assets/*.png

  const vendored = [];
  for (const r of [...htmlRefs, ...cssRefs]) {
    if (r === STYLESHEET) continue;
    vendored.push(vendor(r, outDir));
  }

  // The teaser is served at the project root → index.html (so a static host serves it at /).
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
console.log("Building self-contained teaser → dist/  [copier, no Chromium]:");
build(tplArg, nameArg);
console.log("Done. Copy the whole dist/<project>/ folder to share, or render it with record.mjs.");
