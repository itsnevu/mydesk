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

# The profile home draws its logos only as masks (their alpha), at most about 40 px tall: public/site/logos/<name>-mask.webp keeps
# the alpha alone, fit inside 384 x 120 (three times what it draws and more), written only when that is smaller than the original.
# /full/ and the desk draw the originals, larger, so they stay.
LOGOS = os.path.join(PUB, 'site', 'logos')
lm = lk = 0
for f in sorted(glob.glob(os.path.join(LOGOS, '*.webp'))):
    if f.endswith('-mask.webp'):
        continue
    out = f[:-5] + '-mask.webp'
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        lk += 1
        continue
    im = Image.open(f).convert('RGBA')
    a = im.getchannel('A')
    s = min(1, 384 / im.width, 120 / im.height)
    if s < 1:
        a = a.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    black = Image.new('L', a.size, 0)
    Image.merge('RGBA', (black, black, black, a)).save(out, 'WEBP', quality=80, method=6)
    if os.path.getsize(out) >= os.path.getsize(f):
        os.remove(out)
        continue
    lm += 1
    print(f"{os.path.relpath(out, PUB)}  {os.path.getsize(f) // 1024} kB -> {os.path.getsize(out) // 1024} kB")
print(f'logo masks: {lm} written, {lk} already current')
