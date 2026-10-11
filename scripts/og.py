# Share cards and icons for navygibran.dev, drawn from the same data the pages use (node scripts/site.js --og-data).
#   python scripts/og.py
# writes public/og.jpg (the site's card), public/site/og/<key>.jpg (one card per project, in its colours, with its screenshot),
# public/site/og/work.jpg (the archive's: its title and a wall of the screenshots),
# public/apple-touch-icon.png, public/favicon.ico, public/favicon.svg and public/site/icon-192.png, icon-512.png,
# icon-maskable-512.png. The mark everywhere is site/mark.svg (Navy's logo, traced: scripts/trace-mark.py).
# Needs Pillow. The fonts are in scripts/fonts (SIL Open Font License 1.1, licences beside them).
# The JPEGs stay under 260 kB: WhatsApp leaves a link without its picture when the image is much over 300 kB.
import colorsys, json, os, re, subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
FONTS = os.path.join(ROOT, 'scripts', 'fonts')
W, H = 1200, 630
BG = (14, 12, 9)
INK = (241, 234, 219)
ACC = (217, 160, 91)
ACC2 = (232, 185, 122)
COND, COND_SB, ITALIC = 'BarlowCondensed-Bold.ttf', 'BarlowCondensed-SemiBold.ttf', 'InstrumentSerif-Italic.ttf'


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def color(s):
    """'#17112b' or 'hsl(30 30% 11%)' (the two forms tint() in scripts/site.js gives) → an RGB tuple"""
    s = s.strip()
    if s.startswith('#'):
        s = s[1:]
        if len(s) == 3:
            s = ''.join(c * 2 for c in s)
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    m = re.match(r'hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)', s)
    if not m:
        raise ValueError(f'colour: {s}')
    r, g, b = colorsys.hls_to_rgb(float(m[1]) / 360, float(m[3]) / 100, float(m[2]) / 100)
    return (round(r * 255), round(g * 255), round(b * 255))


# Navy's mark: the two strokes of the N as traced from his own logo (site/mark.svg, made by scripts/trace-mark.py), as polygons
MARK_SVG = open(os.path.join(ROOT, 'site', 'mark.svg'), encoding='utf8').read()
MARK_POLYS = []
for _d in re.findall(r' d="([^"]+)"', MARK_SVG):
    _n = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', _d)]
    MARK_POLYS.append(list(zip(_n[0::2], _n[1::2])))


