# Assumptions, decisions and usability fixes

Some rules in the brief are unresolved or contradictory. For those, the prototype uses a labelled working assumption. Items marked **Open** need a decision from the product or business owner before build. IDs D-01 to D-22 continue the decision log from the low-fidelity wireframes.

## Carried over from the wireframes and applied in the frontend

| ID | Topic | Working assumption in this build | Status |
|---|---|---|---|
| D-01 | First-course offer | Applied automatically. Only a successful paid enrolment uses it up; a failed payment doesn’t. Once per account. | Open |
| D-02 | When access starts | The one-year period starts when access is granted, including after a delayed bank confirmation. | Provisional |
| D-03 | Refund eligibility | No rule exists. The instructor decides case by case and sees lesson progress and graded work as context. | Open |
| D-04 | Access during a refund | Access continues while a refund is pending and ends when the refund is completed. | Provisional |
| D-05 | Which quiz attempt counts | The highest graded attempt counts. | Provisional |
| D-08 | Recordings | Recordings are published with captions within 48 hours. | Provisional |
| D-09 | Payment providers | Card, bank transfer and USSD are simulated. Stripe and PayPal aren’t shown. | Open (implementation) |
| D-11 | Name corrections | The certificate is reissued as a new version with the same reference, and verification notes the reissue. | Provisional |
| D-13 | US$ estimate | An illustrative rate of ₦1,550 = US$1, always labelled “estimate”. The rate lives in `utils/format.ts`. | Open (implementation) |
| D-14 | Transfer and USSD timing | Bank transfers have 24 hours to confirm; USSD codes last 10 minutes. Both are editable in Admin → Settings. | Provisional |
| D-15 | Duplicate payments | Any pending payment for a course blocks a new checkout for that course, whatever the payment method. | Provisional |
| D-17 | Certificate reviewers | Reviewers use public verification only and need no account. Instructors are invited by an administrator. | Provisional |
| D-20 | Lesson completion | The learner marks a lesson complete; time spent on the video isn’t enforced. | Provisional |

## New in the high-fidelity build

| ID | Topic | Working assumption | Status |
|---|---|---|---|
| D-23 | Refund roles | Learner requests → instructor decides course-related requests (from the instructor dashboard) → administrator processes and completes. Administrators can also decide payment problems directly from the Refund review. | Provisional |
| D-24 | Demo calendar | The date is pinned to 16 Nov 2026 so the seeded data stays coherent. | Prototype only |
| D-25 | Editing published courses | Course settings are read-only once a course is published. A material-change review flow is described in the UI but not built. | Open |
| D-26 | Certificate issue | Issued automatically the moment every requirement is met, with no manual approval step. | Provisional |
| D-27 | Grade visibility | Instructors can save a draft grade, which the learner can’t see. Publishing notifies the learner and updates progress and eligibility. | Provisional |

## Usability problems found and addressed

| Problem | Fix |
|---|---|
| Learners could pay twice while a bank transfer was pending. | Checkout is blocked with an explanation, and every pending state says “don’t pay again”. |
| A failed or interrupted payment was easy to mistake for a definite failure. | A **declined** payment (no money taken; retry allowed) is shown separately from an **interrupted** one (outcome unknown; no “pay again” button until the result is checked). |
| “Refund approved” could be read as “money returned”. | Approval and completion are separate steps on the learner timeline, with separate notifications. |
| Lesson progress was easily confused with grades. | Lessons, graded work and certificate eligibility are always shown as three separate things. |
| On mobile, the price and Enrol button were far below the fold on course details. | A sticky price bar plus a price card near the top. On checkout, the order summary appears before the payment action. |
| The error summary took focus on every re-render, pulling users out of the field they were typing in. | Found in keyboard testing. It now takes focus once per new set of errors. |
| The muted text token failed contrast on the subtle surface. | The token was adjusted (see README). |
| Long labels and status badges overflowed at 320px. | Buttons and badges now wrap. Verified at 320, 390, 768, 1024 and 1440px. |
| Internal support notes could be confused with replies. | Internal notes are visually distinct, labelled “not visible to learner” and filtered out of the learner view (checked in scenario 6). |
| Users can’t see what the public can see about their certificate. | A “See what employers see” link opens the public verification view. |
