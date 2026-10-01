import bpy, builtins, math, os
ns = {}; exec(open(os.path.join(os.path.dirname(bpy.data.filepath), '..', 'scripts', 'kw_blender.py')).read(), ns)
K = builtins.KW; M = K['M']
A = r'C:\Users\annisa 05\Documents\Proyekan\keyboardweb\assets'
C = K['col']('04_HERO_CLUSTERS')
for o in [o for o in list(bpy.data.objects) if o is not None and o.name.startswith('HC_')]: bpy.data.objects.remove(o, do_unlink=True)
def grp(o): return 'shell' if '_shell' in o.name else 'mini'
def export(prefix, path, root, mini, kind):
    objs = [o for o in bpy.data.objects if o.name.startswith(prefix) and o.type == 'MESH']
    extra = {'kind': kind}
    if mini: extra['frame'] = {'scale': mini.scale[0], 'offset': K['web'](mini.location)}
    return K['export'](objs, path, extra, q=10000, root=root, group=grp)

# ============ A: SIGNAL DISTRICT (open city, the landmark). L-shape: back strip x[-2,2] y[0,1], front strip x[-1.5,0.5] y[-1,0]
P = 'HC_SIGNAL_'
root = K['empty']('HC_SIGNAL', C)
# terrain: two stepped stone plates with a brass edge, the back one raised
K['box'](4.0, 1.0, 0.1, P + 'shell_back', M('KW_Stone'), C, (0, 0.5, 0), (0, 0, 0), root)
K['box'](2.0, 1.0, 0.05, P + 'shell_front', M('KW_Stone'), C, (-0.5, -0.5, 0), (0, 0, 0), root)
K['box'](4.04, 0.02, 0.11, P + 'shell_lip', M('KW_BronzeDark'), C, (0, 1.0, 0), (0, 0, 0), root)
K['box'](0.02, 1.0, 0.11, P + 'shell_lip2', M('KW_BronzeDark'), C, (-2.0, 0.5, 0), (0, 0, 0), root)
K['box'](0.02, 1.0, 0.11, P + 'shell_lip3', M('KW_BronzeDark'), C, (2.0, 0.5, 0), (0, 0, 0), root)
# main street along the back strip, a side street down the front strip
K['box'](3.6, 0.22, 0.012, P + 'street', M('KW_MatteCharcoal'), C, (0, 0.42, 0.1), (0, 0, 0), root)
K['box'](0.22, 1.0, 0.012, P + 'street2', M('KW_MatteCharcoal'), C, (-0.55, -0.5, 0.05), (0, 0, 0), root)
K['stairs'](P + 'stairs', 0.22, 0.03, 0.025, 2, C, (-0.55, 0.02, 0.05), 0.0, root, 'KW_Stone', rail=False)
# the landmark: signal tower: stone base, charcoal shaft with lit windows, brass lattice, dish, beacon
tx, ty = 1.35, 0.62
K['cyl'](0.22, 0.08, P + 'tower_base', M('KW_Stone'), C, (tx, ty, 0.1), (0, 0, 0), 12)
K['building'](P + 'tower', 0.3, 0.3, 0.8, C, (tx, ty, 0.18), root, wall='KW_MatteCharcoal', roof='KW_BronzeDark', floors=3, cols=1, roofkind='flat')
for sx, sy in [(-0.1, -0.1), (0.1, -0.1), (-0.1, 0.1), (0.1, 0.1)]:
    K['cyl'](0.012, 1.1, P + 'lattice', M('KW_WarmBrass'), C, (tx + sx, ty + sy, 1.0), (0, 0, 0), 6, None, root)
for i, z in enumerate((1.2, 1.5, 1.8)):
    for a in range(4):
        K['box'](0.22, 0.012, 0.012, P + 'lattice_b', M('KW_WarmBrass'), C, (tx + (0.1 if a == 1 else -0.1 if a == 3 else 0), ty + (0.1 if a == 0 else -0.1 if a == 2 else 0), z), (0, 0, a * math.pi / 2), root, center=True)
    K['seg'](P + 'brace', (tx - 0.1, ty - 0.1, z), (tx + 0.1, ty + 0.1, z + 0.28), 0.006, C, 'KW_WarmBrass', root)
