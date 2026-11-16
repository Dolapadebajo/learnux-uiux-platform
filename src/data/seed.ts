/* Fictional seed dataset shared by every role. All people, organisations and references are invented.
   Dates are anchored to a fixed demo "today" (see utils/date.ts) so copy stays consistent over time. */
import type { Assessment, Course, DB, Lesson, Module, QuizQuestion, RubricCriterion } from '../types';

const tx = (title: string): Lesson['transcript'] => [
  { t: '0:00', text: `Welcome. In this lesson — ${title.replace(/^\d+\.\d+ /, '')} — we focus on one practical skill you can use this week.` },
  { t: '0:42', text: 'First we look at why it matters for the people using a product, not just for the design team.' },
  { t: '2:15', text: 'Then we walk through a worked example based on a fictional savings app used by market traders in Lagos.' },
  { t: '5:30', text: 'Finally, you will try it yourself with the worksheet in the resources tab.' },
  { t: '8:05', text: 'Before you continue, note one question to bring to the live session.' },
];
let lid = 0;
const L = (title: string, type: Lesson['type'] = 'video', minutes = 10, extra: Partial<Lesson> = {}): Lesson => ({
  id: `L${++lid}`, title, type, minutes, required: true,
  summary: `Key ideas and a worked example for “${title.replace(/^\d+\.\d+ /, '')}”.`,
  transcript: tx(title),
  resources: [{ name: 'Worksheet (PDF)', size: '240 KB', available: true }, { name: 'Slides (PDF)', size: '1.2 MB', available: true }],
  ...extra,
});
const M = (id: string, title: string, lessons: Lesson[]): Module => ({ id, title, lessons });

const uxfModules: Module[] = [
  M('uxf-m1', 'What UX is (and is not)', [L('1.1 Welcome and how this course works', 'video', 8), L('1.2 The design process', 'video', 12), L('1.3 Roles in a product team', 'reading', 9)]),
  M('uxf-m2', 'Understanding users', [L('2.1 Research goals and questions'), L('2.2 Interview basics', 'video', 14), L('2.3 Synthesis with affinity maps', 'video', 13), L('2.4 Writing assumptions honestly', 'reading', 7)]),
  M('uxf-m3', 'Defining the problem', [L('3.1 Problem statements', 'video', 9), L('3.2 Journey maps', 'video', 12), L('3.3 Prioritising needs', 'reading', 8)]),
  M('uxf-m4', 'Ideation and flows', [L('4.1 Sketching many ideas', 'video', 11), L('4.2 User flows', 'video', 12), L('4.3 Information architecture', 'video', 12), L('4.4 Card sorting', 'video', 10)]),
  M('uxf-m5', 'Wireframing', [L('5.1 Low-fidelity layouts', 'video', 13), L('5.2 Content-first design', 'reading', 9), L('5.3 Responsive thinking', 'video', 11)]),
  M('uxf-m6', 'Prototyping and testing', [L('6.1 Clickable prototypes', 'video', 12), L('6.2 Planning a usability test', 'video', 14), L('6.3 Running sessions ethically', 'reading', 10, { resources: [{ name: 'Consent form template (DOCX)', size: '48 KB', available: true }, { name: 'Session recording checklist (PDF)', size: '120 KB', available: false }] }), L('6.4 Acting on findings', 'video', 11)]),
  M('uxf-m7', 'Accessibility basics', [L('7.1 Inclusive design principles', 'video', 13)]),
  M('uxf-m8', 'Portfolio project', [L('8.1 Presenting your case study', 'video', 12), L('8.2 Course wrap-up', 'video', 6)]),
];
const small = (p: string, titles: string[][]): Module[] => titles.map((ls, i) => M(`${p}-m${i + 1}`, ls[0], ls.slice(1).map((t, j) => L(`${i + 1}.${j + 1} ${t}`, j % 3 === 2 ? 'reading' : 'video', 9 + ((i + j) % 5)))));

const Q = (id: string, prompt: string, options: string[], answer: number, explanation: string): QuizQuestion => ({ id, prompt, options, answer, explanation });
const rubric: RubricCriterion[] = [
  { id: 'r1', name: 'Issues identified', max: 30, description: 'Finds at least five distinct, evidenced usability issues.' },
  { id: 'r2', name: 'Use of heuristics', max: 25, description: 'Links each issue to a named heuristic.' },
  { id: 'r3', name: 'Quality of fixes', max: 30, description: 'Proposes realistic fixes, shown visually.' },
  { id: 'r4', name: 'Clarity', max: 15, description: 'Clear structure, summary table and plain language.' },
];

