import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuFileText, LuSave, LuSend } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { assessmentById, assessmentState, courseById, enrolmentFor, userById } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, KeyValue } from '../../components/ui/data';
import { ErrorSummary, Textarea } from '../../components/ui/form';
import { FileUpload, type UploadItem } from '../../components/ui/FileUpload';
import { ConfirmDialog } from '../../components/ui/overlay';
import { RubricView } from '../../components/learning/patterns';
import { StatusTimeline } from '../../components/payments/patterns';
import { formatDateTime } from '../../utils/format';
import { NotFound } from '../public/System';

export function AssignmentSubmission() {
  const { courseId, assessmentId } = useParams(); const { db, user } = useSession(); const u = user!; const toast = useToast();
  const demo = useDemoState(['uncertain'] as const);
  const a = assessmentById(db, assessmentId); const c = courseById(db, courseId); useTitle(a?.title || 'Assignment');
  const st = a ? assessmentState(db, u.id, a) : undefined; const s = st?.submission;
  const editable = !s || s.status === 'draft' || s.status === 'revision_requested';
  const [files, setFiles] = useState<UploadItem[]>(() => s?.status === 'draft' ? s.files.map((f) => ({ ...f, state: 'done' as const, progress: 100 })) : []);
  const [note, setNote] = useState(s?.status === 'draft' ? s.note : ''); const [errors, setErrors] = useState<[string, string][]>([]); const [confirm, setConfirm] = useState(false);
  if (!a || !c || a.kind !== 'assignment') return <NotFound />;
  const e = enrolmentFor(db, u.id, c.id);
  const crumbs = <Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Assessments', `/learn/courses/${c.id}/assessments`], [a.title]]} />;
  if (!e) return <><PageHeader crumbs={crumbs} title={a.title} /><EmptyState title="Enrol to submit this assignment" actions={<Button to={`/courses/${c.id}`}>View course</Button>} /></>;
  const ok = files.filter((f) => f.state === 'done');
  const check = () => { const er: [string, string][] = []; if (files.some((f) => f.state === 'uploading')) er.push(['upload', 'Wait for uploads to finish']); else if (!ok.length) er.push(['upload', 'Add at least one file before submitting']); if (files.some((f) => f.state === 'error')) er.push(['upload', 'Remove or retry the file that failed to upload']); setErrors(er); return !er.length; };
  const left = a.maxAttempts - (s?.history.length || 0);
  const resub = s?.status === 'revision_requested' || (s?.status === 'draft' && (s.history.length || 0) > 0);
  const status = demo === 'uncertain' ? null : s && !editable ? (
    <Alert tone={s.published ? (st!.passed ? 'success' : 'warning') : 'info'} title={s.published ? `Graded: ${s.score}%` : 'Submitted — awaiting grading'} actions={s.published ? <Button size="sm" to={`/learn/courses/${c.id}/assignment/${a.id}/feedback`}>View feedback</Button> : undefined}>
      {s.published ? (st!.passed ? 'Requirement met.' : 'Revision requested.') : `Version ${s.version} received ${formatDateTime(s.submittedAt!)} (receipt ${s.id}). Grading usually takes up to 7 days. Work submitted before your access ends is graded even if access expires.`}
    </Alert>) : null;
  return (
    <>
      <PageHeader crumbs={crumbs} title={a.title} lead="Required · graded · 1 submission + 2 resubmissions" />
      <div className="with-aside">
        <div className="stack">
          {demo === 'uncertain' && <Alert tone="warning" title="We couldn’t confirm your submission" live actions={<><Button size="sm" variant="secondary" to={`/learn/courses/${c.id}/assignment/${a.id}`}>Check submission status</Button><Button size="sm" variant="tertiary" to={`/learn/support/new?ref=${a.id}`}>Contact support</Button></>}>Your file finished uploading but the confirmation didn’t arrive. <strong>Check the status before submitting again</strong> — checking doesn’t use up an attempt.</Alert>}
          {status}
          {s?.status === 'revision_requested' && <Alert tone="warning" title={`Revision requested — score ${s.score}%`} actions={<Button size="sm" variant="secondary" to={`/learn/courses/${c.id}/assignment/${a.id}/feedback`}>Read feedback</Button>}>You have {left} resubmission{left === 1 ? '' : 's'} left.</Alert>}
          <Card title="Brief"><p className="prose">{a.brief}</p></Card>
          {editable && e.status === 'active' && left > 0 && (
            <section className="card stack" aria-labelledby="sub-h">
              <h2 id="sub-h" style={{ fontSize: 'var(--text-lg)' }}>{resub ? `Resubmission ${(s?.history.length || 0)} of 2` : 'Your submission'}</h2>
              <ErrorSummary errors={errors} />
              <div id="upload" tabIndex={-1}><FileUpload label="Your work" hint="Tip: a file with “fail” in its name simulates an upload error." items={files} onChange={setFiles} accept=".pdf,.png,.jpg" error={errors.find((x) => x[0] === 'upload')?.[1]} /></div>
              <Textarea label="Note to your instructor" optional value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} hint="For example, which flow you chose and anything you’d like feedback on." />
              <div className="row">
                <Button onClick={() => { if (check()) setConfirm(true); }} icon={<LuSend aria-hidden="true" />}>{resub ? 'Submit revision' : 'Submit assignment'}</Button>
                <Button variant="secondary" icon={<LuSave aria-hidden="true" />} onClick={() => { api.saveDraft(u.id, a.id, ok.map(({ name, size }) => ({ name, size })), note); toast('Draft saved. It isn’t visible to your instructor until you submit.'); }}>Save draft</Button>
              </div>
              {s?.status === 'draft' && <p className="small muted">Draft saved {s.files.length ? `with ${s.files.length} file${s.files.length > 1 ? 's' : ''}` : ''}. Not yet submitted.</p>}
            </section>
          )}
          {editable && e.status !== 'active' && <Alert tone="info" title="Your access has ended">New submissions are closed. If feedback asking for a revision arrives after access ends, a 14-day revision window opens.</Alert>}
          {editable && left <= 0 && <Alert tone="error" title="No submissions left" actions={<Button size="sm" variant="secondary" to={`/learn/support/new?ref=${a.id}`}>Request an additional attempt</Button>}>You’ve used the initial submission and both resubmissions.</Alert>}
        </div>
        <aside className="stack">
          <Card title="Rubric" headingLevel={2}><RubricView rubric={a.rubric!} /><p className="small secondary" style={{ marginTop: 12 }}>Pass mark for the certificate: {a.passMark}%.</p></Card>
          {s && s.history.length > 0 && <Card title="Submission history" headingLevel={2}><ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{s.history.map((h) => <li key={h.version} className="row-between small"><span className="row" style={{ gap: 6 }}><LuFileText aria-hidden="true" />Version {h.version} · {formatDateTime(h.submittedAt)}</span><span>{h.score !== undefined && s.published ? <strong>{h.score}%</strong> : 'Awaiting'}</span></li>)}</ul></Card>}
        </aside>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={resub ? 'Submit your revision?' : 'Submit your assignment?'} confirmLabel="Submit" onConfirm={() => { api.submitAssignment(u.id, a.id, ok.map(({ name, size }) => ({ name, size })), note); setFiles([]); setNote(''); toast('Submitted. Your instructor will be notified.'); }}>
        <p>You’re submitting {ok.length} file{ok.length > 1 ? 's' : ''}: {ok.map((f) => f.name).join(', ')}.</p><p>This uses submission {(s?.history.length || 0) + 1} of {a.maxAttempts}. You can’t edit it after submitting.</p>
      </ConfirmDialog>
    </>
  );
}