K['box'](0.24, 0.24, 0.04, P + 'deck', M('KW_BronzeDark'), C, (tx, ty, 2.08), (0, 0, 0), root)
K['railing'](P + 'deckrail', 0.24, 0.24, C, (tx, ty, 2.12), root, hgt=0.06, post=0.008)
K['cyl'](0.09, 0.03, P + 'dish', M('KW_Metal'), C, (tx + 0.12, ty, 1.6), (0.9, 0.5, 0), 12, 0.02, root)
K['cyl'](0.008, 0.36, P + 'mast', M('KW_BronzeDark'), C, (tx, ty, 2.12), (0, 0, 0), 6, None, root)
K['box'](0.06, 0.06, 0.08, P + 'beacon', M('KW_Lamp'), C, (tx, ty, 2.46), (0, 0, 0), root)
K['sph'](0.016, P + 'beacon_tip', M('KW_Ember'), C, (tx, ty, 2.58), 6, 4, root)
mini = K['empty']('HC_SIGNAL_mini', C, (tx, ty - 0.2, 0.36), 0.02, root)
# buildings along the main street (varied heights, facades with windows and awnings)
K['building'](P + 'b1', 0.42, 0.34, 0.5, C, (-1.55, 0.78, 0.1), root, wall='KW_Plaster2', roof='KW_Awning2', floors=1, cols=2, roofkind='gable')
K['building'](P + 'b2', 0.34, 0.3, 0.85, C, (-0.95, 0.76, 0.1), root, wall='KW_Plaster3', roof='KW_BronzeDark', floors=3, cols=1, roofkind='terrace')
K['building'](P + 'b3', 0.4, 0.3, 0.62, C, (-0.3, 0.76, 0.1), root, wall='KW_Cream', roof='KW_BronzeDark', floors=2, cols=2, roofkind='flat')
K['building'](P + 'b4', 0.34, 0.28, 1.05, C, (0.45, 0.76, 0.1), root, wall='KW_MatteCharcoal', roof='KW_WarmBrass', floors=4, cols=1, roofkind='terrace')
K['building'](P + 'b5', 0.36, 0.26, 0.42, C, (1.8, 0.2, 0.1), root, wall='KW_Plaster2', roof='KW_Awning1', floors=1, cols=2, roofkind='gable', rot=0.0)
K['building'](P + 'b6', 0.3, 0.3, 0.7, C, (-1.2, -0.72, 0.05), root, wall='KW_Plaster3', roof='KW_BronzeDark', floors=2, cols=1, roofkind='terrace')
K['building'](P + 'b7', 0.32, 0.26, 0.48, C, (0.15, -0.7, 0.05), root, wall='KW_Cream', roof='KW_Awning2', floors=1, cols=2, roofkind='gable', rot=-0.1)
K['awning'](P + 'awn1', C, (-1.55, 0.6, 0.32), 0.36, 0, root, 'KW_Awning1')
K['awning'](P + 'awn2', C, (-0.3, 0.6, 0.34), 0.34, 0, root, 'KW_Awning2')
K['sign'](P + 'sign1', C, (-0.95, 0.6, 0.62), 0, 0.14, 0.05, root)
K['sign'](P + 'sign2', C, (0.45, 0.61, 0.9), 0, 0.12, 0.05, root)
# a footbridge from b2's roof terrace to b4's terrace, over the street gap
K['bridge'](P + 'bridge', (-0.78, 0.76, 0.95), (0.28, 0.76, 1.15), 0.09, C, root)
# cables from the tower to two rooftops and a pole
K['cable'](P + 'cab1', (tx - 0.1, ty - 0.1, 1.5), (0.45, 0.76, 1.16), C, 0.1, root)
K['cable'](P + 'cab2', (tx - 0.1, ty + 0.05, 1.3), (-0.3, 0.76, 0.74), C, 0.12, root)
K['cyl'](0.01, 0.55, P + 'pole', M('KW_BronzeDark'), C, (0.9, 0.2, 0.1), (0, 0, 0), 6, None, root)
K['cable'](P + 'cab3', (tx - 0.12, ty - 0.12, 1.2), (0.9, 0.2, 0.65), C, 0.06, root)
# trees of varied heights, lamps, benches, planters
K['hero_tree'](P + 'tree1', C, (-1.85, 0.25, 0.1), 0.62, root, 11)
K['hero_tree'](P + 'tree2', C, (0.1, 0.18, 0.1), 0.48, root, 12, (2, 0, 1))
K['hero_tree'](P + 'tree3', C, (-0.95, -0.35, 0.05), 0.82, root, 13, (1, 2, 0))
K['tree'](P + 'pine1', C, (1.85, 0.85, 0.1), 0.55, root, 1, 14)
K['bush'](P + 'bush1', C, (-0.15, -0.95, 0.05), 0.09, root, 15)
K['bush'](P + 'bush2', C, (1.62, 0.22, 0.1), 0.08, root, 16)
for i, (x, y) in enumerate([(-1.25, 0.28), (0.72, 0.28), (-0.85, -0.85), (1.05, 0.9)]): K['lamp_post'](P + f'lp{i}', C, (x, y, 0.1 if y > 0 else 0.05), 0.24, root)
K['box'](0.14, 0.04, 0.035, P + 'bench', M('KW_Walnut'), C, (-0.5, 0.25, 0.1), (0, 0, 0), root)
K['plant'](P + 'planter', C, (0.3, -0.9, 0.05), 0.03, root, 'KW_Awning2')
K['box'](0.2, 0.2, 0.06, P + 'platform', M('KW_Oak'), C, (0.85, -0.55, 0.05), (0, 0, 0), root)
K['plant'](P + 'planter2', C, (0.85, -0.55, 0.11), 0.028, root, 'KW_Ceramic')
rA = export('HC_SIGNAL', A + r'\cluster_signal.json', root, mini, 'district')

