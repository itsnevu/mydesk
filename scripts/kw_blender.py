import bpy, bmesh, json, base64, struct, math, builtins
from mathutils import Vector, Matrix, Euler

KW = {}

def col(name, parent=None):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c

def mat(name, color=None, rough=0.5, metal=0.0, emis=None, estr=0.0, alpha=1.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    if emis: p.inputs['Emission Color'].default_value = (*emis, 1); p.inputs['Emission Strength'].default_value = estr
    p.inputs['Alpha'].default_value = alpha
    if alpha < 1: m.blend_method = 'BLEND'
    return m

def srgb(hexs):
    h = hexs.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b))

def M(name): return bpy.data.materials[name]

def _finish(bm, name, material, collection, loc, rot, smooth, parent, scale=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    if scale: o.scale = scale
    if material: me.materials.append(material)
    collection.objects.link(o)
    if parent: o.parent = parent
    return o

def box(w, d, h, name, material, collection, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, center=False, bev=0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    if not center: bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    if bev > 0: bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=min(bev, min(w, d, h) * 0.45), segments=2, affect='EDGES')
    return _finish(bm, name, material, collection, loc, rot, False, parent)

def cyl(r, h, name, material, collection, loc=(0, 0, 0), rot=(0, 0, 0), seg=16, r2=None, parent=None, smooth=True, center=False):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    if not center: bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    return _finish(bm, name, material, collection, loc, rot, smooth, parent)

def cone(r, h, name, material, collection, loc=(0, 0, 0), rot=(0, 0, 0), seg=12, parent=None, smooth=False):
    return cyl(r, h, name, material, collection, loc, rot, seg, 0.0, parent, smooth)

def sph(r, name, material, collection, loc=(0, 0, 0), seg=12, rings=8, parent=None, scale=None, smooth=True):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    return _finish(bm, name, material, collection, loc, (0, 0, 0), smooth, parent, scale)

def prism(w, d, h, name, material, collection, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    # gable roof / wedge: ridge along x
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in [(-w/2, -d/2, 0), (w/2, -d/2, 0), (w/2, d/2, 0), (-w/2, d/2, 0), (-w/2, 0, h), (w/2, 0, h)]]
    for f in [(0, 1, 2, 3), (0, 4, 5, 1), (3, 2, 5, 4), (0, 3, 4), (1, 5, 2)]: bm.faces.new([v[i] for i in f])
    bm.normal_update()
    return _finish(bm, name, material, collection, loc, rot, False, parent)

def torus(R, r, name, material, collection, loc=(0, 0, 0), rot=(0, 0, 0), seg=24, rseg=8, parent=None):
    bm = bmesh.new()
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; row = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            row.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        rows.append(row)
    for i in range(seg):
        for j in range(rseg):
            bm.faces.new([rows[i][j], rows[(i+1)%seg][j], rows[(i+1)%seg][(j+1)%rseg], rows[i][(j+1)%rseg]])
    bm.normal_update()
    return _finish(bm, name, material, collection, loc, rot, True, parent)

def empty(name, collection, loc=(0, 0, 0), scale=1.0, parent=None):
    e = bpy.data.objects.new(name, None); e.location = loc; e.scale = (scale, scale, scale); e.empty_display_size = 0.2
    collection.objects.link(e)
    if parent: e.parent = parent
    return e

def clear(collection):
    for o in list(collection.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)

def hexc(c): return '#%02x%02x%02x' % tuple(int(max(0, min(1, (v ** (1/2.2)))) * 255) for v in c[:3])

def _mat_json(m):
    p = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m and m.use_nodes else None
    if not p: return {'name': m.name if m else 'none', 'color': [0.5, 0.5, 0.5], 'roughness': 0.6, 'metalness': 0.0}
    d = {'name': m.name, 'color': [round(v, 4) for v in p.inputs['Base Color'].default_value[:3]], 'roughness': round(p.inputs['Roughness'].default_value, 3), 'metalness': round(p.inputs['Metallic'].default_value, 3)}
    es = p.inputs['Emission Strength'].default_value
    if es > 0: d['emissive'] = [round(v, 4) for v in p.inputs['Emission Color'].default_value[:3]]; d['emissiveIntensity'] = round(es, 3)
    al = p.inputs['Alpha'].default_value
    if al < 1: d['opacity'] = round(al, 3)
    return d

def export(objs, path, extra=None, q=100, root=None, group=None):
    """kwbin1: per object one mesh entry (web coords x, z, -y), int16 positions * q, int8 normals, base64."""
    dg = bpy.context.evaluated_depsgraph_get()
    inv = root.matrix_world.inverted() if root else Matrix.Identity(4)
    meshes = []
    for o in objs:
        if o.type != 'MESH': continue
        eo = o.evaluated_get(dg); me = eo.to_mesh()
        mw = inv @ eo.matrix_world; nm = mw.to_3x3().inverted().transposed()
        me.calc_loop_triangles()
        try: me.calc_normals_split()
        except Exception: pass
        # split by material slot
        by_mat = {}
        for tri in me.loop_triangles:
            by_mat.setdefault(tri.material_index, []).append(tri)
        for mi, tris in by_mat.items():
            m = me.materials[mi] if mi < len(me.materials) and me.materials[mi] else o.active_material
            pos = []; nor = []; idx = []; cache = {}
            for tri in tris:
                for li, vi in zip(tri.loops, tri.vertices):
                    v = mw @ me.vertices[vi].co
                    n = (nm @ (me.loops[li].normal if tri.use_smooth else tri.normal)).normalized()
                    key = (round(v.x, 5), round(v.y, 5), round(v.z, 5), round(n.x, 3), round(n.y, 3), round(n.z, 3))
                    k = cache.get(key)
                    if k is None:
                        k = len(pos) // 3; cache[key] = k
                        pos += [v.x, v.z, -v.y]; nor += [n.x, n.z, -n.y]
                    idx.append(k)
            n = len(pos) // 3
            p16 = struct.pack('<%dh' % len(pos), *[max(-32767, min(32767, int(round(v * q)))) for v in pos])
            n8 = struct.pack('<%db' % len(nor), *[max(-127, min(127, int(round(v * 127)))) for v in nor])
            idx32 = n > 65535
            ib = struct.pack('<%d%s' % (len(idx), 'I' if idx32 else 'H'), *idx)
            name = (group(o) if group else o.name)
            meshes.append({'name': name, 'material': _mat_json(m), 'n': n, 'ni': len(idx), 'q': q, 'pos': base64.b64encode(p16).decode(), 'nor': base64.b64encode(n8).decode(), 'idx': base64.b64encode(ib).decode(), 'idx32': idx32})
        eo.to_mesh_clear()
    out = {'format': 'kwbin1', 'meshes': meshes}
    if extra: out.update(extra)
    with open(path, 'w') as f: json.dump(out, f, separators=(',', ':'))
    return {'meshes': len(meshes), 'verts': sum(m['n'] for m in meshes), 'bytes': sum(len(m['pos']) + len(m['nor']) + len(m['idx']) for m in meshes)}

def web(v):  # blender -> web coords
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]

