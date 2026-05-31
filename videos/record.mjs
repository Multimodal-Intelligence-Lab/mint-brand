#!/usr/bin/env node
// MINT videos — render a teaser to an MP4 using ON-BOX tools (no npm install).
//
//   node record.mjs                         teaser.html → dist/teaser.mp4
//   node record.mjs my-teaser.html out.mp4  your copy   → out.mp4
//
// HOW: drives the cached headless Chromium over the Chrome DevTools Protocol (CDP) using node's BUILT-IN
// global WebSocket — no puppeteer/playwright LIBRARY, exactly the dependency-free spirit of how
// posters/build.mjs finds and shells out to Chromium. It opens the teaser and drives Chrome's VIRTUAL
// clock (Emulation.setVirtualTimePolicy) in fixed 1/30s steps, taking a Page.captureScreenshot at each
// step, so every frame — including the eased CSS transitions — is genuinely rendered (deterministic, no
// dropped/duplicated frames) and encodes them at a constant 30fps with the on-box ffmpeg → H.264. If the
// teaser wires a voiceover (<audio><source src>), a second ffmpeg pass muxes it in. ffmpeg + Chromium are
// RUNTIME tools, not repo dependencies (nothing is installed/vendored).
//
// FAIL-LOUD: if Chromium or ffmpeg is missing, it throws with the screen-record fallback and writes
// nothing. After capture it ASSERTS via CDP that the timeline engine actually drove every segment to the
// end (a frozen capture is still valid H.264/720p/30fps, so a container check alone can't catch it) — if
// the teaser did not reach the close segment, it throws and emits no file. The MP4 is written to a temp
// path and renamed into dist/ only on full success.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, renameSync, copyFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { dirname, resolve, join, basename } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";
import { globSync } from "node:fs";

const HERE = dirname(new URL(import.meta.url).pathname);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FALLBACK = "Fallback: open teaser.html in a browser, press F to fullscreen, and screen-record the stage (see README).";

// ── find a Chromium (PATH → standard installs → Playwright cache); same discovery as posters/build.mjs ──
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

