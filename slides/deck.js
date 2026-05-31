/* MINT slides — the deck driver. Dependency-free, no library.
   - Scales the fixed 1280×720 stage to fit the viewport (the reveal_v4 fitStage approach).
   - Steps through slides; within a slide, reveals [data-frag] elements one-by-one before advancing.
   - Keyboard: → / Space / PageDown = next · ← / PageUp = prev · Home/End = first/last · F = fullscreen.
   No timeline, no audio — this is a talk deck, not the reveal_v4 timed teaser. */

const deck   = document.getElementById("deck");
const slides = [...document.querySelectorAll(".slide")];
const barTitle = document.querySelector(".bar-title");
const pageCur  = document.querySelector(".page .cur");
const pageTot  = document.querySelector(".page .total");

let si = 0;   // current slide index
let fi = 0;   // fragments revealed in the current slide

/* ---------------- stage scaling (from reveal_v4) ---------------- */
function fitStage() {
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  deck.style.transform =
    `translate(${(window.innerWidth - 1280 * s) / 2}px,` +
    `${(window.innerHeight - 720 * s) / 2}px) scale(${s})`;
}
window.addEventListener("resize", fitStage);

/* ---------------- slide / fragment state ---------------- */
const frags = (slide) => [...slide.querySelectorAll("[data-frag]")];

// Show slide `i`; `revealAll` reveals every fragment at once (used when stepping backward into a slide).
function show(i, revealAll) {
  si = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, k) => s.classList.toggle("active", k === si));
  // Full-bleed gold hero: hide the band while a .slide--title is showing (CSS #deck.title-active).
  deck.classList.toggle("title-active", slides[si].classList.contains("slide--title"));
  const f = frags(slides[si]);
  fi = revealAll ? f.length : 0;
  f.forEach((el, k) => el.classList.toggle("is-in", k < fi));
  if (barTitle) barTitle.textContent = slides[si].dataset.title || "";
  if (pageCur)  pageCur.textContent  = si + 1;
}

function next() {
  const f = frags(slides[si]);
  if (fi < f.length) { f[fi].classList.add("is-in"); fi++; }   // reveal next fragment
  else if (si < slides.length - 1) show(si + 1, false);        // else advance to next slide
}

function prev() {
  if (fi > 0) { fi--; frags(slides[si])[fi].classList.remove("is-in"); }  // hide last fragment
  else if (si > 0) show(si - 1, true);                                    // else back a slide, fully revealed
}

/* ---------------- keys ---------------- */
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ": case "ArrowRight": case "PageDown": e.preventDefault(); next(); break;
    case "ArrowLeft": case "PageUp": e.preventDefault(); prev(); break;
    case "Home": e.preventDefault(); show(0, false); break;
    case "End":  e.preventDefault(); show(slides.length - 1, true); break;
    case "f": case "F": e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
      break;
  }
});

// Advance/retreat by clicking too (left third = back, rest = forward) — handy when presenting without a keyboard.
deck.addEventListener("click", (e) => { (e.clientX < window.innerWidth / 3) ? prev() : next(); });

/* ---------------- boot ---------------- */
if (pageTot) pageTot.textContent = slides.length;
fitStage();
show(0, false);

// Fade the keyboard hint after a few seconds (reveal_v4-style: out of the way once you start).
const hint = document.querySelector(".hint");
if (hint) setTimeout(() => hint.classList.add("gone"), 4000);
