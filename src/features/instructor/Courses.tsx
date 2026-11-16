import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuPlus } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { allLessons } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, DataTable } from '../../components/ui/data';
import { ErrorSummary, Select, TextField, Textarea } from '../../components/ui/form';
import { Dialog } from '../../components/ui/overlay';
import { CourseStatusBadge, CourseWorkspaceNav, useInstructorCourse } from './shared';
import { formatDate, formatUSDEstimate } from '../../utils/format';
import { NotFound } from '../public/System';
import type { Course } from '../../types';

export function CourseManagement() {
  const { db, user } = useSession(); const u = user!; useTitle('Courses'); const navigate = useNavigate(); const toast = useToast();
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(''); const [err, setErr] = useState('');
  const mine = db.courses.filter((c) => c.instructorId === u.id);
  return (
    <>
      <PageHeader title="Courses" lead="Draft, submit for review and manage your published courses." actions={<Button icon={<LuPlus aria-hidden="true" />} onClick={() => setOpen(true)}>New course</Button>} />
      <DataTable caption="Your courses" rows={mine} rowKey={(c) => c.id} empty={<EmptyState title="No courses yet" actions={<Button onClick={() => setOpen(true)}>Create your first course</Button>} />} columns={[
        { key: 't', header: 'Course', primary: true, render: (c) => <span><span className="strong">{c.title}</span><span className="xs muted" style={{ display: 'block' }}>{c.id} · {c.modules.length} modules · {allLessons(c).length} lessons</span></span> },
        { key: 's', header: 'Status', render: (c) => <CourseStatusBadge status={c.status} /> },
        { key: 'l', header: 'Learners', numeric: true, render: (c) => c.learners },
        { key: 'u', header: 'Updated', render: (c) => formatDate(c.updatedAt) },
      ]} actions={(c) => <div className="row" style={{ gap: 4 }}><Button size="sm" variant="secondary" to={`/teach/courses/${c.id}/${c.status === 'published' ? 'learners' : 'curriculum'}`}>{c.status === 'published' ? 'Manage' : 'Edit'}<span className="sr-only"> {c.title}</span></Button>{c.status === 'published' && <Button size="sm" variant="tertiary" to={`/teach/courses/${c.id}/analytics`}>Analytics<span className="sr-only"> for {c.title}</span></Button>}</div>} />
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a course" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { if (title.trim().length < 5) { setErr('Enter a course title (at least 5 characters)'); return; } const id = api.createCourse(title.trim()); setOpen(false); setTitle(''); toast('Draft created'); navigate(`/teach/courses/${id}/settings`); }}>Create draft</Button></>}>
        <div className="stack"><TextField label="Course title" value={title} onChange={(e) => setTitle(e.target.value)} error={err} /><p className="small secondary">Drafts are private until an administrator approves them.</p></div>
      </Dialog>
    </>
  );
}

export function ReviewBanner({ c }: { c: Course }) {
  const last = c.reviewNotes?.at(-1);
  if (c.status === 'in_review') return <Alert tone="info" title="In review — editing is locked" className="subnav">An administrator is reviewing this course. You’ll be notified of the decision.</Alert>;
  if (c.status === 'changes_requested' && last) return <Alert tone="warning" title="Changes requested by an administrator" className="subnav"><ul style={{ marginTop: 4 }}>{last.items.map((i) => <li key={i}>{i}</li>)}</ul><p className="small" style={{ marginTop: 6 }}>Make the changes, then resubmit from the Curriculum tab.</p></Alert>;
  if (c.status === 'published') return <Alert tone="info" title="Published course" className="subnav">Material changes (lessons, assessments, outcomes, schedule or price) need administrator review and consideration of the {c.learners} enrolled learners. In this prototype, published course content is read-only.</Alert>;
  return null;
}

