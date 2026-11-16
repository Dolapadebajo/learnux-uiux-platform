"""End-to-end journeys driven only through the UI (clicks, typing, file upload). Run against a built copy.
Usage: python3 tools/journeys.py http://localhost:8765 [width]"""
import sys, re
from playwright.sync_api import sync_playwright, expect
BASE = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
results = []
def run(name, fn, pg):
    try: fn(pg); results.append((name, 'PASS', ''))
    except Exception as e: results.append((name, 'FAIL', str(e).splitlines()[0][:220])); pg.screenshot(path=f'/tmp/fail_{name[:2]}.png', full_page=True)
def go(pg, route): pg.evaluate(f"location.hash = '#{route}'"); pg.wait_for_timeout(150)
def persona(pg, pid): pg.select_option('#demo-role', pid); pg.wait_for_timeout(120)
def btn(pg, name, exact=True): return pg.get_by_role('button', name=name, exact=exact).or_(pg.get_by_role('link', name=name, exact=exact)).locator('visible=true').first
def see(pg, text): expect(pg.get_by_text(text, exact=False).locator('visible=true').first).to_be_visible(timeout=4000)
def dialog(pg): return pg.get_by_role('dialog')

def j1(pg):  # find course → register → pay → enrol → start lesson
    persona(pg, ''); go(pg, '/courses')
    pg.get_by_role('searchbox', name='Search courses').fill('research'); btn(pg, 'Search').click()
    see(pg, 'for “research”'); pg.get_by_role('link', name='UX Foundations: Research to Prototype').first.click()
    btn(pg, 'Enrol now').click(); see(pg, 'Continuing enrolment')
    btn(pg, 'Create account').click(); see(pg, 'There are 4 problems')  # validation first
    pg.get_by_label('Full name').fill('Ifeoma Nwosu'); pg.get_by_label('Email address').fill('ifeoma.n@example.com')
    pg.get_by_label('Password', exact=True).fill('ux-learner-2026'); pg.get_by_label(re.compile('I agree')).check(); btn(pg, 'Create account').click()
    see(pg, 'Check your email'); btn(pg, 'Open verification link').click()
    see(pg, 'First-course offer applied'); see(pg, '₦68,000')
    pg.get_by_label('Card number').fill('4111 1111 1111 1111'); pg.get_by_label('Expiry (MM/YY)').fill('08/28'); pg.get_by_label('Security code').fill('123')
    btn(pg, 'Pay ₦68,000').click(); see(pg, 'Payment successful — you’re enrolled')
    pg.get_by_role('link', name=re.compile('^Start lesson 1')).click(); see(pg, '1.1 Welcome and how this course works')
    btn(pg, 'Mark lesson complete').click(); see(pg, 'Lesson complete · 1 of 24 lessons')
def j2(pg):  # complete quiz → results → progress update
    persona(pg, 'u-bola'); go(pg, '/learn/courses/UXF-101/quiz/uxf-q2')
    pg.get_by_text(re.compile('^Graded attempt')).first.click()
    for ans in ['Exploring structure and content priority quickly', 'The steps a person takes to reach a goal', 'Designing around real content and its priority', 'As early as something can be tried', 'Adapt layout and priority to the screen']:
        pg.get_by_text(ans, exact=True).click()
        nxt = pg.get_by_role('button', name='Next question')
        if nxt.count(): nxt.click()
    btn(pg, 'Review and submit').click(); dialog(pg).get_by_role('button', name='Submit').click()
    see(pg, 'You scored 100%'); see(pg, 'All certificate requirements are met')
    go(pg, '/learn/progress'); see(pg, 'Passed · best 100%')
def j3(pg):  # submit assignment → instructor grades → learner sees feedback
    persona(pg, 'u-amaka'); go(pg, '/learn/courses/UXF-101/assignment/uxf-a1')
    btn(pg, 'Submit assignment').click(); see(pg, 'Add at least one file before submitting')
    pg.locator('input[type=file]').set_input_files({'name': 'audit-fail.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 demo'}); pg.wait_for_timeout(1300); see(pg, 'Upload interrupted')
    pg.get_by_role('button', name='Remove audit-fail.pdf').click()
    pg.locator('input[type=file]').set_input_files({'name': 'amaka-audit.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 demo'}); pg.wait_for_timeout(1300); see(pg, 'Uploaded')
    btn(pg, 'Submit assignment').click(); dialog(pg).get_by_role('button', name='Submit').click(); see(pg, 'Submitted — awaiting grading')
    persona(pg, 'u-tunde'); go(pg, '/teach/submissions'); pg.get_by_role('link', name=re.compile('^Grade Amaka Obi')).first.click()
    for lbl, v in [('Issues identified', '20'), ('Use of heuristics', '15'), ('Quality of fixes', '18'), ('Clarity', '10')]: pg.get_by_label(lbl).fill(v)
    pg.get_by_label('Feedback for the learner').fill('Clear audit. Next time link every issue to a named heuristic.')
    btn(pg, 'Publish feedback').click(); dialog(pg).get_by_role('button', name='Publish').click(); see(pg, 'Submission review queue')
    persona(pg, 'u-amaka'); go(pg, '/learn/courses/UXF-101/assignment/uxf-a1/feedback'); see(pg, 'Feedback: 63%'); see(pg, 'Clear audit.')
    go(pg, '/learn/notifications'); see(pg, 'Assignment A1 graded: 63%')