// ── a tiny CDP client over node's built-in WebSocket (no library) ──
function connectCDP(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.addEventListener("open", () => resolve(api));
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
    "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--autoplay-policy=no-user-gesture-required", "--mute-audio",
    // Force a synchronous compositor draw on every captureScreenshot. REQUIRED for the virtual-time
    // capture below: with virtual time paused between steps the page is idle and no BeginFrame is
    // scheduled, so captureScreenshot would block forever waiting for a fresh frame (deadlocks right
    // after frame 0). This flag runs all compositor stages before each draw so the screenshot resolves.
    "--run-all-compositor-stages-before-draw", "--disable-new-content-rendering-timeout",
    // The frame size comes from Emulation.setDeviceMetricsOverride + the screenshot clip below (a true
    // offscreen 1280×720 render), NOT the OS window surface — so the window size is irrelevant here. (The
    // old Page.startScreencast path was the opposite: its frame size WAS the window content area, which
    // forced a ~143px window-overhead workaround. captureScreenshot renders offscreen at the override
    // size, so there is nothing to clip.)
    "--window-size=1280,720", "--hide-scrollbars", "--force-color-profile=srgb",
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

async function record(tplArg, outArg) {
  const tpl = tplArg || "teaser.html";
  const tplAbs = resolve(HERE, tpl);
  if (!existsSync(tplAbs)) throw new Error(`teaser not found: ${tpl}`);
  const chrome = findChrome();
  const ffmpeg = findBin("ffmpeg");

  const outAbs = resolve(HERE, outArg || join("dist", basename(tpl).replace(/\.html?$/i, "") + ".mp4"));
  const work = mkdtempSync(join(tmpdir(), "mint-teaser-"));
  const profile = join(work, "profile");
  const framesDir = join(work, "frames");
  mkdirSync(profile, { recursive: true });
  mkdirSync(framesDir, { recursive: true });

  let proc = null, cdp = null;
  try {
    console.log(`Browser: ${chrome}\nffmpeg:  ${ffmpeg}\nRecording ${tpl} …`);

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

    // 3) navigate to the teaser and wait for load
    const fileUrl = pathToFileURL(tplAbs).href;
    const loaded = cdp.waitFor("Page.loadEventFired", sessionId, 20000);
    await cdp.send("Page.navigate", { url: fileUrl }, sessionId);
    await loaded;

    const evalJs = async (expression) =>
      (await cdp.send("Runtime.evaluate", { expression, returnByValue: true }, sessionId)).result.value;

    const durationMs = await evalJs("window.TEASER_MS") || 32000;
    const voSrc = (await evalJs("document.querySelector('#vo') && document.querySelector('#vo').currentSrc || ''")) || "";

    // 4) deterministic capture: drive Chrome's VIRTUAL clock in fixed 1/30s steps and screenshot each.
    //    Under virtual time, performance.now()/rAF AND the CSS transition clock all advance together, so
    //    every frame is genuinely rendered — no dropped or duplicated frames, fully reproducible. (The old
    //    Page.startScreencast path emitted frames at a low, variable headless rate — measured ~5 real fps —
    //    so an eased transition was captured in a few frames and looked stepped once padded up to 30fps.)
    const FPS = 30, stepMs = 1000 / FPS;
    await cdp.send("Emulation.setDeviceMetricsOverride",
      { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false }, sessionId);

    // Freeze time, then restart the timeline at t=0 from this frozen instant: reset() re-anchors the
    // engine's startClock to the current virtual now and play() schedules the rAF that the steps below
    // drive. The keyboard hint is a live-preview affordance (fades at 4.5s) — drop it so it isn't baked in.
    await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" }, sessionId);
    await evalJs("document.querySelector('.hint') && document.querySelector('.hint').remove(); reset(); play(); true");

    const n = Math.ceil(durationMs / stepMs) + 4;  // +tail so the close hold lands and TEASER_DONE flips
    for (let i = 0; i < n; i++) {
      // Generous per-step timeout: this is ~1000 sequential CDP round-trips and a shared/loaded box can
      // spike, so wait 60s before treating a step as a true hang (it normally returns in milliseconds).
      const expired = cdp.waitFor("Emulation.virtualTimeBudgetExpired", sessionId, 60000);
      await cdp.send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: stepMs }, sessionId);
      await expired;
      const shot = await cdp.send("Page.captureScreenshot",
        { format: "jpeg", quality: 92, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } }, sessionId);
      writeFileSync(join(framesDir, `f${String(i).padStart(6, "0")}.jpg`), Buffer.from(shot.data, "base64"));
    }

    // 5) eyes-free proof the engine actually drove the whole timeline (a frozen capture passes ffprobe)
    const activeSeg = await evalJs("document.querySelector('.seg.active') && document.querySelector('.seg.active').dataset.seg || ''");
    const done = await evalJs("window.TEASER_DONE === true");
    if (activeSeg !== "close" || !done) {
      throw new Error(`teaser did not reach the end under capture (active="${activeSeg}", done=${done}) — ` +
        `the timeline engine froze in headless; emitting no file`);
    }
    if (n < 2) throw new Error(`only ${n} frame(s) captured — nothing to encode`);
    console.log(`  captured ${n} frames at ${FPS}fps (virtual-time, deterministic); reached the close segment ✓`);

    // 6) encode: the frames are already exactly 1280×720 at a fixed 30fps cadence, so a straight
    //    constant-rate encode does it — no concat list, no per-frame durations, no padding (the
    //    deterministic capture removed all three workarounds the variable-rate screencast path needed).
    const silentMp4 = join(work, "video.mp4");
    execFileSync(ffmpeg, ["-y", "-framerate", String(FPS), "-i", join(framesDir, "f%06d.jpg"),
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", silentMp4],
      { stdio: ["ignore", "ignore", "inherit"] });

    // 7) if a voiceover is wired, mux it in (aligned at t=0 since the timeline is authored to the track)
    let finalMp4 = silentMp4;
    if (voSrc.startsWith("file://")) {
      const voPath = fileURLToPath(voSrc);
      if (existsSync(voPath)) {
        finalMp4 = join(work, "final.mp4");
        execFileSync(ffmpeg, ["-y", "-i", silentMp4, "-i", voPath, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
          "-shortest", "-movflags", "+faststart", finalMp4], { stdio: ["ignore", "ignore", "inherit"] });
        console.log(`  muxed voiceover: ${basename(voPath)}`);
      }
    }

    // 8) only now publish into dist/ (rename within tmp can cross devices → copy+unlink fallback)
    mkdirSync(dirname(outAbs), { recursive: true });
    try { renameSync(finalMp4, outAbs); } catch { copyFileSync(finalMp4, outAbs); }
    console.log(`Done → ${outAbs}`);
    return outAbs;
  } finally {
    try { cdp?.close(); } catch {}
    try { proc?.kill("SIGKILL"); } catch {}
    rmSync(work, { recursive: true, force: true });
  }
}

const [, , tplArg, outArg] = process.argv;
await record(tplArg, outArg);
