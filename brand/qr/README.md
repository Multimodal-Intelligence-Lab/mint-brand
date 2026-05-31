# MINT QR

`mint-lab-qr.svg` (scales — **use this by default**) and `mint-lab-qr.png` (490×490 raster
fallback). Both encode **https://github.com/Multimodal-Intelligence-Lab** — the lab's GitHub org.

Green modules on a **transparent** background (MINT deep green `#106f2f` = `--mint-green-deep`, the
lab's strong-accent green — darker than `--mint-green` for scan contrast), error-correction **H**
(30%). Transparent so it blends into whatever it sits on — the gold poster band, a white page —
matching the lab look. **Place it on a light surface only:** the green modules need a lighter
quiet zone around them to scan (gold and white both work — verified; a dark or busy background
will not). The 4-module quiet zone is baked in, so don't crop to the modules. If you re-tint or
move it onto an unusual surface, re-verify it scans first.

**Regenerate** (one-time tool — leaves only these two files, no `node_modules`):

```sh
pip install --target /tmp/qrtools segno
PYTHONPATH=/tmp/qrtools python3 -c 'import segno; q=segno.make("https://github.com/Multimodal-Intelligence-Lab", error="h"); [q.save(f"mint-lab-qr.{x}", scale=10, border=4, dark="#106f2f", light=None) for x in ("svg","png")]'
rm -rf /tmp/qrtools
```

`light=None` drops the background fill (transparent). Verified: both green artifacts decode back to
the exact URL composited on **gold and on white** (OpenCV round-trip, not just eyeballed).
