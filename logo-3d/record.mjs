#!/usr/bin/env node
// MINT logo-3d — render the spinning-mark GIF using ON-BOX tools (no npm install).
//
//   node record.mjs                  viewer.html → dist/logo-3d.gif
//   node record.mjs out.gif          viewer.html → out.gif
//
// HOW: the sibling of videos/record.mjs — the same CDP-over-built-in-WebSocket driver, the same
// on-box Chromium + ffmpeg (runtime tools, not repo dependencies). Three differences, each forced
// by WebGL or the GLB:
//   · it serves the REPO ROOT over node's built-in http for the capture — browsers refuse to
//     fetch() the ../brand GLB from a file:// page, so a file URL would record an empty stage;
//   · it launches Chromium with --enable-unsafe-swiftshader so WebGL renders on GPU-less boxes
//     (software GL; newer Chromium refuses WebGL headless without it);
//   · it needs no virtual clock: a turntable is a function of ANGLE, not time, so each frame is
//     POSED (set the camera orbit, jump it, wait two rAFs) — deterministic, and a seamless loop
//     by construction (the last frame plus one step lands exactly on the first).
//
// FAIL-LOUD: throws (and writes nothing) if Chromium or ffmpeg is missing, the model never
// reports loaded, the captured frames are all byte-identical, or the encoded GIF is implausibly
// small — a blank or frozen WebGL canvas would otherwise encode into a perfectly valid, and
// perfectly empty, GIF.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, renameSync, copyFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, resolve, join, extname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { globSync } from "node:fs";

const HERE = dirname(new URL(import.meta.url).pathname);
const ROOT = resolve(HERE, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FALLBACK = "Fallback: serve the repo root (python3 -m http.server), open logo-3d/viewer.html and screen-record it.";

// 72 poses × 5° at 24fps → one full turn as a seamless 3s loop; captured at 960², shipped at 480².
const FRAMES = 72, FPS = 24, SIZE = 960, OUT_SIZE = 480;
const START_YAW = 25, PITCH = 78; // matches viewer.html's camera-orbit so the GIF opens on the same pose

// ── find a Chromium (PATH → standard installs → Playwright cache); same discovery as videos/record.mjs ──
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
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    LAD && join(LAD, "Google/Chrome/Application/chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ]) { if (app && existsSync(app)) return app; }
  const roots = [
    join(homedir(), ".cache/ms-playwright"),
    join(homedir(), "Library/Caches/ms-playwright"),
    LAD && join(LAD, "ms-playwright"),
  ].filter(Boolean);
  const rels = [
    "chromium-*/chrome-linux64/chrome",
    "chrome-*/chrome-linux64/chrome",
    "chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium",
    "chromium-*/chrome-win/chrome.exe",
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const rel of rels) {
      const hit = globSync(rel, { cwd: root }).sort();
      if (hit.length) return join(root, hit.at(-1));
    }
  }
  throw new Error(`No Chromium found. Install Google Chrome (or run: npx playwright install chromium).\n${FALLBACK}`);
}

// ── find ffmpeg: PATH, then the common ~/.local/bin static install ──
function findBin(name) {
  try { return execFileSync("/bin/bash", ["-c", `command -v ${name}`]).toString().trim(); } catch {}
  const local = join(homedir(), ".local/bin", name);
  if (existsSync(local)) return local;
  throw new Error(`No ${name} found (looked on PATH and ~/.local/bin). Install ffmpeg.\n${FALLBACK}`);
}

// ── serve the repo root on an ephemeral port (the GLB + ../brand refs must arrive over http) ──
function serveRoot() {
  const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
    ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif",
    ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json",
  };
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

// ── a tiny CDP client over node's built-in WebSocket (no library) ──
function connectCDP(url) {
  return new Promise((resolvePromise, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.addEventListener("open", () => resolvePromise(api));
    ws.addEventListener("error", (e) => reject(new Error("CDP WebSocket error: " + (e.message || e.type))));
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
        if (msg.error) rej(new Error("CDP " + JSON.stringify(msg.error))); else res(msg.result);
      } else if (msg.method) {
        for (const l of listeners) l(msg);
      }
    });
    const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
      const mid = ++id; pending.set(mid, { res, rej });
      ws.send(JSON.stringify(sessionId ? { id: mid, method, params, sessionId } : { id: mid, method, params }));
    });
    const on = (l) => { listeners.add(l); return () => listeners.delete(l); };
    const waitFor = (wantMethod, sessionId, timeout = 15000) => new Promise((res, rej) => {
      const t = setTimeout(() => { off(); rej(new Error("timeout waiting for " + wantMethod)); }, timeout);
      const off = on((msg) => {
        if (msg.method === wantMethod && (!sessionId || msg.sessionId === sessionId)) {
          clearTimeout(t); off(); res(msg.params);
        }
      });
    });
    const api = { send, on, waitFor, close: () => ws.close() };
  });
}

// ── launch Chromium with remote debugging; read the ephemeral ws endpoint from DevToolsActivePort ──
async function launchChrome(chrome, profile, mode) {
  const args = [
    mode, "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    // Software WebGL for GPU-less boxes (login nodes): without this flag newer Chromium refuses
    // to create a WebGL context headless and the capture would be a blank stage.
    "--enable-unsafe-swiftshader",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    // Force a synchronous compositor draw on every captureScreenshot (same rationale as
    // videos/record.mjs: an idle page schedules no BeginFrame, so the screenshot would hang).
    "--run-all-compositor-stages-before-draw", "--disable-new-content-rendering-timeout",
    `--window-size=${SIZE},${SIZE}`, "--hide-scrollbars", "--force-color-profile=srgb",
    "about:blank",
  ];
  const proc = spawn(chrome, args, { stdio: "ignore" });
  const portFile = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {                 // poll up to ~10s
    if (existsSync(portFile)) {
      const [port, path] = readFileSync(portFile, "utf8").split("\n");
      if (port && path) return { proc, wsUrl: `ws://127.0.0.1:${port.trim()}${path.trim()}` };
    }
    if (proc.exitCode !== null) break;            // chrome died
    await sleep(100);
  }
  try { proc.kill("SIGKILL"); } catch {}
  throw new Error(`Chromium (${mode}) did not expose a debugging endpoint`);
}

