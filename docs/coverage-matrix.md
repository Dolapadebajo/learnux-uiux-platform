# Coverage matrix

All 60 reference views from the design-system brief, where each is implemented, and how to inspect its alternative states. Generated from `src/app/coverage.ts` (also rendered in the app at `#/coverage`).

- **One responsive app.** Every view is a single responsive implementation, checked at 320, 390, 768, 1024 and 1440 px.
- **No duplicate routes.** Views share routes where the task does (for example, payment failure is a state of the payment status route). Alternative states use `?demo=<state>` or the demo data itself.
- **Personas.** Learner routes need a learner persona, `/teach` needs Tunde Bakare and `/admin` needs Grace Eze. Switch persona in the Demo bar.

## A. Discovery and first lesson

| # | Reference view | Route | Implemented as | State variants |
|---|---|---|---|---|
| 1 | Homepage | `#/` | Route | Signed out / signed in header |
| 2 | Course catalogue with search and filters | `#/courses` | Route; filters, sort and search in URL | ?demo=loading · ?q=blockchain (no results) · Filters drawer on mobile |
| 3 | Course details | `#/courses/UXF-101` | Route | Visitor / eligible offer · Already enrolled · Payment pending (/courses/IXD-210 as Amaka) · Free course (/courses/DT-100) |
| 4 | Create account | `#/signup?course=UXF-101` | Route | Validation errors (submit empty) · Email already registered (amaka.obi@example.com) |
| 5 | Email verification | `#/verify-email` | Route | Check inbox · ?demo=resent · ?demo=expired · Verified |
| 6 | Login | `#/login` | Route | Wrong details (unknown email) · Return to checkout after login |
| 7 | Checkout | `#/checkout/UXF-101` | Route; method + scenario selection | Card / bank transfer / USSD · Promo applied or not eligible · Blocked by unresolved payment (/checkout/IXD-210 as Amaka) · Card validation errors |
| 8 | Payment successful | `#/checkout/UXF-101/status/:txn` | Route (status of a transaction) | Successful + receipt |
| 9 | Learner dashboard | `#/learn` | Route | Returning learner · New learner (after sign-up) · ?demo=loading |
| 10 | Course overview | `#/learn/courses/UXF-101` | Route | Active · Access ended (/learn/courses/A11Y-150) · Locked: not enrolled |
| 11 | Lesson player | `#/learn/courses/UXF-101/lessons/:lesson` | Route; contents panel collapses on mobile | Video / reading · ?demo=unavailable · ?demo=offline · Unavailable resource row (lesson 6.3) |
| 12 | Payment failure and recovery | `#/checkout/:course/status/:txn` | State of the payment status route | Declined (definite) — retry allowed · Pending (bank/USSD) — no re-pay · Interrupted (?demo=interrupted) |

## B. Account, payments and support

| # | Reference view | Route | Implemented as | State variants |
|---|---|---|---|---|
| 13 | Help centre | `#/help` | Route + article route /help/:slug | Search no results |
| 14 | Public certificate verification | `#/verify` | Route; result at /verify/:ref | Valid · Revoked (CERT-UID-25-0119) · Not found · Service failure (?demo=service) · Checking |
| 15 | Forgot password | `#/forgot-password` | Route | Request · Sent (neutral wording) |
| 16 | Reset password | `#/reset-password` | Route | Form + validation · ?demo=expired · Success |
| 17 | Payment history and receipt | `#/learn/payments` | Route + receipt at /learn/payments/:txn | Successful, pending, failed, refunded rows · Empty (new learner) |
| 18 | Refund request | `#/learn/payments/TXN-261109-0419/refund` | Route; tracking on the transaction page | Validation errors · Submitted → approved → completed / declined |
| 19 | Learner profile | `#/learn/profile` | Route | Validation error (empty name) · Saved |
| 20 | Account settings | `#/learn/settings` | Route (tabs) | Notifications · Accessibility & media · Security (simulated) |
| 21 | Notifications | `#/learn/notifications` | Route | Unread / read toggle · Filter by type · Empty filter |
| 22 | Contact support | `#/learn/support/new` | Route; ticket list at /learn/support | Prefilled from a payment · Validation |
| 23 | Support ticket conversation | `#/learn/support/SUP-1182` | Route | Open · Awaiting your reply · Resolved |

