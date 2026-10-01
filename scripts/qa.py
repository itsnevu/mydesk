"""Headless QA driver: python3 scripts/qa.py [step ...]. Screenshots go to /tmp/kw-qa/."""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright

OUT = os.environ.get('KW_OUT', '/tmp/kw-qa'); os.makedirs(OUT, exist_ok=True)
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))
W, H = int(os.environ.get('KW_W', 1024)), int(os.environ.get('KW_H', 640))

async def main(steps):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await pg.route('**/*googleapis*', lambda r: r.abort()); await pg.route('**/*gstatic*', lambda r: r.abort())
        await pg.goto(URL + os.environ.get('KW_HASH',''), wait_until='commit')
        n = 0
        async def shot(name):
            nonlocal n; n += 1
            await pg.screenshot(path=f'{OUT}/{n:02d}-{name}.png')
        async def st():
            return await pg.evaluate('({s: window.__kw?.state.current, cam: window.__kw?.xp.camera.position.map(v=>+v.toFixed(2)), tgt: window.__kw?.xp.camera.target.map(v=>+v.toFixed(2)), scene: window.__kw?.xp.sceneName, draws: window.__kw?.xp.renderer.drawCalls, found:[...(window.__kw?.xp.found||[])], hash: location.hash})')
        for s in steps:
            if s.startswith('wait:'): await pg.wait_for_timeout(int(float(s[5:]) * 1000))
            elif s.startswith('shot:'): await shot(s[5:])
            elif s.startswith('click:'):
                sel = s[6:]
                if sel.startswith('@'):
                    x, y = map(float, sel[1:].split(','))
                    await pg.mouse.move(x, y); await pg.wait_for_timeout(120); await pg.mouse.down(); await pg.wait_for_timeout(40); await pg.mouse.up()
                else: await pg.click(sel)
            elif s.startswith('hover:'):
                x, y = map(float, s[6:].split(','))
                await pg.mouse.move(x, y)
            elif s.startswith('key:'): await pg.keyboard.press(s[4:])
            elif s.startswith('drag:'):
                x0, y0, x1, y1 = map(float, s[5:].split(','))
                await pg.mouse.move(x0, y0); await pg.mouse.down();
                for i in range(1, 11): await pg.mouse.move(x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10); await pg.wait_for_timeout(16)
                await pg.mouse.up()
            elif s.startswith('wheel:'): await pg.mouse.wheel(0, float(s[6:]))
            elif s.startswith('eval:'): print('eval →', await pg.evaluate(s[5:]))
            elif s == 'state': print('state →', json.dumps(await st()))
            elif s == 'settle':
                for _ in range(80):
                    if not await pg.evaluate('!!window.__kw.xp.flight || window.__kw.state.current==="SWITCHING"'): break
                    await pg.wait_for_timeout(100)
                await pg.wait_for_timeout(150)
            elif s.startswith('activate:'): await pg.evaluate(f"window.__kw.xp.activate('{s[9:]}')")
            elif s.startswith('vp:'):
                w, h = map(int, s[3:].split('x')); await pg.set_viewport_size({'width': w, 'height': h})
        print('\n'.join(logs[-40:]))
        await b.close()

asyncio.run(main(sys.argv[1:]))
