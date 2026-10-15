# Share cards and icons for navygibran.dev, drawn from the same data the pages use (node scripts/site.js --og-data).
#   python scripts/og.py          the English cards and the icons
#   python scripts/og.py id zh    the same cards in Indonesian and Chinese: public/og-id.jpg, site/og/<key>-id.jpg, work-id.jpg...
#                                 (a page in that language shares its own card: scripts/site.js head() picks it when it exists;
#                                 the Chinese words are set in Microsoft YaHei, the site's own faces having no Han)
#   python scripts/og.py cv       only the CV's three cards: public/site/og/cv.jpg, cv-id.jpg, cv-zh.jpg (words from
#                                 node scripts/site.js --og-cv; the full runs above draw them too, each in its languages)
# writes public/og.jpg (the site's card), public/site/og/<key>.jpg (one card per project, in its colours, with its screenshot),
# public/site/og/work.jpg (the archive's: its title and a wall of the screenshots),
# public/apple-touch-icon.png, public/favicon.ico, public/favicon.svg and public/site/icon-192.png, icon-512.png,
# icon-maskable-512.png. The mark everywhere is site/mark.svg (Navy's logo, traced: scripts/trace-mark.py).
# Needs Pillow. The fonts are in scripts/fonts (SIL Open Font License 1.1, licences beside them).
# The JPEGs stay under 260 kB: WhatsApp leaves a link without its picture when the image is much over 300 kB.
import colorsys, json, os, re, subprocess, sys
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


CJK = re.compile(r'[\u3000-\u9fff\uff00-\uffef]')
CJK_FACE = {True: 'C:/Windows/Fonts/msyhbd.ttc', False: 'C:/Windows/Fonts/msyh.ttc'}


def tfont(name, size, text):
    """the face for this text: the site's own, or a Chinese one when the text has Han in it (bold for the condensed capitals,
    regular for the italic; a little smaller, YaHei being wider than Barlow Condensed)"""
    if CJK.search(text or '') and os.path.exists(CJK_FACE[True]):
        return ImageFont.truetype(CJK_FACE[name != ITALIC], max(12, round(size * 0.8)))
    return font(name, size)


def words_of(text):
    """the pieces a line can break between: words, or each character of a Chinese line (which has no spaces)"""
    return list(text) if CJK.search(text) and ' ' not in text.strip() else text.split()


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
    end = spaced(draw, x + 22, y, text.upper(), tfont(COND_SB, 19, text), fill, 3.2)
    draw.text((end + 8, y - 14), ')', font=br, fill=accent)


def wrap(draw, words, f, max_w, sep=' '):
    lines, cur = [], ''
    for w in words:
        t = (cur + sep + w).strip()
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


def site_card(ui=None):
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
    kicker(d, 72, 96, f"{ui['role']}  ·  {ui['country']}" if ui else 'Full-stack developer  ·  Indonesia', (241, 234, 219, 185), ACC)
    big = font(COND, 178)
    d.text((64, 150), 'NAVY', font=big, fill=INK)
    d.text((64, 300), 'GIBRAN', font=big, fill=INK)
    motto = ui['motto'] if ui else 'Make it work. Make them want it.'
    d.text((70, 482), motto, font=tfont(ITALIC, 54, motto), fill=ACC2)
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


def project_card(p, ui=None):
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
    kicker(d, 72, 96, f"{ui['project'] if ui else 'Project'} {p['n']:02d} / {p['total']:02d}" if p['counted'] else (ui['every'] if ui else 'Every client site'), (241, 234, 219, 185), acc)
    # the name: the largest size at which it fits the left column in three lines or fewer, with the industry under it
    industry = p['industry'] + (p.get('nowLine') or (f", now {p['now']}" if p.get('now') else ''))
    top, bottom, max_w = 146, 500, 452
    it = tfont(ITALIC, 42, industry)
    ilines = wrap(d, words_of(industry), it, max_w, '' if CJK.search(industry) and ' ' not in industry.strip() else ' ')
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


