import bpy, builtins, math, os
ns = {}; exec(open(os.path.join(os.path.dirname(bpy.data.filepath), '..', 'scripts', 'kw_blender.py')).read(), ns)
K = builtins.KW
C = K['col']('03_PROJECT_KEYS'); M = K['M']
A = r'C:\Users\annisa 05\Documents\Proyekan\keyboardweb\assets'
for o in [o for o in bpy.data.objects if o.name.startswith(('KEY_ENTER', 'KEY_PLAZA', 'KEY_GARDEN'))]: bpy.data.objects.remove(o, do_unlink=True)

# ================= ENTER: a miniature district on an ivory 2.25u cap =================
root = K['empty']('KEY_ENTER', C)
K['box'](2.18, 0.93, 0.5, 'KEY_ENTER_shell', M('KW_Cream'), C, (0, 0, 0), (0, 0, 0), root, bev=0.07)
K['box'](0.62, 0.16, 0.012, 'KEY_ENTER_shell_plate', M('KW_WarmBrass'), C, (-0.72, -0.3, 0.5), (0, 0, 0), root)
K['box'](0.5, 0.05, 0.006, 'KEY_ENTER_shell_groove', M('KW_MatteCharcoal'), C, (-0.72, -0.3, 0.512), (0, 0, 0), root)
mini = K['empty']('KEY_ENTER_mini', C, (0.72, -0.1, 0.8), 0.02, root)
# terrace (right half)
K['box'](0.98, 0.78, 0.12, 'KEY_ENTER_terrace', M('KW_Stone'), C, (0.55, 0.02, 0.5), (0, 0, 0), root)
K['box'](1.0, 0.8, 0.015, 'KEY_ENTER_terrace_lip', M('KW_BronzeDark'), C, (0.55, 0.02, 0.605), (0, 0, 0), root)
K['stairs']('KEY_ENTER_stairs', 0.2, 0.045, 0.04, 3, C, (0.05, -0.16, 0.5), -math.pi / 2, root, 'KW_Stone', rail=True)
# landmark tower
K['building']('KEY_ENTER_tower', 0.3, 0.3, 0.55, C, (0.72, 0.1, 0.62), root, wall='KW_MatteCharcoal', roof='KW_BronzeDark', floors=2, cols=1, roofkind='flat')
for sx, sy in [(-0.11, -0.11), (0.11, -0.11), (-0.11, 0.11), (0.11, 0.11)]:
    K['cyl'](0.014, 0.78, 'KEY_ENTER_lattice', M('KW_WarmBrass'), C, (0.72 + sx, 0.1 + sy, 1.2), (0, 0, 0), 6, None, root)
for z in (1.38, 1.62, 1.86):
    for a in range(4):
        K['box'](0.25, 0.012, 0.012, 'KEY_ENTER_lattice_b', M('KW_WarmBrass'), C, (0.72 + (0.11 if a == 1 else -0.11 if a == 3 else 0), 0.1 + (0.11 if a == 0 else -0.11 if a == 2 else 0), z), (0, 0, a * math.pi / 2), root, center=True)
