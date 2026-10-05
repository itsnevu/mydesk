# KeyboardWeb

The portfolio of Navy Gibran, full-stack developer: a desk at night in a furnished room, a mechanical keyboard, and everything typed on it.
Built on a small custom WebGL2 engine (renderer with shadow mapping, ACES tone mapping and a depth-of-field pass, orbit controls,
raycasting, tween system). **Zero runtime dependencies**: nothing to install.

## Run

```bash
npm run dev      # → http://localhost:5173  (tiny node static server, no deps; PORT=… to change it)
npm run build    # → dist/index.html  (single self-contained file, deploy anywhere)
npm run smoke    # → BOOT OK in ~1 s, no browser: every import names a real export, and the world builds in Node
```

`npm run preview` is the same dev server (it serves the sources, not `dist/`); to check a build, open `dist/index.html` directly or serve `dist/`.
Any static server works for the sources too (`npx serve`, VS Code Live Server, `python -m http.server`), with two differences from
`scripts/serve.js`: it won't repack `assets/*.kwb` from a newer JSON, and it won't serve `public/` at the root, so project pages fall back to
their generated cards. Needs a WebGL2-capable browser, and Node 18+ for the scripts.

## Deploy (Vercel)

`vercel.json` has it set up: Vercel runs `npm run build` and serves `dist/` (the self-contained `index.html` plus `shots/`; routes are
hash-based, so no rewrites). `.vercelignore` keeps `_to_delete/`, a local `dist/`, `node_modules/`, the `.blend` files and the Blender Python
scripts out of the upload.

```bash
npx vercel          # first time: log in, link the project, preview deploy
npx vercel --prod   # production
```

The like counter (the heart above the sound toggle) is the one server piece, and it lives on the VPS, not on Vercel: see
`server/README.md`. If it is down the heart simply stays hidden. `npm run dev` keeps a pretend count in memory.

Or push the folder to GitHub and import it at vercel.com/new (framework preset "Other"; the build settings come from `vercel.json`).

## The experience

The desk is the home world. The objects are the navigation. The projects are miniature worlds.

**The intro is a place, not a page.** The room is dark; a brass ENTER key (with sound) and a cream QUIET key (no sound) sit on a walnut plate
in front of the keyboard, the name plate beside them. Press one (or Enter / Space): the plate sinks into the desk, the lamp, then the monitor,
then the keyboard wake, and the camera makes one continuous move to the desk. **See the work →** below skips in quietly and opens the
project pages. The intro happens once.

| Object / key | Click → immediate reaction → camera → reveal |
| --- | --- |
| **Monitor** (W or Enter) | the right screen ("Hi, I'm Navy") wakes and lists the work → camera pushes in → hands over to a work district on the keyboard (01, or the last work world visited). On a phone held upright the project pages open instead |
| **Work districts** (F1 to F3, or 1 to 3) | Signal District (01 GodPlan ERP), Market Street (02 Client Websites), the Greenhouse (03 JAKASN), built into the key bed: the first click settles the camera on the district with a short note, the second goes through it into the **world** |
| **Enter key** (a miniature district on an ivory cap) | the same two steps into 08 **About** |
| **O, X, ], F8** (diorama keys) | 04 Education, 05 Early Days, 06 How I Work, 07 Career: the key depresses, its miniature lights, a note opens beside it; each further click goes one layer closer (up to three), each with its own text |
| **Paper note** (A, the "about" and "me" keys, or the name top left) | the note lifts → About beside it |
| **Lamp** (S) | lamp switches on → the skills appear as type on the desk mat under the light (it goes back off on leaving if it was off) |
| **Desk clock** (P) | hands sweep → Timeline beside it: every project, newest first, by year; a row opens its world or its page |
| **Mouse** (C) | a door straight into 09 **Contact**, where the phone opens the links and a message form that sends through WhatsApp |
| **Keyboard** (any plain key or the frame) | keys ripple, the navigation keys light → the keyboard becomes the hero |
| **Coffee** | steam + a small message |
| **Esc** | slow cinematic orbit of the desk · **Fn** cycles the backlight (amber, warm white, ember, off) · **Space / M** or the speakers: sound |

