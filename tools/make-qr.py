"""Regenerate web/assets/penguplay-qr.png.

The QR is derived from the bot URL rather than hand-saved, so the asset is
reproducible and stays on the site palette.
"""

import segno

BOT_URL = "https://t.me/PenguPlayBot"
OUT = "web/assets/penguplay-qr.png"

# Light tile with dark modules on purpose: several phone cameras will not read
# an inverted (light-on-dark) code, so the QR keeps its own pale background even
# when the page around it is dark. #12130F on #F7F6F0 measures 16.4:1.
qr = segno.make(BOT_URL, error="q")
qr.save(OUT, scale=12, border=4, dark="#12130F", light="#F7F6F0")

width, height = qr.symbol_size(border=4)
print(f"encoded : {BOT_URL}")
print(f"symbol  : {qr.designator} (version + error level)")
print(f"modules : {qr.symbol_size(border=0)[0]} across, quiet zone 4 on each side")
print(f"png     : {OUT} at {width * 12} x {height * 12} px")
