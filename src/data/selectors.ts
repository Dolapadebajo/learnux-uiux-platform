/* Read-only derivations used by many views. Keeping rules here keeps every view consistent. */
import type { Assessment, Course, DB, ID, Submission } from '../types';
import { DEMO_TODAY, daysBetween } from '../utils/date';

export const userById = (db: DB, id?: ID | null) => db.users.find((u) => u.id === id);
export const currentUser = (db: DB) => userById(db, db.session.userId);
export const courseById = (db: DB, id?: ID) => db.courses.find((c) => c.id === id);
export const assessmentById = (db: DB, id?: ID) => db.assessments.find((a) => a.id === id);
export const publishedCourses = (db: DB) => db.courses.filter((c) => c.status === 'published');
export const allLessons = (c: Course) => c.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));
export const lessonById = (c: Course, lessonId?: ID) => allLessons(c).find((l) => l.id === lessonId);
export const courseAssessments = (db: DB, courseId: ID) => db.assessments.filter((a) => a.courseId === courseId);

export const enrolmentFor = (db: DB, userId?: ID | null, courseId?: ID) => db.enrolments.find((e) => e.userId === userId && e.courseId === courseId);
export const hasAccess = (db: DB, userId: ID | null | undefined, courseId: ID) => enrolmentFor(db, userId, courseId)?.status === 'active';

export function lessonProgress(db: DB, userId: ID, courseId: ID) {
  const c = courseById(db, courseId); const e = enrolmentFor(db, userId, courseId);
  const req = c ? allLessons(c).filter((l) => l.required) : [];
  const done = e ? req.filter((l) => e.completedLessonIds.includes(l.id)).length : 0;
  return { done, total: req.length, pct: req.length ? Math.round((done / req.length) * 100) : 0 };
}
export function nextLesson(db: DB, userId: ID, courseId: ID) {
  const c = courseById(db, courseId)!; const e = enrolmentFor(db, userId, courseId);
  const ls = allLessons(c);
  return (e?.lastLessonId && !e.completedLessonIds.includes(e.lastLessonId) && ls.find((l) => l.id === e.lastLessonId)) || ls.find((l) => !e?.completedLessonIds.includes(l.id)) || ls[ls.length - 1];
}

export function submissionFor(db: DB, userId: ID, assessmentId: ID): Submission | undefined {
  return db.submissions.filter((s) => s.userId === userId && s.assessmentId === assessmentId).sort((a, b) => b.version - a.version)[0];
}
export interface AssessmentState { a: Assessment; attemptsUsed: number; attemptsLeft: number; best: number | null; passed: boolean; status: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'error'; submission?: Submission; }
export function assessmentState(db: DB, userId: ID, a: Assessment): AssessmentState {
  if (a.kind === 'quiz') {
    const atts = db.quizAttempts.filter((q) => q.userId === userId && q.assessmentId === a.id && q.mode === 'graded');
    const best = atts.length ? Math.max(...atts.map((x) => x.score)) : null;
    const passed = best !== null && best >= a.passMark;
    const left = a.maxAttempts - atts.length;
    return { a, attemptsUsed: atts.length, attemptsLeft: left, best, passed,
      status: passed ? `Passed · best ${best}%` : atts.length === 0 ? 'Not started' : left > 0 ? `Best ${best}% · below ${a.passMark}%` : `Attempts used · best ${best}%`,
      tone: passed ? 'success' : atts.length === 0 ? 'neutral' : left > 0 ? 'warning' : 'error' };
  }
  const s = submissionFor(db, userId, a.id);
  const used = s ? s.history.length : 0;
  const graded = s && s.published && (s.status === 'graded' || s.status === 'revision_requested');
  const passed = !!(graded && (s!.score ?? 0) >= a.passMark);
  let status = 'Not submitted'; let tone: AssessmentState['tone'] = 'neutral';
  if (s?.status === 'draft') { status = 'Draft saved'; tone = 'neutral'; }
  if (s?.status === 'submitted' || (s && !s.published && s.status !== 'draft')) { status = 'Submitted · awaiting grading'; tone = 'info'; }
  if (graded && passed) { status = `Graded ${s!.score}%`; tone = 'success'; }
  if (graded && !passed) { status = `Graded ${s!.score}% · revision needed`; tone = 'warning'; }
  return { a, attemptsUsed: used, attemptsLeft: a.maxAttempts - used, best: graded ? s!.score ?? null : null, passed, status, tone, submission: s };
}

export interface EligibilityItem { id: string; label: string; met: boolean; detail: string; pending?: boolean; link?: string; }
export function eligibility(db: DB, userId: ID, courseId: ID) {
  const c = courseById(db, courseId)!; const lp = lessonProgress(db, userId, courseId);
  const items: EligibilityItem[] = [{ id: 'lessons', label: `Complete all ${lp.total} required lessons`, met: lp.done >= lp.total, detail: `${lp.done} of ${lp.total} complete`, link: `/learn/courses/${courseId}` }];
  courseAssessments(db, courseId).filter((a) => a.required && a.graded).forEach((a) => {
    const st = assessmentState(db, userId, a);
    items.push({ id: a.id, label: `${a.title} — score at least ${a.passMark}%`, met: st.passed, detail: st.status, pending: st.tone === 'info',
      link: a.kind === 'quiz' ? `/learn/courses/${courseId}/quiz/${a.id}` : `/learn/courses/${courseId}/assignment/${a.id}` });
  });
  return { course: c, items, eligible: items.every((i) => i.met), remaining: items.filter((i) => !i.met).length };
}
export const certificateFor = (db: DB, userId: ID, courseId: ID) => db.certificates.find((c) => c.userId === userId && c.courseId === courseId);

export const unreadCount = (db: DB, userId?: ID | null) => db.notifications.filter((n) => n.userId === userId && !n.read).length;
export const pendingTxnFor = (db: DB, userId: ID, courseId: ID) => db.transactions.find((t) => t.userId === userId && t.courseId === courseId && t.status === 'pending');
export function promoFor(db: DB, userId: ID | null | undefined, course: Course) {
  const s = db.settings;
  if (!s.promoEnabled || course.price === 0 || daysBetween(DEMO_TODAY, s.promoEnds) < 0) return { eligible: false, reason: 'No offer is running.', discount: 0 };
  const used = userId ? db.transactions.some((t) => t.userId === userId && t.discount > 0 && t.status === 'successful') : false;
  if (used) return { eligible: false, reason: 'You have already used the first-course offer on this account.', discount: 0 };
  return { eligible: true, reason: `${s.promoPercent}% off your first paid course — ends ${s.promoEnds}.`, discount: Math.round((course.price * s.promoPercent) / 100) };
}
export const accessDaysLeft = (until: string) => daysBetween(DEMO_TODAY, until);