**Also on the keyboard:** F3 (a cap lifted off its switch), H (a sapling through the cap), [ (a staircase into the plate), ' (a plaza),
; (a sunken garden), F5 to F7 (the mechanism bay) and Scroll Lock (the secret).

**Around the desk and the room:** the notebook (`builder_manifesto.ts`), the Mandarin book (opens to Lesson 1), the study model, the plant,
the watch box (the hands keep your local time), the PC (the tech stack), the chair (sit where Navy works), the katana, the pull-up bar,
Satoshi, the road bike (B), the running medals; and toggles: the neon, the desk lamp, the curtains, the room lights, the door, the air
conditioner. Every book on the shelf is a project: pointed at, it slides out and names itself; clicked, it opens its world or its page.
On desktop everything that does something names itself on hover, with its number or shortcut key.

**Inside a world:** left drag rotate · right drag pan · scroll zoom (constrained). Brass pins mark the places: click one, it nudges, the camera
glides in and its story appears beside it (in About the bench opens the About panel, in Contact the phone opens the contact form). In the three
work worlds **View project** appears after two places have been inspected (Enter does the same). ← → slide to the neighbouring world (all nine,
wrapping); Esc closes a place, then goes back out through the world's door on the desk.

**Project page:** the live site in a browser frame with the phone version in front (projects listed in `SHOTS`; the others get a generated
study card), industry · stack · date, a link to the live site, *back to the world* where there is one, and a strip of every project.
← → step through them, Esc goes back.

**HUD:** the name (About), the discovery counter, the menu (About, Projects, Skills, Index, Contact), back, sound, **? Guide** (also G, or the
button drawn on the screen: what to click for what, every row takes you there) and **See the work →**.

**Discovery:** 35 discoveries, one per intended interaction (`DISCOVERY_ORDER`), counted in three groups by where to look
(`DISCOVERY_GROUPS`: 17 on the keyboard, 12 on the desk, 6 around the room). They persist for the session (`sessionStorage`), each new one
gets a quiet "discovered · n of 35 found" notice, the counter opens a list of what's left per group with a hint (a found one there takes you
back to it), and all 35 → KEYBOARD MAPPED.

**Routes** (`src/app/router.js`): `#project-<key>` opens that project's world when it has one, otherwise its page; `#<target>` opens a desk
target (`#note`, `#lamp`, `#clock`, `#chair`…). A link opened cold still goes through the gate and lands after the intro. The first step in from
the desk adds one history entry, so the browser's (or the phone's) Back button closes what was opened instead of leaving the site; moving on
replaces that entry, and the scene follows Back / Forward.

## Keyboard shortcuts

`Experience.onKeyDown` in `src/app/experience.js` (G is in `src/app/guide.js`). "Desk" includes an object in focus and the overview orbit.

| Key | Where | Does |
| --- | --- | --- |
| Enter / Space | gate | come in with sound / quietly |
| A · S · C · W · P | desk | About (note) · Skills (lamp) · Contact (mouse, into its world) · Projects (monitor) · Timeline (clock) |
| F1 to F3, or 1 to 3 | desk | the work districts: GodPlan ERP, Client Websites, JAKASN; press again to go in |
| Enter | desk | Projects (monitor) |
| B | desk | the road bike |
| Space, M | after the gate | sound on / off (music and effects) |
| G | after the gate | the guide |
| Esc | after the gate | free on the desk: the slow orbit; otherwise back one step (an open menu, guide or discovery list closes first) |
| ← → | world · project page | previous / next world · previous / next project |
| Enter | work world | the project page, once two places are inspected |

Ctrl / Cmd / Alt chords are left to the browser, typing in the contact form stays in the form, Enter / Space on a focused button press that
button, and keys the 3D board shares with yours dip their caps as you type.

## How it's made

- **The keycap is the portal.** A world trigger presses down, the fill light moves onto it while the room dims, and the camera flies into it.
  `frameStage()` computes the pose that looks at the miniature exactly as the world camera looks at the full district; at that instant the
  scenes swap (`emerge()`), so there is no overlay and no cut. Esc reverses it through the same object (`leaveWorld()`). A world's geometry
  loads on its first entry; worlds sit `WORLD_SPACING` apart, so ← → is a camera move over the gap.
- **Hero clusters** (`scripts/kw_clusters.py` → `assets/cluster_*.json`): districts set into the key bed where caps were removed: Signal
  District (7 to 0 + U, I), Market Street (R, T / F, G / V, B), the Greenhouse (the six navigation keys) and the Mechanism Bay (F5 to F7:
  exposed switches, springs, a bronze gantry).
