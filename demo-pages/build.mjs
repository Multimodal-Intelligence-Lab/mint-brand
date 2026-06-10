#!/usr/bin/env node
// MINT demo-pages — build a self-contained, deployable copy of a demo page.
//
//   node build.mjs                      page.html → dist/page/     (index.html + style.css + vendored brand/)
//   node build.mjs my-paper.html        my-paper.html → dist/my-paper/  (project name defaults to the file stem)
//   node build.mjs my-paper.html my-proj my copy → dist/my-proj/  (explicit project name)
//
// A demo page's deliverable IS the live HTML/CSS/JS — so this is a file COPIER, not a renderer (there
// is deliberately NO Chromium here, unlike posters/ and readme-header/ whose deliverables are rendered
// PDF/PNG). The authoring sources reference the brand single-source by relative path (../brand/…),
// which 404s the instant the page is copied to another repo / GitHub Pages. So the build VENDORS the
// brand files the page actually uses into dist/<project>/brand/ (subpaths preserved) and rewrites
// every ../brand/ → brand/, then ASSERTS self-containment — the demo-pages analog to how posters/
// verifies PDF dims and readme-header/ verifies PNG pixels. Node built-ins only; no npm install.
//
// Why the source keeps ../brand at rest: it honors the single-source-of-truth (one logo, one place) so
// editing the page in the monorepo always reflects brand/. Vendoring happens ONLY in dist/ — the copy
// you deploy. Never hand-edit dist/.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, resolve, join, basename } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);

// Comments hold fake refs on purpose (commented architecture.svg / results.svg figure alternatives, and
// prose that mentions ../brand/colors.css). Strip them before extracting refs, or the copier chases files
// that don't exist and the assertions false-fail.
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
const stripCssComments  = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

// Local, relative asset refs from html or css (comments already stripped). Skips external links
// (http/mailto/data), in-page anchors (#…), and absolute paths — none of those are vendored.
function refsFrom(text) {
  const out = new Set();
  const add = (r) => { if (r && !/^(https?:|mailto:|data:|#|\/)/.test(r)) out.add(r); };
  for (const m of text.matchAll(/(?:src|href)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/g))
    add(m[1] ?? m[2] ?? m[3]);
  for (const m of text.matchAll(/url\(\s*['"]?([^'"()]+)['"]?\s*\)/g)) add(m[1]);
  for (const m of text.matchAll(/@import\s+['"]([^'"]+)['"]/g)) add(m[1]);
  return [...out];
}

// One uniform rewrite for both html and css: both land at dist/<project>/, so both reach the vendored
// brand via brand/…  (refs without ../ — style.css, assets/… — already resolve in place, untouched).
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
  const tpl = tplArg || "page.html";
  const tplAbs = resolve(HERE, tpl);
  if (!existsSync(tplAbs)) throw new Error(`template not found: ${tpl}`);
  const project = nameArg || basename(tpl).replace(/\.html?$/i, "");
  const outDir = join(HERE, "dist", project);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const html = readFileSync(tplAbs, "utf8");
  const css  = readFileSync(resolve(HERE, "style.css"), "utf8");

  // Discover refs from comment-stripped text. (style.css itself is written out separately, below.)
  const htmlRefs = refsFrom(stripHtmlComments(html));   // style.css, assets/*.png, ../brand/{logos,qr}/*
  const cssRefs  = refsFrom(stripCssComments(css));      // ../brand/{colors,tokens}.css, ../brand/fonts/*

  const vendored = [];
  for (const r of [...htmlRefs, ...cssRefs]) {
    if (r === "style.css") continue;
    vendored.push(vendor(r, outDir));
  }

  // The page is served at the project root → index.html (so GitHub Pages serves it at /).
  writeFileSync(join(outDir, "index.html"), rewrite(html));
  writeFileSync(join(outDir, "style.css"), rewrite(css));

  // ── Self-containment assertions (the "zero 404s when copied out" proof) ──────────────────────
  const outHtml = readFileSync(join(outDir, "index.html"), "utf8");
  const outCss  = readFileSync(join(outDir, "style.css"), "utf8");
  // 1) no ../ escape survives anywhere (the rewrite turned every ../brand/ into brand/)
  for (const [f, t] of [["index.html", outHtml], ["style.css", outCss]]) {
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
console.log("Building self-contained demo page → dist/  [copier, no Chromium]:");
build(tplArg, nameArg);
console.log("Done. Copy the whole dist/<project>/ folder into your repo (e.g. as the GitHub Pages root).");