# ============ B: MARKET STREET (raised architecture, a street front-to-back). rows: back x[-0.625,1.375] y[0.5,1.5]; mid x[-1.375,0.625] y[-0.5,0.5]; front x[-0.875,1.125] y[-1.5,-0.5]
P = 'HC_MARKET_'
root = K['empty']('HC_MARKET', C)
K['box'](2.0, 1.0, 0.16, P + 'shell_back', M('KW_Stone'), C, (0.375, 1.0, 0), (0, 0, 0), root)
K['box'](2.0, 1.0, 0.08, P + 'shell_mid', M('KW_Stone'), C, (-0.375, 0.0, 0), (0, 0, 0), root)
K['box'](2.0, 1.0, 0.03, P + 'shell_front', M('KW_Stone'), C, (0.125, -1.0, 0), (0, 0, 0), root)
# a cobbled street snaking front to back, stepping up twice
K['box'](0.3, 1.0, 0.01, P + 'street_f', M('KW_MatteCharcoal'), C, (0.1, -1.0, 0.03), (0, 0, 0), root)
K['box'](0.3, 1.0, 0.01, P + 'street_m', M('KW_MatteCharcoal'), C, (-0.15, 0.0, 0.08), (0, 0, 0), root)
K['box'](0.3, 1.0, 0.01, P + 'street_b', M('KW_MatteCharcoal'), C, (0.2, 1.0, 0.16), (0, 0, 0), root)
K['stairs'](P + 'st1', 0.28, 0.03, 0.025, 2, C, (-0.02, -0.47, 0.03), 0.0, root, 'KW_Stone', rail=False)
K['stairs'](P + 'st2', 0.28, 0.03, 0.027, 3, C, (0.05, 0.53, 0.08), 0.0, root, 'KW_Stone', rail=True)
# a small plaza at the front with a fountain, stalls at the middle, a courtyard at the back
K['cyl'](0.14, 0.03, P + 'fountain', M('KW_Stone'), C, (0.6, -1.15, 0.03), (0, 0, 0), 14)
K['cyl'](0.11, 0.012, P + 'water', M('KW_WarmGlass'), C, (0.6, -1.15, 0.06), (0, 0, 0), 14)
K['cyl'](0.02, 0.1, P + 'fcol', M('KW_Stone'), C, (0.6, -1.15, 0.06), (0, 0, 0), 8)
# buildings: five, unique, different heights; some embedded at the edges
K['building'](P + 'h1', 0.4, 0.32, 0.55, C, (-0.55, -1.05, 0.03), root, wall='KW_Plaster2', roof='KW_Awning1', floors=2, cols=2, roofkind='gable')
K['building'](P + 'h2', 0.36, 0.3, 0.9, C, (-0.95, 0.15, 0.08), root, wall='KW_Plaster3', roof='KW_BronzeDark', floors=3, cols=1, roofkind='terrace')
K['building'](P + 'h3', 0.42, 0.3, 0.42, C, (0.32, 0.12, 0.08), root, wall='KW_Cream', roof='KW_Awning2', floors=1, cols=2, roofkind='gable', rot=0.06)
K['building'](P + 'h4', 0.34, 0.34, 0.72, C, (-0.35, 1.05, 0.16), root, wall='KW_MatteCharcoal', roof='KW_WarmBrass', floors=2, cols=1, roofkind='terrace')
K['building'](P + 'h5', 0.44, 0.3, 0.6, C, (0.95, 1.1, 0.16), root, wall='KW_Plaster2', roof='KW_BronzeDark', floors=2, cols=2, roofkind='flat')
# balconies on h2 and h4
for (bx, by, bz) in [(-0.95, -0.02, 0.4), (-0.35, 0.86, 0.5)]:
    K['box'](0.2, 0.06, 0.012, P + 'balc', M('KW_Stone'), C, (bx, by, bz), (0, 0, 0), root)
    K['railing'](P + 'balcrail', 0.2, 0.06, C, (bx, by, bz + 0.012), root, hgt=0.05, post=0.006)