async function record(outArg) {
  const chrome = findChrome();
  const ffmpeg = findBin("ffmpeg");
  const outAbs = resolve(HERE, outArg || join("dist", "logo-3d.gif"));

  const work = mkdtempSync(join(tmpdir(), "mint-logo3d-"));
  const profile = join(work, "profile");
  const framesDir = join(work, "frames");
  mkdirSync(profile, { recursive: true });
  mkdirSync(framesDir, { recursive: true });

  let proc = null, cdp = null, server = null;
  try {
    console.log(`Browser: ${chrome}\nffmpeg:  ${ffmpeg}\nRecording viewer.html …`);
    ({ server } = await serveRoot());
    const url = `http://127.0.0.1:${server.address().port}/logo-3d/viewer.html`;

    // 1) launch (fall back to legacy --headless if --headless=new won't expose the endpoint)
    let launched;
    try { launched = await launchChrome(chrome, profile, "--headless=new"); }
    catch { launched = await launchChrome(chrome, profile, "--headless"); }
    proc = launched.proc;
    cdp = await connectCDP(launched.wsUrl);

    // 2) open a page target and attach (flatten → page commands ride the one socket with a sessionId)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);

    // 3) navigate and wait for the model itself (page load ≠ GLB parsed + first render)
    const loaded = cdp.waitFor("Page.loadEventFired", sessionId, 20000);
    await cdp.send("Page.navigate", { url }, sessionId);
    await loaded;
    const evalJs = async (expression) => {
      const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) throw new Error("page JS threw: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };
    let modelReady = false;
    for (let i = 0; i < 120 && !modelReady; i++) {   // up to 60s: software GL parses 98K tris fine, slowly
      modelReady = await evalJs('(() => { const mv = document.querySelector("model-viewer"); return !!(mv && mv.loaded); })()');
      if (!modelReady) await sleep(500);
    }
    if (!modelReady) throw new Error("model-viewer never reported the GLB loaded — capture aborted, no file written");

    // 4) pose-and-shoot: frames are a function of angle, not time — stop the live auto-rotate,
    //    drop the footer (the GIF is the square stage alone), and jump the camera per frame.
    await evalJs('(() => { const mv = document.querySelector("model-viewer"); mv.removeAttribute("auto-rotate"); document.querySelector(".foot").style.display = "none"; return true; })()');
    await cdp.send("Emulation.setDeviceMetricsOverride",
      { width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false }, sessionId);
    for (let i = 0; i < FRAMES; i++) {
      const yaw = START_YAW + (i * 360) / FRAMES;
      await evalJs(`(async () => {
        const mv = document.querySelector("model-viewer");
        mv.cameraOrbit = "${yaw}deg ${PITCH}deg 105%";
        mv.jumpCameraToGoal();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return true; })()`);
      const shot = await cdp.send("Page.captureScreenshot",
        { format: "png", clip: { x: 0, y: 0, width: SIZE, height: SIZE, scale: 1 } }, sessionId);
      writeFileSync(join(framesDir, `f${String(i).padStart(3, "0")}.png`), Buffer.from(shot.data, "base64"));
    }

    // 5) eyes-free proof the turntable actually turned (a blank/frozen canvas still encodes cleanly)
    const first = readFileSync(join(framesDir, "f000.png"));
    const mid = readFileSync(join(framesDir, `f${String(FRAMES >> 1).padStart(3, "0")}.png`));
    if (first.equals(mid)) throw new Error("frames are byte-identical — the stage did not rotate; emitting no file");
    console.log(`  captured ${FRAMES} posed frames (360° / seamless loop) ✓`);

    // 6) encode: palettegen/paletteuse two-pass in one filtergraph → small, clean flat-color GIF
    const tmpGif = join(work, "out.gif");
    execFileSync(ffmpeg, ["-y", "-framerate", String(FPS), "-i", join(framesDir, "f%03d.png"),
      "-vf", `scale=${OUT_SIZE}:${OUT_SIZE}:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
      "-loop", "0", tmpGif], { stdio: ["ignore", "ignore", "inherit"] });
    const bytes = readFileSync(tmpGif).length;
    if (bytes < 100_000) throw new Error(`encoded GIF is implausibly small (${bytes} bytes) — likely a blank stage; emitting no file`);

    // 7) only now publish into dist/ (rename within tmp can cross devices → copy+unlink fallback)
    mkdirSync(dirname(outAbs), { recursive: true });
    try { renameSync(tmpGif, outAbs); } catch { copyFileSync(tmpGif, outAbs); }
    console.log(`Done → ${outAbs}  (${(bytes / 1048576).toFixed(2)} MB)`);
    console.log("  README sample: cp dist/logo-3d.gif ../docs/samples/logo-3d.gif");
    return outAbs;
  } finally {
    try { cdp?.close(); } catch {}
    try { proc?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
    rmSync(work, { recursive: true, force: true });
  }
}

const [, , outArg] = process.argv;
await record(outArg);
