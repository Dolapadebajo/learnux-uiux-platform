import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuLock, LuBookOpen, LuArrowRight } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, enrolmentFor, lessonProgress, nextLesson, courseAssessments, assessmentState, eligibility, userById, pendingTxnFor, accessDaysLeft } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { EnrolledCourseCard } from '../../components/learning/CourseCard';
import { ModuleList } from '../../components/learning/patterns';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, StatusBadge } from '../../components/ui/feedback';
import { Breadcrumbs, NavTabs, Tabs, TabPanel } from '../../components/ui/navigation';
import { Card, KeyValue, ProgressRing } from '../../components/ui/data';
import { formatDate } from '../../utils/format';
import { NotFound } from '../public/System';

export function MyCourses() {
  const { db, user } = useSession(); useTitle('My courses'); const u = user!;
  const [tab, setTab] = useState<'active' | 'completed' | 'ended'>('active');
  const mine = db.enrolments.filter((e) => e.userId === u.id);
  const groups = {
    active: mine.filter((e) => (e.status === 'active' && lessonProgress(db, u.id, e.courseId).pct < 100) || e.status === 'pending_payment'),
    completed: mine.filter((e) => e.status === 'active' && lessonProgress(db, u.id, e.courseId).pct === 100),
    ended: mine.filter((e) => e.status === 'expired' || e.status === 'refunded'),
  };
  return (
    <>
      <PageHeader title="My courses" actions={<Button variant="secondary" to="/courses">Browse more courses</Button>} />
      <Tabs idBase="mc" label="Course status" value={tab} onChange={setTab} tabs={[{ id: 'active', label: 'In progress', count: groups.active.length }, { id: 'completed', label: 'Lessons complete', count: groups.completed.length }, { id: 'ended', label: 'Access ended', count: groups.ended.length }]} />
      <TabPanel idBase="mc" value={tab}>
        <h2 className="sr-only">{{ active: 'In progress', completed: 'Lessons complete', ended: 'Access ended' }[tab]}</h2>
        {groups[tab].length ? <div className="stack">{groups[tab].map((e) => { const c = courseById(db, e.courseId)!; const n = nextLesson(db, u.id, c.id); return <EnrolledCourseCard key={e.id} course={c} enrolment={e} progress={lessonProgress(db, u.id, c.id)} nextLessonId={n?.id} nextLessonTitle={n?.title} />; })}</div>
          : <EmptyState icon={<LuBookOpen />} title={tab === 'completed' ? 'No completed courses yet' : tab === 'ended' ? 'No ended courses' : 'No courses in progress'} actions={tab === 'active' ? <Button to="/courses">Browse courses</Button> : undefined}>{tab === 'completed' ? 'Courses appear here once every required lesson is done.' : tab === 'ended' ? 'Courses whose access period ended or were refunded appear here.' : 'Enrol in a course to start learning.'}</EmptyState>}
      </TabPanel>
    </>
  );
}

export function CourseTabs({ courseId }: { courseId: string }) {
  return <NavTabs label="Course sections" className="subnav" items={[{ to: `/learn/courses/${courseId}`, label: 'Lessons', end: true }, { to: `/learn/courses/${courseId}/assessments`, label: 'Assessments' }, { to: `/learn/courses/${courseId}/discussions`, label: 'Discussions' }, { to: `/learn/certificates/${courseId}`, label: 'Certificate' }]} />;
}

export function CourseOverview() {
  const { courseId } = useParams(); const { db, user } = useSession(); const u = user!;
  const c = courseById(db, courseId); useTitle(c?.title || 'Course');
  if (!c) return <NotFound />;
  const e = enrolmentFor(db, u.id, c.id); const ins = userById(db, c.instructorId)!;
  const crumbs = <Breadcrumbs items={[['My courses', '/learn/courses'], [c.title]]} />;
  if (!e || e.status === 'pending_payment') {
    const pend = pendingTxnFor(db, u.id, c.id);
    return <><PageHeader crumbs={crumbs} title={c.title} /><EmptyState icon={<LuLock />} title={pend ? 'This course unlocks when your payment is confirmed' : 'You’re not enrolled in this course'} actions={pend ? <Button to={`/checkout/${c.id}/status/${pend.id}`}>Check payment status</Button> : <><Button to={`/courses/${c.id}`}>View course details</Button><Button variant="secondary" to="/learn/courses">My courses</Button></>}>{pend ? 'Please don’t pay again. We’ll notify you as soon as it’s confirmed.' : 'Lessons, assessments and discussions are available after enrolment.'}</EmptyState></>;
  }
  const p = lessonProgress(db, u.id, c.id); const n = nextLesson(db, u.id, c.id); const assess = courseAssessments(db, c.id); const el = eligibility(db, u.id, c.id);
  const ended = e.status !== 'active';
  return (
    <>
      <PageHeader crumbs={crumbs} title={c.title} lead={`${ins.name} · ${c.liveSchedule}`}
        actions={!ended && n && <Button to={`/learn/courses/${c.id}/lessons/${n.id}`} iconRight={<LuArrowRight aria-hidden="true" />}>{p.done ? 'Resume' : 'Start'}: {n.title.replace(/^\d+\.\d+ /, '')}</Button>} />
      {ended && <Alert tone="info" title={e.status === 'refunded' ? 'Your refund was completed, so access has ended' : `Your access ended on ${formatDate(e.accessUntil)}`} className="subnav">You can still see your grades, feedback and any certificate. Lessons, recordings and new attempts are closed. Work you submitted before access ended will still be graded.</Alert>}
      <CourseTabs courseId={c.id} />
      <div className="with-aside">
        <section aria-labelledby="lessons-h" className="stack">
          <h2 id="lessons-h" className="sr-only">Modules and lessons</h2>
          <ModuleList course={c} completed={e.completedLessonIds} currentLessonId={ended ? undefined : n?.id} base={`/learn/courses/${c.id}`} locked={ended} assessments={assess} assessmentStatus={(a) => { const st = assessmentState(db, u.id, a); return <StatusBadge tone={st.tone}>{st.status}</StatusBadge>; }} />
        </section>
        <aside className="stack">
          <Card title="Your progress" headingLevel={2}><div className="row" style={{ flexWrap: 'nowrap' }}><ProgressRing value={p.pct} label="Lesson progress" /><div><p className="strong">{p.done} of {p.total} lessons</p><p className="small secondary">Lesson progress only — grades are tracked separately.</p></div></div></Card>
          <Card title="Certificate requirements" headingLevel={2}><p className="small secondary">{el.eligible ? 'All requirements met.' : `${el.remaining} of ${el.items.length} requirements left.`}</p><div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" to={`/learn/certificates/${c.id}`}>View checklist</Button></div></Card>
          <Card title="Course details" headingLevel={2}><KeyValue items={[['Access', ended ? 'Ended' : `Until ${formatDate(e.accessUntil)} (${accessDaysLeft(e.accessUntil)} days)`], ['Live', c.liveSchedule], ['Recordings', 'Within 48 hours']]} /><p className="small" style={{ marginTop: 12 }}><Link to={`/learn/courses/${c.id}/discussions`}>Ask a question in discussions</Link></p></Card>
        </aside>
      </div>
    </>
  );
}