export function AssignmentFeedback() {
  const { courseId, assessmentId } = useParams(); const { db, user } = useSession(); const u = user!;
  const a = assessmentById(db, assessmentId); const c = courseById(db, courseId); useTitle(a ? `Feedback · ${a.title}` : 'Feedback');
  if (!a || !c) return <NotFound />;
  const st = assessmentState(db, u.id, a); const s = st.submission; const grader = userById(db, s?.gradedBy);
  const crumbs = <Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], [a.title, `/learn/courses/${c.id}/assignment/${a.id}`], ['Feedback']]} />;
  const shown = s && s.published && s.feedback !== undefined;
  if (!s || s.status === 'draft' && !s.history.length) return <><PageHeader crumbs={crumbs} title="Feedback" /><EmptyState title="Nothing submitted yet" actions={<Button to={`/learn/courses/${c.id}/assignment/${a.id}`}>Go to assignment</Button>}>Feedback appears here once your instructor publishes a grade.</EmptyState></>;
  if (!shown) return (
    <><PageHeader crumbs={crumbs} title="Feedback" />
      <div className="card"><StatusTimeline steps={[{ label: `Version ${s.version} submitted`, detail: s.submittedAt && formatDateTime(s.submittedAt), state: 'done' }, { label: 'Instructor grading', detail: 'Usually within 7 days. Drafts of your grade aren’t visible until published.', state: 'current' }, { label: 'Feedback published', state: 'todo' }]} /></div></>);
  const left = a.maxAttempts - s.history.length;
  return (
    <>
      <PageHeader crumbs={crumbs} title={`Feedback: ${s.score}%`} lead={`Version ${s.version} · graded by ${grader?.name || 'your instructor'}${s.gradedAt ? ` on ${formatDateTime(s.gradedAt)}` : ''}`} />
      <div className="with-aside">
        <div className="stack">
          {st.passed ? <Alert tone="success" title="Requirement met">You scored at least {a.passMark}% on this assignment.</Alert>
            : <Alert tone="warning" title={`Below the ${a.passMark}% pass mark — revision requested`} actions={left > 0 ? <Button size="sm" to={`/learn/courses/${c.id}/assignment/${a.id}`}>Revise and resubmit</Button> : <Button size="sm" variant="secondary" to={`/learn/support/new?ref=${a.id}`}>Request an additional attempt</Button>}>{left > 0 ? `You have ${left} resubmission${left === 1 ? '' : 's'} left.` : 'You’ve used all submissions.'}</Alert>}
          <Card title="Rubric scores"><RubricView rubric={a.rubric!} scores={s.scores} /></Card>
          <Card title="Instructor’s comments"><p style={{ whiteSpace: 'pre-wrap' }}>{s.feedback}</p></Card>
        </div>
        <aside className="stack"><Card title="Details" headingLevel={2}><KeyValue items={[['Status', <StatusBadge tone={st.tone}>{st.status}</StatusBadge>], ['Files', s.files.map((f) => f.name).join(', ')], ['Submissions used', `${s.history.length} of ${a.maxAttempts}`]]} /></Card><p className="small"><Link to={`/learn/certificates/${c.id}`}>See how this affects your certificate</Link></p></aside>
      </div>
    </>
  );
}
