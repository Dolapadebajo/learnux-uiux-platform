import { Link } from 'react-router-dom';
import { LuCalendar, LuBell, LuAward, LuArrowRight, LuClipboardList, LuBookOpen } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { courseById, lessonProgress, nextLesson, courseAssessments, assessmentState, eligibility, certificateFor, accessDaysLeft } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { CourseCover } from '../../components/learning/CourseCard';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, LoadingCards, StatusBadge } from '../../components/ui/feedback';
import { Card, ProgressBar, ProgressRing } from '../../components/ui/data';
import { formatDate, formatRelative } from '../../utils/format';

export function LearnerDashboard() {
  const { db, user } = useSession(); useTitle('Dashboard'); const demo = useDemoState(['loading'] as const);
  const u = user!; const first = u.name.split(' ')[0];
  if (demo === 'loading') return <><PageHeader title={`Welcome back, ${first}`} /><LoadingCards label="Loading your dashboard" /></>;
  const mine = db.enrolments.filter((e) => e.userId === u.id);
  const active = mine.filter((e) => e.status === 'active');
  if (!mine.length) return (
    <><PageHeader title={`Welcome to LearnUX, ${first}`} lead="You’re not enrolled in a course yet." />
      <EmptyState icon={<LuBookOpen />} title="Start your first course" actions={<><Button to="/courses">Browse courses</Button><Button variant="secondary" to="/courses/DT-100">Try the free course</Button></>}>Compare level, workload and live schedules, or begin with the free two-week introduction.</EmptyState></>);
  const resume = active.map((e) => ({ e, c: courseById(db, e.courseId)!, p: lessonProgress(db, u.id, e.courseId) })).filter((x) => x.p.pct < 100).sort((a, b) => b.p.pct - a.p.pct)[0] || active.map((e) => ({ e, c: courseById(db, e.courseId)!, p: lessonProgress(db, u.id, e.courseId) }))[0];
  const todo = active.flatMap((e) => courseAssessments(db, e.courseId).filter((a) => a.required).map((a) => ({ a, st: assessmentState(db, u.id, a), c: courseById(db, e.courseId)! }))).filter((x) => !x.st.passed);
  const pending = db.transactions.filter((t) => t.userId === u.id && t.status === 'pending');
  const ending = active.filter((e) => accessDaysLeft(e.accessUntil) <= 30);
  const unread = db.notifications.filter((n) => n.userId === u.id && !n.read).slice(0, 3);
  const newCert = db.certificates.filter((c) => c.userId === u.id && c.status === 'valid').at(-1);
  const nl = resume ? nextLesson(db, u.id, resume.c.id) : undefined;
  return (
    <>
      <PageHeader title={`Welcome back, ${first}`} lead={active.length ? `You have ${active.length} active ${active.length === 1 ? 'course' : 'courses'}.` : 'You have no active courses right now.'} />
      <div className="stack">
        {pending.map((t) => <Alert key={t.id} tone="warning" title={`Payment pending: ${courseById(db, t.courseId)!.title}`} actions={<Button size="sm" variant="secondary" to={`/checkout/${t.courseId}/status/${t.id}`}>Check status</Button>}>{t.id} is waiting for bank confirmation. Please don’t pay again — the course unlocks automatically.</Alert>)}
        {ending.map((e) => <Alert key={e.id} tone="warning" title={`Access to ${courseById(db, e.courseId)!.title} ends in ${accessDaysLeft(e.accessUntil)} days`}>Submit graded work before {formatDate(e.accessUntil)} — it will still be graded afterwards.</Alert>)}
        {newCert && <Alert tone="success" title="You have a certificate" actions={<Button size="sm" variant="secondary" to={`/learn/certificates/${newCert.courseId}`}>View certificate</Button>}>{courseById(db, newCert.courseId)!.title} · {newCert.id}</Alert>}
      </div>
      <div className="with-aside" style={{ marginTop: 'var(--space-6)' }}>
        <div className="stack-lg">
          {resume && nl && (
            <section aria-labelledby="resume-h" className="resume-card">
              <CourseCover cover={resume.c.cover} height={124} />
              <div className="stack-sm">
                <p className="eyebrow">{resume.p.done ? 'Continue where you left off' : 'Start learning'}</p>
                <h2 id="resume-h" style={{ fontSize: 'var(--text-xl)' }}>{nl.title}</h2>
                <p className="small secondary">{resume.c.title} · {nl.moduleTitle} · {nl.type === 'video' ? 'Video' : 'Reading'} {nl.minutes} min{resume.e.lastLessonId === nl.id && resume.e.lastPosition ? ` · stopped at ${resume.e.lastPosition}` : ''}</p>
                <ProgressBar value={resume.p.pct} label="Lesson progress" detail={`${resume.p.done} of ${resume.p.total} lessons`} />
                <div className="row"><Button to={`/learn/courses/${resume.c.id}/lessons/${nl.id}`} iconRight={<LuArrowRight aria-hidden="true" />}>{resume.p.done ? 'Resume lesson' : 'Start lesson'}</Button><Button variant="tertiary" to={`/learn/courses/${resume.c.id}`}>Course overview</Button></div>
              </div>
            </section>
          )}
          <Card title="Graded work to complete" actions={<Link to="/learn/progress" className="small">View progress</Link>}>
            {todo.length ? <ul className="checklist">{todo.map(({ a, st, c }) => (
              <li key={a.id}><LuClipboardList aria-hidden="true" style={{ color: 'var(--color-primary)' }} /><div className="grow"><Link to={`/learn/courses/${c.id}/${a.kind === 'quiz' ? 'quiz' : 'assignment'}/${a.id}`} className="strong">{a.title}</Link><p className="small secondary">{c.title} · self-paced, before your access ends</p></div><StatusBadge tone={st.tone}>{st.status}</StatusBadge></li>
            ))}</ul> : <p className="secondary">Nothing outstanding. Nice work.</p>}
          </Card>
          <section className="stack" aria-labelledby="mycourses-h">
            <div className="row-between"><h2 id="mycourses-h">My courses</h2><Link to="/learn/courses">All courses</Link></div>
            <div className="grid-2">{active.map((e) => { const c = courseById(db, e.courseId)!; const p = lessonProgress(db, u.id, c.id); const el = eligibility(db, u.id, c.id); return (
              <article key={e.id} className="card card-sm row row-top" style={{ flexWrap: 'nowrap' }}>
                <ProgressRing value={p.pct} label={`${c.title} lesson progress`} size={64} />
                <div className="stack-sm grow"><h3 style={{ fontSize: 'var(--text-md)' }}><Link to={`/learn/courses/${c.id}`}>{c.title}</Link></h3><p className="small secondary">{p.done}/{p.total} lessons · {certificateFor(db, u.id, c.id) ? 'Certificate issued' : el.eligible ? 'Certificate ready' : `${el.remaining} requirement${el.remaining === 1 ? '' : 's'} left`}</p><p className="xs muted">Access until {formatDate(e.accessUntil)}</p></div>
              </article>
            ); })}</div>
          </section>
        </div>
        <aside className="stack">
          {resume && <Card title="Next live session" headingLevel={2}><div className="row row-top" style={{ flexWrap: 'nowrap' }}><LuCalendar aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--color-accent)', flex: 'none' }} /><div><p className="strong">Wed 18 Nov, 7:00 pm WAT</p><p className="small secondary">Card sorting clinic · {resume.c.title}</p><p className="xs muted">Moved from Tuesday — see announcement</p></div></div></Card>}
          <Card title="Notifications" headingLevel={2} actions={<Link to="/learn/notifications" className="small">See all</Link>}>
            {unread.length ? <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{unread.map((n) => <li key={n.id} className="row row-top" style={{ flexWrap: 'nowrap' }}><LuBell aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--color-primary)', flex: 'none', marginTop: 3 }} /><div><Link to={n.link} className="small strong">{n.title}</Link><p className="xs muted">{formatRelative(n.at)}</p></div></li>)}</ul> : <p className="small secondary">You’re all caught up.</p>}
          </Card>
          <Card title="Certificates" headingLevel={2}><div className="row row-top" style={{ flexWrap: 'nowrap' }}><LuAward aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--color-accent)', flex: 'none' }} /><p className="small secondary">{db.certificates.filter((c) => c.userId === u.id && c.status === 'valid').length} issued. Complete all lessons and score 50%+ on graded work to earn one.</p></div><div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" to="/learn/certificates">My certificates</Button></div></Card>
        </aside>
      </div>
    </>
  );
}