export function CourseSettings() {
  const { course: c } = useInstructorCourse(); useTitle(c ? `Settings · ${c.title}` : 'Course settings'); const toast = useToast();
  const [f, setF] = useState(() => c ? { title: c.title, subtitle: c.subtitle, category: c.category, level: c.level, price: String(c.price), weeks: String(c.weeks), hoursPerWeek: c.hoursPerWeek, liveSchedule: c.liveSchedule, nextStart: c.nextStart, prerequisites: c.prerequisites, outcomes: c.outcomes.join('\n'), description: c.description } : null);
  const [errors, setErrors] = useState<[string, string][]>([]);
  if (!c || !f) return <NotFound />;
  const locked = c.status === 'in_review' || c.status === 'published';
  const save = () => {
    const e: [string, string][] = [];
    if (f.title.trim().length < 5) e.push(['cs-title', 'Enter a course title']);
    if (!/^\d+$/.test(f.price.trim())) e.push(['cs-price', 'Enter a whole number in naira, or 0 for free']);
    if (!/^\d+$/.test(f.weeks.trim()) || +f.weeks < 1) e.push(['cs-weeks', 'Enter the number of weeks']);
    if (f.outcomes.split('\n').filter((x) => x.trim()).length < 3) e.push(['cs-outcomes', 'Add at least 3 learning outcomes, one per line']);
    setErrors(e); if (e.length) return;
    api.updateCourse(c.id, { ...f, level: f.level as Course['level'], price: +f.price, weeks: +f.weeks, outcomes: f.outcomes.split('\n').map((x) => x.trim()).filter(Boolean) }); toast('Course settings saved');
  };
  const err = (id: string) => errors.find((x) => x[0] === id)?.[1];
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Course settings" actions={<CourseStatusBadge status={c.status} />} />
      <ReviewBanner c={c} />
      <form className="card stack" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        <ErrorSummary errors={errors} />
        <fieldset disabled={locked} className="form-grid">
          <TextField id="cs-title" className="span-2" label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={err('cs-title')} />
          <Textarea className="span-2" label="Short description" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} rows={2} hint="Shown on course cards (one sentence)." />
          <Select label="Level" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Course['level'] })} options={['Beginner', 'Intermediate', 'Advanced']} />
          <Select label="Topic" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={['Foundations', 'Research', 'Visual design', 'Interaction', 'Accessibility', 'Content']} />
          <TextField id="cs-price" label="Price (₦)" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} error={err('cs-price')} hint={/^\d+$/.test(f.price) && +f.price > 0 ? `${formatUSDEstimate(+f.price)} — shown to learners as an estimate` : 'Enter 0 for a free course'} />
          <TextField id="cs-weeks" label="Length (weeks)" inputMode="numeric" value={f.weeks} onChange={(e) => setF({ ...f, weeks: e.target.value })} error={err('cs-weeks')} />
          <TextField label="Weekly workload" value={f.hoursPerWeek} onChange={(e) => setF({ ...f, hoursPerWeek: e.target.value })} />
          <TextField label="Live session schedule" value={f.liveSchedule} onChange={(e) => setF({ ...f, liveSchedule: e.target.value })} hint="Day and time in WAT" />
          <TextField label="Next start" value={f.nextStart} onChange={(e) => setF({ ...f, nextStart: e.target.value })} />
          <TextField label="Prerequisites" value={f.prerequisites} onChange={(e) => setF({ ...f, prerequisites: e.target.value })} />
          <Textarea id="cs-outcomes" className="span-2" label="Learning outcomes" value={f.outcomes} onChange={(e) => setF({ ...f, outcomes: e.target.value })} rows={4} hint="One per line — at least 3." error={err('cs-outcomes')} />
          <div className="field span-2"><span className="field-label">Access period</span><p className="card card-subtle card-sm small">One year from enrolment — platform rule, not editable.</p></div>
        </fieldset>
        {!locked && <div className="row"><Button type="submit">Save settings</Button><Button variant="secondary" to={`/teach/courses/${c.id}/curriculum`}>Next: curriculum</Button></div>}
      </form>
      {c.status === 'published' && <Card title="Course page" className="subnav" headingLevel={2}><Button variant="secondary" to={`/courses/${c.id}`}>View public course page</Button></Card>}
    </>
  );
}