# ---- composite builders (all in Blender z-up, units = web units)
def building(name, w, d, h, collection, loc, parent=None, wall='KW_Plaster2', roof='KW_BronzeDark', win='KW_Window', floors=None, rot=0, roofkind='flat', win_w=0.18, win_h=0.26, door=True, cols=None):
    """A facade with real inset windows (emissive quads), a door, roof and a cornice. Returns list of objects."""
    objs = []
    body = box(w, d, h, name, M(wall), collection, loc, (0, 0, rot), parent); objs.append(body)
    floors = floors or max(1, int(h / 0.5)); cols = cols or max(1, int(w / 0.42))
    fh = (h - 0.08) / floors; win_h = min(win_h, fh * 0.5); win_w = min(win_w, w / cols * 0.55)
    for side, sign in (('f', -1), ('b', 1)):
        for f in range(floors):
            z = 0.04 + f * fh + fh * 0.32
            if f == 0 and door and side == 'f': z = max(z, 0.2)
            if z + win_h > h - 0.04: continue
            for c in range(cols):
                x = -w / 2 + (c + 0.5) * w / cols
                if door and side == 'f' and f == 0 and c == cols // 2: continue
                wn = box(win_w, 0.03, win_h, f'{name}_w', M(win), collection, (x, sign * (d / 2 + 0.005), z), (0, 0, 0), body); objs.append(wn)
                fr = box(win_w + 0.05, 0.02, win_h + 0.05, f'{name}_wf', M('KW_BronzeDark'), collection, (x, sign * (d / 2 + 0.002), z - 0.025), (0, 0, 0), body); objs.append(fr)
    if door:
        objs.append(box(0.24, 0.04, 0.4, f'{name}_door', M('KW_Walnut'), collection, (0, -d / 2 - 0.01, 0), (0, 0, 0), body))
        objs.append(box(0.3, 0.06, 0.44, f'{name}_doorf', M('KW_BronzeDark'), collection, (0, -d / 2 - 0.005, 0), (0, 0, 0), body))
        objs.append(box(0.08, 0.02, 0.06, f'{name}_doorlamp', M('KW_Lamp'), collection, (0, -d / 2 - 0.03, 0.5), (0, 0, 0), body))
    objs.append(box(w + 0.1, d + 0.1, 0.06, f'{name}_cornice', M(roof), collection, (0, 0, h - 0.03), (0, 0, 0), body))
    if roofkind == 'gable': objs.append(prism(w + 0.14, d + 0.14, min(0.45, w * 0.35), f'{name}_roof', M(roof), collection, (0, 0, h + 0.03), (0, 0, 0), body))
    elif roofkind == 'terrace': objs += railing(f'{name}_rail', w, d, collection, (0, 0, h + 0.03), body)
    return objs

