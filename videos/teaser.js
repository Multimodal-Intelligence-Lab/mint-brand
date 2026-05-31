/* MINT videos — the teaser engine (dependency-free, adapted from slides/deck.js).
   The timed sibling of slides/deck.js: same fitStage() scaling of a fixed 1280×720 stage, but it
   re-adds the two things the talk deck dropped — a millisecond TIMELINE and a synced voiceover —
   driven by an auto-play clock.

   TIMELINE-FROM-DOM: instead of a hand-kept TIMELINE[] array, the timeline IS the markup.
   Every element with data-at="<ms>" is a cue; the engine scans them in document order, stable-sorts
   by time, and fires them on the clock. A cue that is a <section class="seg"> switches the active
   segment (and its band state); any other cue gets .is-in (its reveal). So adding/re-timing a beat is
   a local edit to one <section> — there is no central list to keep in sync.

   AUDIO-OPTIONAL: with no <audio> source the engine just plays the visual timeline. Add a source and
   it syncs the track to the clock (VO.currentTime = elapsed/1000) on play/seek. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const stage    = $("#stage");
const VO       = $("#vo");
const barTitle = $(".bar-title", stage);
const clockEl  = $(".clock", stage);

/* ---------------- stage scaling (identical to slides/deck.js, retargeted to #stage) ---------------- */
function fitStage() {
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform =
    `translate(${(window.innerWidth - 1280 * s) / 2}px,${(window.innerHeight - 720 * s) / 2}px) scale(${s})`;
}
window.addEventListener("resize", fitStage);

/* ---------------- the timeline, derived from the DOM ---------------- */
// Every [data-at] under the stage, in document order, stable-sorted by time (ties keep doc order, so a
// segment sorts before its own child cues at the same ms).
const cues = $$("[data-at]", stage)
  .map((el, i) => ({ el, at: +el.dataset.at || 0, i, isSeg: el.classList.contains("seg") }))
  .sort((a, b) => a.at - b.at || a.i - b.i);

const END_MS = (cues.length ? cues[cues.length - 1].at : 0) + 3000;   // last cue + a tail to hold the close
const firstSeg = cues.find((c) => c.isSeg);

// Exposed for record.mjs: how long to record, and a flag it can poll to stop exactly at the end.
window.TEASER_MS = END_MS;
window.TEASER_DONE = false;

const hasAudio = () =>
  !!(VO && (VO.currentSrc || VO.getAttribute("src") || VO.querySelector("source[src]")));

const fmt = (ms) => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/* ---------------- cue application ---------------- */
function setSeg(seg) {
  $$(".seg", stage).forEach((s) => s.classList.toggle("active", s === seg));
  stage.classList.remove("band-hero", "band-full", "band-compact");
  stage.classList.add("band-" + (seg.dataset.band || "full"));
  barTitle.textContent = seg.dataset.title || "";
}
function runCue(c) {
  if (c.isSeg) setSeg(c.el);
  else c.el.classList.add("is-in");
}

/* ---------------- driver ---------------- */
let ptr = 0, playing = false, startClock = 0, raf = 0;

// Instant (no-animation) rebuild to cue index n (exclusive) — used by reset and step-back so the
// timeline snaps to a state instead of replaying every transition.
function rebuildTo(n) {
  stage.classList.add("noanim");
  $$(".is-in", stage).forEach((el) => el.classList.remove("is-in"));
  if (firstSeg) setSeg(firstSeg.el);          // idle frame: first segment, nothing revealed yet
  for (let i = 0; i < n; i++) runCue(cues[i]);
  ptr = n;
  void stage.offsetWidth;                     // force reflow so the next transition starts clean
  stage.classList.remove("noanim");
}

function play() {
  if (playing) return;
  if (ptr >= cues.length) reset();            // played to the end → restart
  playing = true;
  const already = ptr > 0 ? cues[ptr - 1].at : 0;
  startClock = performance.now() - already;
  if (hasAudio()) { try { VO.currentTime = already / 1000; } catch {} VO.play().catch(() => {}); }
  const tick = () => {
    if (!playing) return;
    // Clock off performance.now(), NOT the rAF timestamp arg: they're equal in a live browser, but under
    // the headless renderer's virtual-time clock (record.mjs) the rAF timestamp runs ahead of real virtual
    // time, which would fire every cue ~2× early. performance.now() tracks virtual time exactly.
    const el = performance.now() - startClock;
    while (ptr < cues.length && cues[ptr].at <= el) { runCue(cues[ptr]); ptr++; }
    clockEl.textContent = fmt(el);
    if (el < END_MS) { raf = requestAnimationFrame(tick); }
    else { playing = false; window.TEASER_DONE = true; clockEl.textContent = fmt(END_MS); }
  };
  raf = requestAnimationFrame(tick);
}
function pause() { playing = false; if (raf) cancelAnimationFrame(raf); if (hasAudio()) VO.pause(); }
function reset() {
  pause();
  rebuildTo(0);
  if (VO) { try { VO.currentTime = 0; } catch {} }
  clockEl.textContent = "0:00";
  window.TEASER_DONE = false;
}
function next() { if (playing) pause(); if (ptr < cues.length) runCue(cues[ptr++]); }
function prev() { if (playing) pause(); rebuildTo(Math.max(0, ptr - 1)); }

/* ---------------- keys ---------------- */
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ": case "p": case "P": e.preventDefault(); playing ? pause() : play(); break;
    case "r": case "R": e.preventDefault(); reset(); play(); break;
    case "ArrowRight": case "PageDown": e.preventDefault(); next(); break;
    case "ArrowLeft":  case "PageUp":   e.preventDefault(); prev(); break;
    case "f": case "F": e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen(); break;
  }
});

/* ---------------- boot: fit, reset to the idle frame, then auto-play (no build, no click) ---------- */
fitStage();
reset();
play();
setTimeout(() => $(".hint")?.classList.add("gone"), 4500);
