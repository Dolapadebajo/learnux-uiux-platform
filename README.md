# LearnUX: high-fidelity frontend prototype

This is a responsive React + TypeScript frontend for a fictional online learning platform for UI/UX courses. It turns the earlier low-fidelity wireframes into realistic, navigable screens that work on simulated data.

- **Coverage:** all **60 reference views** from the design-system brief.
- **Audiences:** visitors, learners, instructors, administrators and certificate verifiers.
- **Data:** everything is fictional and every service is simulated (see [Simulation boundaries](#simulation-boundaries)).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # TypeScript project check + production build to dist/
npm run typecheck  # TypeScript only
npm run preview    # serve the production build
```

Requires Node 20+. The app uses `HashRouter` and `base: './'`, so `dist/` runs from any static folder or file host.

### Opening it without a server

- **The root `index.html` won't load on its own.** It's Vite's development entry point and points at `src/main.tsx`, which browsers can't run directly. Use `npm run dev` instead.
- **`dist/index.html` won't open from a double-click either.** Vite outputs ES modules, and browsers block those on `file://` pages. Serve it with `npm run preview`, or with any static server such as `npx serve dist`. On Vercel, Netlify or GitHub Pages it works as-is.
- **For a double-click preview, open `dist-local/index.html`.** That build is a single classic script, so it runs straight from `file://` with no install and no server.

### How this build was verified in the authoring sandbox

The sandbox had no network access, so Vite, React Router and `@types/react` could not be installed. Verification there used substitutes:

- **Build:** `node tools/build-local.mjs` bundled the same `src/` with esbuild and the machine's React 19 and `react-icons`.
- **Router:** `react-router-dom` was aliased to `tools/shims/react-router-dom.tsx`, a small hash router covering only the API subset the app uses.
- **Type check:** `tools/typecheck.sh` was a partial check that used stub React declarations.

`npm run build` / `npm run typecheck` were **not** run, because they need those packages. Run them once after `npm install`; see [`docs/verification-report.md`](docs/verification-report.md).

## Exploring the prototype

The dark **Demo** bar at the top is a prototype control, not part of the product.

| Control | What it does |
|---|---|
| **View as** | Switch persona. This is a clearly labelled demo role switcher. **It is not security.** |
| **States & journeys** | Shortcut links to the 7 test journeys and to every important alternative state (loading, empty, errors, restricted, expired, pending…). |
| **Components** | `#/showcase`: tokens, controls and product patterns with their states. |
| **Coverage** | `#/coverage`: the 60 reference views mapped to routes and states. |
| **Reset demo data** | Restores the starting dataset and signs out. |

### Personas

| Persona | Use it for |
|---|---|
| **Visitor** (signed out) | Discovery, sign-up, certificate verification |
| **Amaka Obi**: learner, mid-course | Dashboard, lessons, assignment, a pending bank transfer, a refund, an expired course, support |
| **Bola Adeyemi**: learner, one quiz from a certificate | Quiz, then certificate, then verification |
| **Tunde Bakare**: instructor | Grading, course building, refund decisions, announcements |
| **Grace Eze**: administrator | Approvals, payments, refunds, certificates, settings |
| **Musa Ibrahim**: support administrator | Support queue; read-only for role changes |

On the login screen, any password works for the fictional accounts.

### Demo scenarios (each tested end to end through the UI)

1. **Find a course, register, pay, enrol and start a lesson.** As a visitor: Courses → search “research” → UX Foundations → Enrol now → create account → open the simulated verification link → checkout. The 20% first-course offer applies; use card `4111 1111 1111 1111`. You land on the receipt, then lesson 1.
2. **Complete a quiz, see results and a progress update.** As Bola: Quiz 2 → Graded attempt → answer → submit. The score, answer review, progress update and newly met certificate requirement all show.
3. **Submit an assignment, have it graded and see feedback.** As Amaka: Assignment A1. A file named `*fail*` shows the upload error and retry. Then submit. As Tunde: Submissions → Grade → publish. As Amaka: the feedback and a notification appear.
4. **Complete requirements, get a certificate and verify it.** As Bola after scenario 2: Certificates → copy the reference → `/verify`. As Grace: revoke it. Public verification then shows “Revoked”.
5. **Recover from a payment failure.** Checkout with a card ending `0002` is declined, with “no money was taken”. Try again with another card and it succeeds.
6. **Support request, staff reply, learner response.** As Amaka: Support → new request. As Musa: add an internal note (staff only), then reply. As Amaka: the reply is visible, the internal note is not, and Amaka responds.
7. **Refund request, staff decisions, updated status.** As Amaka: refund UX Writing Essentials. As Tunde: approve. As Grace: process and complete. As Amaka: “Refund completed” shows and course access has ended.
8. **Pending transfer, staff confirmation, access.** As Grace: Transactions → `TXN-261112-0431` → confirm with evidence. As Amaka: Interaction Design for Mobile unlocks.

### Inspecting alternative states

States open with `?demo=<state>` on the relevant route, so there are no duplicate pages. Examples:

- `#/courses?demo=loading`
- `#/courses?q=blockchain` (no results)
- `#/verify-email?demo=expired`
- `#/learn/courses/UXF-101/lessons/L18?demo=offline` and `?demo=unavailable`
- `#/learn/courses/UXF-101/assignment/uxf-a1?demo=uncertain`
- `#/learn/courses/UXF-101/quiz/uxf-q2?demo=exhausted`
- `#/checkout/IXD-210/status/TXN-261112-0428?demo=interrupted`
- `#/verify/CERT-DT-25-0342?demo=service`

The full list is in [`docs/coverage-matrix.md`](docs/coverage-matrix.md).

## Simulation boundaries

- **Authentication.** There is no real authentication. Passwords are length-checked and immediately discarded; none are stored. The persona switcher and route guards only shape the UI. **A real backend must enforce every permission on every request.**
- **Payments.** There is no real payment processing. Card fields say “never enter a real card”; card numbers are not stored, only the last 4 digits of the fictional test card. Outcomes come from a labelled “Simulated outcome” selector or the test card number. Bank and USSD details are fictional. No Stripe or PayPal integration exists (an open implementation decision).
- **Email.** No email is sent. Verification and reset links are simulated with labelled demo buttons.
- **Files.** Nothing is stored. Uploads keep only the file name and size; progress is simulated.
- **Database.** There is no production database. State lives in `localStorage` (key `learnux-demo-db`), falling back to memory if storage is unavailable. Use **Reset demo data** to start over.
- **Labelling.** Every financial and administrative confirmation is marked “Simulated action”.
- **Unsupported controls.** Controls the prototype can’t support (full-screen video, file preview, direct messages, account deletion, email change) say so honestly instead of faking success.
- **Demo date.** The calendar is pinned to **16 Nov 2026** (`src/utils/date.ts`), so copy such as “access ends in 5 days” stays consistent. Clock time is real.

## Design system

Tokens live in `src/styles/tokens.css` as CSS custom properties: colour, type scale, the 4–64px spacing scale, radii (8/12/16/pill), elevation, layout widths and motion.

**Deliberate adjustments to the starting tokens** (checked with `node tools/contrast.mjs`):

- **Muted text:** changed from `#64748B` to `#5E6D83`. The original is 4.34:1 on the subtle surface (`#F1F5F9`), which fails WCAG AA. The new value passes on white, the page background and the subtle surface.
- **Focus ring:** `#2563EB` is only 1.3:1 against the primary button. Focus rings therefore use a 2px offset gap, so the ring is drawn against the light background (5.17:1).

**Structure:** `src/components/ui/` holds the generic components, `src/components/{layout,learning,payments,support}/` holds the product patterns, and every component is shown at `#/showcase`.

**Icons:** a single icon library is used, the Lucide set via `react-icons/lu`. `lucide-react` wasn’t available offline; the glyphs are the same.

## Project structure

```
src/
  app/          App routes, route guard, demo bar, coverage data
  components/
    ui/         Button, IconButton, form controls, feedback, overlays, navigation, data display, FileUpload
    layout/     Public, auth and workspace layouts (sidebar → drawer + bottom nav), PageHeader
    learning/   Course cards, curriculum/lesson items, eligibility checklist, certificate, rubric, posts
    payments/   Order summary, receipt, status timeline, payment and refund badges
    support/    Ticket conversation (staff view shows internal notes)
  features/     public/, auth/, learner/, instructor/, admin/, dev/ (showcase, coverage)
  data/         Types-backed seed data, store (localStorage), services (simulated API), selectors (rules)
  hooks/        useSession, useDemoState, useFocusTrap, useTitle
  styles/       tokens, base, components, layout, features
  types/        Domain types
  utils/        Formatting (formatNGN, dates), cx
tools/          Local build, router shim, partial type check, crawl/journey/a11y/keyboard tests, contrast check, doc export
docs/           coverage-matrix.md, verification-report.md, decisions.md
```

Views only call `api.*` (in `src/data/services.ts`) and read data through `src/data/selectors.ts`. To connect a backend, replace the bodies of the service functions with API calls; views don’t need to change.

## Accessibility

**Designed in:**

- **Structure:** semantic landmarks, one `h1` per page with ordered headings, and a skip link as the first Tab stop.
- **Forms:** persistent labels. Hints and errors are tied to fields with `aria-describedby` and `aria-invalid`. On submit, an error summary takes focus once and links to each field.
- **Overlays:** dialogs and drawers trap focus, close with Escape and return focus to the opener.
- **Controls:** tabs follow the ARIA pattern with arrow keys, every icon-only button has a name, touch targets are at least 44px, and reordering uses buttons rather than drag.
- **Status and motion:** status is shown with text and an icon, not colour alone, and reduced motion is respected.
- **Media:** captions are on by default, with transcripts.

**What was checked** is listed in the verification report: automated lint, keyboard tests and contrast checks. **It has not been tested with screen readers or by people with disabilities.** No compliance claim is made.

## Known limitations

- **Course building:** drag-and-drop reordering isn’t implemented (the arrow buttons work). Rubric editing and creating assessments for brand-new courses aren’t implemented.
- **Media and files:** video playback, captions upload and file previews are simulated.
- **Account features:** photo upload and email change aren’t implemented. Direct messages aren’t part of the product scope.
- **Published courses:** material changes to a published course aren’t routed through review in this build. Settings are read-only once a course is published; the assessment builder warns that its edits apply immediately.
- **Decisions and assumptions:** see [`docs/decisions.md`](docs/decisions.md), carried over from the wireframe decision log, with additions.