def railing(name, w, d, collection, loc, parent, hgt=0.14, post=0.02):
    objs = []
    for x, y, lw, ld in [(0, -d/2, w, post), (0, d/2, w, post), (-w/2, 0, post, d), (w/2, 0, post, d)]:
        objs.append(box(lw, ld, post, f'{name}_top', M('KW_BronzeDark'), collection, (loc[0] + x, loc[1] + y, loc[2] + hgt), (0, 0, 0), parent))
    n = max(2, int(w / 0.25))
    for i in range(n + 1):
        x = -w / 2 + i * w / n
        for y in (-d/2, d/2): objs.append(box(post, post, hgt, f'{name}_p', M('KW_BronzeDark'), collection, (loc[0] + x, loc[1] + y, loc[2]), (0, 0, 0), parent))
    return objs

def stairs(name, w, run, rise, steps, collection, loc, rot, parent=None, material='KW_Stone', rail=True):
    objs = []
    for i in range(steps):
        objs.append(box(w, run, rise * (i + 1), f'{name}_s{i}', M(material), collection, (loc[0], loc[1], loc[2]), (0, 0, rot), parent) if False else None)
    objs = []
    root = empty(name, collection, loc, 1.0, parent); root.rotation_euler = (0, 0, rot)
    for i in range(steps):
        objs.append(box(w, run, rise * (i + 1), f'{name}_s{i}', M(material), collection, (0, -run * i, 0), (0, 0, 0), root))
    if rail:
        L = run * (steps - 1); H = rise * (steps - 1); ang = math.atan2(H, L); hr = 0.11
        for sx in (-w / 2, w / 2):
            r = cyl(0.01, math.hypot(L, H) + run, f'{name}_rail', M('KW_BronzeDark'), collection, (sx, -L / 2, rise + H / 2 + hr), (math.pi / 2 - ang, 0, 0), 6, None, root, True, True)
            objs.append(r)
            for i in range(0, steps, 2): objs.append(cyl(0.007, hr, f'{name}_rp', M('KW_BronzeDark'), collection, (sx, -run * i, rise * (i + 1)), (0, 0, 0), 6, None, root))
    return objs, root

def tree(name, collection, loc, h=1.0, parent=None, kind=0, seed=0):
    import random; rnd = random.Random(seed)
    objs = [cyl(0.03 * h, h * 0.45, f'{name}_trunk', M('KW_Walnut'), collection, loc, (0, 0, 0), 8, 0.02 * h, parent)]
    fol = ['KW_Foliage', 'KW_Foliage2', 'KW_Foliage3']
    if kind == 0:  # round layered canopy
        for i in range(3):
            r = h * (0.32 - i * 0.07); z = h * (0.42 + i * 0.17)
            objs.append(sph(r, f'{name}_fol{i}', M(fol[i % 3]), collection, (loc[0] + rnd.uniform(-0.05, 0.05) * h, loc[1] + rnd.uniform(-0.05, 0.05) * h, loc[2] + z), 10, 7, parent, (1, 1, 0.75)))
    elif kind == 1:  # conifer
        for i in range(4):
            r = h * (0.3 - i * 0.06); z = h * (0.3 + i * 0.17)
            objs.append(cone(r, h * 0.28, f'{name}_fol{i}', M(fol[(i + 1) % 3]), collection, (loc[0], loc[1], loc[2] + z), (0, 0, rnd.uniform(0, 1)), 8, parent))
    else:  # branching: trunk + 3 offset blobs
        for i in range(4):
            a = i * 1.7 + rnd.uniform(0, 0.6); r = h * 0.18
            objs.append(cyl(0.012 * h, h * 0.3, f'{name}_br{i}', M('KW_Walnut'), collection, (loc[0], loc[1], loc[2] + h * 0.42), (0.6, 0, a), 6, 0.006 * h, parent))
            objs.append(sph(r, f'{name}_fol{i}', M(fol[i % 3]), collection, (loc[0] + math.sin(a) * 0.2 * h, loc[1] - math.cos(a) * 0.2 * h, loc[2] + h * 0.62), 9, 6, parent, (1, 1, 0.8)))
    return objs

