"""Keyboard checks: dialog focus trap + Escape + focus return; drawer nav on mobile; tabs arrow keys; skip link."""
import sys, re
from playwright.sync_api import sync_playwright
B = sys.argv[1]; res = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto(B + '/index.html#/showcase'); pg.wait_for_timeout(300)
    opener = pg.get_by_role('button', name='Open dialog'); opener.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(100)
    inside = all(pg.evaluate("!!document.activeElement.closest('[role=dialog]')") or pg.keyboard.press('Tab') for _ in range(1)) 
    ok = True
    for _ in range(8):
        pg.keyboard.press('Tab'); ok &= pg.evaluate("!!document.activeElement.closest('[role=dialog]')")
    res.append(('Tab stays inside dialog', ok))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    res.append(('Escape closes dialog', pg.get_by_role('dialog').count() == 0))
    res.append(('Focus returns to opener', pg.evaluate("document.activeElement.textContent") == 'Open dialog'))
    tab = pg.get_by_role('tab', name=re.compile('^First tab')); tab.focus(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(50)
    res.append(('Arrow keys move between tabs', pg.evaluate("document.activeElement.getAttribute('aria-selected')") == 'true' and 'Second' in pg.evaluate("document.activeElement.textContent")))
    m = b.new_page(viewport={'width': 390, 'height': 800}); m.goto(B + '/index.html#/'); m.wait_for_timeout(300)
    m.get_by_role('button', name='Open menu').click(); m.wait_for_timeout(100)
    res.append(('Mobile menu opens as dialog with focus inside', m.evaluate("!!document.activeElement.closest('[role=dialog]')")))
    m.keyboard.press('Escape'); m.wait_for_timeout(100); res.append(('Mobile menu closes with Escape', m.get_by_role('dialog').count() == 0))
    pg.goto('about:blank'); pg.goto(B + '/index.html#/courses'); pg.wait_for_timeout(300); pg.keyboard.press('Tab')
    res.append(('Skip link is the first Tab stop', pg.evaluate("document.activeElement.textContent") == 'Skip to main content'))
    pg.keyboard.press('Enter'); res.append(('Skip link moves focus to <main>', pg.evaluate("document.activeElement.id") == 'main'))
    pg.goto(B + '/index.html#/signup'); pg.wait_for_timeout(200); pg.get_by_role('button', name='Create account').click(); pg.wait_for_timeout(100)
    res.append(('Error summary takes focus after submit', pg.evaluate("document.activeElement.className") == 'error-summary'))
    pg.get_by_label('Full name').fill('Test'); pg.wait_for_timeout(100)
    res.append(('Typing after errors keeps focus in the field', pg.evaluate("document.activeElement.tagName") == 'INPUT'))
    b.close()
for n, ok in res: print('PASS' if ok else 'FAIL', n)
