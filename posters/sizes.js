// MINT posters — the size catalog. Single source of truth for every poster dimension.
// build.mjs reads this and injects each size as a literal @page block (see build.mjs).
//   w, h   physical dimensions in `unit`
//   unit   "in" or "mm" — emitted verbatim into `@page { size: … }` (CSS understands both)
//   cols   number of newspaper columns the body flows into (poster.css: column-count)
//   trifold true → add fold-line guides at 1/3 and 2/3 (tabletop display); folds coincide with
//          the 3 column gaps, so `break-inside: avoid` already keeps sections off the creases.
//
// Dimensions are width × height as the poster hangs. Portrait entries have h > w.

export const SIZES = {
  "30x40":         { w: 30,  h: 40,   unit: "in", cols: 2, trifold: false }, // portrait
  "40x30":         { w: 40,  h: 30,   unit: "in", cols: 3, trifold: false },
  "48x36":         { w: 48,  h: 36,   unit: "in", cols: 3, trifold: false }, // the common default
  "48x36-trifold": { w: 48,  h: 36,   unit: "in", cols: 3, trifold: true  }, // tabletop trifold
  "56x36":         { w: 56,  h: 36,   unit: "in", cols: 4, trifold: false },
  "44x44":         { w: 44,  h: 44,   unit: "in", cols: 3, trifold: false }, // square
  "48x48":         { w: 48,  h: 48,   unit: "in", cols: 3, trifold: false }, // square
  "A0":            { w: 841, h: 1189, unit: "mm", cols: 2, trifold: false }, // ISO A0, portrait

  // Regression size — NOT a template default. Matches the original LaTeX poster
  // (cvpr-poster-template/musdet-cvpr-poster.pdf, 42×21 in) so examples/musdet.html can be
  // rendered and compared 1:1. Excluded from the default "build all" set (see build.mjs).
  "42x21":         { w: 42,  h: 21,   unit: "in", cols: 3, trifold: false, regression: true },
};
