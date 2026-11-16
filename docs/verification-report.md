# Verification report

**Scope:** what was actually run and what wasn't. Run in the authoring sandbox on 16 Nov 2026, using headless Chrome via Playwright.

## Environment constraint

The sandbox had **no network access**, so `npm install` couldn’t fetch Vite, React Router, `@types/react` or `lucide-react`. What was used instead:

| Required by the brief | Used for verification here | In the delivered project |
|---|---|---|
| Vite production build | esbuild bundle of the same `src/` (`tools/build-local.mjs`) | `vite.config.ts`, `npm run build` |
| React Router | A small hash router implementing only the API subset used (`tools/shims/react-router-dom.tsx`) | `react-router-dom` ^7 in `package.json` |
| `tsc` with React types | Partial check with loose React stubs (`tools/typecheck.sh`) | `npm run typecheck` |
| One icon library | `react-icons/lu` (the Lucide set) | Same |

**Not run:** `npm run build`, `npm run typecheck`, and the app under the real `react-router-dom`. These should be the first things run after `npm install`. If the real router behaves differently from the shim anywhere, it’s most likely in nested-route matching or `NavLink` active states.

## Checks performed

| Check | Tool | Result |
|---|---|---|
| Bundle builds | `node tools/build-local.mjs` | ✅ Builds (JS ~590 KB minified, CSS ~53 KB) |
| Partial TypeScript check | `tools/typecheck.sh` | ✅ 0 errors once 50 stub-only `TS7006` (implicit any) lines are filtered. These come from the loose React stubs, not from app code. It found and fixed 2 real issues (duplicate default keys in profile settings). |
| Every reference view renders at **320, 390, 768, 1024 and 1440 px** with the right persona, including key alternative states | `tools/crawl.py` (94 routes × 5 widths = 470 renders) | ✅ **60/60 views, 0 problems.** There were no page or console errors, no horizontal page scrolling, and no unexpected “not found” or “restricted” screens. Expected restrictions (visitor on `/learn`, learner on `/admin`, a lesson in a course the learner hasn’t joined) were confirmed. |
| End-to-end journeys through real UI controls (clicks, typing, file upload) | `tools/journeys.py` at **1440, 390 and 320 px** | ✅ **8/8 at each width:** the 7 required journeys plus “pending transfer → staff confirms → access”. Validation errors, an upload failure, the internal note not leaking to the learner, and revocation changing public verification were all asserted. |
| Automated accessibility lint on all 94 routes | `tools/a11y_lint.py` | ✅ 0 issues. It checked for unnamed controls, unlabelled fields, exposed SVGs, `h1` count, heading-level skips, duplicate ids and the main landmark. It found and fixed 6 heading problems. |
| Keyboard behaviour | `tools/keyboard.py` | ✅ 10/10: the dialog focus trap, Escape to close, focus returning to the opener, arrow keys in tabs, the mobile menu opening and closing, the skip link as the first Tab stop moving focus to `<main>`, and the error summary taking focus without stealing it while typing. The last of these was **found as a bug and fixed**. |
| Colour contrast of every text/background pair used | `node tools/contrast.mjs` | ✅ All pass, after adjusting the muted text token and adding a focus-ring offset (see README) |
| Visual inspection of desktop and mobile screenshots | Screenshots of all views at 390 and 1440 px; contact sheets reviewed for each area | Reviewed: home, catalogue, course details, checkout, lesson player, payment failure, verification, payments, notifications, support thread, quiz, assignment, progress, certificate, the instructor dashboard, curriculum, grading, learners and analytics, and the admin dashboard, transactions, transaction detail, support ticket and certificate record. Fixed after review: demo-bar height on mobile, badge wrapping, the duplicate price card on course details, the learner-list progress labels and toast stacking. |

## What was not tested

- **Assistive technology:** no screen readers (NVDA, VoiceOver, TalkBack) and no testing with disabled users. No accessibility compliance is claimed.
- **Browsers:** only Chromium. Safari, Firefox and real mobile devices weren’t used.
- **Real-environment behaviour:** performance, real network latency and offline behaviour. Offline and error states are simulated with `?demo=`.
- **Usability:** no usability testing with participants.

## Remaining issues and limitations

- Drag-and-drop reordering, rubric editing and creating assessments for brand-new courses aren’t implemented.
- Video playback, file previews, downloads and emails are simulated; the UI says so.
- The persona switcher is a demo control, not security.
- Published-course material-change review is described but not built (decision D-25).
- Run `npm run build` and `npm run typecheck` with network access to complete the verification the brief asks for.
