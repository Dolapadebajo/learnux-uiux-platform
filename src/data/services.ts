/* Simulated service layer. Each function mirrors what a backend endpoint would do. Swap these for
   API calls later; views only call `api.*` and read data through selectors. NOTHING here is real:
   no authentication, payments, email or storage leave the browser. */
import type { DB, ID, PaymentMethod, Role, TicketStatus, Course, Lesson, QuizQuestion } from '../types';
import { store } from './store';
import { assessmentById, courseById, eligibility, enrolmentFor, promoFor, userById, certificateFor } from './selectors';
import { addDays, addYears, nowISO, todayISO } from '../utils/date';
import { initials, formatNGN } from '../utils/format';

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const stamp = () => { const d = todayISO().replace(/-/g, '').slice(2); return `${d}-${String(Math.floor(Math.random() * 9000) + 1000)}`; };
const notify = (db: DB, userId: ID, kind: DB['notifications'][number]['kind'], title: string, body: string, link: string) =>
  db.notifications.unshift({ id: uid('N'), userId, kind, title, body, link, read: false, at: nowISO() });
const audit = (db: DB, action: string, target: string, detail = '') =>
  db.audit.unshift({ id: uid('AU'), at: nowISO(), actorId: db.session.userId || 'system', action, target, detail });

