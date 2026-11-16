import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuShieldCheck } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { allLessons, courseAssessments, userById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Accordion, Card, DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { Checkbox, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { CourseStatusBadge } from '../instructor/shared';
import { formatDate, formatDateTime, formatNGN, formatUSDEstimate } from '../../utils/format';
import { NotFound } from '../public/System';

export function CourseReviewQueue() {
  const { db } = useSession(); useTitle('Course review');
  const rows = [...db.courses].sort((a, b) => Number(b.status === 'in_review') - Number(a.status === 'in_review'));
  return (
    <>
      <PageHeader title="Course review and approval" lead="New courses and resubmissions waiting for review appear first." />
      {!db.courses.some((c) => c.status === 'in_review') && <Alert tone="success" title="Nothing waiting for review" className="subnav">Tip: as Tunde Bakare, submit “Research Ops Basics” from its curriculum page.</Alert>}
      <DataTable caption="Courses" rows={rows} rowKey={(c) => c.id} empty={<EmptyState icon={<LuShieldCheck />} title="No courses" />} columns={[
        { key: 't', header: 'Course', primary: true, render: (c) => <Link to={`/admin/courses/${c.id}`} className="strong">{c.title}</Link> },
        { key: 'i', header: 'Instructor', render: (c) => userById(db, c.instructorId)!.name },
        { key: 's', header: 'Status', render: (c) => <CourseStatusBadge status={c.status} /> },
        { key: 'u', header: 'Updated', render: (c) => formatDate(c.updatedAt) },
      ]} actions={(c) => <Button size="sm" variant={c.status === 'in_review' ? 'primary' : 'secondary'} to={`/admin/courses/${c.id}`}>{c.status === 'in_review' ? 'Review' : 'View'}<span className="sr-only"> {c.title}</span></Button>} />
    </>
  );
}

const CHECKS = ['Outcomes are accurate and not overstated', 'Every video has captions and a transcript', 'Price is in naira with a labelled US$ estimate', 'Assessments follow platform attempt and pass-mark rules', 'Certificate wording says completion, not accreditation', 'Content is original and appropriately licensed'];
export function CourseReview() {
  const { courseId } = useParams(); const { db } = useSession(); const navigate = useNavigate(); const toast = useToast();
  const c = db.courses.find((x) => x.id === courseId); useTitle(c ? `Review · ${c.title}` : 'Review');
  const [checked, setChecked] = useState<string[]>([]); const [notes, setNotes] = useState(''); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState<null | 'approve' | 'changes'>(null);
  if (!c) return <NotFound />;
  const ins = userById(db, c.instructorId)!; const ls = allLessons(c);
  const missingCaps = ls.filter((l) => l.type === 'video' && !l.transcript.length);
  const items = notes.split('\n').map((x) => x.trim()).filter(Boolean);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Course review', '/admin/courses'], [c.title]]} />} title={c.title} lead={`${ins.name} · ${c.modules.length} modules · ${ls.length} lessons`} actions={<CourseStatusBadge status={c.status} />} />
      {c.status !== 'in_review' && <Alert tone="info" title={c.status === 'published' ? 'This course is published' : 'This course isn’t waiting for review'} className="subnav">{c.status === 'changes_requested' ? 'Changes were requested; the instructor will resubmit.' : c.status === 'draft' ? 'The instructor hasn’t submitted it yet.' : 'Material changes to published courses come back here for review.'}</Alert>}
      <div className="with-aside-wide">
        <div className="stack">
          <Card title="Course page summary"><KeyValue items={[['Subtitle', c.subtitle || '—'], ['Level', c.level], ['Price', c.price ? `${formatNGN(c.price)} (${formatUSDEstimate(c.price)} estimate)` : 'Free'], ['Schedule', `${c.weeks} weeks · ${c.hoursPerWeek} a week · ${c.liveSchedule}`], ['Prerequisites', c.prerequisites || '—'], ['Outcomes', c.outcomes.length ? <ul style={{ margin: 0 }}>{c.outcomes.map((o) => <li key={o}>{o}</li>)}</ul> : '—']]} /></Card>
          <section className="stack-sm"><h2 style={{ fontSize: 'var(--text-lg)' }}>Curriculum</h2>{c.modules.map((m, i) => <Accordion key={m.id} title={`Module ${i + 1}: ${m.title}`} meta={`${m.lessons.length} lessons`}><ul className="stack-sm" style={{ paddingLeft: 18 }}>{m.lessons.map((l) => <li key={l.id} className="small">{l.title} · {l.type}{l.type === 'video' && !l.transcript.length && <strong style={{ color: 'var(--color-warning)' }}> · no captions</strong>}</li>)}</ul></Accordion>)}</section>
          <Card title="Assessments">{courseAssessments(db, c.id).length ? <DataTable caption="Assessments" rows={courseAssessments(db, c.id)} rowKey={(a) => a.id} columns={[{ key: 't', header: 'Title', primary: true, render: (a) => a.title }, { key: 'k', header: 'Type', render: (a) => a.kind }, { key: 'p', header: 'Pass mark', render: (a) => `${a.passMark}%` }]} /> : <p className="secondary">No graded assessments defined yet.</p>}</Card>
          {c.reviewNotes?.length ? <Card title="Review history">{c.reviewNotes.map((r) => <div key={r.id} className="small" style={{ marginBottom: 8 }}><strong>{r.decision === 'approved' ? 'Approved' : 'Changes requested'}</strong> · {formatDateTime(r.at)} by {userById(db, r.by)?.name}{r.items.length > 0 && <ul>{r.items.map((x) => <li key={x}>{x}</li>)}</ul>}</div>)}</Card> : null}
        </div>
        <aside className="card stack sticky" aria-label="Review decision">
          <h2 style={{ fontSize: 'var(--text-lg)' }}>Review checklist</h2>
          {missingCaps.length > 0 && <Alert tone="warning" title={`${missingCaps.length} video${missingCaps.length > 1 ? 's' : ''} without captions`} className="mt-0">{missingCaps.map((l) => l.title).join(', ')}</Alert>}
          <fieldset disabled={c.status !== 'in_review'}><legend className="sr-only">Checks</legend>{CHECKS.map((x) => <Checkbox key={x} label={x} checked={checked.includes(x)} onChange={() => setChecked(checked.includes(x) ? checked.filter((y) => y !== x) : [...checked, x])} />)}</fieldset>
          <Textarea label="Changes needed (one per line)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} error={err} disabled={c.status !== 'in_review'} hint="Sent to the instructor if you request changes." />
          <div className="stack-sm">
            <Button block variant="secondary" disabled={c.status !== 'in_review'} onClick={() => { if (!items.length) { setErr('List at least one change for the instructor'); return; } setErr(''); setConfirm('changes'); }}>Request changes</Button>
            <Button block disabled={c.status !== 'in_review'} onClick={() => setConfirm('approve')}>Approve and publish</Button>
            {c.status === 'in_review' && checked.length < CHECKS.length && <p className="xs muted">{CHECKS.length - checked.length} checks not ticked — you can still decide.</p>}
          </div>
        </aside>
      </div>
      <ConfirmDialog open={confirm === 'changes'} onClose={() => setConfirm(null)} title="Request changes?" confirmLabel="Send to instructor" simulated onConfirm={() => { api.reviewCourse(c.id, 'changes_requested', items); toast(`Changes requested — ${ins.name} notified`); navigate('/admin/courses'); }}><p>{ins.name} will see these {items.length} item{items.length > 1 ? 's' : ''} and the course unlocks for editing.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'approve'} onClose={() => setConfirm(null)} title="Approve and publish?" confirmLabel="Approve and publish" simulated onConfirm={() => { api.reviewCourse(c.id, 'approved', items); toast(`${c.title} is now published in the catalogue`); navigate('/admin/courses'); }}><p>{c.title} will appear in the public catalogue immediately.{missingCaps.length ? ' Some videos still lack captions.' : ''}</p></ConfirmDialog>
    </>
  );
}