K['awning'](P + 'aw1', C, (0.32, -0.05, 0.28), 0.36, 0, root, 'KW_Awning1')
K['awning'](P + 'aw2', C, (0.95, 0.94, 0.4), 0.38, 0, root, 'KW_Awning2')
K['sign'](P + 'sg1', C, (-0.55, -1.22, 0.42), 0, 0.14, 0.05, root)
K['sign'](P + 'sg2', C, (-0.95, -0.01, 0.75), 0, 0.12, 0.045, root)
# market stalls (canvas tops on posts) in the middle row
for i, (x, y, mt) in enumerate([(0.55, -0.35, 'KW_Awning1'), (-0.55, -0.4, 'KW_Awning2'), (0.62, 0.42, 'KW_Canvas')]):
    K['box'](0.18, 0.12, 0.05, P + f'stall{i}', M('KW_Walnut'), C, (x, y, 0.08), (0, 0, 0), root)
    for sx, sy in [(-0.08, -0.05), (0.08, -0.05), (-0.08, 0.05), (0.08, 0.05)]: K['box'](0.008, 0.008, 0.16, P + f'stallpost{i}', M('KW_BronzeDark'), C, (x + sx, y + sy, 0.08), (0, 0, 0), root)
    K['prism'](0.22, 0.16, 0.05, P + f'stallroof{i}', M(mt), C, (x, y, 0.24), (0, 0, 0), root)
    K['box'](0.03, 0.03, 0.03, P + f'goods{i}', M('KW_Ember' if i == 0 else 'KW_Cream'), C, (x - 0.04, y, 0.13), (0, 0, 0), root)
# courtyard at the back with a tree and a well, planters, lamps
K['hero_tree'](P + 'tree1', C, (0.55, 1.35, 0.16), 0.7, root, 21, (2, 1, 0))
K['tree'](P + 'tree2', C, (-0.85, 1.35, 0.16), 0.4, root, 0, 22)
K['bush'](P + 'bush1', C, (0.95, -0.75, 0.03), 0.08, root, 23)
K['bush'](P + 'bush2', C, (-0.3, 0.45, 0.08), 0.07, root, 24)
for i, (x, y, z) in enumerate([(0.3, -1.4, 0.03), (-0.45, -0.15, 0.08), (0.42, 0.62, 0.16), (-0.05, 1.42, 0.16)]): K['lamp_post'](P + f'lp{i}', C, (x, y, z), 0.22, root)
K['plant'](P + 'pl1', C, (-0.2, -1.4, 0.03), 0.026, root, 'KW_Awning2'); K['plant'](P + 'pl2', C, (0.85, 0.75, 0.16), 0.026, root, 'KW_Ceramic')
K['bridge'](P + 'bridge', (-0.35, 0.86, 0.9), (0.32, 0.3, 0.52), 0.08, C, root)
mini = K['empty']('HC_MARKET_mini', C, (0.2, 1.42, 0.3), 0.02, root)
rB = export('HC_MARKET', A + r'\cluster_market.json', root, mini, 'street')