def lamp_post(name, collection, loc, h=0.5, parent=None):
    return [cyl(0.012, h, f'{name}_pole', M('KW_BronzeDark'), collection, loc, (0, 0, 0), 6, None, parent),
            box(0.1, 0.08, 0.06, f'{name}_fix', M('KW_BronzeDark'), collection, (loc[0], loc[1], loc[2] + h), (0, 0, 0), parent),
            box(0.07, 0.05, 0.03, f'{name}_bulb', M('KW_Lamp'), collection, (loc[0], loc[1], loc[2] + h - 0.03), (0, 0, 0), parent)]

def plant(name, collection, loc, r=0.12, parent=None, potmat='KW_Ceramic'):
    objs = [cyl(r, r * 1.3, f'{name}_pot', M(potmat), collection, loc, (0, 0, 0), 12, r * 0.8, parent),
            cyl(r * 0.9, 0.02, f'{name}_soil', M('KW_Ground'), collection, (loc[0], loc[1], loc[2] + r * 1.3), (0, 0, 0), 12, None, parent)]
    for i in range(5):
        a = i * 1.26; objs.append(sph(r * 0.55, f'{name}_leaf{i}', M(['KW_Foliage', 'KW_Foliage2', 'KW_Foliage3'][i % 3]), collection, (loc[0] + math.cos(a) * r * 0.45, loc[1] + math.sin(a) * r * 0.45, loc[2] + r * 1.7 + (i % 2) * r * 0.3), 8, 6, parent, (1, 1, 0.7)))
    return objs

for k, v in list(globals().items()):
    if callable(v) and not k.startswith('_'): KW[k] = v
KW['M'] = M; KW['srgb'] = srgb
builtins.KW = KW

# ---- v3: hero-cluster families (deterministic: every seed is fixed by the caller)
def seg(name, a, b, r, collection, material='KW_Rubber', parent=None, smooth=True):
    """A cylinder between two points (cable, strut, pipe)."""
    dx, dy, dz = b[0] - a[0], b[1] - a[1], b[2] - a[2]; L = math.sqrt(dx * dx + dy * dy + dz * dz)
    if L < 1e-5: return None
    rot = Vector((dx, dy, dz)).to_track_quat('Z', 'Y').to_euler()
    return cyl(r, L, name, M(material), collection, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), rot, 6, None, parent, smooth, True)

def cable(name, a, b, collection, sag=0.08, parent=None, r=0.006):
    """A sagging cable: two segments through a low midpoint."""
    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - sag)
    return [seg(name, a, m, r, collection, 'KW_Rubber', parent), seg(name, m, b, r, collection, 'KW_Rubber', parent)]

def bridge(name, a, b, w, collection, parent=None, deck='KW_Walnut'):
    """A footbridge from a to b: deck, two rails with posts, a support under each end."""
    objs = []
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); ang = math.atan2(dy, dx)
    cx, cy, cz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2
    tilt = -math.atan2(b[2] - a[2], L)
    root = empty(name, collection, (cx, cy, cz), 1.0, parent); root.rotation_euler = (0, tilt, ang)
    objs.append(box(L + 0.04, w, 0.025, name + '_deck', M(deck), collection, (0, 0, -0.0125), (0, 0, 0), root))
    for sy in (-w / 2, w / 2):
        objs.append(box(L, 0.012, 0.012, name + '_rail', M('KW_BronzeDark'), collection, (0, sy, 0.1), (0, 0, 0), root))
        n = max(2, int(L / 0.12))
        for i in range(n + 1): objs.append(box(0.01, 0.01, 0.1, name + '_post', M('KW_BronzeDark'), collection, (-L / 2 + L * i / n, sy, 0), (0, 0, 0), root))
    return objs, root

