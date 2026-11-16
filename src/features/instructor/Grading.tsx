import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuFileText, LuEye, LuSave, LuSend } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { assessmentById, courseById, userById, enrolmentFor } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { ErrorSummary, Select, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { formatDate, formatDateTime, formatRelative } from '../../utils/format';
import { NotFound } from '../public/System';
import type { Submission } from '../../types';

const subStatus = (s: Submission) => s.status === 'submitted' ? <StatusBadge tone="info">Needs grading</StatusBadge> : !s.published ? <StatusBadge tone="warning">Draft grade — not published</StatusBadge> : s.status === 'graded' ? <StatusBadge tone="success">Published · {s.score}%</StatusBadge> : <StatusBadge tone="warning">Published · {s.score}% · revision</StatusBadge>;

export function SubmissionQueue() {
  const { db, user } = useSession(); const u = user!; useTitle('Submissions');
  const [status, setStatus] = useState('needs'); const [course, setCourse] = useState('all');
  const mine = db.courses.filter((c) => c.instructorId === u.id);
  const subs = db.submissions.filter((s) => s.status !== 'draft').filter((s) => { const a = assessmentById(db, s.assessmentId)!; return mine.some((c) => c.id === a.courseId) && (course === 'all' || a.courseId === course); })
    .filter((s) => status === 'all' || (status === 'needs' ? s.status === 'submitted' || !s.published : s.published)).sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''));
  return (
    <>
      <PageHeader title="Submission review queue" lead="Oldest first. Includes work submitted before a learner’s access ended." />
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'needs', label: 'Needs grading or publishing' }, { value: 'done', label: 'Published' }, { value: 'all', label: 'All' }]} />
        <Select label="Course" value={course} onChange={(e) => setCourse(e.target.value)} options={[{ value: 'all', label: 'All my courses' }, ...mine.map((c) => ({ value: c.id, label: c.title }))]} />
      </div>
      <DataTable caption="Submissions" rows={subs} rowKey={(s) => s.id} empty={<EmptyState title="Nothing in this view">{status === 'needs' ? 'You’re all caught up.' : 'Try another filter.'}</EmptyState>} columns={[
        { key: 'l', header: 'Learner', primary: true, render: (s) => <span><span className="strong">{userById(db, s.userId)!.name}</span><span className="xs muted" style={{ display: 'block' }}>{s.id} · version {s.version}</span></span> },
        { key: 'a', header: 'Assessment', render: (s) => assessmentById(db, s.assessmentId)!.title },
        { key: 'w', header: 'Submitted', render: (s) => s.submittedAt ? formatRelative(s.submittedAt) : '—' },
        { key: 'st', header: 'Status', render: subStatus },
      ]} actions={(s) => <Button size="sm" variant={s.status === 'submitted' ? 'primary' : 'secondary'} to={`/teach/submissions/${s.id}`}>{s.status === 'submitted' ? 'Grade' : 'Open'}<span className="sr-only"> {userById(db, s.userId)!.name}</span></Button>} />
    </>
  );
}