const assessments: Assessment[] = [
  { id: 'uxf-q1', courseId: 'UXF-101', kind: 'quiz', title: 'Quiz 1: Research methods', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'uxf-m2', description: '5 questions on research goals, interviews and synthesis.',
    questions: [
      Q('q1', 'What is the main purpose of a research goal?', ['To prove the team’s idea is right', 'To define what the team needs to learn and why', 'To list every feature to build', 'To choose interview participants'], 1, 'A goal frames what you need to learn, which then shapes questions and methods.'),
      Q('q2', 'Which interview question is least leading?', ['Don’t you find saving hard?', 'Would you use an app that saves money for you?', 'Tell me about the last time you put money aside.', 'Isn’t our idea great?'], 2, 'Asking about a specific past behaviour avoids suggesting an answer.'),
      Q('q3', 'An affinity map is mainly used to…', ['Group observations into patterns', 'Prioritise the backlog', 'Test a prototype', 'Recruit participants'], 0, 'Affinity mapping clusters observations so themes become visible.'),
      Q('q4', 'With only three interviews you should…', ['Present patterns as proven findings', 'Treat patterns as tentative and say so', 'Stop the project', 'Add made-up quotes'], 1, 'Small samples can suggest directions but must be labelled as limited.'),
      Q('q5', 'Informed consent means participants…', ['Sign before learning what the study is', 'Understand the purpose and can withdraw', 'Are paid a fixed amount', 'Are always anonymous'], 1, 'Consent requires understanding the purpose, data use and the right to withdraw.'),
    ] },
  { id: 'uxf-q2', courseId: 'UXF-101', kind: 'quiz', title: 'Quiz 2: Wireframes and prototyping', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'uxf-m5', description: '5 questions on fidelity, flows and prototypes.',
    questions: [
      Q('q1', 'What is a low-fidelity wireframe mainly for?', ['Testing final colours', 'Exploring structure and content priority quickly', 'Developer hand-off', 'Measuring performance'], 1, 'Low fidelity keeps attention on structure and content, so it is cheap to change.'),
      Q('q2', 'A user flow shows…', ['The steps a person takes to reach a goal', 'The brand colours', 'Server architecture', 'Marketing channels'], 0, 'Flows map the path, decisions and screens involved in completing a task.'),
      Q('q3', 'Content-first design means…', ['Writing lorem ipsum first', 'Designing around real content and its priority', 'Adding content after visuals', 'Ignoring headings'], 1, 'Real content reveals the true hierarchy and length that layouts must handle.'),
      Q('q4', 'When should you test a prototype?', ['Only after launch', 'As early as something can be tried', 'Never with real people', 'Only with developers'], 1, 'Early testing finds problems while they are cheap to fix.'),
      Q('q5', 'Responsive design should…', ['Hide most content on mobile', 'Adapt layout and priority to the screen', 'Use one fixed width', 'Only shrink text'], 1, 'Layouts adapt structure, not just scale, across screen sizes.'),
    ] },
  { id: 'uxf-a1', courseId: 'UXF-101', kind: 'assignment', title: 'Assignment A1: Usability audit of a banking app', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'uxf-m6',
    description: 'Audit a fictional or public banking flow, identify issues and propose fixes.',
    brief: 'Choose a banking app flow (for example sending money to a new recipient). Identify at least five usability issues, link each one to a heuristic from Module 6, and propose a fix with an annotated sketch. Submit a PDF or a link to your prototype.', rubric },
  { id: 'dt-q1', courseId: 'DT-100', kind: 'quiz', title: 'Design thinking check-in', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'dt-m2', description: '3 quick questions.',
    questions: [Q('q1', 'Design thinking starts with…', ['A solution', 'Understanding people', 'A budget'], 1, 'Empathy for people comes first.'), Q('q2', 'Prototypes should be…', ['Expensive', 'Quick and disposable', 'Final'], 1, 'Cheap prototypes encourage learning.'), Q('q3', 'Ideation favours…', ['One idea', 'Many ideas', 'No ideas'], 1, 'Quantity helps quality emerge.')] },
  { id: 'a11y-a1', courseId: 'A11Y-150', kind: 'assignment', title: 'Assignment B1: Accessible form review', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'a11y-m2', description: 'Review a sign-up form for accessibility issues.', brief: 'Review a public sign-up form and report labels, errors, focus and contrast issues with fixes.', rubric },
  { id: 'uxw-q1', courseId: 'UXW-120', kind: 'quiz', title: 'Microcopy quiz', required: true, graded: true, passMark: 50, maxAttempts: 3, afterModuleId: 'uxw-m1', description: '3 questions.', questions: [Q('q1', 'Good button labels…', ['Say what happens', 'Say “Click here”', 'Are always one letter'], 0, 'Describe the outcome.'), Q('q2', 'Error messages should…', ['Blame the user', 'Explain how to fix it', 'Use codes only'], 1, 'Help people recover.'), Q('q3', 'Plain language helps…', ['Only beginners', 'Everyone', 'No one'], 1, 'Clear writing helps all readers.')] },
];