- **Diorama keys** (`assets/key_04..07.json`): O a glass greenhouse-library, X an elevated platform, ] a studio, F8 a mountain outpost, each
  holding its world's own geometry; the key's `frame` {scale, offset} maps the world onto it exactly. The Enter key (`key_enter`,
  `scripts/kw_enter.py`) is an ivory cap carrying a small district with a landmark tower; `'` and `;` are `key_plaza` and `key_garden`; F3, H, [ and Scroll Lock are
  `key_micro_*` and `key_secret`.
- **Interactive lighting.** A miniature's windows and lamps sleep until the camera comes close or its key is hovered or pressed (`__wake` in
  `world.update`), and the tungsten pool over the board drifts to whichever one is awake. Worlds wake during the approach (`d.wake`) and
  their point lights brighten as the camera nears them.
- **The room is code** (`src/app/room.js` and the prop modules): walls, a window onto a city at night, the bookshelf, three monitors, the PC,
  speakers, chair, bike, plants. Static parts are baked into one mesh per material (`src/app/bake.js`), and Blender assets merge meshes that
  share a material, to keep draw calls down.
- **Keycaps.** Row-sculpted profile (height, taper, tilt per row), per-cap tone and roughness variation, on the Blender chassis
  (`keyboard_body`). Vegetation in the Blender assets is seeded: the same seed gives the same tree on every export.

## Engine notes

- **Renderer** (`src/engine/renderer.js`): one forward shader (hemisphere light, a directional light with a 3×3 PCF shadow map, up to four
  point lights, fresnel rim, fog, ACES, specular anti-aliasing). Frustum culling against each geometry's cached bounding sphere; the shadow
  map is redrawn every other frame and only for casters inside the light's box; a uniform and texture-binding cache sends a draw only what
  changed. The frame renders into a 4× MSAA buffer, then a post pass adds depth of field around the camera's focus distance and a vignette;
  both passes end in a static dither so the dark gradients don't band. Adaptive pixel ratio: up to `min(devicePixelRatio, 1.5)`, lowered when
  frames run long (to 1, or 0.75 on dense screens) and raised again when there is headroom; `renderer.adaptive = false` pins it,
  `renderer.culling = false` draws everything.
- **Controls** (`src/engine/controls.js`): damped orbit. In the room the camera slides along the walls and rounds corners instead of
  stopping; zoom eases onto its limits and stops where zooming out would change nothing on screen; at the desk the wheel or a pinch zooms
  toward the cursor; pulling far back raises the view over the room. On touch one finger rotates only past a 10 px slop (a tap never turns
  the view), two fingers pinch and pan.
- **Picking** (`src/engine/raycast.js`): a ray against each mesh's local box (an OBB in world space). A box the ray starts inside is ignored,
  so one big hit volume can't swallow every click; still, keep hit volumes tight.
- **Audio** (`src/app/audio.js`): all procedural WebAudio, no files: a slow pad as room tone, and every click, tick and rustle. One master bus
  → compressor → soft-clip ceiling, so stacked sounds never clip. `keyPress(pitch, { pan, w })` pans with the key's place on the board and
  makes long caps (1.75u and up) deeper with a stabilizer rattle; `keyRelease` is the upstroke on keyup. Mute is total silence (music and
  effects; the audio thread suspends once the pad has faded), and `setHidden` freezes it while the tab is hidden, waking only if sound was on.

## Asset pipeline

Blender (`assets/keyboardweb.blend`) → `assets/*.json` → `assets/*.kwb` → the page.

1. **Export.** `scripts/kw_blender.py` (exec it inside Blender → `builtins.KW`) holds the helper toolkit and the `kwbin1` exporter: one mesh
   entry per object and material, Blender Z-up turned into web Y-up, positions int16 × q (set per export, from 100 for the rooms to 10000
   for the key and cluster miniatures), normals int8, indices u16/u32, base64 in JSON, the Principled BSDF as the engine material. Extras
   ride along: `kind`, the portal `frame`, `hotspots` (from `HS_*` empties) and `lights` (from `LT_*` empties). `kw_clusters.py`,
   `kw_enter.py`, `kw_rooms.py` and `kw_desk.py` build and export their parts; each writes to a hard-coded `A = r'…\assets'` path at the
   top, so point it at your checkout first.
2. **Pack.** `scripts/kwpack.js` turns a JSON into kwb2: `KWB2` + zlib(header length, header JSON, blob). Identical vertices are welded
   (except in `desk_props`, whose lamp shade needs its vertices as authored), positions become delta-coded int16 byte planes, normals int8
   planes, indices zigzag-delta varints; lossless for what the engine draws. `node scripts/kwpack.js [name…]` packs by hand, and the dev server
   repacks `NAME.kwb` whenever `NAME.json` is newer (a JSON caught mid-export gets a 404, so the loader falls back to the JSON).
