import bpy, builtins, math, os
ns = {}; exec(open(os.path.join(os.path.dirname(bpy.data.filepath), '..', 'scripts', 'kw_blender.py')).read(), ns)
K = builtins.KW; M = K['M']
A = r'C:\Users\annisa 05\Documents\Proyekan\keyboardweb\assets'
H = 9.0; R = 15.0; T = 0.5   # room half-size, wall thickness

def wipe(col, prefix):
    for o in [o for o in list(col.all_objects) if o is not None and o.name.startswith(prefix)]: bpy.data.objects.remove(o, do_unlink=True)

def beams(col, n=5, y0=-12, y1=12, z=H - 0.6):
    for i in range(n):
        y = y0 + (y1 - y0) * i / (n - 1)
        K['box'](2 * R + 1, 0.32, 0.55, 'AR_beam', M('KW_Walnut'), col, (0, y, z))
    for x in (-R + 4, R - 4): K['box'](0.3, y1 - y0 + 2, 0.32, 'AR_purlin', M('KW_Walnut'), col, (x, (y0 + y1) / 2, z + 0.5))

def window_wall(col, name, x, y, w, rot, mullions=4, sill=1.2, top=H - 1.2, mat='KW_Window'):
    """A wall segment made of glass strips between plaster piers (a lit window wall)."""
    K['box'](w, T, sill, name + '_sill', M('KW_Plaster3'), col, (x, y, 0), (0, 0, rot))
    K['box'](w, T, H - top, name + '_head', M('KW_Plaster3'), col, (x, y, top), (0, 0, rot))
    K['box'](w, T * 0.4, top - sill, name + '_glass', M(mat), col, (x, y, sill), (0, 0, rot))
    c, s = math.cos(rot), math.sin(rot)
    for i in range(mullions + 1):
        u = -w / 2 + w * i / mullions
        K['box'](0.22, T + 0.1, top - sill, name + '_mullion', M('KW_BronzeDark'), col, (x + u * c, y + u * s, sill), (0, 0, rot))
    K['box'](w, T + 0.1, 0.25, name + '_transom', M('KW_BronzeDark'), col, (x, y, (sill + top) / 2), (0, 0, rot))

def arch_wall(col, name, x, y, w, rot, aw=6, ah=6):
    """A solid wall with an arched opening in the middle: two piers, a lintel, and a brass frame."""
    c, s = math.cos(rot), math.sin(rot)
    side = (w - aw) / 2
    for sg in (-1, 1):
        u = sg * (aw / 2 + side / 2)
        K['box'](side, T, H, name + '_pier', M('KW_Plaster3'), col, (x + u * c, y + u * s, 0), (0, 0, rot))
    K['box'](aw + 0.2, T, H - ah, name + '_lintel', M('KW_Plaster3'), col, (x, y, ah), (0, 0, rot))
    K['box'](aw + 0.6, T + 0.2, 0.3, name + '_frame_top', M('KW_WarmBrass'), col, (x, y, ah - 0.15), (0, 0, rot))
    for sg in (-1, 1):
        u = sg * (aw / 2 + 0.15)
        K['box'](0.3, T + 0.2, ah, name + '_frame_side', M('KW_WarmBrass'), col, (x + u * c, y + u * s, 0), (0, 0, rot))

def mezzanine(col, name, x, y0, y1, depth, z=4.6, stair_y=None):
    w = y1 - y0
    K['box'](depth, w, 0.35, name + '_deck', M('KW_Oak'), col, (x, (y0 + y1) / 2, z))
    K['box'](0.4, w, 0.5, name + '_edge', M('KW_BronzeDark'), col, (x + depth / 2 - 0.2, (y0 + y1) / 2, z - 0.15))
    n = int(w / 1.2)
    for i in range(n + 1):
        y = y0 + w * i / n
        K['box'](0.12, 0.12, 1.1, name + '_post', M('KW_BronzeDark'), col, (x + depth / 2 - 0.2, y, z + 0.35))
    K['box'](0.12, w, 0.12, name + '_rail', M('KW_WarmBrass'), col, (x + depth / 2 - 0.2, (y0 + y1) / 2, z + 1.4))
    for i in range(3):
        K['box'](depth, 0.5, 0.5, name + '_joist', M('KW_Walnut'), col, (x, y0 + w * (i + 0.5) / 3, z - 0.5))
    for cx in (y0 + 1, y1 - 1): K['box'](0.5, 0.5, z, name + '_col', M('KW_BronzeDark'), col, (x + depth / 2 - 0.5, cx, 0))
    if stair_y is not None:
        steps = 12; run = 0.9; rise = z / steps
        st, root = K['stairs'](name + '_stairs', 2.4, run, rise, steps, col, (x + depth / 2 + 1.4, stair_y + run * (steps - 1) / 2 + run / 2, 0), math.pi, None, 'KW_Oak', rail=False)
        for i in range(steps): pass
        # a brass handrail along the stair
        L = run * (steps - 1); Hh = rise * (steps - 1)
        K['cyl'](0.08, math.hypot(L, Hh) + run, name + '_hand', M('KW_WarmBrass'), col, (x + depth / 2 + 2.7, stair_y, rise + Hh / 2 + 1.0), (math.pi / 2 + math.atan2(Hh, L), 0, 0), 8, None, None, True, True)
    # things up on the deck
    K['box'](depth - 1.5, 1.2, 2.6, name + '_shelfup', M('KW_Walnut'), col, (x - 0.4, y0 + 2.5, z + 0.35))
    for i in range(3): K['box'](depth - 2.2, 0.15, 0.2, name + '_shelfup_b', M('KW_Oak'), col, (x - 0.4, y0 + 2.5 - 0.5, z + 0.9 + i * 0.7))
    K['plant'](name + '_plantup', col, (x + 0.6, y1 - 2.2, z + 0.35), 0.5)