# ============ C: MECH BAY (exposed mechanical layer, F5–F7): x[-1.5,1.5] y[-0.5,0.5], recessed
P = 'HC_MECH_'
root = K['empty']('HC_MECH', C)
K['box'](3.0, 1.0, 0.02, P + 'shell_plate', M('KW_BrushedMetal'), C, (0, 0, -0.12), (0, 0, 0), root)
K['box'](3.04, 0.03, 0.14, P + 'shell_edge', M('KW_BronzeDark'), C, (0, 0.5, -0.12), (0, 0, 0), root)
K['box'](3.04, 0.03, 0.14, P + 'shell_edge2', M('KW_BronzeDark'), C, (0, -0.5, -0.12), (0, 0, 0), root)
for x in (-1.35, -0.45, 0.45, 1.35):
    for y in (-0.4, 0.4): K['cyl'](0.025, 0.012, P + 'screw', M('KW_WarmBrass'), C, (x, y, -0.1), (0, 0, 0), 8)
K['switch'](P + 'sw1', C, (-1.0, 0.0, -0.1), root, lit=True)
K['switch'](P + 'sw2', C, (-0.35, 0.0, -0.1), root)
K['switch'](P + 'sw3', C, (1.05, 0.05, -0.1), root, lit=True)
# a cable tray and cables between switches, a small bronze gantry with a workshop platform and stairs
K['box'](2.6, 0.06, 0.03, P + 'tray', M('KW_Metal'), C, (0, -0.42, -0.1), (0, 0, 0), root)
K['cable'](P + 'c1', (-1.0, -0.4, -0.06), (-0.35, -0.4, -0.06), C, 0.03, root, 0.008)
K['cable'](P + 'c2', (-0.35, -0.4, -0.06), (1.05, -0.4, -0.06), C, 0.05, root, 0.008)
K['cable'](P + 'c3', (1.05, -0.4, -0.06), (1.45, -0.2, 0.0), C, 0.02, root, 0.008)
gx = 0.35
K['box'](0.5, 0.42, 0.02, P + 'platform', M('KW_Oak'), C, (gx, 0.1, 0.2), (0, 0, 0), root)
for sx, sy in [(-0.23, -0.19), (0.23, -0.19), (-0.23, 0.19), (0.23, 0.19)]: K['box'](0.02, 0.02, 0.32, P + 'leg', M('KW_WarmBrass'), C, (gx + sx, 0.1 + sy, -0.1), (0, 0, 0), root)
K['railing'](P + 'prail', 0.5, 0.42, C, (gx, 0.1, 0.22), root, hgt=0.07, post=0.008)
K['stairs'](P + 'pstairs', 0.14, 0.04, 0.032, 10, C, (gx + 0.32, -0.1, -0.1), math.pi / 2, root, 'KW_Metal', rail=True)
K['box'](0.22, 0.1, 0.06, P + 'bench', M('KW_Walnut'), C, (gx - 0.08, 0.2, 0.22), (0, 0, 0), root)
K['box'](0.04, 0.04, 0.03, P + 'tool', M('KW_Bronze'), C, (gx - 0.12, 0.2, 0.28), (0, 0, 0), root)
K['lamp_post'](P + 'lp', C, (gx + 0.18, 0.24, 0.22), 0.18, root)
K['box'](0.16, 0.04, 0.1, P + 'panel', M('KW_MatteCharcoal'), C, (-1.4, 0.4, -0.1), (0, 0, 0), root)
for i in range(4): K['box'](0.02, 0.01, 0.012, P + f'led{i}', M('KW_Ember' if i % 2 else 'KW_Lamp'), C, (-1.45 + i * 0.03, 0.375, -0.03), (0, 0, 0), root)
K['seg'](P + 'pipe', (-1.45, 0.45, -0.05), (1.45, 0.45, -0.05), 0.012, C, 'KW_Metal', root)
rC = export('HC_MECH', A + r'\cluster_mech.json', root, None, 'mech')