## C. Learning, assessments and certificates

| # | Reference view | Route | Implemented as | State variants |
|---|---|---|---|---|
| 24 | My courses | `#/learn/courses` | Route (tabs) | Active / Completed / Ended · Payment pending card |
| 25 | Course assessments | `#/learn/courses/UXF-101/assessments` | Route | Not started, passed, awaiting grading, attempts used |
| 26 | Quiz-taking interface | `#/learn/courses/UXF-101/quiz/uxf-q2` | Route | Instructions · In progress · Unanswered warning · Attempts exhausted (?demo=exhausted) |
| 27 | Assignment submission | `#/learn/courses/UXF-101/assignment/uxf-a1` | Route | Draft saved · Upload error (file name containing “fail”) · Submitted · awaiting grading · ?demo=uncertain |
| 28 | Quiz results | `#/learn/courses/UXF-101/quiz/uxf-q2/results` | Route | Passed · Below pass mark · Practice attempt |
| 29 | Assignment feedback | `#/learn/courses/UXF-101/assignment/uxf-a1/feedback` | Route | Awaiting grading · Passed · Revision requested |
| 30 | Learning progress | `#/learn/progress` | Route | Per course |
| 31 | Course discussions | `#/learn/courses/UXF-101/discussions` | Route | New question dialog · Search no results |
| 32 | Discussion thread | `#/learn/courses/UXF-101/discussions/T-1` | Route | Instructor reply highlighted · Reply validation |
| 33 | My certificates | `#/learn/certificates` | Route | Issued, in progress, revoked · Empty |
| 34 | Certificate details and eligibility | `#/learn/certificates/UXF-101` | Route | Not eligible · Awaiting grading · Issued · Revoked · Name correction dialog |

## D. Instructor workspace

| # | Reference view | Route | Implemented as | State variants |
|---|---|---|---|---|
| 35 | Instructor dashboard | `#/teach` | Route | Refund decisions panel |
| 36 | Instructor course management | `#/teach/courses` | Route | Draft, in review, changes requested, published |
| 37 | Course settings | `#/teach/courses/ROB-130/settings` | Route | Validation · Saved · Locked while in review |
| 38 | Curriculum builder | `#/teach/courses/ROB-130/curriculum` | Route | Reorder with buttons · Add module/lesson · Submit for review checklist |
| 39 | Lesson editor | `#/teach/courses/ROB-130/lessons/:lesson` | Route | Missing captions warning · Saved · Delete confirmation |
| 40 | Assessment builder | `#/teach/courses/UXF-101/assessments` | Route | Edit question · Add/remove question · Platform rules locked |
| 41 | Submission review queue | `#/teach/submissions` | Route | Needs grading / graded filter · Empty |
| 42 | Grading workspace | `#/teach/submissions/SUB-3311` | Route | Save draft (not visible to learner) · Publish · Below pass mark → revision |
| 43 | Course learner list | `#/teach/courses/UXF-101/learners` | Route | Filters · Search no results |
| 44 | Individual learner progress | `#/teach/courses/UXF-101/learners/u-amaka` | Route | — |
| 45 | Course announcements | `#/teach/courses/UXF-101/announcements` | Route | Compose + validation · Posted |
| 46 | Course analytics | `#/teach/courses/UXF-101/analytics` | Route | — |

## E. Administration

