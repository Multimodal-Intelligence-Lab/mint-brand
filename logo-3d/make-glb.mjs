#!/usr/bin/env node
// MINT logo-3d — regenerate brand/logos/mint-mark-3d.glb from the 2D master (one-time tool).
//
//   npm i three@0.170.0 --no-save          # one-time, in this folder (leaves no repo dependency)
//   node make-glb.mjs                      # -> dist/make-glb/mint-mark-3d-raw.glb + proof renders
//   npx -y gltfpack -i dist/make-glb/mint-mark-3d-raw.glb -o dist/make-glb/mint-mark-3d.glb -kn
//   cp dist/make-glb/mint-mark-3d.glb ../brand/logos/mint-mark-3d.glb
//   rm -rf node_modules package.json package-lock.json
//
// The trace/extrude algorithm lives in make-glb.html (see its header); this driver is the
// record.mjs CDP pattern: on-box headless Chromium over node's built-in WebSocket, an ephemeral
// repo-root http server (the page fetches ../brand/…), no puppeteer/playwright. gltfpack is a
// one-time generator tool (quantize ONLY — never -c/meshopt: those add CDN WASM decoders).
// FAIL-LOUD: refuses to emit if three/ is missing, the trace does not yield exactly the two
// named slabs, or the GLB is implausibly small.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, resolve, join, extname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { globSync } from "node:fs";

const HERE = dirname(new URL(import.meta.url).pathname);
const ROOT = resolve(HERE, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(join(HERE, "node_modules/three"))) {
  throw new Error("three is not installed. One-time: npm i three@0.170.0 --no-save   (then delete node_modules when done)");
}

// ── find a Chromium (PATH → standard installs → Playwright cache); same discovery as record.mjs ──
function findChrome() {
  for (const cmd of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try { return execFileSync("/bin/bash", ["-c", `command -v ${cmd}`]).toString().trim(); }
    catch { /* not on PATH / no bash */ }
  }
  const LAD = process.env.LOCALAPPDATA || "";
  for (const app of [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    LAD && join(LAD, "Google/Chrome/Application/chrome.exe"),
  ]) { if (app && existsSync(app)) return app; }
  const roots = [join(homedir(), ".cache/ms-playwright"), join(homedir(), "Library/Caches/ms-playwright"), LAD && join(LAD, "ms-playwright")].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const rel of ["chromium-*/chrome-linux64/chrome", "chrome-*/chrome-linux64/chrome", "chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium", "chromium-*/chrome-win/chrome.exe"]) {
      const hit = globSync(rel, { cwd: root }).sort();
      if (hit.length) return join(root, hit.at(-1));
    }
  }
  throw new Error("No Chromium found. Install Google Chrome (or run: npx playwright install chromium).");
}

// ── serve the repo root on an ephemeral port (the page fetches ../brand/… + ./node_modules/…) ──
function serveRoot() {
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".glb": "model/gltf-binary" };
  const server = createServer((req, res) => {
    try {
      const path = resolve(ROOT, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (!path.startsWith(ROOT)) throw new Error("outside root");
      const data = readFileSync(path);
      res.writeHead(200, { "content-type": MIME[extname(path)] || "application/octet-stream" });
      res.end(data);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((res) => server.listen(0, "127.0.0.1", () => res({ server, port: server.address().port })));
}

// ── a tiny CDP client over node's built-in WebSocket (record.mjs's client, verbatim) ──
function connectCDP(url) {
  return new Promise((resolvePromise, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    ws.addEventListener("open", () => resolvePromise(api));
    ws.addEventListener("error", (e) => reject(new Error("CDP WebSocket error: " + (e.message || e.type))));
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
        if (msg.error) rej(new Error("CDP " + JSON.stringify(msg.error))); else res(msg.result);
      }
    });
    const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
      const mid = ++id; pending.set(mid, { res, rej });
      ws.send(JSON.stringify(sessionId ? { id: mid, method, params, sessionId } : { id: mid, method, params }));
    });
    const api = { send, close: () => ws.close() };
  });
}

async function launchChrome(chrome, profile, mode) {
  const args = [
    mode, "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",                       // software WebGL on GPU-less boxes
    "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--window-size=1400,1000", "--hide-scrollbars", "--force-color-profile=srgb", "about:blank",
  ];
  const proc = spawn(chrome, args, { stdio: "ignore" });
  const portFile = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (existsSync(portFile)) {
      const [port, path] = readFileSync(portFile, "utf8").split("\n");
      if (port && path) return { proc, wsUrl: `ws://127.0.0.1:${port.trim()}${path.trim()}` };
    }
    if (proc.exitCode !== null) break;
    await sleep(100);
  }
  try { proc.kill("SIGKILL"); } catch {}
  throw new Error(`Chromium (${mode}) did not expose a debugging endpoint`);
}

const outDir = join(HERE, "dist", "make-glb");
mkdirSync(outDir, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "mint-makeglb-"));
let proc = null, cdp = null, server = null;
try {
  const chrome = findChrome();
  console.log(`Browser: ${chrome}\nTracing brand/logos/mint-mark.png …`);
  ({ server } = await serveRoot());
  let launched;
  try { launched = await launchChrome(chrome, join(work, "p1"), "--headless=new"); }
  catch { launched = await launchChrome(chrome, join(work, "p2"), "--headless"); }
  proc = launched.proc;
  cdp = await connectCDP(launched.wsUrl);
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/logo-3d/make-glb.html` }, sessionId);
  const evalJs = async (expression) => {
    const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("page JS threw: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  let built = false;
  for (let i = 0; i < 240 && !built; i++) { built = await evalJs('document.title === "BUILT"'); if (!built) await sleep(500); }
  if (!built) throw new Error("generator page never reached BUILT — nothing written");

  const stats = await evalJs("JSON.stringify(window.__RESULT__.stats)");
  console.log("  trace:", stats);
  const st = JSON.parse(stats);
  if (st.outers !== 2 || !st.parts.includes("m-letterform") || !st.parts.includes("leaf-blade")) {
    throw new Error("trace did not yield the two named slabs (m-letterform, leaf-blade) — master changed? nothing written");
  }
  const glb = Buffer.from(await evalJs("window.__RESULT__.glbB64"), "base64");
  if (glb.length < 50_000) throw new Error(`GLB implausibly small (${glb.length} bytes) — nothing written`);
  writeFileSync(join(outDir, "mint-mark-3d-raw.glb"), glb);
  for (const name of ["front", "side", "threequarter"]) {
    const dataUrl = await evalJs(`window.__RESULT__.shots[${JSON.stringify(name)}]`);
    writeFileSync(join(outDir, `${name}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
  }
  console.log(`Done → ${outDir}/mint-mark-3d-raw.glb (${(glb.length / 1024).toFixed(0)} KB) + 3 proof renders`);
  console.log("Next: npx -y gltfpack -i dist/make-glb/mint-mark-3d-raw.glb -o dist/make-glb/mint-mark-3d.glb -kn");
  console.log("      eyeball the renders, cp the quantized file to ../brand/logos/mint-mark-3d.glb,");
  console.log("      then rm -rf node_modules package.json package-lock.json");
} finally {
  try { cdp?.close(); } catch {}
  try { proc?.kill("SIGKILL"); } catch {}
  try { server?.close(); } catch {}
  rmSync(work, { recursive: true, force: true });
}