def archive_card(data, ui=None):
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
    kicker(d, 72, 96, ui['archive'] if ui else 'Archive', (241, 234, 219, 185), ACC)
    all_the, work_em = (ui['allThe'].upper(), ui['workEm']) if ui else ('ALL THE', 'work.')
    d.text((64, 150), all_the, font=tfont(COND, 150, all_the), fill=INK)
    d.text((70, 286), work_em, font=tfont(ITALIC, 168, work_em), fill=ACC2)
    # (the Client Websites hub has a card of its own but is not a project: `counted` is false on it)
    n = sum(1 for p in data if p.get('counted', True))
    line = ui['count'].upper() if ui else f'{n} PROJECTS, EACH WITH ITS OWN PAGE'
    spaced(d, 72, 486, line, tfont(COND_SB, 19, line), (241, 234, 219, 170), 2.6)
    mark(card, 72, 560, 0.15, ACC)
    spaced(d, 112, 566, 'NAVYGIBRAN.DEV/WORK', font(COND_SB, 20), (241, 234, 219, 165), 3)
    return card


def paper(c):
    """the CV as a sheet of paper, in its own layout but without words beyond the name (any smaller would be a blur): the head
    with its chips, the column of experience, education and projects, the narrow one of contact and skills"""
    pw, ph = 380, 537
    # (drawn opaque so the translucent greys blend into the paper; made RGBA at the end, for the turn)
    sheet = Image.new('RGB', (pw, ph), (247, 243, 234))
    d = ImageDraw.Draw(sheet, 'RGBA')
    ink, grey, amber = (23, 18, 12, 255), (23, 18, 12, 64), (143, 84, 24, 255)
    d.text((32, 26), 'NAVY GIBRAN', font=font(COND, 46), fill=ink)
    spaced(d, 33, 84, f"{c['role']} · {c['country']}".upper(), tfont(COND_SB, 10, c['role']), (23, 18, 12, 150), 1.4)
    x = 32
    for w in (96, 60, 80, 74):
        d.rounded_rectangle((x, 104, x + w, 121), 9, outline=(23, 18, 12, 120), width=1)
        x += w + 6
    def label(x0, x1, y, w):
        d.rectangle((x0, y, x0 + w, y + 5), fill=amber)
        d.line([(x0, y + 13), (x1, y + 13)], fill=(23, 18, 12, 40), width=1)
        return y + 24
    def entry(x0, y, title, lines, date=True):
        if date:
            d.rectangle((x0, y + 1, x0 + 30, y + 5), fill=(23, 18, 12, 90))
        tx = x0 + (42 if date else 0)
        d.rectangle((tx, y, tx + title, y + 7), fill=ink)
        for i, w in enumerate(lines):
            d.rectangle((tx, y + 14 + i * 10, tx + w, y + 18 + i * 10), fill=grey)
        return y + 26 + len(lines) * 10
    # the wide column: experience, education, selected projects
    y = label(32, 226, 146, 58)
    for t, ls in ((92, (140, 118)), (118, (136, 96)), (74, (128,)), (96, (110,))):
        y = entry(32, y, t, ls)
    y = label(32, 226, y + 6, 52)
    for t, ls in ((104, (140, 120)), (128, (86,))):
        y = entry(32, y, t, ls)
    y = label(32, 226, y + 6, 66)
    for t, ls in ((62, (190, 150)), (70, (182, 120)), (84, (170,))):
        y = entry(32, y, t, ls, date=False)
    # the narrow column: contact, skills (the most used in bold), spoken languages
    y = label(246, 348, 146, 40)
    for w in (92, 70, 102, 84, 64):
        d.rectangle((246, y, 246 + w, y + 4), fill=(23, 18, 12, 110))
        y += 11
    y = label(246, 348, y + 8, 30)
    for bold, light in ((52, 40), (44, 46), (38, 52), (58, 30), (0, 86), (0, 70), (0, 92)):
        d.rectangle((246, y, 246 + 34, y + 3), fill=(23, 18, 12, 120))
        if bold:
            d.rectangle((246, y + 8, 246 + bold, y + 13), fill=ink)
        d.rectangle((246 + bold + (5 if bold else 0), y + 9, 246 + bold + (5 if bold else 0) + light, y + 12), fill=grey)
        y += 22
    y = label(246, 348, y + 6, 58)
    for w in (98, 76):
        d.rectangle((246, y, 246 + w, y + 4), fill=grey)
        y += 10
    return sheet.convert('RGBA')


