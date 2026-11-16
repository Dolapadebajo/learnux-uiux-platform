"""Renders every reference view (and key alternative states) at 320/390/768/1024/1440 px with the right persona.
Flags: page errors, console errors, horizontal page overflow, unexpected 'not found'/restricted screens.
Usage: python3 tools/crawl.py http://localhost:8765 [shots_dir]"""
import sys, json, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else None
V, A, B, T, G = '', 'u-amaka', 'u-bola', 'u-tunde', 'u-grace'
ROUTES = [  # (view number, route, persona)
 (1,'/',V),(2,'/courses',V),(2,'/courses?demo=loading',V),(2,'/courses?q=blockchain',V),(3,'/courses/UXF-101',V),(3,'/courses/IXD-210',A),(3,'/courses/DT-100',A),
 (4,'/signup?course=UXF-101',V),(5,'/verify-email',V),(5,'/verify-email?demo=expired',V),(6,'/login',V),(7,'/checkout/UXF-101',B),(7,'/checkout/IXD-210',A),(7,'/checkout/DT-100',A),
 (8,'/checkout/UXF-101/status/TXN-260214-0087',A),(9,'/learn',A),(9,'/learn?demo=loading',A),(10,'/learn/courses/UXF-101',A),(10,'/learn/courses/A11Y-150',A),
 (11,'/learn/courses/UXF-101/lessons/L18',A),(11,'/learn/courses/UXF-101/lessons/L20?demo=unavailable',A),(11,'/learn/courses/UXF-101/lessons/L18?demo=offline',A),(11,'/learn/courses/UXF-101/lessons/L10',A),
 (12,'/checkout/IXD-210/status/TXN-261112-0428',A),(12,'/checkout/IXD-210/status/TXN-261112-0431',A),(12,'/checkout/IXD-210/status/TXN-261112-0428?demo=interrupted',A),
 (13,'/help',V),(13,'/help/bank-transfer-pending',V),(13,'/help?q=zoom',V),(14,'/verify',V),(14,'/verify/CERT-DT-25-0342',V),(14,'/verify/CERT-UID-25-0119',V),(14,'/verify/CERT-XYZ-00-0000',V),(14,'/verify/CERT-DT-25-0342?demo=service',V),
 (15,'/forgot-password',V),(16,'/reset-password',V),(16,'/reset-password?demo=expired',V),(17,'/learn/payments',A),(17,'/learn/payments/TXN-260214-0087',A),(18,'/learn/payments/TXN-261109-0419/refund',A),
 (19,'/learn/profile',A),(20,'/learn/settings',A),(21,'/learn/notifications',A),(22,'/learn/support/new?ref=TXN-261112-0431',A),(22,'/learn/support',A),(23,'/learn/support/SUP-1182',A),
 (24,'/learn/courses',A),(25,'/learn/courses/UXF-101/assessments',A),(26,'/learn/courses/UXF-101/quiz/uxf-q2',B),(26,'/learn/courses/UXF-101/quiz/uxf-q2?demo=exhausted',A),
 (27,'/learn/courses/UXF-101/assignment/uxf-a1',A),(27,'/learn/courses/UXF-101/assignment/uxf-a1?demo=uncertain',A),(28,'/learn/courses/UXF-101/quiz/uxf-q1/results',A),(29,'/learn/courses/UXF-101/assignment/uxf-a1/feedback',B),
 (30,'/learn/progress',A),(31,'/learn/courses/UXF-101/discussions',A),(32,'/learn/courses/UXF-101/discussions/T-1',A),(33,'/learn/certificates',A),(34,'/learn/certificates/UXF-101',A),(34,'/learn/certificates/UXF-101',B),
 (35,'/teach',T),(36,'/teach/courses',T),(37,'/teach/courses/ROB-130/settings',T),(38,'/teach/courses/ROB-130/curriculum',T),(39,'/teach/courses/ROB-130/lessons/L58',T),(40,'/teach/courses/UXF-101/assessments',T),
 (41,'/teach/submissions',T),(42,'/teach/submissions/SUB-3311',T),(43,'/teach/courses/UXF-101/learners',T),(44,'/teach/courses/UXF-101/learners/u-amaka',T),(45,'/teach/courses/UXF-101/announcements',T),(46,'/teach/courses/UXF-101/analytics',T),
 (47,'/admin',G),(48,'/admin/users',G),(49,'/admin/users/u-tunde',G),(50,'/admin/roles',G),(51,'/admin/courses',G),(51,'/admin/courses/UXF-101',G),(52,'/admin/enrolments',G),(53,'/admin/transactions',G),
 (54,'/admin/transactions/TXN-261112-0431',G),(55,'/admin/refunds',G),(55,'/admin/refunds?id=RFD-0052',G),(56,'/admin/support',G),(56,'/admin/support/SUP-1182',G),(57,'/admin/certificates',G),(58,'/admin/certificates/CERT-DT-25-0342',G),
 (59,'/admin/reports',G),(60,'/admin/settings',G),(0,'/showcase',V),(0,'/coverage',V),(0,'/learn',V),(0,'/admin',A),(0,'/learn/courses/UID-201/lessons/L25',A),
]
WIDTHS = [320, 390, 768, 1024, 1440]
EXPECT_BLOCK = {('/learn', V), ('/admin', A), ('/learn/courses/UID-201/lessons/L25', A)}
problems = []; covered = set()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for w in WIDTHS:
        ctx = b.new_context(viewport={'width': w, 'height': 900}); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
        pg.goto(BASE + '/index.html#/'); pg.wait_for_timeout(300); cur = None
        for n, route, persona in ROUTES:
            if persona != cur:
                pg.select_option('#demo-role', persona); pg.wait_for_timeout(80); cur = persona
            errs.clear(); pg.evaluate(f"location.hash = '#{route}'"); pg.wait_for_timeout(260 if 'verify/' in route else 120)
            txt = pg.inner_text('body'); sw = pg.evaluate('document.documentElement.scrollWidth')
            bad = []
            if errs: bad += errs
            if sw > w + 1: bad.append(f'horizontal overflow {sw}px')
            blocked = ('We can’t find that page' in txt) or ('Please log in to continue' in txt) or ('don’t have access' in txt) or ('This lesson is locked' in txt)
            if blocked != ((route, persona) in EXPECT_BLOCK): bad.append('unexpected blocked/not-found' if blocked else 'expected restriction missing')
            if bad: problems.append((w, n, route, persona or 'visitor', bad[:3]))
            elif n: covered.add(n)
            if SHOTS and w in (390, 1440) and n:
                os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f"{SHOTS}/{n:02d}_{route.strip('/').replace('/','_').replace('?','_').replace('=','-')[:60] or 'home'}_{w}.png", full_page=True)
        ctx.close()
    b.close()
print('views covered without problems at all widths:', len([n for n in range(1, 61) if n in covered and not any(pr[1] == n for pr in problems)]), '/ 60')
print('checks:', len(ROUTES) * len(WIDTHS), 'problems:', len(problems))
for pr in problems[:60]: print(pr)
