import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuSearchX } from 'react-icons/lu';
import { useTitle } from '../../hooks/useTitle';
import { lessonProgress, userById, courseAssessments, assessmentState, eligibility, enrolmentFor, certificateFor } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Avatar, Card, DataTable, KeyValue, ProgressBar } from '../../components/ui/data';
import { SearchInput, Select } from '../../components/ui/form';
import { Button } from '../../components/ui/Button';
import { EligibilityChecklist } from '../../components/learning/patterns';
import { CourseWorkspaceNav, useInstructorCourse } from './shared';
import { formatDate } from '../../utils/format';
import { NotFound } from '../public/System';

export function CourseLearners() {
  const { db, course: c } = useInstructorCourse(); useTitle(c ? `Learners · ${c.title}` : 'Learners');
  const [q, setQ] = useState(''); const [f, setF] = useState('all');
  if (!c) return <NotFound />;
  const rows = db.enrolments.filter((e) => e.courseId === c.id).map((e) => ({ e, u: userById(db, e.userId)!, p: lessonProgress(db, e.userId, c.id), el: eligibility(db, e.userId, c.id) }))
    .filter((r) => !q || r.u.name.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => f === 'all' || (f === 'behind' ? r.p.pct < 50 : f === 'ready' ? r.el.eligible : r.el.items.some((i) => i.pending)));
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Learners" lead={`${c.learners} enrolled · ${db.enrolments.filter((e) => e.courseId === c.id).length} demo learner records shown`} />
      <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
        <SearchInput label="Search learners" value={q} onChange={setQ} placeholder="Search by name" className="grow" />
        <Select label="Show" value={f} onChange={(e) => setF(e.target.value)} options={[{ value: 'all', label: 'All learners' }, { value: 'behind', label: 'Under 50% of lessons' }, { value: 'pending', label: 'Awaiting my grading' }, { value: 'ready', label: 'Certificate requirements met' }]} />
      </div>
      <DataTable caption="Learners" rows={rows} rowKey={(r) => r.e.id} empty={<EmptyState icon={<LuSearchX />} title="No learners match">Try clearing the search or filter.</EmptyState>} columns={[
        { key: 'n', header: 'Learner', primary: true, render: (r) => <Link to={`/teach/courses/${c.id}/learners/${r.u.id}`} className="strong">{r.u.name}</Link> },
        { key: 'p', header: 'Lessons', render: (r) => <span style={{ display: 'block', minWidth: 120 }}><span className="small">{r.p.done}/{r.p.total} ({r.p.pct}%)</span><ProgressBar hideLabel value={r.p.pct} label={`${r.u.name}: lessons complete`} /></span> },
        { key: 'g', header: 'Graded work passed', render: (r) => `${r.el.items.filter((i) => i.id !== 'lessons' && i.met).length}/${r.el.items.length - 1}` },
        { key: 'c', header: 'Certificate', render: (r) => certificateFor(db, r.u.id, c.id) ? <StatusBadge tone="success">Issued</StatusBadge> : r.el.items.some((i) => i.pending) ? <StatusBadge tone="info">Awaiting grading</StatusBadge> : <StatusBadge tone="neutral">{r.el.remaining} left</StatusBadge> },
        { key: 'a', header: 'Access', render: (r) => r.e.status === 'active' ? `Until ${formatDate(r.e.accessUntil)}` : r.e.status },
      ]} />
    </>
  );
}

export function LearnerDetail() {
  const { userId } = useParams(); const { db, course: c } = useInstructorCourse(); const toast = useToast();
  const u = userById(db, userId); useTitle(u ? `${u.name} · progress` : 'Learner');
  if (!c || !u) return <NotFound />;
  const e = enrolmentFor(db, u.id, c.id); if (!e) return <NotFound />;
  const p = lessonProgress(db, u.id, c.id); const el = eligibility(db, u.id, c.id); const sts = courseAssessments(db, c.id).map((a) => assessmentState(db, u.id, a));
  return (
    <>
      <Breadcrumbs items={[['Courses', '/teach/courses'], [c.title, `/teach/courses/${c.id}/learners`], ['Learners', `/teach/courses/${c.id}/learners`], [u.name]]} />
      <PageHeader title={u.name} lead={`${c.title} · enrolled ${formatDate(e.enrolledAt)}`} actions={<Button variant="secondary" onClick={() => toast('Direct messages aren’t part of this prototype. Use announcements or discussion replies.', 'info')}>Message learner</Button>} />
      <div className="with-aside">
        <div className="stack">
          <Card title="Lessons"><ProgressBar value={p.pct} label="Required lessons" detail={`${p.done} of ${p.total}`} /><div className="stack-sm" style={{ marginTop: 16 }}>{c.modules.map((m, i) => { const d = m.lessons.filter((l) => e.completedLessonIds.includes(l.id)).length; return <ProgressBar key={m.id} value={(d / m.lessons.length) * 100} label={`Module ${i + 1}: ${m.title}`} detail={`${d}/${m.lessons.length}`} />; })}</div></Card>
          <Card title="Graded work"><DataTable caption="Graded work" rows={sts} rowKey={(s) => s.a.id} columns={[{ key: 'a', header: 'Activity', primary: true, render: (s) => s.a.title }, { key: 't', header: 'Attempts', render: (s) => `${s.attemptsUsed} of ${s.a.maxAttempts}` }, { key: 's', header: 'Status', render: (s) => <StatusBadge tone={s.tone}>{s.status}</StatusBadge> }]} actions={(s) => s.submission && s.submission.status !== 'draft' ? <Button size="sm" variant="secondary" to={`/teach/submissions/${s.submission.id}`}>Open</Button> : null} /></Card>
        </div>
        <aside className="stack">
          <Card title="Learner" headingLevel={2}><div className="row" style={{ marginBottom: 12 }}><Avatar initials={u.initials} /><div><p className="strong">{u.name}</p><p className="small secondary">{u.location}</p></div></div><KeyValue items={[['Access until', formatDate(e.accessUntil)], ['Last lesson', c.modules.flatMap((m) => m.lessons).find((l) => l.id === e.lastLessonId)?.title || '—']]} /></Card>
          <Card title="Certificate requirements" headingLevel={2}><EligibilityChecklist items={el.items} /></Card>
        </aside>
      </div>
    </>
  );
}