K['box'](0.2, 0.2, 0.03, 'KEY_ENTER_lantern_base', M('KW_BronzeDark'), C, (0.72, 0.1, 1.98), (0, 0, 0), root)
K['box'](0.14, 0.14, 0.16, 'KEY_ENTER_lantern', M('KW_Lamp'), C, (0.72, 0.1, 2.01), (0, 0, 0), root)
K['box'](0.18, 0.18, 0.025, 'KEY_ENTER_lantern_cap', M('KW_BronzeDark'), C, (0.72, 0.1, 2.17), (0, 0, 0), root)
K['cyl'](0.006, 0.22, 'KEY_ENTER_antenna', M('KW_BronzeDark'), C, (0.72, 0.1, 2.195), (0, 0, 0), 6, None, root)
K['sph'](0.014, 'KEY_ENTER_antenna_tip', M('KW_Ember'), C, (0.72, 0.1, 2.42), 6, 4, root)
# annex + plants + lamps on the terrace
K['building']('KEY_ENTER_annex', 0.34, 0.26, 0.28, C, (0.36, 0.2, 0.62), root, wall='KW_Plaster3', roof='KW_BronzeDark', floors=1, cols=2, roofkind='terrace', door=False)
K['plant']('KEY_ENTER_plant_a', C, (0.3, 0.02, 0.62), 0.035, root)
K['lamp_post']('KEY_ENTER_lp_a', C, (0.95, -0.3, 0.62), 0.24, root)
# left half: street, two houses, a tree, a lamp, a bench
K['box'](0.9, 0.12, 0.01, 'KEY_ENTER_street', M('KW_Stone'), C, (-0.5, -0.02, 0.5), (0, 0, 0), root)
K['building']('KEY_ENTER_house_a', 0.3, 0.26, 0.4, C, (-0.86, 0.22, 0.5), root, wall='KW_Plaster2', roof='KW_Awning2', floors=1, cols=2, roofkind='gable', rot=0.08)
K['building']('KEY_ENTER_house_b', 0.26, 0.28, 0.56, C, (-0.42, 0.24, 0.5), root, wall='KW_Plaster3', roof='KW_BronzeDark', floors=2, cols=1, roofkind='terrace', door=True)
K['tree']('KEY_ENTER_tree', C, (-0.16, 0.25, 0.5), 0.42, root, 0, 3)
K['lamp_post']('KEY_ENTER_lp_b', C, (-0.62, -0.15, 0.5), 0.26, root)
K['box'](0.16, 0.05, 0.05, 'KEY_ENTER_bench', M('KW_Walnut'), C, (-0.9, -0.22, 0.5), (0, 0, 0), root)
K['plant']('KEY_ENTER_plant_b', C, (-0.3, -0.3, 0.5), 0.03, root, 'KW_Awning1')
K['box'](0.9, 0.02, 0.02, 'KEY_ENTER_conduit', M('KW_Metal'), C, (0.55, -0.39, 0.53), (0, 0, 0), root)
K['box'](0.03, 0.01, 0.01, 'KEY_ENTER_led', M('KW_Ember'), C, (0.1, -0.395, 0.535), (0, 0, 0), root)
objs = [o for o in bpy.data.objects if o.name.startswith('KEY_ENTER') and o.type == 'MESH']
r1 = K['export'](objs, A + r'\key_enter.json', {'frame': {'scale': mini.scale[0], 'offset': K['web'](mini.location)}, 'kind': 'district'}, q=10000, root=root, group=lambda o: 'shell' if '_shell' in o.name else 'mini')