def mark(img, x, y, s, fill, bold=0):
    """the mark on img: (x, y) is where the viewBox's corner (150, 140) lands, s the scale of its 220 x 214 box. Drawn four times
    larger and brought down, so its edges are smooth at any size. bold (in the logo's units, its strokes are 16 wide) thickens it
    for the smallest icons, where the true weight would fade to a hairline"""
    k = 4 if 220 * s < 600 else 1
    ox, oy = int(x), int(y)
    w, h = int(220 * s) + 3, int(214 * s) + 3
    m = Image.new('L', (w * k, h * k), 0)
    dr = ImageDraw.Draw(m)
    for poly in MARK_POLYS:
        dr.polygon([(((px - 150) * s + x - ox) * k, ((py - 140) * s + y - oy) * k) for px, py in poly], fill=255)
    r = round(bold * s * k)
    if r:
        m = m.filter(ImageFilter.MaxFilter(2 * r + 1))
    if k > 1:
        m = m.resize((w, h), Image.LANCZOS)
    rgba = tuple(fill) + (255,) if len(fill) == 3 else tuple(fill)
    layer = Image.new('RGBA', (w, h), rgba[:3] + (0,))
    layer.putalpha(m.point(lambda v: v * rgba[3] // 255))
    if img.mode == 'RGBA':
        img.alpha_composite(layer, (ox, oy))
    else:
        img.paste(layer, (ox, oy), layer)


def favicon_svg(path):
    """public/favicon.svg: the mark in amber on a rounded square of the page's black (the tab icon of both sites)"""
    # (a tab shows it at 16 px: the mark fills more of the square and its outline is traced a little wider, so it stays legible)
    s = 64 * 0.7 / 220
    tx, ty = (64 - 220 * s) / 2 - 150 * s, (64 - 214 * s) / 2 - 140 * s
    paths = ''.join(f'<path d="{d}"/>' for d in re.findall(r' d="([^"]+)"', MARK_SVG))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0e0c09"/>'
           f'<g fill="#d9a05b" stroke="#d9a05b" stroke-width="5" stroke-linejoin="round" transform="translate({tx:.2f} {ty:.2f}) scale({s:.4f})">{paths}</g></svg>\n')
    open(path, 'w', encoding='utf8', newline='\n').write(svg)


def spaced(draw, x, y, text, f, fill, track):
    """letter-spaced capitals; returns where the text ends"""
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + track
    return x


def kicker(draw, x, y, text, fill, accent):
    """the site's label: spaced condensed capitals between italic brackets"""
    br = font(ITALIC, 40)
    draw.text((x, y - 14), '(', font=br, fill=accent)
    end = spaced(draw, x + 22, y, text.upper(), font(COND_SB, 19), fill, 3.2)
    draw.text((end + 8, y - 14), ')', font=br, fill=accent)


def wrap(draw, words, f, max_w):
    lines, cur = [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if not cur or draw.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def rounded(img, r):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), r, fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out


def drop_shadow(base, card, xy, blur=26, dy=22, alpha=160):
    a = card.split()[-1].point(lambda v: alpha if v else 0)
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    blk = Image.new('RGBA', card.size, (0, 0, 0, 255))
    blk.putalpha(a)
    sh.paste(blk, (xy[0], xy[1] + dy), blk)
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def save_jpg(img, path, q=88):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    rgb = img.convert('RGB')
    rgb.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
    while os.path.getsize(path) > 260_000 and q > 60:
        q -= 6
        rgb.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
    return os.path.getsize(path)


def site_card():
    """the site's own card: the desk on the right fading into the page black, the name, the line, the address"""
    card = Image.new('RGB', (W, H), BG)
    desk = Image.open(os.path.join(PUB, 'site/desk-wide.webp')).convert('RGB')
    dh = H + 40
    dw = round(desk.width * dh / desk.height)
    desk = desk.resize((dw, dh), Image.LANCZOS).crop((0, 20, dw, 20 + H))
    x0 = 210
    vis = min(dw, W - x0)
    desk = desk.crop((0, 0, vis, H))
    fade = Image.new('L', (vis, H), 255)
    fd = ImageDraw.Draw(fade)
    for i in range(520):
        fd.line([(i, 0), (i, H)], fill=round(255 * (i / 520) ** 1.7))
    card.paste(desk, (x0, 0), fade)
    shade = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        t = max(0, (y - H * 0.45) / (H * 0.55))
        sd.line([(0, y), (W, y)], fill=round(230 * t ** 1.3))
    card.paste(Image.new('RGB', (W, H), BG), (0, 0), shade)
    d = ImageDraw.Draw(card, 'RGBA')
    kicker(d, 72, 96, 'Full-stack developer  ·  Indonesia', (241, 234, 219, 185), ACC)
    big = font(COND, 178)
    d.text((64, 150), 'NAVY', font=big, fill=INK)
    d.text((64, 300), 'GIBRAN', font=big, fill=INK)
    d.text((70, 482), 'Make it work. Make them want it.', font=font(ITALIC, 54), fill=ACC2)
    spaced(d, 72, 566, 'NAVYGIBRAN.DEV', font(COND_SB, 20), (241, 234, 219, 150), 3)
    mark(card, W - 128, H - 112, 0.3, ACC)
    return card


def browser(shot_path, cw=700, max_h=430):
    """a screenshot in a browser frame: a dark top bar with three dots, the page cropped from the top"""
    shot = Image.open(os.path.join(PUB, shot_path)).convert('RGB')
    sh = round(shot.height * cw / shot.width)
    shot = shot.resize((cw, sh), Image.LANCZOS).crop((0, 0, cw, min(sh, max_h)))
    bar = 30
    frame = Image.new('RGB', (cw, shot.height + bar), (30, 26, 21))
    fd = ImageDraw.Draw(frame)
    for i, c in enumerate([(236, 106, 94), (236, 190, 92), (122, 196, 112)]):
        fd.ellipse((16 + i * 18, 10, 26 + i * 18, 20), fill=c)
    frame.paste(shot, (0, bar))
    return rounded(frame, 12)


def phone(shot_path, pw=150, max_h=300):
    ph = Image.open(os.path.join(PUB, shot_path)).convert('RGB')
    h = round(ph.height * pw / ph.width)
    ph = ph.resize((pw, h), Image.LANCZOS).crop((0, 0, pw, min(h, max_h)))
    body = Image.new('RGB', (pw + 12, ph.height + 12), (11, 9, 6))
    body.paste(ph, (6, 6))
    return rounded(body, 20)


def plate(p, bg, acc, w=700, h=440):
    """for a project without a screenshot: the site's plate, a grid and a glow, with the mark set large (the name is already
    on the card's left), and when it happened"""
    img = Image.new('RGBA', (w, h), tuple(max(0, c - 4) for c in bg) + (255,))
    d = ImageDraw.Draw(img, 'RGBA')
    for x in range(0, w, 48):
        d.line([(x, 0), (x, h)], fill=(241, 234, 219, 22))
    for y in range(0, h, 48):
        d.line([(0, y), (w, y)], fill=(241, 234, 219, 22))
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((w * 0.45, -h * 0.4, w * 1.3, h * 0.6), fill=acc + (70,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(70)))
    d = ImageDraw.Draw(img, 'RGBA')
    if p.get('date') and p['date'] != 'live':
        spaced(d, 32, h - 50, p['date'].upper(), font(COND_SB, 17), (241, 234, 219, 130), 2.6)
    s = h * 0.62 / 214
    mark(img, (w - 220 * s) / 2 + 40, (h - 214 * s) / 2, s, acc + (230,))
    return rounded(img, 12)


def project_card(p):
    bg, acc = color(p['bg']), color(p['acc'])
    img = Image.new('RGBA', (W, H), bg + (255,))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((640, -160, 1360, 520), fill=acc + (46,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(130)))
    # the picture on the right, running off the edge like the site's panels
    x0 = 560
    if p.get('cover'):
        frame = browser(p['cover'])
        y0 = round((H - frame.height) / 2) + 4
        drop_shadow(img, frame, (x0, y0))
        img.alpha_composite(frame, (x0, y0))
        if p.get('phone'):
            ph = phone(p['phone'])
            px, py = x0 + 430, min(H - ph.height - 18, y0 + frame.height - ph.height + 46)
            drop_shadow(img, ph, (px, py), blur=20, dy=16, alpha=190)
            img.alpha_composite(ph, (px, py))
    else:
        pl = plate(p, bg, acc)
        y0 = round((H - pl.height) / 2)
        drop_shadow(img, pl, (x0, y0))
        img.alpha_composite(pl, (x0, y0))
    d = ImageDraw.Draw(img, 'RGBA')
    kicker(d, 72, 96, f"Project {p['n']:02d} / {p['total']:02d}", (241, 234, 219, 185), acc)
    # the name: the largest size at which it fits the left column in three lines or fewer, with the industry under it
    industry = p['industry'] + (f", now {p['now']}" if p.get('now') else '')
    top, bottom, max_w = 146, 500, 452
    it = font(ITALIC, 42)
    ilines = wrap(d, industry.split(), it, max_w)
    for size in range(132, 50, -4):
        f = font(COND, size)
        lines = wrap(d, p['title'].upper().split(), f, max_w)
        if len(lines) > 3 or any(d.textlength(l, font=f) > max_w for l in lines):
            continue
        total = len(lines) * size * 0.88 + 16 + len(ilines) * 46
        if top + total <= bottom:
            break
    y = top
    for l in lines:
        d.text((66, y), l, font=f, fill=INK)
        y += size * 0.88
    y += 16
    for l in ilines:
        d.text((72, y), l, font=it, fill=acc)
        y += 46
    # the stack, then the address with the mark
    st = font(COND_SB, 17)
    stack = p['stack'].upper()
    while d.textlength(stack, font=st) + len(stack) * 2.2 > max_w and ' · ' in stack:
        stack = stack.rsplit(' · ', 1)[0]
    spaced(d, 72, 522, stack, st, (241, 234, 219, 150), 2.2)
    mark(img, 72, 560, 0.15, acc)
    spaced(d, 112, 566, 'NAVYGIBRAN.DEV', font(COND_SB, 20), (241, 234, 219, 165), 3)
    return img


def archive_card(data):
    """the archive's card (/work/): its title as the page sets it, and a wall of the projects' screenshots running off the right
    edge in staggered rows (the home page's rest of the street), fading into the page black behind the words"""
    card = Image.new('RGBA', (W, H), BG + (255,))
    # (the umbrella page for the client sites shows one of them: left out, so no site appears twice)
    covers = [p['cover'] for p in data if p.get('cover') and p['key'] != 'client-websites']
    tw, th, gap = 250, 125, 16
    wall = Image.new('RGBA', (3 * tw + 4 * gap + 140, 4 * th + 3 * gap), (0, 0, 0, 0))
    k = 0
    for row in range(4):
        for col in range(4):
            if not covers:
                break
            shot = Image.open(os.path.join(PUB, covers[k % len(covers)])).convert('RGB')
            k += 1
            sh = round(shot.height * tw / shot.width)
            shot = shot.resize((tw, sh), Image.LANCZOS).crop((0, 0, tw, min(sh, th)))
            if shot.height < th:
                shot = shot.resize((round(tw * th / shot.height), th), Image.LANCZOS).crop((0, 0, tw, th))
            wall.alpha_composite(rounded(shot, 8), ((row % 2) * 70 + col * (tw + gap) - (35 if row % 2 else 0), row * (th + gap)))
    x0, y0 = 500, round((H - wall.height) / 2)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(wall.crop((0, 0, min(wall.width, W - x0), wall.height)), (x0, y0))
    # the wall fades in from the words' side, and darkens a little overall so the screenshots stay a texture, not a collage
    fade = Image.new('L', (W, H), 0)
    fd = ImageDraw.Draw(fade)
    for x in range(W):
        t = min(1, max(0, (x - x0) / 360))
        fd.line([(x, 0), (x, H)], fill=round(205 * t ** 1.4))
    layer.putalpha(ImageChops.multiply(layer.split()[-1], fade))
    card.alpha_composite(layer)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((-260, -220, 560, 520), fill=ACC + (34,))
    card.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))
    d = ImageDraw.Draw(card, 'RGBA')
    kicker(d, 72, 96, 'Archive', (241, 234, 219, 185), ACC)
    d.text((64, 150), 'ALL THE', font=font(COND, 150), fill=INK)
    d.text((70, 286), 'work.', font=font(ITALIC, 168), fill=ACC2)
    # (the Client Websites hub has a card of its own but is not a project: `counted` is false on it)
    n = sum(1 for p in data if p.get('counted', True))
    spaced(d, 72, 486, f'{n} PROJECTS, EACH WITH ITS OWN PAGE', font(COND_SB, 19), (241, 234, 219, 170), 2.6)
    mark(card, 72, 560, 0.15, ACC)
    spaced(d, 112, 566, 'NAVYGIBRAN.DEV/WORK', font(COND_SB, 20), (241, 234, 219, 165), 3)
    return card