3. **Load.** `loadAsset(name)` (`src/engine/assets.js`) takes the inlined kwb2 in a build, otherwise `assets/NAME.kwb`, then `assets/NAME.json`.
   It inflates with its own synchronous inflater (DecompressionStream ran about 30× slower beside the render loop), and `buildAsset` merges
   meshes that share a material into one draw.

## Build output

`npm run build` (`scripts/build.js`) writes:

- **`dist/index.html`**: one self-contained file that works from `file://` too. The ES modules are bundled in dependency order into one inline
  script (each module a scoped function in a small module table) and the CSS is inlined. Every asset the code names as a string literal
  (`'world_02'`, `'desk_props'`…) is packed to kwb2 and inlined as base64 in a non-executing `<script type="application/octet-stream"
  id="kwa-NAME">`, decoded only when first used, so unvisited worlds cost nothing at startup. Assets nobody names are left out (the log lists
  them); a JSON caught mid-export falls back to its last good `.kwb`.
- **`dist/shots/`** (and anything else in `public/`), copied as is: the screenshots stay out of the HTML and load when a project page first opens.
- **`dist/artifact.html`**: the same page as a body-only fragment, for hosts that wrap it in their own document (not written on Vercel).

JS and CSS get a light minify (`scripts/jsmin.js`: comments, indentation and extra spaces go, newlines stay so ASI is untouched; strings,
templates and regexes pass through byte for byte), kept only if a second pass changes nothing and the result parses; otherwise the readable
bundle ships. The bundler understands `import { a, b as c } from '…'`, `import * as x from '…'`, `export const / let / function / class` and
`export { … }`; any other import or export form stops the build instead of shipping a raw `import`. A module missing from the import map in
`index.html` is bundled from `src/<spec>.js` with a warning (the dev server still needs the entry). `KW_OUT=dir` builds somewhere else.

## QA notes

- Run `npm run smoke` first (`scripts/smoke.js`, ~1 s, no browser). It checks that every `import { x } from 'y'` names something `y`
  exports (in the browser a missing export stops the whole page from loading) and builds the world in Node with a stub canvas, printing
  `BOOT OK` or the stack. It exits 1 on failure, so it can gate a capture: `npm run smoke && node capture.mjs`.
- When the page is left alone for 20 s it renders at half rate (the overview orbit excepted); any input restores 60 fps. A capture that
  measures frame times should move the pointer first.
- Visual checks run in headless Chrome over CDP, against `npm run dev` or the built `dist/index.html`. It renders WebGL on the CPU
  (SwiftShader) and is heavy: one instance at a time, only the screenshots you need, then close Chrome and stop the server. No loops, no
  parallel runs.
- `scripts/qa.py` is an optional Playwright driver for `dist/index.html` (build first), e.g.
  `python scripts/qa.py wait:10 "eval:__kw.xp.enter({music:false})" settle activate:note settle shot:note state`.
  Steps: `wait:s`, `shot:name`, `click:@x,y` (or a selector), `hover:x,y`, `key:Key`, `drag:x0,y0,x1,y1`, `wheel:dy`, `eval:js`, `state`,
  `settle` (waits out camera flights), `activate:id`, `vp:WxH`. Env: `KW_W` / `KW_H` (1024 × 640), `KW_HASH` (a route), `KW_OUT` (screenshots,
  `/tmp/kw-qa`; careful, `build.js` reads `KW_OUT` as its output folder).
- Hooks: `window.__kw = { xp, state }` (`src/main.js`).
  - `xp.enter({ music: false })` leaves the gate quietly; until then the camera drifts on its own every frame.
  - `xp.activate(id)` does what a click on that target does: any `TARGETS` id (`'note'`, `'signal'`, `'monitor'`, `'work'`, `'esc'`…).
  - `xp.renderer.adaptive = false` pins the resolution, so shots aren't soft from a slow software renderer.
  - `xp.flyTo({ position, target })` parks the camera and leaves the controls off, so it stays put; `xp.settle('desk')` hands control back.
  - Read `state.current`, `xp.sceneName`, `xp.flight` (null once a move has settled), `xp.renderer.drawCalls`, `xp.found`.
  - Pick test after changing a hit volume: set `xp.pointer.ndcX` / `ndcY` and `xp.pointer.moved = true`, call `xp.updateHover()`, read
    `xp.hovered`; from the home view and zoomed out.

## Structure

