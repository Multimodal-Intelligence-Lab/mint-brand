"""MINT figure system — the per-paper layer for the MuSDeT example charts.

The brand-UNIVERSAL conventions (font, spines, grid, transparent SVG-as-paths) live in
../../figures/mint.mplstyle. This module supplies the two things that are paper-specific or
generation-time:

  • PALETTE — the MuSDeT accent slot, hand-mirrored from brand/colors.css --ref-musdet-*
    (REFERENCE ONLY — NOT the MINT brand; a paper's own accents). gold = our model (hero,
    reserved for MuSDeT), m1/m2/m3 = the three modalities, navy = this paper's ink (it matches
    poster.css --poster-ink, so the charts read as one with the poster body).

  • register_inter() — make Inter (the brand font) available to matplotlib *at generation time*.
    brand/fonts ships Inter as a variable woff2; matplotlib needs a .ttf, so we derive static
    instances (Regular 400, Bold 700, Italic 400) into a transient cache. Nothing is written into
    the repo — the derived ttf is a one-time tool input, exactly like the segno QR recipe. The
    rendered SVGs embed text as glyph PATHS (svg.fonttype: path), so no font is needed afterwards.

Usage in a plot script (same directory):
    import mint_figs
    mint_figs.apply()              # load the mplstyle + register Inter (warns loudly if it can't)
    C = mint_figs.PALETTE
    ...  color=C['gold'] ...
    fig.savefig(mint_figs.ASSETS / 'ablation_bars.svg')
"""
import os
import tempfile
import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

_HERE = Path(__file__).resolve().parent
_MPLSTYLE = _HERE.parent.parent / "figures" / "mint.mplstyle"   # posters/figures/mint.mplstyle
_BRAND_FONTS = _HERE.parent.parent.parent / "brand" / "fonts"   # mint/brand/fonts
ASSETS = _HERE.parent / "assets"                                # posters/examples/assets

# mirror of brand/colors.css --ref-musdet-* (REFERENCE ONLY — NOT brand; the MuSDeT paper's accents)
PALETTE = {
    "gold": "#efc500",  # MuSDeT — our model (hero colour, reserved for "ours")
    "navy": "#01122b",  # this paper's ink — matches poster.css --poster-ink
    "m1":   "#3b7dd8",  # modality 1 — multi-scale CNN encoder (ECG)
    "m2":   "#1a9e76",  # modality 2 — gated fusion (RESP)
    "m3":   "#e07b39",  # modality 3 — temporal head (EDA)
    "mute": "#888888",  # neutral grey — de-emphasised marks (error caps, side notes, baseline means)
    "mute_soft": "#c4c9cf",  # light neutral — de-emphasised fills (baseline dots vs our gold)
}


# ── Inter at generation time ────────────────────────────────────────────────────────────────
def _subfamily(weight, italic):
    if weight >= 700 and italic:
        return "Bold Italic"
    if weight >= 700:
        return "Bold"
    if italic:
        return "Italic"
    return "Regular"


def _restyle(ttf, family, weight, italic):
    """Force a clean, matplotlib-resolvable name table + weight/style bits on a static instance.
    Without this, fontTools' instancer can leave the bold instance under a name like
    'Inter Bold' that font.family='Inter'+bold won't match — the gotcha that breaks 1b."""
    sub = _subfamily(weight, italic)
    full = family if sub == "Regular" else f"{family} {sub}"
    ps = full.replace(" ", "-")
    name = ttf["name"]
    for nid, val in [(1, family), (2, sub), (4, full), (6, ps), (16, family), (17, sub)]:
        name.setName(val, nid, 3, 1, 0x409)   # Windows / Unicode BMP / en-US
        name.setName(val, nid, 1, 0, 0)        # Mac / Roman / en
    os2 = ttf["OS/2"]
    os2.usWeightClass = weight
    fs = os2.fsSelection & ~(0x01 | 0x20 | 0x40)   # clear ITALIC, BOLD, REGULAR
    head = ttf["head"]
    mac = head.macStyle & ~(0x01 | 0x02)
    if weight >= 700:
        fs |= 0x20
        mac |= 0x01
    if italic:
        fs |= 0x01
        mac |= 0x02
    if weight < 700 and not italic:
        fs |= 0x40
    os2.fsSelection = fs
    head.macStyle = mac


def _make_static(src_woff2, weight, italic, out_path):
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    f = TTFont(str(src_woff2))                 # decodes woff2 (needs brotli)
    if "fvar" in f:
        axes = {a.axisTag: a.defaultValue for a in f["fvar"].axes}
        axes["wght"] = weight                  # pin every axis; set weight → a clean static
        f = instantiateVariableFont(f, axes, inplace=False)
    _restyle(f, "Inter", weight, italic)
    f.flavor = None                            # write a plain .ttf, not woff2
    f.save(str(out_path))


_REGISTERED = None


def register_inter():
    """Derive + register static Inter faces. Idempotent. Returns True iff Inter resolves; warns
    loudly (Rule 12) and returns False if the woff2 is missing or bold doesn't land on Inter."""
    global _REGISTERED
    if _REGISTERED is not None:
        return _REGISTERED
    upright = _BRAND_FONTS / "inter-variable-latin.woff2"
    italic = _BRAND_FONTS / "inter-variable-latin-italic.woff2"
    if not upright.exists():
        warnings.warn(f"[mint_figs] Inter not found at {upright}; charts fall back to DejaVu Sans.")
        _REGISTERED = False
        return False
    cache = Path(tempfile.gettempdir()) / "mint-inter-cache"
    cache.mkdir(parents=True, exist_ok=True)
    specs = [
        (upright, 400, False, "Inter-Regular.ttf"),
        (upright, 700, False, "Inter-Bold.ttf"),
        (italic,  400, True,  "Inter-Italic.ttf"),
    ]
    for src, wght, ital, fn in specs:
        if not src.exists():
            continue
        out = cache / fn
        if not out.exists():
            _make_static(src, wght, ital, out)
        fm.fontManager.addfont(str(out))
    _REGISTERED = _verify()
    return _REGISTERED


def _verify():
    """Empirically confirm Inter resolves for the weights/styles the scripts actually use —
    especially bold, which the value labels and titles rely on."""
    ok = True
    for weight, style in [("normal", "normal"), ("bold", "normal"), ("normal", "italic")]:
        path = fm.findfont(fm.FontProperties(family="Inter", weight=weight, style=style),
                           fallback_to_default=False)
        if "Inter" not in os.path.basename(path):
            warnings.warn(f"[mint_figs] Inter {weight}/{style} resolved to "
                          f"{os.path.basename(path)}, not a registered Inter face — chart text "
                          f"may use a fallback.")
            ok = False
    return ok


def apply():
    """Load the universal mplstyle and register Inter. Call once at the top of a plot script."""
    plt.style.use(str(_MPLSTYLE))
    register_inter()