def icon(size, scale, path):
    """the mark in amber on the page black; drawn large, then scaled down for clean edges"""
    S = size * 4
    ic = Image.new('RGB', (S, S), BG)
    s = S * scale / 220
    mark(ic, (S - 220 * s) / 2, (S - 214 * s) / 2, s, ACC)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ic.resize((size, size), Image.LANCZOS).save(path, optimize=True)


def favicon(path):
    """public/favicon.ico, for whatever still asks for one: the pages' own icon (a rounded black square, the mark in amber) at
    48, 32 and 16 px, each drawn on its own"""
    def one(size):
        S = size * 8
        ic = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(ic)
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=round(S * 14 / 64), fill=BG)
        s = S * 0.7 / 220
        mark(ic, (S - 220 * s) / 2, (S - 214 * s) / 2, s, ACC, bold={16: 3.5, 32: 2.5}.get(size, 1.5))
        return ic.resize((size, size), Image.LANCZOS)
    big, mid, small = one(48), one(32), one(16)
    big.save(path, sizes=[(48, 48), (32, 32), (16, 16)], append_images=[mid, small])


if __name__ == '__main__':
    data = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'site.js'), '--og-data'], capture_output=True, text=True, encoding='utf8', check=True).stdout)
    print('og.jpg', save_jpg(site_card(), os.path.join(PUB, 'og.jpg')))
    for p in data:
        print(f"site/og/{p['key']}.jpg", save_jpg(project_card(p), os.path.join(PUB, 'site', 'og', p['key'] + '.jpg')))
    print('site/og/work.jpg', save_jpg(archive_card(data), os.path.join(PUB, 'site', 'og', 'work.jpg')))
    icon(180, 0.7, os.path.join(PUB, 'apple-touch-icon.png'))
    icon(192, 0.7, os.path.join(PUB, 'site', 'icon-192.png'))
    icon(512, 0.7, os.path.join(PUB, 'site', 'icon-512.png'))
    icon(512, 0.52, os.path.join(PUB, 'site', 'icon-maskable-512.png'))   # (inside the circle a maskable icon may be cut to)
    favicon(os.path.join(PUB, 'favicon.ico'))
    favicon_svg(os.path.join(PUB, 'favicon.svg'))
    print('icons ok')