# ================= PLAZA (the ' key): a charcoal cap carrying a brass gate, a bench, paving and a lamp =================
root = K['empty']('KEY_PLAZA', C)
K['box'](0.93, 0.93, 0.5, 'KEY_PLAZA_shell', M('KW_DarkPlastic'), C, (0, 0, 0), (0, 0, 0), root, bev=0.07)
K['box'](0.7, 0.7, 0.01, 'KEY_PLAZA_paving', M('KW_Stone'), C, (0, 0, 0.5), (0, 0, 0), root)
for i in range(3): K['box'](0.7, 0.012, 0.004, 'KEY_PLAZA_joint', M('KW_BronzeDark'), C, (0, -0.2 + i * 0.2, 0.51), (0, 0, 0), root)
# the architectural frame: two brass posts and a lintel, a doorway into nowhere: the plaza's landmark
for sx in (-0.18, 0.18): K['box'](0.04, 0.04, 0.62, 'KEY_PLAZA_post', M('KW_WarmBrass'), C, (sx, 0.12, 0.51), (0, 0, 0), root)
K['box'](0.48, 0.05, 0.05, 'KEY_PLAZA_lintel', M('KW_WarmBrass'), C, (0, 0.12, 1.13), (0, 0, 0), root)
K['box'](0.36, 0.03, 0.14, 'KEY_PLAZA_sign', M('KW_Cream'), C, (0, 0.12, 0.96), (0, 0, 0), root)
K['box'](0.3, 0.005, 0.02, 'KEY_PLAZA_signline', M('KW_LineGlow'), C, (0, 0.095, 1.02), (0, 0, 0), root)
K['box'](0.28, 0.07, 0.03, 'KEY_PLAZA_bench', M('KW_Walnut'), C, (-0.1, -0.22, 0.58), (0, 0, 0.1), root)
for sx in (-0.2, 0.0): K['box'](0.03, 0.06, 0.08, 'KEY_PLAZA_benchleg', M('KW_BronzeDark'), C, (sx, -0.22, 0.51), (0, 0, 0.1), root)
K['lamp_post']('KEY_PLAZA_lp', C, (0.28, -0.24, 0.51), 0.34, root)
K['plant']('KEY_PLAZA_plant', C, (-0.28, 0.28, 0.51), 0.045, root, 'KW_Awning2')
K['tree']('KEY_PLAZA_tree', C, (0.26, 0.3, 0.51), 0.4, root, 2, 5)
objs = [o for o in bpy.data.objects if o.name.startswith('KEY_PLAZA') and o.type == 'MESH']
r2 = K['export'](objs, A + r'\key_plaza.json', {'kind': 'plaza'}, q=10000, root=root, group=lambda o: 'shell' if '_shell' in o.name else 'mini')

# ================= GARDEN (the ; key): a sunken garden with a pond, low walls and a conifer =================
root = K['empty']('KEY_GARDEN', C)
K['box'](0.93, 0.93, 0.5, 'KEY_GARDEN_shell', M('KW_DarkPlastic'), C, (0, 0, 0), (0, 0, 0), root, bev=0.07)
K['box'](0.74, 0.74, 0.03, 'KEY_GARDEN_wall', M('KW_Stone'), C, (0, 0, 0.5), (0, 0, 0), root)
K['box'](0.64, 0.64, 0.02, 'KEY_GARDEN_bed', M('KW_Grass'), C, (0, 0, 0.5), (0, 0, 0), root)
K['cyl'](0.16, 0.012, 'KEY_GARDEN_pond', M('KW_WarmGlass'), C, (0.12, -0.1, 0.52), (0, 0, 0), 16, None, root)
K['torus'](0.17, 0.015, 'KEY_GARDEN_pondrim', M('KW_Stone'), C, (0.12, -0.1, 0.525), (0, 0, 0), 16, 6, root)
K['tree']('KEY_GARDEN_pine', C, (-0.2, 0.18, 0.52), 0.62, root, 1, 2)
K['tree']('KEY_GARDEN_tree', C, (0.22, 0.22, 0.52), 0.34, root, 0, 7)
for i in range(4): K['box'](0.08, 0.08, 0.008, 'KEY_GARDEN_step', M('KW_Stone'), C, (-0.28 + i * 0.1, -0.22 + (i % 2) * 0.04, 0.52), (0, 0, 0.2), root)
K['lamp_post']('KEY_GARDEN_lp', C, (-0.28, -0.28, 0.52), 0.22, root)
K['box'](0.1, 0.06, 0.06, 'KEY_GARDEN_shed', M('KW_Walnut'), C, (0.28, -0.3, 0.52), (0, 0, 0), root)
K['prism'](0.12, 0.08, 0.04, 'KEY_GARDEN_shedroof', M('KW_Awning1'), C, (0.28, -0.3, 0.58), (0, 0, 0), root)
objs = [o for o in bpy.data.objects if o.name.startswith('KEY_GARDEN') and o.type == 'MESH']
r3 = K['export'](objs, A + r'\key_garden.json', {'kind': 'garden'}, q=10000, root=root, group=lambda o: 'shell' if '_shell' in o.name else 'mini')
bpy.ops.wm.save_mainfile()
result = {'enter': r1, 'plaza': r2, 'garden': r3}
