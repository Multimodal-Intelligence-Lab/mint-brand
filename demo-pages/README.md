# demo-pages

A responsive, brand-consistent **project / paper demo-page template** — the "project page" for a
publication. The lab identity is **standardized**: a fixed gold-band header (**SDSU │ MINT** lockup +
paper title + QR + blue corner triangle) and a matching footer — the same header as the deck, the
poster, and the README header. Everything between them is a **freeform skeleton you fill** with your
paper's content (abstract, approach, results, BibTeX, acknowledgements). Built fresh for the
screen so it reflows from phone to desktop.

![Standardized header band](screenshots/page.png)

The header band pins to the top on scroll (desktop), a scroll-to-top button appears once you scroll
down, and the whole page is dependency-free (no framework, no CDN). A single `--accent` variable drives
the web layer (links, buttons, section rules) — **blue** by default, **green** with one class — but it
never touches the gold band chrome, which stays brand-blue in both.

## Use it for your project

1. **Copy the template** — copy `page.html` to a new file in this folder, e.g. `my-paper.html` (copy it;
   don't edit `page.html` in place — it's the pristine skeleton).
2. **Edit only the marked block** — between `<!-- ↓↓↓ EDIT FOR YOUR PROJECT ↓↓↓ -->` and `↑↑↑`: title,
   authors, affiliation, the action buttons, abstract, approach, results, BibTeX,
   acknowledgements. **Leave the brand chrome alone** (the gold band, lockup, corner triangle, footer,
   scroll-to-top — all marked `do not edit`). That chrome is the standardized lab identity.
3. **(Optional) green accent** — add `class="accent-green"` to the `<body>` tag. That's the whole swap.
4. **Build a deployable copy:**
   ```bash
   node build.mjs my-paper.html my-project      # → dist/my-project/  (self-contained)
   ```
   This vendors the brand assets your page uses into `dist/my-project/brand/` and rewrites the
   `../brand/…` paths to local, then verifies the result is self-contained (no `../` escapes; every
   asset resolves). Needs this monorepo at build time (for `../brand/`); node built-ins only, no install.
5. **Deploy** — copy the whole `dist/my-project/` folder into your project's repo (e.g. as the GitHub
   Pages root). It needs nothing else. Copy the folder; don't hotlink across repos.

Want VCS-style interactivity (a playground, tabs, live widgets)? That goes in *your* content block — the
template keeps the chrome standard and stays dependency-free; the content zone is yours to extend.

`dist/` is generated, not committed — build it on demand (step 4). Full agent/build rules: `AGENTS.md`.