# ============ D: GREENHOUSE (glass, elegant; ins/home/pgup + del/end/pgdn): x[-1.5,1.5] y[-1,1]
P = 'HC_GREEN_'
root = K['empty']('HC_GREEN', C)
K['box'](3.0, 2.0, 0.06, P + 'shell_apron', M('KW_Ground'), C, (0, 0, 0), (0, 0, 0), root)
K['box'](3.04, 2.04, 0.02, P + 'shell_lip', M('KW_BronzeDark'), C, (0, 0, 0), (0, 0, 0), root)
K['box'](2.3, 1.3, 0.03, P + 'floor', M('KW_Stone'), C, (0.15, 0.1, 0.06), (0, 0, 0), root)
K['glasshouse'](P + 'gh', C, (0.15, 0.1, 0.09), 2.2, 1.2, 0.55, root, 0.4, 5)
# inside: benches with plants, hanging lamps, shelves, a vine
for i, (x, y) in enumerate([(-0.6, 0.35), (0.2, 0.35), (0.9, 0.35), (-0.6, -0.2), (0.6, -0.2)]):
    K['box'](0.5, 0.22, 0.02, P + f'table{i}', M('KW_Oak'), C, (x, y, 0.28), (0, 0, 0), root)
    for sx in (-0.2, 0.2): K['box'](0.015, 0.015, 0.19, P + f'tleg{i}', M('KW_BronzeDark'), C, (x + sx, y, 0.09), (0, 0, 0), root)
    for j in range(3): K['plant'](P + f'tp{i}{j}', C, (x - 0.16 + j * 0.16, y, 0.3), 0.03, root, ['KW_Ceramic', 'KW_Awning1', 'KW_Awning2'][(i + j) % 3])
for i in range(3): K['cyl'](0.004, 0.16, P + f'cord{i}', M('KW_Rubber'), C, (-0.55 + i * 0.7, 0.1, 0.78), (0, 0, 0), 4, None, root); K['box'](0.07, 0.07, 0.04, P + f'hl{i}', M('KW_Lamp'), C, (-0.55 + i * 0.7, 0.1, 0.74), (0, 0, 0), root)
K['hero_tree'](P + 'tree', C, (1.0, -0.25, 0.09), 0.62, root, 31, (1, 2, 0))
K['tree'](P + 'tree2', C, (-0.95, -0.35, 0.09), 0.36, root, 2, 32)
for i in range(6): K['sph'](0.02, P + f'vine{i}', M('KW_Foliage3'), C, (-0.95 + i * 0.06, 0.7, 0.62 - (i % 2) * 0.05), 6, 4, root, (1, 1, 0.6))
# outside: path to the door, planters, a water tank, a bench, lamps
K['box'](0.22, 0.34, 0.012, P + 'path', M('KW_Stone'), C, (0.15, -0.68, 0.06), (0, 0, 0), root)
K['cyl'](0.1, 0.22, P + 'tank', M('KW_Metal'), C, (-1.3, -0.7, 0.06), (0, 0, 0), 12)
K['seg'](P + 'tankpipe', (-1.3, -0.6, 0.2), (-0.95, -0.5, 0.2), 0.01, C, 'KW_Metal', root)
K['bush'](P + 'bush1', C, (1.25, -0.75, 0.06), 0.1, root, 33); K['bush'](P + 'bush2', C, (-1.05, 0.85, 0.06), 0.09, root, 34)
K['plant'](P + 'pl1', C, (0.45, -0.75, 0.06), 0.035, root, 'KW_Awning1'); K['plant'](P + 'pl2', C, (-0.2, -0.78, 0.06), 0.03, root, 'KW_Ceramic')
K['box'](0.16, 0.05, 0.04, P + 'bench', M('KW_Walnut'), C, (0.9, -0.8, 0.06), (0, 0, 0), root)
K['lamp_post'](P + 'lp1', C, (-0.4, -0.85, 0.06), 0.22, root); K['lamp_post'](P + 'lp2', C, (1.35, 0.85, 0.06), 0.22, root)
mini = K['empty']('HC_GREEN_mini', C, (0.15, -0.55, 0.3), 0.02, root)
rD = export('HC_GREEN', A + r'\cluster_green.json', root, mini, 'greenhouse')
bpy.ops.wm.save_mainfile()
result = {'signal': rA, 'market': rB, 'mech': rC, 'green': rD}
