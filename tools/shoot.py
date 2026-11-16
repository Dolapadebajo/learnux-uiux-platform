"""Screenshots routes at given widths from a local static server. Usage: shoot.py URLBASE out_dir route@width[@persona] ..."""
import sys, os
from playwright.sync_api import sync_playwright
base, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    errs = []
    for spec in sys.argv[3:]:
        parts = spec.split('@'); route, w = parts[0], int(parts[1]); persona = parts[2] if len(parts) > 2 else None
        ctx = b.new_context(viewport={'width': w, 'height': 900}, device_scale_factor=1)
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/index.html#/'); pg.wait_for_timeout(200)
        if persona is not None:
            pg.evaluate("p => { const s = JSON.parse(localStorage.getItem('learnux-demo-db') || 'null'); }", persona)
            pg.select_option('#demo-role', persona if persona != 'visitor' else ''); pg.wait_for_timeout(150)
        pg.evaluate(f"location.hash = '#{route}'"); pg.wait_for_timeout(700)
        name = (route.strip('/').replace('/', '_').replace('?', '_').replace('=', '-') or 'home') + f'_{w}' + (f'_{persona}' if persona else '')
        pg.screenshot(path=f'{out}/{name}.png', full_page=True)
        sw = pg.evaluate('document.documentElement.scrollWidth')
        if sw > w: errs.append(f'H-OVERFLOW {route} @{w}: {sw}px')
        ctx.close()
    b.close()
    print('\n'.join(errs) or 'no errors')
