# Smaller copies of the portfolio's wide pictures, for phones and small screens (the pages offer both through srcset).
#   python scripts/thumbs.py
# For every screenshot in public/shots and public/shots/gallery and every desk render in public/site (desk-*.webp) wider than
# 900 px, writes <name>-800.webp beside it, 800 px wide. A copy newer than its original is left alone. Phone screenshots
# (<name>-m.webp) are narrow already and are skipped. Needs Pillow.
import glob, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
W = 800

files = sorted(glob.glob(os.path.join(PUB, 'shots', '*.webp')) + glob.glob(os.path.join(PUB, 'shots', 'gallery', '*.webp')) + glob.glob(os.path.join(PUB, 'site', 'desk-*.webp')))
made = kept = 0
for f in files:
    name = os.path.basename(f)
    if name.endswith(f'-{W}.webp') or name.endswith('-m.webp'):
        continue
    out = f[:-5] + f'-{W}.webp'
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        kept += 1
        continue
    im = Image.open(f)
    if im.width <= 900:
        continue
    im = im.convert('RGB')
    im.resize((W, round(im.height * W / im.width)), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
    made += 1
    print(f"{os.path.relpath(out, PUB)}  {os.path.getsize(f) // 1024} kB -> {os.path.getsize(out) // 1024} kB")
print(f'thumbs: {made} written, {kept} already current')
