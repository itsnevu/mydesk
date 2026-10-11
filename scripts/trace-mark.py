# Navy's mark as a vector, traced from the logo he publishes (itsnevu.xyz/logo.png, 512 x 512, the N in its alpha channel).
#   python scripts/trace-mark.py path/to/logo.png
# Writes site/mark.svg: the two strokes of the N as filled outlines, in the logo's own coordinates (the viewBox the pages use,
# 150 140 220 214, frames them). The edge is found where the logo's alpha crosses one half, between pixels (its anti-aliasing
# places it to a fraction of a pixel), then each outline is thinned to the points that matter. Needs Pillow and numpy.
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X0, Y0, W, H = 150, 140, 220, 214          # the viewBox
LEVEL, TOL, BLUR = 0.5, 0.3, 1.2            # where the edge is (alpha), how far a thinned outline may stray, the blur (px)

# (the logo's alpha is all but on or off, so a slanted edge is a staircase of whole pixels: a slight blur first turns it back into
#  the straight line it was drawn as, and keeps the strokes as wide as they are; corners round by about a pixel)
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA').getchannel('A').filter(ImageFilter.GaussianBlur(BLUR))).astype(float) / 255
g = a[Y0:Y0 + H + 1, X0:X0 + W + 1]
assert g[0, :].max() < LEVEL and g[-1, :].max() < LEVEL and g[:, 0].max() < LEVEL and g[:, -1].max() < LEVEL, 'the mark touches the frame'

# marching squares: each cell between four pixels gives up to two pieces of edge; an edge point is named by the cell side it
# lies on, so neighbouring cells share it
def point(key):
    kind, x, y = key
    if kind == 'h':   # between (x, y) and (x + 1, y)
        v0, v1 = g[y, x], g[y, x + 1]
        return (x + (LEVEL - v0) / (v1 - v0), y)
    v0, v1 = g[y, x], g[y + 1, x]   # between (x, y) and (x, y + 1)
    return (x, y + (LEVEL - v0) / (v1 - v0))

links = {}
def link(p, q):
    links.setdefault(p, []).append(q); links.setdefault(q, []).append(p)

for y in range(H):
    for x in range(W):
        tl, tr, br, bl = g[y, x] >= LEVEL, g[y, x + 1] >= LEVEL, g[y + 1, x + 1] >= LEVEL, g[y + 1, x] >= LEVEL
        case = tl * 8 + tr * 4 + br * 2 + bl
        if case in (0, 15):
            continue
        T, R, B, L = ('h', x, y), ('v', x + 1, y), ('h', x, y + 1), ('v', x, y)
        if case in (5, 10):   # a saddle: the middle decides whether the two inside corners join across the cell
            mid = (g[y, x] + g[y, x + 1] + g[y + 1, x + 1] + g[y + 1, x]) / 4 >= LEVEL
            cut_tl_br = [(T, L), (R, B)]   # the edge cuts off the top-left and bottom-right corners
            cut_tr_bl = [(T, R), (B, L)]   # ... or the top-right and bottom-left ones
            # case 5 (top-right and bottom-left inside): joined across the middle, the outside corners are cut off
            pairs = (cut_tl_br if mid else cut_tr_bl) if case == 5 else (cut_tr_bl if mid else cut_tl_br)
        else:
            edges = [e for e, on in ((T, tl != tr), (R, tr != br), (B, br != bl), (L, bl != tl)) if on]
            pairs = [tuple(edges)]
        for p, q in pairs:
            link(p, q)

# walk the links into closed outlines
loops, seen = [], set()
for start in links:
    if start in seen:
        continue
    loop, prev, cur = [start], None, start
    seen.add(start)
    while True:
        nxt = [n for n in links[cur] if n != prev]
        if not nxt:
            break
        prev, cur = cur, nxt[0]
        if cur == start:
            break
        loop.append(cur); seen.add(cur)
    loops.append([point(k) for k in loop])
loops = [l for l in loops if len(l) > 20]
assert len(loops) == 2, f'expected the two strokes, found {len(loops)} outlines'

def thin(pts):
    """Douglas-Peucker on a closed outline: split at the two points farthest apart, thin each half"""
    def dp(seg):
        if len(seg) < 3:
            return seg
        (x1, y1), (x2, y2) = seg[0], seg[-1]
        dx, dy = x2 - x1, y2 - y1
        n = (dx * dx + dy * dy) ** 0.5 or 1e-9
        d = [abs(dy * (x - x1) - dx * (y - y1)) / n for x, y in seg[1:-1]]
        i = int(np.argmax(d)) + 1
        if d[i - 1] <= TOL:
            return [seg[0], seg[-1]]
        return dp(seg[:i + 1])[:-1] + dp(seg[i:])
    p = np.array(pts)
    i = 0
    j = int(np.argmax(((p - p[i]) ** 2).sum(1)))
    i = int(np.argmax(((p - p[j]) ** 2).sum(1)))
    i, j = min(i, j), max(i, j)
    a1 = pts[i:j + 1]
    a2 = pts[j:] + pts[:i + 1]
    return dp(a1)[:-1] + dp(a2)[:-1]

# the strokes in reading order: the left one (with the apex) first
loops.sort(key=lambda l: min(x for x, _ in l))
paths = []
for l in loops:
    t = thin(l)
    # (a pixel's value belongs to its middle, half a pixel in from its corner)
    d = 'M' + ' '.join(f'{X0 + x + 0.5:.1f} {Y0 + y + 0.5:.1f}' for x, y in t) + 'Z'
    paths.append(d.replace('.0 ', ' ').replace('.0Z', 'Z'))
    print(f'outline: {len(l)} points, thinned to {len(t)}')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0} {Y0} {W} {H}">'
       + ''.join(f'<path d="{d}"/>' for d in paths) + '</svg>\n')
out = os.path.join(ROOT, 'site', 'mark.svg')
open(out, 'w', encoding='utf8', newline='\n').write(svg)
print(f'site/mark.svg  {len(svg)} bytes')
