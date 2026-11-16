"""Lightweight automated accessibility lint (not a full audit, not a substitute for testing with assistive tech).
Per route: controls without an accessible name, images/svgs exposed without alt, form fields without labels,
h1 count, skipped heading levels, duplicate ids. Usage: python3 tools/a11y_lint.py http://localhost:8765"""
import sys, importlib.util
V, A, B, T, G = '', 'u-amaka', 'u-bola', 'u-tunde', 'u-grace'
src = open('tools/crawl.py').read(); ROUTES = eval(src[src.index('ROUTES = [') + 9: src.index(']\nWIDTHS') + 1])
from playwright.sync_api import sync_playwright
JS = r"""() => {
 const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') || '').split(' ').map(i => document.getElementById(i)?.textContent || '').join('') || (el.labels && [...el.labels].map(l => l.textContent).join('')) || el.textContent || el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('placeholder') || '').trim();
 const vis = (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
 const out = [];
 document.querySelectorAll('button, a[href], [role=button], [role=tab], [role=switch]').forEach(el => { if (vis(el) && !name(el)) out.push('unnamed control: ' + el.outerHTML.slice(0, 80)); });
 document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => { if (!name(el) && !(el.id && document.querySelector(`label[for="${el.id}"]`))) out.push('unlabelled field: ' + el.outerHTML.slice(0, 80)); });
 document.querySelectorAll('img').forEach(el => { if (!el.hasAttribute('alt')) out.push('img without alt'); });
 document.querySelectorAll('svg').forEach(el => { if (!el.closest('[aria-hidden=true]') && el.getAttribute('aria-hidden') !== 'true' && !el.closest('[role=img]') && !el.getAttribute('aria-label')) out.push('svg exposed: ' + (el.parentElement?.outerHTML || '').slice(0, 60)); });
 const main = document.querySelector('main') || document.body;
 const hs = [...main.querySelectorAll('h1,h2,h3,h4')].filter(h => vis(h) && !h.closest('[role=dialog]')).map(h => +h.tagName[1]);
 const h1 = hs.filter(x => x === 1).length; if (h1 !== 1) out.push('h1 count ' + h1);
 for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { out.push(`heading skip h${hs[i-1]}→h${hs[i]}`); break; }
 const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1); Object.entries(ids).filter(([, n]) => n > 1).forEach(([i]) => out.push('duplicate id ' + i));
 if (!document.querySelector('main')) out.push('no main landmark');
 return out;
}"""
issues = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto(sys.argv[1] + '/index.html#/'); pg.wait_for_timeout(300); cur = None
    for n, route, persona in ROUTES:
        if persona != cur: pg.select_option('#demo-role', persona); cur = persona; pg.wait_for_timeout(60)
        pg.evaluate(f"location.hash='#{route}'"); pg.wait_for_timeout(150)
        r = pg.evaluate(JS)
        for x in r: issues.setdefault(x, []).append(route)
    b.close()
print(len(issues), 'distinct issues')
for k, v in sorted(issues.items(), key=lambda kv: -len(kv[1]))[:40]: print(len(v), k, '|', v[:3])