def sign(name, collection, loc, rot, w=0.16, h=0.06, parent=None, glow=True):
    objs = [box(w, 0.012, h, name, M('KW_Cream'), collection, loc, (0, 0, rot), parent)]
    if glow: objs.append(box(w * 0.7, 0.006, h * 0.25, name + '_line', M('KW_LineGlow'), collection, (loc[0] - math.sin(rot) * 0.01, loc[1] + math.cos(rot) * 0.01, loc[2] + h * 0.35), (0, 0, rot), parent))
    return objs

def awning(name, collection, loc, w, rot=0, parent=None, material='KW_Awning1'):
    a = box(w, 0.14, 0.012, name, M(material), collection, loc, (0.35, 0, rot), parent)
    return [a, box(0.01, 0.13, 0.01, name + '_strut', M('KW_BronzeDark'), collection, (loc[0] - math.sin(rot) * 0.02, loc[1] + math.cos(rot) * 0.02, loc[2] - 0.05), (0.35, 0, rot), parent)]

def hero_tree(name, collection, loc, h, parent=None, seed=1, palette=(0, 1, 2)):
    """A tree with a tapered trunk, three branches and an irregular layered canopy. Same seed → same tree."""
    import random; rnd = random.Random(seed)
    fol = ['KW_Foliage', 'KW_Foliage2', 'KW_Foliage3']
    objs = [cyl(0.035 * h, h * 0.5, name + '_trunk', M('KW_Walnut'), collection, loc, (0, 0, 0), 8, 0.018 * h, parent)]
    blobs = []
    for i in range(3):
        a = i * 2.09 + rnd.uniform(-0.3, 0.3); L = h * 0.28
        end = (loc[0] + math.cos(a) * L * 0.7, loc[1] + math.sin(a) * L * 0.7, loc[2] + h * 0.45 + L * 0.6)
        objs.append(seg(name + '_br', (loc[0], loc[1], loc[2] + h * 0.42), end, 0.012 * h, collection, 'KW_Walnut', parent))
        blobs.append((end, h * (0.17 + rnd.uniform(0, 0.06)), fol[palette[i % len(palette)]]))
    blobs.append(((loc[0], loc[1], loc[2] + h * 0.72), h * 0.24, fol[palette[0]]))
    blobs.append(((loc[0] + rnd.uniform(-0.08, 0.08) * h, loc[1] + rnd.uniform(-0.08, 0.08) * h, loc[2] + h * 0.88), h * 0.15, fol[palette[1 % len(palette)]]))
    for i, (c, r, mt) in enumerate(blobs):
        objs.append(sph(r, f'{name}_fol{i}', M(mt), collection, c, 9, 6, parent, (1 + rnd.uniform(-0.15, 0.25), 1 + rnd.uniform(-0.15, 0.25), 0.7 + rnd.uniform(0, 0.15))))
    return objs

def bush(name, collection, loc, r, parent=None, seed=1):
    import random; rnd = random.Random(seed)
    fol = ['KW_Foliage', 'KW_Foliage2', 'KW_Foliage3']; objs = []
    for i in range(4):
        a = i * 1.57 + rnd.uniform(0, 0.5); d = r * 0.45
        objs.append(sph(r * (0.55 + rnd.uniform(0, 0.2)), f'{name}_{i}', M(fol[i % 3]), collection, (loc[0] + math.cos(a) * d, loc[1] + math.sin(a) * d, loc[2] + r * 0.45), 8, 6, parent, (1, 1, 0.7)))
    objs.append(sph(r * 0.6, f'{name}_top', M(fol[0]), collection, (loc[0], loc[1], loc[2] + r * 0.7), 8, 6, parent, (1, 1, 0.7)))
    return objs