def back_chamber(col, name, y0, y1, w=10, glow='KW_Window'):
    """A secondary space seen through the arch: a corridor that ends in a lit wall, with side shelves."""
    K['box'](w, y1 - y0, 0.2, name + '_floor', M('KW_Stone'), col, (0, (y0 + y1) / 2, 0))
    for sg in (-1, 1): K['box'](T, y1 - y0, H, name + '_wall', M('KW_Plaster2'), col, (sg * w / 2, (y0 + y1) / 2, 0))
    K['box'](w, T, H, name + '_end', M('KW_Plaster3'), col, (0, y1, 0))
    K['box'](w - 3, 0.2, 5.5, name + '_endglow', M(glow), col, (0, y1 - 0.3, 1.2))
    for sg in (-1, 1):
        for i in range(3): K['box'](0.3, y1 - y0 - 2, 0.15, name + '_shelf', M('KW_Oak'), col, (sg * (w / 2 - 0.5), (y0 + y1) / 2, 1.5 + i * 1.5))
    for i in range(2): K['cyl'](0.05, 2.0, name + '_cord', M('KW_Rubber'), col, (0, y0 + (y1 - y0) * (i + 1) / 3, H - 2.0), (0, 0, 0), 6); K['sph'](0.35, name + '_bulb', M('KW_Lamp'), col, (0, y0 + (y1 - y0) * (i + 1) / 3, H - 2.1), 10, 8)
    # roof over the chamber so it reads as a corridor, not a courtyard
    K['box'](w + 1, y1 - y0 + 1, 0.4, name + '_roof', M('KW_Walnut'), col, (0, (y0 + y1) / 2, H))

def door_frame(col, name, x, y, rot=0):
    for sg in (-1, 1): K['box'](0.45, 0.45, 7, name + '_post', M('KW_WarmBrass'), col, (x + sg * 2.4 * math.cos(rot), y + sg * 2.4 * math.sin(rot), 0))
    K['box'](5.4, 0.45, 0.45, name + '_head', M('KW_WarmBrass'), col, (x, y, 7), (0, 0, rot))
    K['box'](0.6, 0.6, 0.12, name + '_lamp', M('KW_Lamp'), col, (x, y, 6.85), (0, 0, rot))

# ================= W08 WORKSHOP =================
c8 = bpy.data.collections['W08_Workshop']
wipe(c8, 'AR_');
sh = c8.objects.get('shell')
if sh: bpy.data.objects.remove(sh, do_unlink=True)
# left: solid wall with a mezzanine and a stair; right: window wall; back: arch to a lit corridor
K['box'](T, 2 * R, H, 'AR_wall_left', M('KW_Plaster3'), c8, (-R, 0, 0))
mezzanine(c8, 'AR_mezz', -R + 3, -13, 3, 6, 4.6, stair_y=6.5)
window_wall(c8, 'AR_win_right', R, 0, 2 * R, math.pi / 2, mullions=6, sill=1.0, top=7.6)
arch_wall(c8, 'AR_back', 0, R, 2 * R, 0, aw=7, ah=6.2)
back_chamber(c8, 'AR_corr', R, R + 11, 7)
beams(c8, 4, -12, 12)
door_frame(c8, 'AR_front', -9, -R + 0.5)
K['plant']('AR_plant_f', c8, (-13, -13, 0), 0.9); K['plant']('AR_plant_f2', c8, (13.5, -13, 0), 0.7, None, 'KW_Awning2')
# pipes along the left wall and a small fuse box: exposed services
for z in (6.0, 6.6): K['cyl'](0.14, 2 * R - 2, 'AR_pipe', M('KW_Metal'), c8, (-R + 0.6, 0, z), (math.pi / 2, 0, 0), 8, None, None, True, True)
K['box'](0.3, 1.6, 2.0, 'AR_fusebox', M('KW_MatteCharcoal'), c8, (-R + 0.5, -10, 3.5)); K['box'](0.1, 0.3, 0.1, 'AR_fuseled', M('KW_Ember'), c8, (-R + 0.66, -10.4, 5.1))
objs8 = [o for o in list(c8.all_objects) if o is not None and o.type == 'MESH']

