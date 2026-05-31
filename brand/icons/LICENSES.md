# Icon licenses

These icons are vendored (not authored by MINT Lab) and drawn with `currentColor`, so each one
takes the surrounding text color — brand them by setting CSS `color:` (or `fill`/`stroke`).

- **github.svg** — [simple-icons](https://simpleicons.org), CC0-1.0.
- **leaf.svg** — [Font Awesome Free](https://fontawesome.com) (`leaf`, solid), CC BY 4.0.
- **everything else** — [Lucide](https://lucide.dev), ISC License.

The link set (one per common lab-link type): `github` (code), `globe` (website), `mail` (contact),
`external-link` (outbound links), `graduation-cap` (Scholar / academic), `file-text` (paper /
PDF), `flask-conical` (research / lab).

`leaf.svg` is the odd one out: not a link icon but the lab's **M+leaf accent mark** (mint-green,
echoing the logo). It's `fill`-based (Font Awesome) where the link icons are `stroke`-based (Lucide).
Brand it with `var(--mint-green)`; print consumers inline it so the token color applies (an `<img>`
SVG can't inherit a CSS var). Canonical home for the mark — modules reference it, never re-draw it.