function grantAccess(db: DB, userId: ID, courseId: ID) {
  const e = enrolmentFor(db, userId, courseId);
  const start = todayISO(); // access period starts when access is granted (decision D-02)
  if (e) { e.status = 'active'; e.enrolledAt = start; e.accessUntil = addYears(start, 1); }
  else db.enrolments.push({ id: uid('E'), userId, courseId, status: 'active', enrolledAt: start, accessUntil: addYears(start, 1), completedLessonIds: [] });
}
function maybeIssueCertificate(db: DB, userId: ID, courseId: ID) {
  if (certificateFor(db, userId, courseId)) return;
  if (!eligibility(db, userId, courseId).eligible) return;
  const c = courseById(db, courseId)!; const u = userById(db, userId)!;
  const ref = `CERT-${courseId.split('-')[0]}-${todayISO().slice(2, 4)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  db.certificates.push({ id: ref, userId, courseId, issuedAt: todayISO(), status: 'valid', nameOnCertificate: u.certificateName || u.name, version: 1 });
  notify(db, userId, 'certificate', 'Your certificate is ready', c.title, `/learn/certificates/${courseId}`);
}

export const api = {
  // ---------- Session & auth (simulated: no passwords are stored) ----------
  switchUser: (userId: ID | null) => store.run((db) => { db.session = { userId }; }),
  login: (email: string) => store.run((db) => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { ok: false as const };
    db.session = { userId: u.id }; return { ok: true as const, user: u };
  }),
  logout: () => store.run((db) => { db.session = { userId: null }; }),
  startSignup: (name: string, email: string, courseId?: ID) => store.run((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return { ok: false as const, reason: 'exists' as const };
    db.session = { userId: null, pendingSignup: { name: name.trim(), email: email.trim(), verified: false, courseId } }; return { ok: true as const };
  }),
  verifyEmail: () => store.run((db) => {
    const p = db.session.pendingSignup; if (!p) return null;
    const id = uid('u');
    db.users.push({ id, name: p.name, email: p.email, role: 'learner', status: 'active', joined: todayISO(), initials: initials(p.name), certificateName: p.name });
    db.session = { userId: id, pendingSignup: { ...p, verified: true } };
    return { userId: id, courseId: p.courseId };
  }),
  updateProfile: (userId: ID, patch: Partial<DB['users'][number]>) => store.run((db) => { Object.assign(userById(db, userId)!, patch); }),
  updatePrefs: (userId: ID, patch: Partial<DB['profile'][string]>) => store.run((db) => {
    const defaults: DB['profile'][string] = { captions: true, transcript: false, autoplay: false, reducedMotion: false, emailGrades: true, emailAnnouncements: true, emailReminders: true, emailNews: false, timezone: 'Africa/Lagos' };
    db.profile[userId] = { ...defaults, ...db.profile[userId], ...patch };
  }),

  // ---------- Enrolment & payments ----------
  enrolFree: (userId: ID, courseId: ID) => store.run((db) => { grantAccess(db, userId, courseId); notify(db, userId, 'course', 'You’re enrolled', courseById(db, courseId)!.title, `/learn/courses/${courseId}`); }),
  /** Simulated payment. `scenario` lets the prototype demonstrate each outcome. */
  pay: (userId: ID, courseId: ID, method: PaymentMethod, scenario: 'success' | 'pending' | 'failed', cardLast4?: string) => store.run((db) => {
    const c = courseById(db, courseId)!; const promo = promoFor(db, userId, c);
    const id = `TXN-${stamp()}`; const amount = c.price - promo.discount; const at = nowISO();
    const t: DB['transactions'][number] = { id, userId, courseId, amount, listPrice: c.price, discount: promo.discount, method, status: scenario === 'success' ? 'successful' : scenario, createdAt: at, providerRef: `PRV-${Math.floor(Math.random() * 90000) + 10000}`, cardLast4, events: [] };
    if (scenario === 'success') {
      t.receiptNo = id.replace('TXN', 'RCT'); t.events.push({ at, label: 'Payment confirmed (simulated)' }, { at, label: 'Access granted' });
      grantAccess(db, userId, courseId); notify(db, userId, 'payment', 'Payment successful — you’re enrolled', `${c.title} · ${formatNGN(amount)}`, `/learn/courses/${courseId}`);
    } else if (scenario === 'pending') {
      t.events.push({ at, label: method === 'bank_transfer' ? 'Transfer instructions issued' : 'USSD code issued' }, { at, label: 'Waiting for provider confirmation' });
      const e = enrolmentFor(db, userId, courseId); if (!e) db.enrolments.push({ id: uid('E'), userId, courseId, status: 'pending_payment', enrolledAt: todayISO(), accessUntil: '', completedLessonIds: [] });
      notify(db, userId, 'payment', 'Payment awaiting confirmation', `${id} · ${c.title}`, `/learn/payments/${id}`);
    } else { t.failureReason = 'Declined by bank (simulated). No money was taken.'; t.events.push({ at, label: 'Payment declined' }); }
    db.transactions.unshift(t); return t;
  }),
  confirmTxn: (txnId: ID, evidence: string) => store.run((db) => {
    const t = db.transactions.find((x) => x.id === txnId)!; t.status = 'successful'; t.receiptNo = txnId.replace('TXN', 'RCT');
    t.events.push({ at: nowISO(), label: `Confirmed by staff (evidence ${evidence || 'n/a'})` }, { at: nowISO(), label: 'Access granted' });
    grantAccess(db, t.userId, t.courseId);
    notify(db, t.userId, 'payment', 'Payment confirmed — course unlocked', courseById(db, t.courseId)!.title, `/learn/courses/${t.courseId}`);
    audit(db, 'Payment confirmed & access granted', txnId, `Evidence ${evidence}`);
  }),
  failTxn: (txnId: ID) => store.run((db) => {
    const t = db.transactions.find((x) => x.id === txnId)!; t.status = 'failed'; t.failureReason = 'Funds not received by provider (simulated).'; t.events.push({ at: nowISO(), label: 'Marked as not received' });
    const e = enrolmentFor(db, t.userId, t.courseId); if (e?.status === 'pending_payment') db.enrolments = db.enrolments.filter((x) => x !== e);
    notify(db, t.userId, 'payment', 'We could not confirm your payment', 'No access was granted and nothing further will be charged.', `/learn/payments/${txnId}`);
    audit(db, 'Payment marked not received', txnId);
  }),

  // ---------- Refunds ----------
  requestRefund: (userId: ID, txnId: ID, reason: string, details: string) => store.run((db) => {
    const t = db.transactions.find((x) => x.id === txnId)!; const id = `RFD-${String(db.refunds.length + 53).padStart(4, '0')}`;
    db.refunds.unshift({ id, txnId, userId, courseId: t.courseId, reason, details, status: 'submitted', createdAt: nowISO(), history: [{ at: nowISO(), label: 'Request submitted' }] });
    return id;
  }),
  decideRefund: (refundId: ID, approve: boolean, note: string, by: 'instructor' | 'admin') => store.run((db) => {
    const r = db.refunds.find((x) => x.id === refundId)!; const actor = userById(db, db.session.userId)!;
    r.status = approve ? 'approved' : 'declined'; r.decisionNote = note; r.decidedBy = actor.id;
    r.history.push({ at: nowISO(), label: `${approve ? 'Approved' : 'Declined'} by ${by} ${actor.name}` });
    notify(db, r.userId, 'payment', approve ? 'Refund approved — processing next' : 'Refund request declined', `${r.id} · ${note}`, `/learn/payments/${r.txnId}`);
    audit(db, `Refund ${approve ? 'approved' : 'declined'}`, refundId, note);
  }),
  completeRefund: (refundId: ID, providerRef: string) => store.run((db) => {
    const r = db.refunds.find((x) => x.id === refundId)!; r.status = 'completed'; r.history.push({ at: nowISO(), label: `Refund completed (ref ${providerRef})` });
    const t = db.transactions.find((x) => x.id === r.txnId)!; t.status = 'refunded'; t.events.push({ at: nowISO(), label: `Refunded ${formatNGN(t.amount)}` });
    const e = enrolmentFor(db, r.userId, r.courseId); if (e) { e.status = 'refunded'; e.accessUntil = todayISO(); } // access ends at completion (D-04)
    notify(db, r.userId, 'payment', 'Refund completed', `${formatNGN(t.amount)} returned to your original payment method.`, `/learn/payments/${t.id}`);
    audit(db, 'Refund completed', refundId, providerRef);
  }),

  // ---------- Learning ----------
  openLesson: (userId: ID, courseId: ID, lessonId: ID) => store.run((db) => { const e = enrolmentFor(db, userId, courseId); if (e) e.lastLessonId = lessonId; }),
  completeLesson: (userId: ID, courseId: ID, lessonId: ID, done = true) => store.run((db) => {
    const e = enrolmentFor(db, userId, courseId); if (!e) return;
    e.completedLessonIds = done ? Array.from(new Set([...e.completedLessonIds, lessonId])) : e.completedLessonIds.filter((x) => x !== lessonId);
    maybeIssueCertificate(db, userId, courseId);
  }),
  submitQuiz: (userId: ID, assessmentId: ID, answers: number[], mode: 'graded' | 'practice') => store.run((db) => {
    const a = assessmentById(db, assessmentId)!; const qs = a.questions!;
    const score = Math.round((qs.filter((q, i) => answers[i] === q.answer).length / qs.length) * 100);
    const id = uid('QA'); db.quizAttempts.push({ id, userId, assessmentId, answers, score, submittedAt: nowISO(), mode });
    if (mode === 'graded') maybeIssueCertificate(db, userId, a.courseId);
    return id;
  }),
  saveDraft: (userId: ID, assessmentId: ID, files: { name: string; size: string }[], note: string) => store.run((db) => {
    let s = db.submissions.filter((x) => x.userId === userId && x.assessmentId === assessmentId).sort((a, b) => b.version - a.version)[0];
    if (!s || (s.status !== 'draft' && s.status !== 'revision_requested')) { s = { id: `SUB-${Math.floor(Math.random() * 900) + 3400}`, userId, assessmentId, version: (s?.version || 0) + 1, status: 'draft', files: [], note: '', published: false, history: s?.history || [] }; db.submissions.push(s); }
    if (s.status === 'revision_requested') { s.status = 'draft'; s.version += 1; }
    s.files = files; s.note = note; return s.id;
  }),
  submitAssignment: (userId: ID, assessmentId: ID, files: { name: string; size: string }[], note: string) => store.run((db) => {
    let s = db.submissions.filter((x) => x.userId === userId && x.assessmentId === assessmentId).sort((a, b) => b.version - a.version)[0];
    if (!s || (s.status !== 'draft' && s.status !== 'revision_requested')) { s = { id: `SUB-${Math.floor(Math.random() * 900) + 3400}`, userId, assessmentId, version: (s?.version || 0) + 1, status: 'draft', files: [], note: '', published: false, history: s?.history || [] }; db.submissions.push(s); }
    else if (s.status === 'revision_requested') s.version += 1;
    s.files = files; s.note = note; s.status = 'submitted'; s.published = false; s.score = undefined; s.scores = undefined; s.feedback = undefined; s.submittedAt = nowISO();
    s.history = [...s.history, { version: s.version, submittedAt: s.submittedAt }];
    return s.id;
  }),
  gradeSubmission: (subId: ID, scores: Record<ID, number>, feedback: string, publish: boolean) => store.run((db) => {
    const s = db.submissions.find((x) => x.id === subId)!; const a = assessmentById(db, s.assessmentId)!;
    const total = Object.values(scores).reduce((x, y) => x + y, 0);
    s.scores = scores; s.score = total; s.feedback = feedback; s.gradedBy = db.session.userId || undefined; s.gradedAt = nowISO(); s.published = publish;
    s.status = total >= a.passMark ? 'graded' : 'revision_requested';
    const h = s.history.find((x) => x.version === s.version); if (h) h.score = total;
    if (publish) {
      notify(db, s.userId, 'grade', `${a.title.split(':')[0]} graded: ${total}%`, total >= a.passMark ? 'Feedback is ready.' : 'Feedback is ready — revision requested.', `/learn/courses/${a.courseId}/assignment/${a.id}/feedback`);
      audit(db, 'Grade published', subId, `${total}%`);
      maybeIssueCertificate(db, s.userId, a.courseId);
    }
  }),

  // ---------- Discussions & notifications ----------
  createThread: (courseId: ID, authorId: ID, title: string, body: string) => store.run((db) => { const id = uid('T'); db.threads.unshift({ id, courseId, authorId, title, body, at: nowISO(), replies: [] }); return id; }),
  reply: (threadId: ID, authorId: ID, body: string) => store.run((db) => {
    const t = db.threads.find((x) => x.id === threadId)!; t.replies.push({ id: uid('R'), authorId, body, at: nowISO() });
    if (t.authorId !== authorId) notify(db, t.authorId, 'course', `New reply in “${t.title}”`, `${userById(db, authorId)!.name} replied.`, `/learn/courses/${t.courseId}/discussions/${t.id}`);
  }),
  markRead: (id: ID, read = true) => store.run((db) => { const n = db.notifications.find((x) => x.id === id); if (n) n.read = read; }),
  markAllRead: (userId: ID) => store.run((db) => { db.notifications.filter((n) => n.userId === userId).forEach((n) => { n.read = true; }); }),

  // ---------- Support ----------
  createTicket: (userId: ID, subject: string, category: string, body: string, relatedRef?: string) => store.run((db) => {
    const id = `SUP-${1186 + db.tickets.length}`;
    db.tickets.unshift({ id, userId, subject, category, status: 'open', priority: category === 'Payment or access' ? 'high' : 'normal', relatedRef, createdAt: nowISO(), messages: [{ id: uid('m'), authorId: userId, body, at: nowISO() }] });
    return id;
  }),
  replyTicket: (ticketId: ID, authorId: ID, body: string, internal = false) => store.run((db) => {
    const t = db.tickets.find((x) => x.id === ticketId)!; t.messages.push({ id: uid('m'), authorId, body, at: nowISO(), internal });
    const author = userById(db, authorId)!;
    if (!internal && author.role === 'admin') { t.status = 'awaiting_learner'; notify(db, t.userId, 'support', `Support replied: ${t.subject}`, body.slice(0, 80), `/learn/support/${t.id}`); }
    if (author.role === 'learner' && t.status !== 'resolved') t.status = 'open';
  }),
  setTicket: (ticketId: ID, patch: { status?: TicketStatus; assigneeId?: ID; priority?: 'normal' | 'high' }) => store.run((db) => {
    const t = db.tickets.find((x) => x.id === ticketId)!; Object.assign(t, patch);
    if (patch.status === 'resolved') notify(db, t.userId, 'support', `Resolved: ${t.subject}`, 'Reply if you still need help.', `/learn/support/${t.id}`);
    audit(db, 'Support ticket updated', ticketId, JSON.stringify(patch).replace(/[{}"]/g, ''));
  }),

  // ---------- Certificates ----------
  requestNameCorrection: (userId: ID, certId: ID, name: string) => store.run((db) => api_internal_ticket(db, userId, `Certificate name correction: ${certId}`, 'Certificate', `Please change the name on ${certId} to “${name}”.`, certId)),
  revokeCertificate: (certId: ID, reason: string) => store.run((db) => { const c = db.certificates.find((x) => x.id === certId)!; c.status = 'revoked'; c.revokedReason = reason; c.revokedAt = todayISO(); notify(db, c.userId, 'certificate', 'A certificate was revoked', `${certId} · ${reason}`, `/learn/certificates/${c.courseId}`); audit(db, 'Certificate revoked', certId, reason); }),
  reinstateCertificate: (certId: ID) => store.run((db) => { const c = db.certificates.find((x) => x.id === certId)!; c.status = 'valid'; c.revokedReason = undefined; c.revokedAt = undefined; audit(db, 'Certificate reinstated', certId); }),
  correctCertificateName: (certId: ID, name: string) => store.run((db) => { const c = db.certificates.find((x) => x.id === certId)!; c.nameOnCertificate = name; c.version += 1; audit(db, 'Certificate reissued with corrected name', certId, `v${c.version}: ${name}`); }),

  // ---------- Instructor ----------
  createCourse: (title: string) => store.run((db) => {
    const id = `NEW-${String(db.courses.length + 101)}`;
    db.courses.push({ id, title, subtitle: '', category: 'Foundations', level: 'Beginner', price: 0, instructorId: db.session.userId!, weeks: 4, hoursPerWeek: '3 hours', liveSchedule: 'To be scheduled', nextStart: 'To be confirmed', learners: 0, rating: null, reviews: 0, outcomes: [], prerequisites: '', description: '', status: 'draft', modules: [{ id: uid('m'), title: 'Module 1', lessons: [] }], assessmentIds: [], updatedAt: todayISO(), cover: 'ops' });
    audit(db, 'Course created', id, title); return id;
  }),
  updateCourse: (courseId: ID, patch: Partial<Course>) => store.run((db) => { const c = courseById(db, courseId)!; Object.assign(c, patch, { updatedAt: todayISO() }); }),
  addModule: (courseId: ID, title: string) => store.run((db) => { courseById(db, courseId)!.modules.push({ id: uid('m'), title, lessons: [] }); }),
  addLesson: (courseId: ID, moduleId: ID, title: string) => store.run((db) => {
    const m = courseById(db, courseId)!.modules.find((x) => x.id === moduleId)!; const id = uid('L');
    m.lessons.push({ id, title, type: 'video', minutes: 10, required: true, summary: '', transcript: [], resources: [] }); return id;
  }),
  moveLesson: (courseId: ID, moduleId: ID, lessonId: ID, dir: -1 | 1) => store.run((db) => {
    const ls = courseById(db, courseId)!.modules.find((x) => x.id === moduleId)!.lessons; const i = ls.findIndex((l) => l.id === lessonId); const j = i + dir;
    if (j < 0 || j >= ls.length) return false; [ls[i], ls[j]] = [ls[j], ls[i]]; return true;
  }),
  moveModule: (courseId: ID, moduleId: ID, dir: -1 | 1) => store.run((db) => {
    const ms = courseById(db, courseId)!.modules; const i = ms.findIndex((m) => m.id === moduleId); const j = i + dir;
    if (j < 0 || j >= ms.length) return false; [ms[i], ms[j]] = [ms[j], ms[i]]; return true;
  }),
  updateLesson: (courseId: ID, lessonId: ID, patch: Partial<Lesson>) => store.run((db) => { for (const m of courseById(db, courseId)!.modules) { const l = m.lessons.find((x) => x.id === lessonId); if (l) Object.assign(l, patch); } }),
  deleteLesson: (courseId: ID, lessonId: ID) => store.run((db) => { for (const m of courseById(db, courseId)!.modules) m.lessons = m.lessons.filter((x) => x.id !== lessonId); }),
  updateQuestion: (assessmentId: ID, qIndex: number, patch: Partial<QuizQuestion>) => store.run((db) => { Object.assign(assessmentById(db, assessmentId)!.questions![qIndex], patch); }),
  addQuestion: (assessmentId: ID) => store.run((db) => { const a = assessmentById(db, assessmentId)!; a.questions = [...(a.questions || []), { id: uid('q'), prompt: 'New question', options: ['Option A', 'Option B', 'Option C'], answer: 0, explanation: '' }]; }),
  removeQuestion: (assessmentId: ID, qIndex: number) => store.run((db) => { const a = assessmentById(db, assessmentId)!; a.questions = a.questions!.filter((_, i) => i !== qIndex); }),
  submitForReview: (courseId: ID) => store.run((db) => { const c = courseById(db, courseId)!; c.status = 'in_review'; c.updatedAt = todayISO(); audit(db, 'Course submitted for review', courseId); }),
  postAnnouncement: (courseId: ID, title: string, body: string, emailed: boolean) => store.run((db) => {
    db.announcements.unshift({ id: uid('AN'), courseId, authorId: db.session.userId!, title, body, at: nowISO(), emailed });
    db.enrolments.filter((e) => e.courseId === courseId && e.status === 'active').forEach((e) => notify(db, e.userId, 'announcement', title, `${userById(db, db.session.userId)!.name} · ${courseById(db, courseId)!.title}`, `/learn/notifications`));
  }),

  // ---------- Admin ----------
  reviewCourse: (courseId: ID, decision: 'approved' | 'changes_requested', items: string[]) => store.run((db) => {
    const c = courseById(db, courseId)!; c.reviewNotes = [...(c.reviewNotes || []), { id: uid('RV'), at: nowISO(), by: db.session.userId!, items, decision }];
    c.status = decision === 'approved' ? 'published' : 'changes_requested';
    audit(db, decision === 'approved' ? 'Course approved and published' : 'Changes requested', courseId, items.join('; '));
  }),
  updateUser: (userId: ID, patch: { role?: Role; status?: DB['users'][number]['status'] }, reason: string) => store.run((db) => {
    const u = userById(db, userId)!; const before = `${u.role}/${u.status}`; Object.assign(u, patch); audit(db, 'User updated', u.name, `${before} → ${u.role}/${u.status} · ${reason}`);
  }),
  extendAccess: (enrolmentId: ID, days: number, reason: string) => store.run((db) => { const e = db.enrolments.find((x) => x.id === enrolmentId)!; e.accessUntil = addDays(e.accessUntil || todayISO(), days); if (e.status === 'expired') e.status = 'active'; audit(db, `Access extended ${days} days`, enrolmentId, reason); }),
  endAccess: (enrolmentId: ID, reason: string) => store.run((db) => { const e = db.enrolments.find((x) => x.id === enrolmentId)!; e.status = 'expired'; e.accessUntil = todayISO(); audit(db, 'Access ended', enrolmentId, reason); }),
  updateSettings: (patch: Partial<DB['settings']>) => store.run((db) => { Object.assign(db.settings, patch); audit(db, 'Platform settings updated', 'Settings', Object.keys(patch).join(', ')); }),
  reset: () => store.reset(),
};

function api_internal_ticket(db: DB, userId: ID, subject: string, category: string, body: string, ref: string) {
  const id = `SUP-${1186 + db.tickets.length}`;
  db.tickets.unshift({ id, userId, subject, category, status: 'open', priority: 'normal', relatedRef: ref, createdAt: nowISO(), messages: [{ id: uid('m'), authorId: userId, body, at: nowISO() }] });
  return id;
}