```
index.html            dev entry (import map → src/) and the HTML layers (HUD, panel, project page)
src/styles.css        identity & UI layers
src/main.js           bootstrap, deep links and routes, UI wiring; exposes window.__kw
src/engine/           math, geometry, scene graph, WebGL2 renderer, controls, raycast, tween, canvas textures, asset loader
src/app/theme.js      colour tokens, materials, lighting rig  ← one place for the whole palette
src/app/data.js       ALL content (site, worlds, projects, targets, discoveries, shots)  ← edit this
src/app/world.js      the desk: keyboard layout, hero clusters, diorama keys, screens, clock, note, lamp, mouse, mug, the gate
src/app/room.js       the room: walls, window + city, bookshelf of projects, chair, bike, PC, speakers…
src/app/<prop>.js     hand-built props (monitors, pc, speakers, chair, bike, plant, watches, mandarin, satoshi, …)
src/app/dioramas.js   the project worlds: Blender exports on a plinth, hotspots, pins, camera framing
src/app/gallery.js    generated "study" cards for projects without a screenshot
src/app/experience.js state-driven controller: camera flights, interaction, discovery, keyboard, scene switching
src/app/ui.js         HUD, menu, spatial panel, project page, discovery list · src/app/guide.js the guide
src/app/router.js     hash routes + history · state.js state machine · motion.js motion tokens · audio.js sound · bake.js baking
public/shots/         real screenshots of the live client sites (+ manifest.json)
assets/               Blender exports (.json), their packs (.kwb), keyboardweb.blend
scripts/              serve.js dev server · build.js bundler · kwpack.js asset packer · jsmin.js minifier
                      kw_*.py Blender toolkit + exporters · qa.py headless QA driver (optional, needs playwright)
```

## Replacing content

Everything textual lives in `src/app/data.js`: `SITE` (name, links, about, skills; the lines printed on the note and the screen have fixed
lengths), `WORLDS` (the nine worlds; hotspot ids belong to the geometry and stay as they are, and the first hotspot is the note a key shows),
`PROJECTS` (project pages, the clock's timeline, the bookshelf), `CHAPTERS` (records for the who-I-am worlds), `TARGETS` (everything
clickable), `DISCOVERY_ORDER` / `DISCOVERY_GROUPS`, `MENU`. A project page shows the live site when its key is in `SHOTS` and it has a `url`:
put `public/shots/<key>.webp` (desktop) and `<key>-m.webp` (phone) in place (`manifest.json` there records each capture). Everything else
gets a generated study card (`studyTexture` in `src/app/gallery.js`), so there is nothing to license.

## The keyboard tells the story

- **Every miniature is a real thing** (`src/app/kbtown.js`, built in code on the Blender shells, which keep only their stone steps):
  - **Client Websites** (market cluster): thirteen shops, one per live client site, each with its trade on the roof (glasses over NF Optical, a ship over Miniatur Kapal, a flying elephant over Gajah Terbang) and its name over the door. A free lot at the top of the street says "your site here" and opens Contact.
  - **GodPlan ERP** (signal cluster): the dashboard tower, the modules (Employees, Attendance, Payroll, CRM), the core with its database, lit lines from the core to every door, the phone, a crane still up, and a bridge to the Gajah Terbang shop (the same client twice).
  - **JAKASN** (nav cluster): a civic hall between the OJS press and BKNPEDIA, the PHP · MySQL core, the internship annex.
  - **The chapter keys**: O the campus (OOP board, GPA plaque, ID/EN/中文 signpost), X the field work (a crew carrying TVs up a stair, a table of laptops), ] the process (four stations and a parcel on a belt), F8 keeps its mountain with a flag per year, Enter the workshop.
- Once a district has the focus, each building is its own target: a shop names its client and opens its page (back returns to the street), a module opens its note.
- **The story** (`STORY` in data.js): the orange bookmark key, T, the menu's Story or `#story` walks the board in time order with a caption card; the keys between two stops light up as if typed. The last stop ends on "say hello".
- **The map**: while the keyboard has the focus, a label floats over each district (numbers only on a phone).
- Checks without a browser: `npm run smoke`.

## Credits

- The cat (`public/cat/`) is "Medium poly Cat In Motion 3d Model Free" by [iRahulRajput](https://sketchfab.com/rt699448) on [Sketchfab](https://sketchfab.com/3d-models/medium-poly-cat-in-motion-3d-model-free-5c31c77904de4e458d434c167ea0f4bc), licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Changed here: repacked and rigged in code (`app/cat`), texture cleaned of flat pale bake patches and downsized to 1024 px.