# ================= W09 NIGHT DESK =================
c9 = bpy.data.collections['W09_NightDesk']
wipe(c9, 'AR_')
sh = c9.objects.get('shell.001')
if sh: bpy.data.objects.remove(sh, do_unlink=True)
# back: a full glass wall onto the skyline; left: solid wall with a reading niche; right: partial wall + balcony door and balcony
window_wall(c9, 'AR_glass_back', 0, R, 2 * R, 0, mullions=8, sill=0.6, top=8.2, mat='KW_WarmGlass')
K['box'](T, 2 * R, H, 'AR_wall_left', M('KW_Plaster3'), c9, (-R, 0, 0))
K['box'](1.2, 6, 5.5, 'AR_niche', M('KW_Plaster2'), c9, (-R + 0.6, -2, 1.2))
for i in range(4): K['box'](1.0, 5.6, 0.12, 'AR_niche_shelf', M('KW_Oak'), c9, (-R + 0.7, -2, 1.6 + i * 1.3))
for i in range(14): K['box'](0.7, 0.35, 0.9 + (i * 7 % 5) * 0.12, 'AR_book', M(['KW_Awning1', 'KW_Awning2', 'KW_Cream', 'KW_BronzeDark'][i % 4]), c9, (-R + 0.7, -4.5 + i * 0.38, 1.72 + (i % 4) * 1.3))
K['box'](T, 2 * R - 8, H, 'AR_wall_right', M('KW_Plaster3'), c9, (R, -4, 0))
K['box'](T, 8, 2.0, 'AR_wall_right_head', M('KW_Plaster3'), c9, (R, 11, 7))
door_frame(c9, 'AR_balcony_door', R, 11, math.pi / 2)
K['box'](6, 9, 0.4, 'AR_balcony', M('KW_Stone'), c9, (R + 3, 11, 0))
K['railing']('AR_balcony_rail', 6, 9, c9, (R + 3, 11, 0.4), None, hgt=1.1, post=0.12)
K['plant']('AR_balcony_plant', c9, (R + 4.5, 14, 0.4), 0.7)
beams(c9, 4, -11, 11)
K['box'](0.5, 0.5, H, 'AR_column', M('KW_BronzeDark'), c9, (-4, -13, 0))
K['plant']('AR_plant_f', c9, (12, -13.5, 0), 0.8, None, 'KW_Awning2')
# a low partition behind the sofa with a strip light: layers the room
K['box'](9, 0.4, 3.2, 'AR_partition', M('KW_Plaster2'), c9, (-3, -5.2, 0))
K['box'](8.4, 0.1, 0.12, 'AR_partition_glow', M('KW_LineGlow'), c9, (-3, -5.45, 3.0))
objs9 = [o for o in list(c9.all_objects) if o is not None and o.type == 'MESH']

def lights_of(col):
    out = []
    for o in list(col.all_objects):
        if o is not None and o.type == 'EMPTY' and o.name.startswith('LT_'):
            p = {k: o[k] for k in o.keys()} if len(o.keys()) else {}
            out.append({'id': o.name[3:].split('.')[0], 'pos': K['web'](o.matrix_world.translation), 'hex': p.get('hex', '#ffd6a3'), 'intensity': float(p.get('intensity', 4.0)), 'distance': float(p.get('distance', 12.0))})
    return out
import json as _json
HS_SIZES = {'bench': [7.0, 4.0, 3.0], 'shelves': [2.6, 6.0, 20.0], 'sketches': [11.0, 6.0, 1.2], 'plants': [4.0, 3.0, 4.0], 'phone': [2.4, 1.6, 1.6], 'monitor': [3.0, 2.4, 2.0], 'window': [18.0, 5.0, 1.0], 'shelf': [2.6, 6.0, 6.0]}
def hs_of(col, oldpath):
    old = HS_SIZES
    out = []
    for o in list(col.all_objects):
        if o is not None and o.type == 'EMPTY' and o.name.startswith('HS_'):
            hid = o.name[3:].split('.')[0]
            out.append({'id': hid, 'pos': K['web'](o.matrix_world.translation), 'size': [float(v) for v in old.get(hid, [4, 3, 4])]})
    return out
r8 = K['export'](objs8, A + r'\world_08.json', {'hotspots': hs_of(c8, A + r'\world_08.json'), 'lights': lights_of(c8)}, q=100, group=lambda o: o.active_material.name if o.active_material else o.name)
r9 = K['export'](objs9, A + r'\world_09.json', {'hotspots': hs_of(c9, A + r'\world_09.json'), 'lights': lights_of(c9)}, q=100, group=lambda o: o.active_material.name if o.active_material else o.name)
bpy.ops.wm.save_mainfile()
result = {'w08': r8, 'w09': r9}