def switch(name, collection, loc, parent=None, lit=False):
    """An exposed mechanical switch: housing, brass stem, a spring coil, contact leaf."""
    objs = [box(0.5, 0.5, 0.22, name + '_house', M('KW_MatteCharcoal'), collection, loc, (0, 0, 0), parent, bev=0.03),
            box(0.44, 0.44, 0.04, name + '_top', M('KW_Metal'), collection, (loc[0], loc[1], loc[2] + 0.22), (0, 0, 0), parent),
            cyl(0.05, 0.16, name + '_stem', M('KW_WarmBrass'), collection, (loc[0], loc[1], loc[2] + 0.24), (0, 0, 0), 8, None, parent),
            box(0.12, 0.04, 0.12, name + '_cross', M('KW_WarmBrass'), collection, (loc[0], loc[1], loc[2] + 0.26), (0, 0, 0), parent),
            box(0.04, 0.12, 0.12, name + '_cross2', M('KW_WarmBrass'), collection, (loc[0], loc[1], loc[2] + 0.26), (0, 0, 0), parent)]
    for i in range(5): objs.append(torus(0.075, 0.012, name + '_coil', M('KW_Metal'), collection, (loc[0] + 0.16, loc[1] - 0.14, loc[2] + 0.24 + i * 0.03), (0, 0, 0), 12, 5, parent))
    objs.append(box(0.02, 0.16, 0.14, name + '_leaf', M('KW_Bronze'), collection, (loc[0] - 0.17, loc[1] + 0.1, loc[2] + 0.22), (0, 0, 0), parent))
    if lit: objs.append(box(0.06, 0.04, 0.02, name + '_led', M('KW_Ember'), collection, (loc[0] - 0.17, loc[1] - 0.18, loc[2] + 0.23), (0, 0, 0), parent))
    return objs

def glasshouse(name, collection, loc, w, d, h, parent=None, ridge=0.35, bays=4):
    """A gabled greenhouse: brass frame, glass panels, a ridge, a door. Open on the inside for props."""
    objs = []
    fr = 'KW_WarmBrass'; g = 'KW_WarmGlass'
    # corner posts + eave beams
    for sx in (-w / 2, w / 2):
        for sy in (-d / 2, d / 2): objs.append(box(0.025, 0.025, h, name + '_post', M(fr), collection, (loc[0] + sx, loc[1] + sy, loc[2]), (0, 0, 0), parent))
        objs.append(box(0.02, d, 0.02, name + '_eave', M(fr), collection, (loc[0] + sx, loc[1], loc[2] + h), (0, 0, 0), parent))
    for sy in (-d / 2, d / 2): objs.append(box(w, 0.02, 0.02, name + '_eave2', M(fr), collection, (loc[0], loc[1] + sy, loc[2] + h), (0, 0, 0), parent))
    objs.append(box(0.02, d + 0.04, 0.02, name + '_ridge', M(fr), collection, (loc[0], loc[1], loc[2] + h + ridge), (0, 0, 0), parent))
    # glass walls
    for sx in (-w / 2, w / 2): objs.append(box(0.006, d - 0.04, h - 0.03, name + '_glass', M(g), collection, (loc[0] + sx, loc[1], loc[2] + 0.02), (0, 0, 0), parent))
    for sy in (-d / 2, d / 2):
        objs.append(box(w - 0.04, 0.006, h - 0.03, name + '_glass', M(g), collection, (loc[0], loc[1] + sy, loc[2] + 0.02), (0, 0, 0), parent))
        objs.append(prism(w - 0.04, 0.006, ridge, name + '_gable', M(g), collection, (loc[0], loc[1] + sy, loc[2] + h), (0, 0, 0), parent))
    # roof panes (two slopes) with mullions per bay
    slope = math.hypot(w / 2, ridge); ang = math.atan2(ridge, w / 2)
    for sgn in (-1, 1):
        cx = loc[0] + sgn * w / 4; cz = loc[2] + h + ridge / 2
        objs.append(box(slope, d + 0.02, 0.006, name + '_roofglass', M(g), collection, (cx, loc[1], cz), (0, -sgn * ang, 0), parent))
        for i in range(bays + 1):
            y = loc[1] - d / 2 + d * i / bays
            objs.append(box(slope, 0.014, 0.014, name + '_rafter', M(fr), collection, (cx, y, cz + 0.008), (0, -sgn * ang, 0), parent))
    for i in range(1, bays):
        y = loc[1] - d / 2 + d * i / bays
        for sx in (-w / 2, w / 2): objs.append(box(0.014, 0.014, h, name + '_mullion', M(fr), collection, (loc[0] + sx, y, loc[2]), (0, 0, 0), parent))
    # door on the front (−y)
    objs.append(box(0.16, 0.02, 0.3, name + '_door', M('KW_Walnut'), collection, (loc[0], loc[1] - d / 2 - 0.005, loc[2]), (0, 0, 0), parent))
    objs.append(box(0.06, 0.03, 0.02, name + '_doorlamp', M('KW_Lamp'), collection, (loc[0], loc[1] - d / 2 - 0.02, loc[2] + 0.34), (0, 0, 0), parent))
    return objs

for k, v in list(globals().items()):
    if callable(v) and not k.startswith('_'): KW[k] = v
builtins.KW = KW

result = {'ok': True, 'fns': sorted(KW.keys())}