def j4(pg):  # requirements complete → certificate → verify (and revocation changes verification)
    persona(pg, 'u-bola'); go(pg, '/learn/certificates/UXF-101'); see(pg, 'Your certificate')
    ref = pg.locator('.certificate .mono').first.inner_text().split(' ')[0]
    persona(pg, ''); go(pg, '/verify'); pg.get_by_label('Certificate reference').fill(ref); btn(pg, 'Verify certificate').click(); see(pg, 'Valid certificate'); see(pg, 'Bola Adeyemi')
    persona(pg, 'u-grace'); go(pg, f'/admin/certificates/{ref}'); btn(pg, 'Revoke certificate').click(); dialog(pg).get_by_role('button', name='Revoke certificate').click()
    persona(pg, ''); go(pg, f'/verify/{ref}'); pg.wait_for_timeout(700); see(pg, 'This certificate has been revoked')
def j5(pg):  # payment failure → recovery
    persona(pg, 'u-amaka'); go(pg, '/courses/UID-201'); btn(pg, 'Enrol now').click()
    pg.get_by_label('Card number').fill('4000 0000 0000 0002'); pg.get_by_label('Expiry (MM/YY)').fill('08/28'); pg.get_by_label('Security code').fill('123')
    btn(pg, 'Pay ₦120,000').click(); see(pg, 'Your payment didn’t go through'); see(pg, 'No money was taken')
    btn(pg, 'Try again').click(); pg.get_by_label('Card number').fill('4111 1111 1111 1111'); pg.get_by_label('Expiry (MM/YY)').fill('08/28'); pg.get_by_label('Security code').fill('123')
    btn(pg, 'Pay ₦120,000').click(); see(pg, 'Payment successful — you’re enrolled')
def j6(pg):  # support request → staff reply → learner response
    persona(pg, 'u-amaka'); go(pg, '/learn/support/new')
    pg.get_by_label('Topic').select_option('Course content'); pg.get_by_label('Subject').fill('Lesson 6.3 checklist missing')
    pg.get_by_label('What’s happening?').fill('The session recording checklist in lesson 6.3 says it is unavailable.'); btn(pg, 'Send request').click()
    see(pg, 'Open — with support'); tid = pg.evaluate("location.hash.split('/').pop()")
    persona(pg, 'u-musa'); go(pg, f'/admin/support/{tid}'); pg.get_by_label('Internal note (staff only)').check(); pg.get_by_label('Internal note', exact=True).fill('Asked content team to re-upload.'); btn(pg, 'Save note').click()
    pg.get_by_label('Reply to learner').fill('Thanks Amaka — we have re-uploaded the checklist. Can you check?'); btn(pg, 'Send').click(); see(pg, 'Awaiting learner')
    persona(pg, 'u-amaka'); go(pg, f'/learn/support/{tid}'); see(pg, 'Support is waiting for your reply')
    assert pg.get_by_text('Asked content team').count() == 0, 'internal note leaked to learner'
    pg.get_by_label('Your reply').fill('Yes, it works now. Thank you!'); btn(pg, 'Send').click(); see(pg, 'Open — with support')
def j7(pg):  # refund request → staff decisions → updated status
    persona(pg, 'u-amaka'); go(pg, '/learn/payments/TXN-261109-0419/refund')
    btn(pg, 'Submit refund request').click(); see(pg, 'There are 3 problems')
    pg.get_by_label('Reason').select_option('Schedule doesn’t work for me'); pg.get_by_label('Tell us more').fill('The Wednesday sessions clash with my new shift.')
    pg.get_by_label(re.compile('I understand I keep access')).check(); btn(pg, 'Submit refund request').click(); dialog(pg).get_by_role('button', name='Submit request').click()
    see(pg, 'Awaiting instructor review')
    persona(pg, 'u-tunde'); go(pg, '/teach'); btn(pg, 'Approve').click(); dialog(pg).get_by_label('Reason (shared with the learner)').fill('Early in the course; schedule-related.'); dialog(pg).get_by_role('button', name='Approve').click()
    persona(pg, 'u-amaka'); go(pg, '/learn/payments/TXN-261109-0419'); see(pg, 'Approved — not yet refunded')
    persona(pg, 'u-grace'); go(pg, '/admin/refunds'); btn(pg, re.compile('^Process RFD'), exact=False).click(); pg.get_by_label('Provider refund reference').fill('RF-PRV-77120'); btn(pg, 'Mark refund completed').click(); dialog(pg).get_by_role('button', name='Mark completed').click()
    persona(pg, 'u-amaka'); go(pg, '/learn/payments/TXN-261109-0419'); see(pg, 'Refund completed'); go(pg, '/learn/courses/UXW-120'); see(pg, 'Your refund was completed, so access has ended')
def j8(pg):  # pending bank transfer → staff confirms → course unlocks
    persona(pg, 'u-amaka'); go(pg, '/checkout/IXD-210'); see(pg, 'You already have a payment in progress')
    persona(pg, 'u-grace'); go(pg, '/admin/transactions/TXN-261112-0431'); pg.get_by_label('Provider evidence reference').fill('PRV-88213'); btn(pg, 'Confirm payment & grant access').click(); dialog(pg).get_by_role('button', name='Confirm and grant access').click()
    persona(pg, 'u-amaka'); go(pg, '/learn/courses/IXD-210'); see(pg, 'Interaction Design for Mobile'); assert pg.get_by_text('This course unlocks when').count() == 0

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': W, 'height': 900}); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/index.html#/'); pg.wait_for_timeout(300); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(300)
    for name, fn in [('1 Find → register → pay → lesson', j1), ('2 Quiz → results → progress', j2), ('3 Assignment → grading → feedback', j3), ('4 Certificate → verify → revoke', j4), ('5 Payment failure → recovery', j5), ('6 Support → staff reply → learner', j6), ('7 Refund → decisions → status', j7), ('8 Pending transfer → staff confirm → access', j8)]:
        run(name, fn, pg)
    b.close()
for r in results: print(f'{r[1]}  {r[0]}  {r[2]}')
print('page errors:', errs[:5] or 'none')