export function GradingWorkspace() {
  const { submissionId } = useParams(); const { db, user } = useSession(); const navigate = useNavigate(); const toast = useToast();
  const s = db.submissions.find((x) => x.id === submissionId); const a = s && assessmentById(db, s.assessmentId); const c = a && courseById(db, a.courseId);
  useTitle(s ? `Grade ${s.id}` : 'Grading');
  const [scores, setScores] = useState<Record<string, string>>(() => Object.fromEntries((a?.rubric || []).map((r) => [r.id, s?.scores?.[r.id] !== undefined ? String(s!.scores![r.id]) : ''])));
  const [feedback, setFeedback] = useState(s?.feedback || ''); const [errors, setErrors] = useState<[string, string][]>([]); const [publish, setPublish] = useState(false);
  if (!s || !a || !c || c.instructorId !== user!.id || !a.rubric) return <NotFound />;
  const learner = userById(db, s.userId)!; const e = enrolmentFor(db, s.userId, c.id);
  const total = a.rubric.reduce((sum, r) => sum + (Number(scores[r.id]) || 0), 0);
  const validate = () => { const er: [string, string][] = []; a.rubric!.forEach((r) => { const v = scores[r.id]; if (v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > r.max) er.push([`sc-${r.id}`, `${r.name}: enter a score from 0 to ${r.max}`]); }); if (feedback.trim().length < 20) er.push(['gr-fb', 'Write feedback of at least 20 characters so the learner knows what to do next']); setErrors(er); return !er.length; };
  const num = () => Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Number(v)]));
  const left = a.maxAttempts - s.history.length;
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Submissions', '/teach/submissions'], [s.id]]} />} title={`${learner.name} · ${a.title.split(':')[0]}`} lead={`${c.title} · version ${s.version} · submitted ${s.submittedAt ? formatDateTime(s.submittedAt) : '—'}`} actions={subStatus(s)} />
      {e?.status !== 'active' && <Alert tone="info" title="This learner’s access has ended" className="subnav">Work submitted before access ended must still be graded. If you request a revision, the learner gets a 14-day assessment-only window.</Alert>}
      {s.published && <Alert tone="success" title="Feedback published" className="subnav">The learner can see this grade. Saving again updates what they see.</Alert>}
      <div className="split-view">
        <div className="stack">
          <Card title="Submission">
            <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{s.files.map((f) => <li key={f.name} className="file-item"><LuFileText aria-hidden="true" /><span className="grow"><span className="strong">{f.name}</span><span className="small secondary" style={{ display: 'block' }}>{f.size}</span></span><Button size="sm" variant="secondary" icon={<LuEye aria-hidden="true" />} onClick={() => toast('File preview is simulated — submitted files aren’t stored in this prototype.', 'info')}>Preview</Button></li>)}</ul>
            {s.note && <div className="card card-subtle card-sm" style={{ marginTop: 12 }}><p className="small strong">Learner’s note</p><p className="small">{s.note}</p></div>}
          </Card>
          <Card title="Brief"><p className="small secondary">{a.brief}</p></Card>
          {s.history.length > 1 && <Card title="Earlier versions"><ul className="stack-sm" style={{ paddingLeft: 18 }}>{s.history.slice(0, -1).map((h) => <li key={h.version} className="small">Version {h.version} · {formatDateTime(h.submittedAt)} · {h.score ?? '—'}%</li>)}</ul></Card>}
        </div>
        <form className="card stack" noValidate onSubmit={(ev) => ev.preventDefault()}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>Rubric</h2>
          <ErrorSummary errors={errors} />
          <div className="rubric">{a.rubric.map((r) => (
            <div key={r.id} className="rubric-row">
              <div className="grow"><label htmlFor={`sc-${r.id}`} className="strong">{r.name}</label><p className="small secondary">{r.description}</p></div>
              <span className="row nowrap" style={{ gap: 6 }}><input id={`sc-${r.id}`} className="input" inputMode="numeric" value={scores[r.id]} onChange={(ev) => setScores({ ...scores, [r.id]: ev.target.value })} aria-invalid={errors.some((x) => x[0] === `sc-${r.id}`) || undefined} aria-describedby={`max-${r.id}`} /><span id={`max-${r.id}`} className="muted">/ {r.max}</span></span>
            </div>
          ))}<div className="rubric-row rubric-total"><p className="strong grow">Total</p><p className="strong" aria-live="polite">{total}%</p></div></div>
          <p className="small" role="status">{total >= a.passMark ? <StatusBadge tone="success">Meets the {a.passMark}% pass mark</StatusBadge> : <StatusBadge tone="warning">Below {a.passMark}% — publishing requests a revision ({left} resubmission{left === 1 ? '' : 's'} left)</StatusBadge>}</p>
          <Textarea id="gr-fb" label="Feedback for the learner" value={feedback} onChange={(ev) => setFeedback(ev.target.value)} rows={6} hint="Say what worked, what to change and how." />
          <div className="row">
            <Button variant="secondary" icon={<LuSave aria-hidden="true" />} onClick={() => { if (!validate()) return; api.gradeSubmission(s.id, num(), feedback.trim(), false); toast('Draft saved — not visible to the learner'); }}>Save draft</Button>
            <Button icon={<LuSend aria-hidden="true" />} onClick={() => { if (validate()) setPublish(true); }}>Publish feedback</Button>
          </div>
          <KeyValue items={[['Learner', learner.name], ['Access', e?.status === 'active' ? `Active until ${formatDate(e.accessUntil)}` : 'Ended']]} />
        </form>
      </div>
      <ConfirmDialog open={publish} onClose={() => setPublish(false)} title="Publish feedback?" confirmLabel="Publish" onConfirm={() => { api.gradeSubmission(s.id, num(), feedback.trim(), true); toast(`Published — ${learner.name} has been notified`); navigate('/teach/submissions'); }}>
        <p>{learner.name} will see a score of <strong>{total}%</strong> and your feedback{total < a.passMark ? ', with a request to revise' : ''}. Their progress and certificate eligibility update immediately.</p>
      </ConfirmDialog>
    </>
  );
}