| # | Reference view | Route | Implemented as | State variants |
|---|---|---|---|---|
| 47 | Administration dashboard | `#/admin` | Route | — |
| 48 | User management | `#/admin/users` | Route | Filter/search · No results |
| 49 | User details | `#/admin/users/u-tunde` | Route | Role change confirmation · Suspend confirmation |
| 50 | Roles and permissions | `#/admin/roles` | Route | — |
| 51 | Course review and approval | `#/admin/courses` | Route + /admin/courses/:id | Request changes · Approve & publish · Nothing to review |
| 52 | Enrolment management | `#/admin/enrolments` | Route + detail drawer | Extend / end access confirmations |
| 53 | Transaction list | `#/admin/transactions` | Route | Status filters |
| 54 | Transaction details | `#/admin/transactions/TXN-261112-0431` | Route | Pending → confirm or mark not received · Successful · Refunded |
| 55 | Refund review | `#/admin/refunds` | Route + detail drawer | Awaiting instructor · Approved → complete · Declined |
| 56 | Support queue with staff ticket handling | `#/admin/support` | Route + /admin/support/:id | Assign, status, priority · Internal notes · Reply |
| 57 | Certificate management | `#/admin/certificates` | Route | Filter valid/revoked |
| 58 | Certificate record | `#/admin/certificates/CERT-DT-25-0342` | Route | Revoke confirmation · Reinstate · Correct name |
| 59 | Platform reports | `#/admin/reports` | Route | — |
| 60 | Platform settings | `#/admin/settings` | Route | Saved · Disable payment method confirmation |

## Quick links to alternative states

These are also available in the app under **Demo bar → States & journeys**.

**Journeys (start here)**

- 1 · Find course → register → pay → enrol → lesson: `#/courses` (as visitor)
- 2 · Complete quiz → results → progress: `#/learn/courses/UXF-101/quiz/uxf-q2` (as u-bola)
- 3 · Submit assignment → instructor grades → feedback: `#/learn/courses/UXF-101/assignment/uxf-a1` (as u-amaka)
- 4 · Complete requirements → certificate → verify: `#/learn/certificates/UXF-101` (as u-bola)
- 5 · Payment failure → recovery: `#/checkout/UXF-101` (as visitor)
- 6 · Support request → staff reply → learner response: `#/learn/support/new` (as u-amaka)
- 7 · Refund request → staff decisions → updated status: `#/learn/payments/TXN-261109-0419/refund` (as u-amaka)

**Loading & empty**

- Catalogue loading: `#/courses?demo=loading`
- Catalogue no results: `#/courses?q=blockchain`
- Dashboard loading: `#/learn?demo=loading` (as u-amaka)
- Help search no results: `#/help?q=zoom%20link`

**Errors & recovery**

- Verification link expired: `#/verify-email?demo=expired`
- Reset link expired: `#/reset-password?demo=expired`
- Payment interrupted (unknown outcome): `#/checkout/UXF-101/status/TXN-261112-0428?demo=interrupted` (as u-amaka)
- Declined payment: `#/checkout/IXD-210/status/TXN-261112-0428` (as u-amaka)
- Pending bank transfer: `#/checkout/IXD-210/status/TXN-261112-0431` (as u-amaka)
- Video unavailable: `#/learn/courses/UXF-101/lessons/L18?demo=unavailable` (as u-amaka)
- Offline while learning: `#/learn/courses/UXF-101/lessons/L18?demo=offline` (as u-amaka)
- Submission uncertain: `#/learn/courses/UXF-101/assignment/uxf-a1?demo=uncertain` (as u-amaka)
- Quiz attempts exhausted: `#/learn/courses/UXF-101/quiz/uxf-q2?demo=exhausted` (as u-amaka)
- Verification service failure: `#/verify/CERT-DT-25-0342?demo=service` (as visitor)

**Restricted & locked**

- Learner page as visitor: `#/learn` (as visitor)
- Admin page as learner: `#/admin` (as u-amaka)
- Lesson in a course you have not joined: `#/learn/courses/UID-201/lessons/L25` (as u-amaka)
- Course access ended: `#/learn/courses/A11Y-150` (as u-amaka)

**Certificates**

- Valid certificate: `#/verify/CERT-DT-25-0342` (as visitor)
- Revoked certificate: `#/verify/CERT-UID-25-0119` (as visitor)
- Unknown reference: `#/verify/CERT-XYZ-00-0000` (as visitor)

## Supporting pages (not counted as reference views)

- **Component showcase:** `#/showcase`
- **Coverage matrix:** `#/coverage`
- **Not found / restricted access:** shared system states