const course = (c: Omit<Course, 'assessmentIds' | 'reviewNotes'> & { reviewNotes?: Course['reviewNotes'] }): Course => ({ ...c, assessmentIds: assessments.filter((a) => a.courseId === c.id).map((a) => a.id) });

const courses: Course[] = [
  course({ id: 'UXF-101', title: 'UX Foundations: Research to Prototype', subtitle: 'Learn the end-to-end UX process — from understanding people to testing a clickable prototype.', category: 'Foundations', level: 'Beginner', price: 85000, instructorId: 'u-tunde', weeks: 8, hoursPerWeek: '4–6 hours', liveSchedule: 'Tuesdays, 7:00–8:00 pm WAT', nextStart: '1 Dec 2026', learners: 46, rating: 4.7, reviews: 38,
    outcomes: ['Plan and run a small, ethical research activity', 'Turn findings into problem statements and user flows', 'Produce wireframes and a clickable prototype', 'Plan a usability test and act on the results'],
    prerequisites: 'None. Comfortable using a computer and the web.', description: 'A beginner course for career changers and people learning around work or study. Weekly live sessions are recorded, so you can follow at your own pace.', status: 'published', modules: uxfModules, updatedAt: '2026-11-01', cover: 'research' }),
  course({ id: 'UID-201', title: 'UI Design Systems in Figma', subtitle: 'Build consistent, accessible interfaces with tokens, components and documentation.', category: 'Visual design', level: 'Intermediate', price: 120000, instructorId: 'u-zainab', weeks: 6, hoursPerWeek: '5–7 hours', liveSchedule: 'Thursdays, 6:30–7:30 pm WAT', nextStart: '8 Dec 2026', learners: 31, rating: 4.8, reviews: 22,
    outcomes: ['Define colour, type and spacing tokens', 'Build components with variants and states', 'Document usage for developers'], prerequisites: 'UX Foundations or equivalent experience.', description: 'Move from one-off screens to a reusable system your team can trust.', status: 'published',
    modules: small('uid', [['Foundations of a system', 'Why systems fail', 'Auditing an interface', 'Naming conventions'], ['Tokens', 'Colour and contrast', 'Type scales', 'Spacing'], ['Components', 'Buttons and inputs', 'Variants and states', 'Documentation']]), updatedAt: '2026-10-12', cover: 'systems' }),
  course({ id: 'IXD-210', title: 'Interaction Design for Mobile', subtitle: 'Design gestures, navigation and feedback that work on small screens and slow networks.', category: 'Interaction', level: 'Intermediate', price: 95000, instructorId: 'u-zainab', weeks: 6, hoursPerWeek: '4–5 hours', liveSchedule: 'Saturdays, 11:00 am–12:00 pm WAT', nextStart: '5 Dec 2026', learners: 27, rating: 4.6, reviews: 15,
    outcomes: ['Choose mobile navigation patterns', 'Design for interruptions and poor connectivity', 'Prototype micro-interactions'], prerequisites: 'Basic UI design knowledge.', description: 'Practical mobile interaction patterns grounded in real constraints.', status: 'published',
    modules: small('ixd', [['Mobile contexts', 'Thumbs and reach', 'Interruptions', 'Offline-first thinking'], ['Navigation', 'Tabs vs drawers', 'Back behaviour', 'Deep links'], ['Feedback', 'Loading and progress', 'Errors on the go', 'Micro-interactions']]), updatedAt: '2026-10-02', cover: 'mobile' }),
  course({ id: 'A11Y-150', title: 'Accessibility for Designers', subtitle: 'Design products more people can use — contrast, structure, forms and assistive technology.', category: 'Accessibility', level: 'Beginner', price: 60000, instructorId: 'u-tunde', weeks: 4, hoursPerWeek: '3–4 hours', liveSchedule: 'Mondays, 7:00–8:00 pm WAT', nextStart: 'Jan 2027', learners: 18, rating: 4.9, reviews: 12,
    outcomes: ['Check contrast and colour use', 'Structure pages for assistive tech', 'Design accessible forms'], prerequisites: 'None.', description: 'Accessibility is part of good design from the first sketch.', status: 'published',
    modules: small('a11y', [['Why accessibility', 'Disability and design', 'Standards in plain language'], ['Forms and errors', 'Labels and instructions', 'Error recovery', 'Focus order']]), updatedAt: '2026-09-04', cover: 'access' }),
  course({ id: 'UXW-120', title: 'UX Writing Essentials', subtitle: 'Write clear interface copy: buttons, errors, empty states and onboarding.', category: 'Content', level: 'Beginner', price: 45000, instructorId: 'u-tunde', weeks: 3, hoursPerWeek: '3 hours', liveSchedule: 'Wednesdays, 6:00–7:00 pm WAT', nextStart: '2 Dec 2026', learners: 22, rating: 4.5, reviews: 9,
    outcomes: ['Write action-focused labels', 'Write helpful errors', 'Create a mini voice guide'], prerequisites: 'None.', description: 'Words are interface. Learn to write them on purpose.', status: 'published',
    modules: small('uxw', [['Microcopy', 'Buttons and links', 'Errors that help', 'Empty states'], ['Voice and tone', 'Plain language', 'A mini voice guide']]), updatedAt: '2026-10-20', cover: 'writing' }),
  course({ id: 'DT-100', title: 'Introduction to Design Thinking', subtitle: 'A free, two-week introduction to human-centred problem solving.', category: 'Foundations', level: 'Beginner', price: 0, instructorId: 'u-zainab', weeks: 2, hoursPerWeek: '2 hours', liveSchedule: 'Monthly live Q&A', nextStart: 'Start any time', learners: 412, rating: 4.4, reviews: 96,
    outcomes: ['Explain the stages of design thinking', 'Run a quick ideation session'], prerequisites: 'None.', description: 'Try learning with LearnUX at no cost.', status: 'published',
    modules: small('dt', [['Empathise and define', 'Who are we designing for?', 'Framing the problem'], ['Ideate and test', 'Many ideas fast', 'Quick prototypes', 'Learning from tests']]), updatedAt: '2026-08-15', cover: 'thinking' }),
  course({ id: 'ROB-130', title: 'Research Ops Basics', subtitle: 'Set up lightweight research operations: consent, participant tracking and a findings library.', category: 'Research', level: 'Intermediate', price: 55000, instructorId: 'u-tunde', weeks: 4, hoursPerWeek: '3–4 hours', liveSchedule: 'Thursdays, 6:30–7:30 pm WAT', nextStart: '7 Jan 2027', learners: 0, rating: null, reviews: 0,
    outcomes: ['Write a plain-language consent form', 'Track participants responsibly', 'Set up a findings library'], prerequisites: 'UX Foundations or equivalent research experience.', description: 'Make research repeatable without heavy tools.', status: 'draft',
    modules: small('rob', [['Why research operations', 'What ResearchOps covers', 'Your current process'], ['Consent and ethics', 'Plain-language consent', 'Storing personal data'], ['Participant tracking', 'Recruiting fairly']]), updatedAt: '2026-11-15', cover: 'ops' }),
];

