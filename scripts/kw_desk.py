import bpy, builtins, math, os
ns = {}; exec(open(os.path.join(os.path.dirname(bpy.data.filepath), '..', 'scripts', 'kw_blender.py')).read(), ns)
K = builtins.KW; M = K['M']
A = r'C:\Users\annisa 05\Documents\Proyekan\keyboardweb\assets'
C = bpy.data.collections['13_DESK_ENVIRONMENT']
for o in [o for o in list(C.all_objects) if o is not None and o.name.startswith(('DK_Lamp', 'DK_Mug', 'DK_Plant', 'DK_Cable'))]: bpy.data.objects.remove(o, do_unlink=True)

# ---- desk lamp (web lamp group at x -15, z -8 → blender y +8). Articulated: base, lower arm, elbow, upper arm, shade at web (4.2, 6.2, 3.0)
bx, by = -15.0, 8.0
K['cyl'](1.6, 0.22, 'DK_Lamp_base', M('KW_BronzeDark'), C, (bx, by, 0), (0, 0, 0), 32)
K['cyl'](1.2, 0.12, 'DK_Lamp_base2', M('KW_WarmBrass'), C, (bx, by, 0.22), (0, 0, 0), 32)
K['sph'](0.3, 'DK_Lamp_joint0', M('KW_WarmBrass'), C, (bx, by, 0.5), 12, 8)
# lower arm: from (0,0,0.5) to elbow E=(1.4,-0.6,5.4)
def arm(name, a, b, r=0.11):
    dx, dy, dz = b[0] - a[0], b[1] - a[1], b[2] - a[2]; L = math.sqrt(dx * dx + dy * dy + dz * dz)
    from mathutils import Vector
    v = Vector((dx, dy, dz)); rot = v.to_track_quat('Z', 'Y').to_euler()
    K['cyl'](r, L, name, M('KW_BronzeDark'), C, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), rot, 10, None, None, True, True)
E = (bx + 1.4, by - 0.6, 5.6); S = (bx + 4.2, by - 3.0, 6.2)
arm('DK_Lamp_arm1', (bx, by, 0.5), E); arm('DK_Lamp_arm1b', (bx + 0.25, by, 0.5), (E[0] + 0.25, E[1], E[2]), 0.08)
K['sph'](0.32, 'DK_Lamp_elbow', M('KW_WarmBrass'), C, E, 12, 8)
K['cyl'](0.09, 0.9, 'DK_Lamp_spring', M('KW_Metal'), C, (E[0] - 0.5, E[1] + 0.3, E[2] - 0.2), (0.4, 0.9, 0), 8)
arm('DK_Lamp_arm2', E, S)
K['sph'](0.26, 'DK_Lamp_wrist', M('KW_WarmBrass'), C, S, 12, 8)
# shade: a cone, mouth facing down and slightly forward; the web bulb sits at shade-local (0,-0.9,0) rotated (0.55,0,-0.55)
from mathutils import Vector, Euler
sh = bpy.data.objects.new('DK_Lamp_shadeE', None); sh.location = S; C.objects.link(sh)
aim = Vector((0.55, -0.42, -0.72)).normalized()   # mouth of the shade: down and towards the keyboard
sh.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
K['cone'](1.55, 1.8, 'DK_Lamp_shade', M('KW_Bronze'), C, (0, 0, -1.9), (0, 0, 0), 32, sh, True)
K['cyl'](1.58, 0.06, 'DK_Lamp_rim', M('KW_WarmBrass'), C, (0, 0, -1.92), (0, 0, 0), 32, None, sh)
K['cyl'](0.35, 0.45, 'DK_Lamp_neck', M('KW_BronzeDark'), C, (0, 0, -0.35), (0, 0, 0), 12, None, sh)
K['cyl'](0.05, 3.2, 'DK_Lamp_cord', M('KW_Rubber'), C, (bx - 1.2, by + 0.6, 0.02), (math.pi / 2, 0, 0.5), 6, None, None, True, True)

# ---- mug (web -13.4, z -3.6 → blender y 3.6): thick ceramic, a coffee surface, a handle, a saucer
mx, my = -13.4, 3.6
K['cyl'](1.3, 0.08, 'DK_Mug_saucer', M('KW_Ceramic'), C, (mx, my, 0), (0, 0, 0), 32)
K['cyl'](0.98, 2.0, 'DK_Mug_body', M('KW_Ceramic'), C, (mx, my, 0.08), (0, 0, 0), 32, 0.88)
K['torus'](0.93, 0.07, 'DK_Mug_lip', M('KW_Ceramic'), C, (mx, my, 2.08), (0, 0, 0), 32, 8)
K['cyl'](0.86, 0.02, 'DK_Mug_coffee', M('KW_MatteCharcoal'), C, (mx, my, 1.9), (0, 0, 0), 32)
K['torus'](0.55, 0.13, 'DK_Mug_handle', M('KW_Ceramic'), C, (mx + 0.95, my, 1.15), (math.pi / 2, 0, 0), 20, 8)
K['box'](0.9, 0.02, 0.3, 'DK_Mug_band', M('KW_Awning1'), C, (mx, my - 0.99, 0.6))

# ---- plant (web 14.2, z -5.8 → blender y 5.8): terracotta pot, soil, a branching plant with layered foliage
px, py = 14.2, 5.8
K['cyl'](1.05, 1.5, 'DK_Plant_pot', M('KW_Awning1'), C, (px, py, 0), (0, 0, 0), 24, 0.8)
K['torus'](1.0, 0.09, 'DK_Plant_potlip', M('KW_Awning1'), C, (px, py, 1.5), (0, 0, 0), 24, 8)
K['cyl'](0.92, 0.04, 'DK_Plant_soil', M('KW_Ground'), C, (px, py, 1.46), (0, 0, 0), 24)
K['tree']('DK_Plant_tree', C, (px, py, 1.4), 3.4, None, 2, 11)
K['tree']('DK_Plant_tree2', C, (px + 0.4, py - 0.3, 1.4), 2.4, None, 0, 4)

# ---- monitor cable management: a cable from the stand down the back and along the wall foot
K['cyl'](0.09, 6.0, 'DK_Cable_1', M('KW_Rubber'), C, (0.6, 8.6 + 2.6, 0.02), (0, math.pi / 2, 0), 6, None, None, True, True)
K['cyl'](0.09, 2.6, 'DK_Cable_2', M('KW_Rubber'), C, (0.6, 8.6 + 1.3, 0.2), (math.pi / 2, 0, 0), 6, None, None, True, True)
K['box'](0.5, 1.2, 0.12, 'DK_Cable_clip', M('KW_MatteCharcoal'), C, (2.4, 8.6 + 2.6, 0)); K['box'](0.5, 1.2, 0.12, 'DK_Cable_clip2', M('KW_MatteCharcoal'), C, (-1.4, 8.6 + 2.6, 0))

objs = [o for o in list(C.all_objects) if o is not None and o.type == 'MESH']
r = K['export'](objs, A + r'\desk_props.json', None, q=500, group=lambda o: o.name)
bpy.ops.wm.save_mainfile()
result = {'desk': r, 'n': len(objs)}
