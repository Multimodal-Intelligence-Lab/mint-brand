#!/usr/bin/env node
// MINT posters — build one HTML template into print-ready PDFs at any catalog size.
//
//   node build.mjs                      every catalog size (sizes.js, minus regression) ← default
//   node build.mjs poster.html 48x36    one file, one size
//   node build.mjs examples/musdet.html 42x21   render the worked example (regression check)
//
// For each size it injects a literal @page block, renders with the cached headless Chromium, and
// VERIFIES the result (page count, exact dimensions, embedded font). A failed check exits non-zero.
//
// CMYK: PDFs are sRGB. For a CMYK press, convert with ghostscript (see README) — not done here.

import { readFileSync, writeFileSync, existsSync, globSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve, basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { SIZES } from "./sizes.js";

const HERE = dirname(new URL(import.meta.url).pathname);
const DIST = join(HERE, "dist");

// The @font-face woff2 files poster.css references, resolved to disk. If one of these goes missing
// or is mis-pathed, Chromium silently falls back to a system font — the one font failure mode that
// page-size checks can't see. (Chromium embeds the *variable* Inter as Type 3 glyph outlines, so it
// never appears by name in pdffonts; asset existence is the deterministic guard instead.)
const FONT_SRCS = [...readFileSync(join(HERE, "poster.css"), "utf8")
  .matchAll(/url\("([^"]+\.woff2)"\)/g)].map((m) => resolve(HERE, m[1]));
const FONTS_PRESENT = FONT_SRCS.length > 0 && FONT_SRCS.every((p) => existsSync(p));

// ── physical → PostScript points, for verifying the rendered page size ──────────────────
const toPt = (v, unit) => (unit === "in" ? v * 72 : (v * 72) / 25.4);

// ── find a Chromium: PATH, then standard install locations, then the Playwright cache ─────
// Cross-platform — Linux (PATH + ~/.cache/.../chrome-linux64), macOS (/Applications + ~/Library/
// Caches/.../chrome-mac), Windows (Program Files / %LOCALAPPDATA% + .../chrome-win). On Windows,
// Edge counts as a Chromium fallback since it ships with the OS. Glob uses cwd + forward-slash
// relative patterns so it works regardless of the platform path separator.
function findChrome() {
  // 1. on PATH (Linux/macOS; on native Windows /bin/bash is absent → caught and skipped)
  for (const cmd of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try { return execFileSync("/bin/bash", ["-c", `command -v ${cmd}`]).toString().trim(); }
    catch { /* not on PATH / no bash */ }
  }
  // 2. standard install locations — macOS bundles, then Windows (Chrome, then Edge)
  const LAD = process.env.LOCALAPPDATA || "";
  for (const app of [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    LAD && join(LAD, "Google/Chrome/Application/chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ]) { if (app && existsSync(app)) return app; }
  // 3. the Playwright-cached browser — Linux / macOS / Windows roots × per-OS layouts
  const roots = [
    join(homedir(), ".cache/ms-playwright"),
    join(homedir(), "Library/Caches/ms-playwright"),
    LAD && join(LAD, "ms-playwright"),
  ].filter(Boolean);
  const rels = [
    "chromium-*/chrome-linux64/chrome",
    "chrome-*/chrome-linux64/chrome",
    "chromium_headless_shell-*/chrome-linux64/chrome-headless-shell",
    "chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium",
    "chromium_headless_shell-*/chrome-mac*/chrome-headless-shell",
    "chromium-*/chrome-win/chrome.exe",
    "chromium_headless_shell-*/chrome-win/chrome-headless-shell.exe",
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const rel of rels) {
      const hit = globSync(rel, { cwd: root }).sort();
      if (hit.length) return join(root, hit.at(-1));
    }
  }
  throw new Error("No Chromium found. Install Google Chrome (or Edge on Windows), or run: npx playwright install chromium");
}

// ── build the per-size style block injected at <!--SIZE_BLOCK--> ─────────────────────────
function sizeBlock({ w, h, unit, cols }) {
  return `<style>
    @page { size: ${w}${unit} ${h}${unit}; margin: 0; }
    :root { --cols: ${cols}; --page-w: ${w}${unit}; --page-h: ${h}${unit}; }
  </style>`;
}

// ── render + verify one (file, size) → returns true on full pass ─────────────────────────
function buildOne(chrome, verify, srcRel, key) {
  const spec = SIZES[key];
  if (!spec) throw new Error(`Unknown size "${key}". Known: ${Object.keys(SIZES).join(", ")}`);

  const srcAbs = resolve(HERE, srcRel);
  if (!existsSync(srcAbs)) throw new Error(`Input not found: ${srcRel}`);
  let html = readFileSync(srcAbs, "utf8");
  if (!html.includes("<!--SIZE_BLOCK-->")) throw new Error(`${srcRel} has no <!--SIZE_BLOCK--> marker`);

  // <base> so the template's relative asset paths (assets/…, ../brand/…) resolve from the SOURCE
  // dir even though the rendered HTML lives in dist/.
  const baseHref = pathToFileURL(dirname(srcAbs)).href + "/";
  html = html.replace("<head>", `<head>\n  <base href="${baseHref}">`);
  html = html.replace("<!--SIZE_BLOCK-->", sizeBlock(spec));
  if (spec.trifold) html = html.replace(/^<body>/m, '<body class="trifold">'); // anchored: the real tag, not a mention in a comment

  const name = `${basename(srcRel).replace(/\.html?$/i, "")}-${key}`;
  const htmlOut = join(DIST, `${name}.html`);
  const pdfOut = join(DIST, `${name}.pdf`);
  writeFileSync(htmlOut, html);

  execFileSync(chrome, [
    "--headless", "--no-sandbox", "--disable-gpu",
    `--print-to-pdf=${pdfOut}`, "--no-pdf-header-footer",
    "--virtual-time-budget=15000", pathToFileURL(htmlOut).href,
  ], { stdio: ["ignore", "ignore", "ignore"] });

  // ── verify (skipped when poppler is absent — common on Windows; the PDF is still produced) ──
  if (!verify) {
    console.log(`  • ${name.padEnd(28)} rendered (poppler not found — size/font checks skipped)`);
    return true;
  }
  const info = execFileSync("pdfinfo", [pdfOut]).toString();
  const fonts = execFileSync("pdffonts", [pdfOut]).toString();

  const pages = +(info.match(/Pages:\s+(\d+)/)?.[1] ?? 0);
  const [, pw, ph] = info.match(/Page size:\s+([\d.]+) x ([\d.]+)/) ?? [];
  const wantW = toPt(spec.w, spec.unit), wantH = toPt(spec.h, spec.unit);
  const dimOk = pw && Math.abs(pw - wantW) <= 2 && Math.abs(ph - wantH) <= 2;
  // the PDF actually embedded glyphs (not a blank/textless render — guards a totally failed page),
  // and the Inter assets the text depends on are on disk (FONTS_PRESENT — the anti-fallback guard).
  const fontRows = fonts.split("\n").slice(2).filter((l) => l.trim());
  const fontOk = FONTS_PRESENT && fontRows.length > 0 && /\byes\b/.test(fonts);

  const checks = [
    [pages === 1, `pages=${pages} (want 1)`],
    [dimOk, `${pw}×${ph}pt (want ${wantW.toFixed(0)}×${wantH.toFixed(0)})`],
    [fontOk, `fonts embedded${FONTS_PRESENT ? "" : " (MISSING Inter woff2!)"}`],
  ];
  const pass = checks.every(([ok]) => ok);
  const mark = pass ? "✓" : "✗";
  console.log(`  ${mark} ${name.padEnd(28)} ${checks.map(([ok, m]) => (ok ? "" : "FAIL:") + m).join("  ")}`);
  return pass;
}

// ── poppler present? verification shells out to pdfinfo/pdffonts; absent (common on Windows)
//    → render anyway and skip the checks rather than hard-fail. ─────────────────────────────
function hasPoppler() {
  try { execFileSync("pdfinfo", ["-v"], { stdio: "ignore" }); return true; }
  catch (e) { return e.code !== "ENOENT"; }
}

// ── main ─────────────────────────────────────────────────────────────────────────────
const [, , fileArg, sizeArg] = process.argv;
const file = fileArg ?? "poster.html";
const keys = sizeArg ? [sizeArg] : Object.keys(SIZES).filter((k) => !SIZES[k].regression);

mkdirSync(DIST, { recursive: true });
const chrome = findChrome();
const verify = hasPoppler();
console.log(`Browser: ${chrome}\nRendering ${file} → ${keys.length} size(s)${verify ? "" : "  (poppler not found — verification will be skipped)"}:`);

let allPass = true;
for (const key of keys) allPass = buildOne(chrome, verify, file, key) && allPass;

if (!allPass) { console.error("\nSome posters FAILED verification (see ✗ above)."); process.exit(1); }
console.log(`\nAll ${keys.length} poster(s) ${verify ? "verified" : "rendered (install poppler to enable size/font verification)"}. Output in dist/.`);