const uxfLessonIds = uxfModules.flatMap((m) => m.lessons.map((l) => l.id));

export const createSeed = (): DB => ({
  version: 3,
  session: { userId: null },
  users: [
    { id: 'u-amaka', name: 'Amaka Obi', email: 'amaka.obi@example.com', role: 'learner', status: 'active', joined: '2026-02-10', initials: 'AO', headline: 'Customer service lead learning UX', location: 'Lagos', certificateName: 'Amaka Obi' },
    { id: 'u-bola', name: 'Bola Adeyemi', email: 'bola.a@example.com', role: 'learner', status: 'active', joined: '2025-05-20', initials: 'BA', headline: 'Graphic designer moving into product', location: 'Ibadan', certificateName: 'Bola Adeyemi' },
    { id: 'u-chinedu', name: 'Chinedu Okafor', email: 'chinedu.o@example.com', role: 'learner', status: 'active', joined: '2025-06-02', initials: 'CO', location: 'Enugu', certificateName: 'Chinedu Okafor' },
    { id: 'u-kemi', name: 'Kemi Adebayo', email: 'kemi.a@example.com', role: 'learner', status: 'active', joined: '2026-03-01', initials: 'KA', location: 'Abuja', certificateName: 'Kemi Adebayo' },
    { id: 'u-tolu', name: 'Tolu Okon', email: 'tolu.o@example.com', role: 'learner', status: 'active', joined: '2026-04-11', initials: 'TO', location: 'Port Harcourt', certificateName: 'Tolu Okon' },
    { id: 'u-tunde', name: 'Tunde Bakare', email: 'tunde.b@example.com', role: 'instructor', status: 'active', joined: '2025-01-08', initials: 'TB', headline: 'Product designer, 9 years in fintech and public services', bio: 'Tunde has led research and design for savings, payments and government services. He teaches the foundations and research courses.' },
    { id: 'u-zainab', name: 'Zainab Musa', email: 'zainab.m@example.com', role: 'instructor', status: 'active', joined: '2025-03-14', initials: 'ZM', headline: 'Interaction designer focused on mobile and design systems', bio: 'Zainab designs mobile products for low-bandwidth contexts and maintains a design system used by three product teams.' },
    { id: 'u-grace', name: 'Grace Eze', email: 'grace.e@example.com', role: 'admin', status: 'active', joined: '2025-01-02', initials: 'GE' },
    { id: 'u-musa', name: 'Musa Ibrahim', email: 'musa.i@example.com', role: 'admin', status: 'active', joined: '2025-05-05', initials: 'MI', headline: 'Support lead' },
    { id: 'u-ngozi', name: 'Ngozi Eke', email: 'ngozi.e@example.com', role: 'instructor', status: 'invited', joined: '2026-11-12', initials: 'NE' },
  ],
  courses, assessments,
  enrolments: [
    { id: 'E-1001', userId: 'u-amaka', courseId: 'UXF-101', status: 'active', enrolledAt: '2026-02-14', accessUntil: '2027-02-14', completedLessonIds: uxfLessonIds.slice(0, 17), lastLessonId: uxfLessonIds[17], lastPosition: '4:31' },
    { id: 'E-1002', userId: 'u-amaka', courseId: 'UXW-120', status: 'active', enrolledAt: '2026-11-09', accessUntil: '2027-11-09', completedLessonIds: [courses[4].modules[0].lessons[0].id, courses[4].modules[0].lessons[1].id], lastLessonId: courses[4].modules[0].lessons[2].id },
    { id: 'E-1003', userId: 'u-amaka', courseId: 'A11Y-150', status: 'expired', enrolledAt: '2025-11-02', accessUntil: '2026-11-02', completedLessonIds: courses[3].modules.flatMap((m) => m.lessons.map((l) => l.id)).slice(0, 5) },
    { id: 'E-1004', userId: 'u-amaka', courseId: 'IXD-210', status: 'pending_payment', enrolledAt: '2026-11-12', accessUntil: '', completedLessonIds: [] },
    { id: 'E-1005', userId: 'u-bola', courseId: 'UXF-101', status: 'active', enrolledAt: '2026-04-10', accessUntil: '2027-04-10', completedLessonIds: uxfLessonIds, lastLessonId: uxfLessonIds[23] },
    { id: 'E-1006', userId: 'u-chinedu', courseId: 'UXF-101', status: 'active', enrolledAt: '2026-01-20', accessUntil: '2027-01-20', completedLessonIds: uxfLessonIds.slice(0, 22), lastLessonId: uxfLessonIds[22] },
    { id: 'E-1007', userId: 'u-chinedu', courseId: 'DT-100', status: 'active', enrolledAt: '2025-07-01', accessUntil: '2026-07-01', completedLessonIds: courses[5].modules.flatMap((m) => m.lessons.map((l) => l.id)) },
    { id: 'E-1008', userId: 'u-kemi', courseId: 'UXF-101', status: 'active', enrolledAt: '2026-03-05', accessUntil: '2027-03-05', completedLessonIds: uxfLessonIds.slice(0, 20), lastLessonId: uxfLessonIds[20] },
    { id: 'E-1009', userId: 'u-tolu', courseId: 'UXF-101', status: 'active', enrolledAt: '2026-04-15', accessUntil: '2027-04-15', completedLessonIds: uxfLessonIds.slice(0, 9), lastLessonId: uxfLessonIds[9] },
    { id: 'E-1010', userId: 'u-bola', courseId: 'UID-201', status: 'active', enrolledAt: '2025-06-01', accessUntil: '2026-06-01', completedLessonIds: [] },
    { id: 'E-1011', userId: 'u-chinedu', courseId: 'IXD-210', status: 'active', enrolledAt: '2026-10-01', accessUntil: '2027-10-01', completedLessonIds: [] },
  ],
  quizAttempts: [
    { id: 'QA-1', userId: 'u-amaka', assessmentId: 'uxf-q1', answers: [1, 0, 0, 1, 1], score: 60, submittedAt: '2026-03-20T19:10:00', mode: 'graded' },
    { id: 'QA-2', userId: 'u-amaka', assessmentId: 'uxf-q1', answers: [1, 2, 0, 1, 2], score: 80, submittedAt: '2026-03-22T20:02:00', mode: 'graded' },
    { id: 'QA-3', userId: 'u-bola', assessmentId: 'uxf-q1', answers: [1, 2, 0, 1, 1], score: 100, submittedAt: '2026-05-02T18:00:00', mode: 'graded' },
    { id: 'QA-4', userId: 'u-chinedu', assessmentId: 'uxf-q1', answers: [1, 2, 0, 1, 1], score: 100, submittedAt: '2026-02-20T18:00:00', mode: 'graded' },
    { id: 'QA-5', userId: 'u-chinedu', assessmentId: 'uxf-q2', answers: [1, 0, 1, 1, 1], score: 100, submittedAt: '2026-04-02T18:00:00', mode: 'graded' },
    { id: 'QA-6', userId: 'u-kemi', assessmentId: 'uxf-q1', answers: [1, 2, 0, 0, 1], score: 80, submittedAt: '2026-04-11T18:00:00', mode: 'graded' },
    { id: 'QA-7', userId: 'u-kemi', assessmentId: 'uxf-q2', answers: [1, 0, 1, 0, 0], score: 60, submittedAt: '2026-06-11T18:00:00', mode: 'graded' },
    { id: 'QA-8', userId: 'u-chinedu', assessmentId: 'dt-q1', answers: [1, 1, 1], score: 100, submittedAt: '2025-07-10T18:00:00', mode: 'graded' },
  ],
  submissions: [
    { id: 'SUB-3290', userId: 'u-chinedu', assessmentId: 'uxf-a1', version: 1, status: 'graded', files: [{ name: 'chinedu-audit.pdf', size: '2.8 MB' }], note: '', submittedAt: '2026-11-01T14:20:00', scores: { r1: 24, r2: 18, r3: 20, r4: 12 }, score: 74, feedback: 'Thorough and well evidenced. Your fixes for the confirmation screen are excellent.', published: true, gradedBy: 'u-tunde', gradedAt: '2026-11-04T10:00:00', history: [{ version: 1, submittedAt: '2026-11-01T14:20:00', score: 74 }] },
    { id: 'SUB-3301', userId: 'u-bola', assessmentId: 'uxf-a1', version: 1, status: 'graded', files: [{ name: 'bola-banking-audit.pdf', size: '3.4 MB' }], note: 'Focused on the transfer flow.', submittedAt: '2026-10-20T09:00:00', scores: { r1: 22, r2: 17, r3: 21, r4: 10 }, score: 70, feedback: 'Strong visual fixes. Link every issue to a named heuristic next time.', published: true, gradedBy: 'u-tunde', gradedAt: '2026-10-24T12:00:00', history: [{ version: 1, submittedAt: '2026-10-20T09:00:00', score: 70 }] },
    { id: 'SUB-3311', userId: 'u-kemi', assessmentId: 'uxf-a1', version: 1, status: 'submitted', files: [{ name: 'kemi-usability-audit.pdf', size: '3.1 MB' }], note: 'I chose the bill-payment flow.', submittedAt: '2026-11-05T21:14:00', published: false, history: [{ version: 1, submittedAt: '2026-11-05T21:14:00' }] },
    { id: 'SUB-3315', userId: 'u-tolu', assessmentId: 'uxf-a1', version: 1, status: 'submitted', files: [{ name: 'audit-tolu.pdf', size: '1.9 MB' }], note: '', submittedAt: '2026-11-12T08:40:00', published: false, history: [{ version: 1, submittedAt: '2026-11-12T08:40:00' }] },
  ],
  transactions: [
    { id: 'TXN-260214-0087', userId: 'u-amaka', courseId: 'UXF-101', amount: 68000, listPrice: 85000, discount: 17000, method: 'card', status: 'successful', createdAt: '2026-02-14T18:22:00', receiptNo: 'RCT-260214-0087', providerRef: 'PRV-12077', cardLast4: '4422', events: [{ at: '2026-02-14T18:22:00', label: 'Card payment authorised' }, { at: '2026-02-14T18:22:05', label: 'Access granted' }] },
    { id: 'TXN-251102-0033', userId: 'u-amaka', courseId: 'A11Y-150', amount: 60000, listPrice: 60000, discount: 0, method: 'card', status: 'successful', createdAt: '2025-11-02T10:01:00', receiptNo: 'RCT-251102-0033', providerRef: 'PRV-09981', cardLast4: '4422', events: [{ at: '2025-11-02T10:01:00', label: 'Card payment authorised' }] },
    { id: 'TXN-261109-0419', userId: 'u-amaka', courseId: 'UXW-120', amount: 45000, listPrice: 45000, discount: 0, method: 'ussd', status: 'successful', createdAt: '2026-11-09T13:40:00', receiptNo: 'RCT-261109-0419', providerRef: 'PRV-88102', events: [{ at: '2026-11-09T13:40:00', label: 'USSD payment confirmed' }] },
    { id: 'TXN-261112-0428', userId: 'u-amaka', courseId: 'IXD-210', amount: 95000, listPrice: 95000, discount: 0, method: 'card', status: 'failed', createdAt: '2026-11-12T09:58:00', failureReason: 'Declined by bank: insufficient funds (simulated).', providerRef: 'PRV-88201', cardLast4: '4422', events: [{ at: '2026-11-12T09:58:00', label: 'Card declined by issuing bank' }] },
    { id: 'TXN-261112-0431', userId: 'u-amaka', courseId: 'IXD-210', amount: 95000, listPrice: 95000, discount: 0, method: 'bank_transfer', status: 'pending', createdAt: '2026-11-12T10:05:00', providerRef: 'PRV-88213', events: [{ at: '2026-11-12T10:05:00', label: 'Transfer instructions issued (ref LUX-261112-0431)' }, { at: '2026-11-12T10:21:00', label: 'Learner marked transfer as sent' }] },
    { id: 'TXN-260410-0121', userId: 'u-bola', courseId: 'UXF-101', amount: 68000, listPrice: 85000, discount: 17000, method: 'bank_transfer', status: 'successful', createdAt: '2026-04-10T11:00:00', receiptNo: 'RCT-260410-0121', providerRef: 'PRV-30112', events: [{ at: '2026-04-10T15:30:00', label: 'Transfer confirmed' }] },
    { id: 'TXN-260120-0060', userId: 'u-chinedu', courseId: 'UXF-101', amount: 68000, listPrice: 85000, discount: 17000, method: 'card', status: 'successful', createdAt: '2026-01-20T08:00:00', receiptNo: 'RCT-260120-0060', providerRef: 'PRV-10011', cardLast4: '9090', events: [{ at: '2026-01-20T08:00:00', label: 'Card payment authorised' }] },
    { id: 'TXN-261001-0201', userId: 'u-chinedu', courseId: 'IXD-210', amount: 95000, listPrice: 95000, discount: 0, method: 'card', status: 'successful', createdAt: '2026-10-01T09:30:00', receiptNo: 'RCT-261001-0201', providerRef: 'PRV-71001', cardLast4: '9090', events: [{ at: '2026-10-01T09:30:00', label: 'Card payment authorised' }] },
    { id: 'TXN-260305-0099', userId: 'u-kemi', courseId: 'UXF-101', amount: 68000, listPrice: 85000, discount: 17000, method: 'ussd', status: 'successful', createdAt: '2026-03-05T12:00:00', receiptNo: 'RCT-260305-0099', providerRef: 'PRV-20190', events: [{ at: '2026-03-05T12:00:00', label: 'USSD payment confirmed' }] },
    { id: 'TXN-260415-0133', userId: 'u-tolu', courseId: 'UXF-101', amount: 85000, listPrice: 85000, discount: 0, method: 'card', status: 'successful', createdAt: '2026-04-15T16:45:00', receiptNo: 'RCT-260415-0133', providerRef: 'PRV-31007', cardLast4: '1881', events: [{ at: '2026-04-15T16:45:00', label: 'Card payment authorised' }] },
  ],
  refunds: [
    { id: 'RFD-0052', txnId: 'TXN-261001-0201', userId: 'u-chinedu', courseId: 'IXD-210', reason: 'Schedule doesn’t work for me', details: 'The Saturday sessions clash with my new job.', status: 'approved', createdAt: '2026-11-08T10:00:00', decisionNote: 'Early in the course; schedule-related.', decidedBy: 'u-zainab', history: [{ at: '2026-11-08T10:00:00', label: 'Request submitted' }, { at: '2026-11-10T09:12:00', label: 'Approved by instructor Zainab Musa' }] },
  ],
  threads: [
    { id: 'T-1', courseId: 'UXF-101', authorId: 'u-amaka', title: 'Is three interviews enough for the affinity map?', body: 'For the practice activity, is three interviews enough to build an affinity map?', at: '2026-11-12T19:05:00', replies: [
      { id: 'R-1', authorId: 'u-tunde', body: 'Yes for practice — note it as a limitation and avoid presenting patterns as proven findings.', at: '2026-11-13T08:30:00' },
      { id: 'R-2', authorId: 'u-bola', body: 'Thanks, that helped me too. I labelled mine “early signals”.', at: '2026-11-13T09:10:00' }] },
    { id: 'T-2', courseId: 'UXF-101', authorId: 'u-kemi', title: 'Best free tool for card sorting?', body: 'Any recommendations for running an online card sort with five people?', at: '2026-11-14T12:00:00', replies: [] },
    { id: 'T-3', courseId: 'UXF-101', authorId: 'u-tunde', title: 'Week 5 live session moved to Wednesday', body: 'This week’s session moves to Wednesday 18 November, 7 pm WAT. The recording will be posted as usual.', at: '2026-11-15T10:00:00', pinned: true, replies: [{ id: 'R-3', authorId: 'u-tolu', body: 'Noted, thank you!', at: '2026-11-15T11:20:00' }] },
  ],
  notifications: [
    { id: 'N-1', userId: 'u-amaka', kind: 'announcement', title: 'Week 5 live session moved to Wednesday', body: 'Tunde Bakare · UX Foundations', link: '/learn/courses/UXF-101/discussions/T-3', read: false, at: '2026-11-15T10:00:00' },
    { id: 'N-2', userId: 'u-amaka', kind: 'course', title: 'New reply in “Is three interviews enough…”', body: 'Tunde Bakare replied to your question.', link: '/learn/courses/UXF-101/discussions/T-1', read: false, at: '2026-11-13T08:30:00' },
    { id: 'N-3', userId: 'u-amaka', kind: 'payment', title: 'Bank transfer awaiting confirmation', body: 'TXN-261112-0431 · Interaction Design for Mobile', link: '/learn/payments/TXN-261112-0431', read: false, at: '2026-11-12T10:21:00' },
    { id: 'N-4', userId: 'u-amaka', kind: 'grade', title: 'Quiz 1 graded: 80%', body: 'UX Foundations · best of 2 attempts', link: '/learn/courses/UXF-101/assessments', read: true, at: '2026-03-22T20:02:00' },
    { id: 'N-5', userId: 'u-amaka', kind: 'course', title: 'Your access to Accessibility for Designers has ended', body: 'Grades and certificates remain available.', link: '/learn/courses', read: true, at: '2026-11-02T00:00:00' },
    { id: 'N-6', userId: 'u-bola', kind: 'grade', title: 'Assignment A1 graded: 70%', body: 'UX Foundations · feedback available', link: '/learn/courses/UXF-101/assignment/uxf-a1/feedback', read: false, at: '2026-10-24T12:00:00' },
  ],
  announcements: [
    { id: 'AN-1', courseId: 'UXF-101', authorId: 'u-tunde', title: 'Week 5 live session moved to Wednesday', body: 'This week’s session moves to Wednesday 18 November, 7 pm WAT. The recording will be posted as usual.', at: '2026-11-15T10:00:00', emailed: true },
    { id: 'AN-2', courseId: 'UXF-101', authorId: 'u-tunde', title: 'Assignment A1 rubric clarified', body: 'I have added an example of “linking an issue to a heuristic” to the assignment brief.', at: '2026-10-30T09:00:00', emailed: false },
  ],
  tickets: [
    { id: 'SUP-1182', userId: 'u-amaka', subject: 'Bank transfer not confirmed', category: 'Payment or access', status: 'open', priority: 'high', assigneeId: 'u-musa', relatedRef: 'TXN-261112-0431', createdAt: '2026-11-13T10:20:00', messages: [
      { id: 'm1', authorId: 'u-amaka', body: 'I transferred ₦95,000 on 12 November but Interaction Design for Mobile has not unlocked.', at: '2026-11-13T10:20:00' },
      { id: 'm2', authorId: 'u-musa', body: 'Thanks, Amaka. I have asked the payment provider to confirm the transfer. Please do not pay again — we will update you here.', at: '2026-11-13T11:02:00' },
      { id: 'm3', authorId: 'u-musa', body: 'Provider says reference matches; waiting on settlement file. Check again tomorrow.', at: '2026-11-13T11:05:00', internal: true }] },
    { id: 'SUP-1185', userId: 'u-bola', subject: 'Captions out of sync in lesson 6.2', category: 'Accessibility', status: 'open', priority: 'normal', createdAt: '2026-11-14T15:00:00', messages: [{ id: 'm1', authorId: 'u-bola', body: 'Captions in 6.2 are about five seconds behind the audio.', at: '2026-11-14T15:00:00' }] },
    { id: 'SUP-1179', userId: 'u-chinedu', subject: 'Certificate PDF download', category: 'Certificate', status: 'resolved', priority: 'normal', assigneeId: 'u-musa', createdAt: '2026-11-01T09:00:00', messages: [{ id: 'm1', authorId: 'u-chinedu', body: 'My certificate download fails on my phone.', at: '2026-11-01T09:00:00' }, { id: 'm2', authorId: 'u-musa', body: 'Fixed — please try again. Sorry for the trouble.', at: '2026-11-01T13:00:00' }] },
  ],
  certificates: [
    { id: 'CERT-DT-25-0342', userId: 'u-chinedu', courseId: 'DT-100', issuedAt: '2025-07-22', status: 'valid', nameOnCertificate: 'Chinedu Okafor', version: 1 },
    { id: 'CERT-UID-25-0119', userId: 'u-bola', courseId: 'UID-201', issuedAt: '2025-08-30', status: 'revoked', nameOnCertificate: 'Bola Adeyemi', revokedReason: 'Issued in error', revokedAt: '2026-03-03', version: 1 },
  ],
  audit: [
    { id: 'AU-3', at: '2026-11-10T09:12:00', actorId: 'u-zainab', action: 'Refund request approved', target: 'RFD-0052', detail: 'Early in the course; schedule-related.' },
    { id: 'AU-2', at: '2026-03-03T13:22:00', actorId: 'u-grace', action: 'Certificate revoked', target: 'CERT-UID-25-0119', detail: 'Public reason: Issued in error' },
    { id: 'AU-1', at: '2026-01-20T10:00:00', actorId: 'u-grace', action: 'Role changed', target: 'Zainab Musa', detail: 'Learner → Instructor' },
  ],
  settings: { promoEnabled: true, promoPercent: 20, promoEnds: '2026-12-31', supportEmail: 'support@learnux.example', bankTransferHours: 24, ussdMinutes: 10, revisionWindowDays: 14, maintenanceNotice: '', methods: { card: true, bank_transfer: true, ussd: true } },
  profile: {},
});