def cv_card(c):
    """the CV's card (/cv/): the name, the role and the CV's own facts on the left, the sheet itself on the right, tilted, on the
    page black with the amber glow"""
    card = Image.new('RGBA', (W, H), BG + (255,))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((-260, -220, 560, 520), fill=ACC + (34,))
    ImageDraw.Draw(glow).ellipse((700, 160, 1360, 820), fill=ACC + (26,))
    card.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))
    sheet = paper(c).rotate(-5, resample=Image.BICUBIC, expand=True)
    sx, sy = 742, 38
    drop_shadow(card, sheet, (sx, sy), blur=30, dy=26, alpha=190)
    card.alpha_composite(sheet, (sx, sy))
    d = ImageDraw.Draw(card, 'RGBA')
    kicker(d, 72, 96, c['kick'], (241, 234, 219, 185), ACC)
    big = font(COND, 150)
    d.text((64, 136), 'NAVY', font=big, fill=INK)
    d.text((64, 262), 'GIBRAN', font=big, fill=INK)
    line = f"{c['role']}, {c['country']}" if not CJK.search(c['role']) else f"{c['role']} · {c['country']}"
    d.text((70, 404), line, font=tfont(ITALIC, 46, line), fill=ACC2)
    # the facts as the CV's chips: outlined pills in spaced capitals, two rows at most within the left column
    x, y, max_x, ph_ = 72, 468, 680, 36
    for f in c['facts']:
        txt = f.upper()
        tf = tfont(COND_SB, 16, txt)
        tw = sum(d.textlength(ch, font=tf) for ch in txt) + 1.8 * (len(txt) - 1)
        w = round(tw + 32)
        if x + w > max_x and x > 72:
            x, y = 72, y + ph_ + 8
        d.rounded_rectangle((x, y, x + w, y + ph_), ph_ // 2, outline=(241, 234, 219, 95), width=2)
        spaced(d, x + 16, y + (8 if not CJK.search(txt) else 7), txt, tf, (241, 234, 219, 215), 1.8)
        x += w + 10
    mark(card, 72, 572, 0.15, ACC)
    spaced(d, 112, 578, c['url'], font(COND_SB, 20), (241, 234, 219, 165), 3)
    return card


def cv_cards(langs):
    out = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'site.js'), '--og-cv'], capture_output=True, text=True, encoding='utf8', check=True).stdout)
    for lang in langs:
        name = 'cv.jpg' if lang == 'en' else f'cv-{lang}.jpg'
        print(f'site/og/{name}', save_jpg(cv_card(out[lang]), os.path.join(PUB, 'site', 'og', name)))


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
    if 'cv' in sys.argv[1:]:   # python scripts/og.py cv → only the CV's three cards
        cv_cards(['en', 'id', 'zh'])
        sys.exit(0)
    langs = [a for a in sys.argv[1:] if a in ('id', 'zh')]
    if langs:
        cv_cards(langs)
    for lang in langs:
        out = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'site.js'), '--og-data', lang], capture_output=True, text=True, encoding='utf8', check=True).stdout)
        ui, data = out['ui'], out['projects']
        print(f'og-{lang}.jpg', save_jpg(site_card(ui), os.path.join(PUB, f'og-{lang}.jpg')))
        for p in data:
            print(f"site/og/{p['key']}-{lang}.jpg", save_jpg(project_card(p, ui), os.path.join(PUB, 'site', 'og', f"{p['key']}-{lang}.jpg")))
        print(f'site/og/work-{lang}.jpg', save_jpg(archive_card(data, ui), os.path.join(PUB, 'site', 'og', f'work-{lang}.jpg')))
    if langs:
        sys.exit(0)
    data = json.loads(subprocess.run(['node', os.path.join(ROOT, 'scripts', 'site.js'), '--og-data'], capture_output=True, text=True, encoding='utf8', check=True).stdout)
    print('og.jpg', save_jpg(site_card(), os.path.join(PUB, 'og.jpg')))
    for p in data:
        print(f"site/og/{p['key']}.jpg", save_jpg(project_card(p), os.path.join(PUB, 'site', 'og', p['key'] + '.jpg')))
    print('site/og/work.jpg', save_jpg(archive_card(data), os.path.join(PUB, 'site', 'og', 'work.jpg')))
    cv_cards(['en'])
    icon(180, 0.7, os.path.join(PUB, 'apple-touch-icon.png'))
    icon(192, 0.7, os.path.join(PUB, 'site', 'icon-192.png'))
    icon(512, 0.7, os.path.join(PUB, 'site', 'icon-512.png'))
    icon(512, 0.52, os.path.join(PUB, 'site', 'icon-maskable-512.png'))   # (inside the circle a maskable icon may be cut to)
    favicon(os.path.join(PUB, 'favicon.ico'))
    favicon_svg(os.path.join(PUB, 'favicon.svg'))
    print('icons ok')
