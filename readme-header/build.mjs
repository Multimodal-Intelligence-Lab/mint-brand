#!/usr/bin/env node
// MINT readme-header — render a self-contained HTML banner into a retina PNG for a GitHub README.
//
//   node build.mjs                        header.html → dist/header.png   ← default
//   node build.mjs header.html 1280x160   explicit file + logical size
//
// GitHub strips inline SVG and drops web fonts from SVG-as-<img>, so the deliverable is a PNG.
// We render the HTML with headless Chromium's --screenshot (NOT --print-to-pdf: screenshot crops to
// the window, it does not paginate), at 2× device scale for retina, then VERIFY the PNG's real pixel
// size by reading its IHDR chunk in pure node — the dependency-free analog to how posters/build.mjs
// verifies PDF dimensions via poppler. A failed check exits non-zero.
//
// Sibling of posters/build.mjs and deliberately separate: it duplicates the ~40-line findChrome()
// rather than refactor a shared helper into the working poster build — extract one only when a 3rd
// renderer appears.

import { readFileSync, writeFileSync, existsSync, globSync, mkdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve, basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(new URL(import.meta.url).pathname);
const DIST = join(HERE, "dist");

const SCALE = 2;                 // device-scale-factor → retina PNG (logical W×H rendered at 2×)
const DEFAULT_SIZE = "1280x160";  // 8:1 GitHub README banner — title reads at GitHub's rendered width
const HEADLESS = "--headless";   // fallback: "--headless=old" if --screenshot misbehaves in this env

// The Inter woff2 files the banners' @font-face references, resolved to disk. If one is missing or
// mis-pathed, Chromium silently falls back to a system font — the one failure a pixel-size check
// can't catch — so asset existence is the deterministic anti-fallback guard (mirrors posters).
const FONT_SRCS = [
  resolve(HERE, "../brand/fonts/inter-variable-latin.woff2"),
  resolve(HERE, "../brand/fonts/inter-variable-latin-italic.woff2"),
];
const FONTS_PRESENT = FONT_SRCS.every((p) => existsSync(p));

// ── find a Chromium: PATH, then standard install locations, then the Playwright cache ─────
// Verbatim from posters/build.mjs — cross-platform (Linux / macOS / Windows + Edge fallback).
function findChrome() {
  for (const cmd of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try { return execFileSync("/bin/bash", ["-c", `command -v ${cmd}`]).toString().trim(); }
    catch { /* not on PATH / no bash */ }
  }
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

// ── read a PNG's real pixel dimensions from its IHDR chunk (bytes 16–24, big-endian) ──────
// The 8-byte signature + 4-byte length + "IHDR" tag precede width/height; this is the verify step.
function pngSize(file) {
  const b = readFileSync(file);
  const sigOk = b.length > 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString("ascii", 12, 16) === "IHDR";
  if (!sigOk) throw new Error(`${basename(file)} is not a valid PNG (bad signature/IHDR)`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

// ── render + verify one HTML → returns true on full pass ──────────────────────────────────
function buildOne(chrome, srcRel, sizeArg) {
  const [logW, logH] = (sizeArg || DEFAULT_SIZE).split("x").map(Number);
  if (!logW || !logH) throw new Error(`Bad size "${sizeArg}" — expected WxH, e.g. 1280x320`);

  const srcAbs = resolve(HERE, srcRel);
  if (!existsSync(srcAbs)) throw new Error(`Input not found: ${srcRel}`);
  let html = readFileSync(srcAbs, "utf8");

  // <base> so the banner's relative asset paths (../../brand/…) resolve from the SOURCE dir even
  // though the processed copy is rendered out of dist/ (same trick posters/build.mjs uses).
  const baseHref = pathToFileURL(dirname(srcAbs)).href + "/";
  if (!html.includes("<base ")) html = html.replace("<head>", `<head>\n  <base href="${baseHref}">`);

  const name = basename(srcRel).replace(/\.html?$/i, "");
  const htmlOut = join(DIST, `${name}.html`);
  const pngOut = join(DIST, `${name}.png`);
  writeFileSync(htmlOut, html);

  execFileSync(chrome, [
    HEADLESS, "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    `--screenshot=${pngOut}`,
    `--window-size=${logW},${logH}`,
    `--force-device-scale-factor=${SCALE}`,
    "--virtual-time-budget=15000",
    pathToFileURL(htmlOut).href,
  ], { stdio: ["ignore", "ignore", "ignore"] });

  if (!existsSync(pngOut)) throw new Error(`${name}: Chromium produced no PNG (screenshot failed)`);

  const { w, h, bytes } = pngSize(pngOut);
  const wantW = logW * SCALE, wantH = logH * SCALE;
  const dimOk = w === wantW && h === wantH;          // exact: screenshot is deterministic at fixed scale
  const nonTrivial = bytes > 2000;                   // a blank/failed render is a few hundred bytes
  const fontOk = FONTS_PRESENT;                       // anti-fallback: Inter assets actually on disk

  const checks = [
    [dimOk, `${w}×${h}px (want ${wantW}×${wantH})`],
    [nonTrivial, `${(bytes / 1024).toFixed(0)}KB`],
    [fontOk, `Inter present${FONTS_PRESENT ? "" : " (MISSING woff2!)"}`],
  ];
  const pass = checks.every(([ok]) => ok);
  console.log(`  ${pass ? "✓" : "✗"} ${name.padEnd(10)} ${checks.map(([ok, m]) => (ok ? "" : "FAIL:") + m).join("  ")}`);
  return pass;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────
const [, , fileArg, sizeArg] = process.argv;
const files = [fileArg ?? "header.html"];

mkdirSync(DIST, { recursive: true });
const chrome = findChrome();
console.log(`Browser: ${chrome}\nRendering ${files.length} banner(s) → dist/  [${HEADLESS}, ${SCALE}×]:`);
if (!FONTS_PRESENT) console.log("  ! Inter woff2 missing under ../brand/fonts — text will fall back to a system font.");

let allPass = true;
for (const f of files) allPass = buildOne(chrome, f, sizeArg) && allPass;

if (!allPass) { console.error("\nSome banners FAILED verification (see ✗ above)."); process.exit(1); }
console.log(`\nAll ${files.length} banner(s) verified. PNGs in dist/.`);
