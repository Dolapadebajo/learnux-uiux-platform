import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuUsers, LuClipboardList, LuMessageSquare, LuUndo2 } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { assessmentById, courseById, userById, lessonProgress } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Card, DataTable, Metric } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { EmptyState, useToast } from '../../components/ui/feedback';
import { Textarea } from '../../components/ui/form';
import { Dialog } from '../../components/ui/overlay';
import { CourseStatusBadge } from './shared';
import { formatDate, formatNGN, formatRelative } from '../../utils/format';
import type { Refund } from '../../types';

export function InstructorDashboard() {
  const { db, user } = useSession(); const u = user!; useTitle('Instructor dashboard'); const toast = useToast();
  const mine = db.courses.filter((c) => c.instructorId === u.id);
  const ids = mine.map((c) => c.id);
  const toGrade = db.submissions.filter((s) => s.status === 'submitted' && ids.includes(assessmentById(db, s.assessmentId)!.courseId)).sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!));
  const learners = db.enrolments.filter((e) => ids.includes(e.courseId) && e.status === 'active');
  const unanswered = db.threads.filter((t) => ids.includes(t.courseId) && !t.replies.some((r) => userById(db, r.authorId)?.role === 'instructor') && userById(db, t.authorId)?.role !== 'instructor');
  const refunds = db.refunds.filter((r) => ids.includes(r.courseId) && r.status === 'submitted');
  const [decide, setDecide] = useState<{ r: Refund; approve: boolean } | null>(null); const [note, setNote] = useState(''); const [replyTo, setReplyTo] = useState<string | null>(null); const [reply, setReply] = useState(''); const [err, setErr] = useState('');
  return (
    <>
      <PageHeader title={`Good day, ${u.name.split(' ')[0]}`} lead="What needs your attention across your courses." actions={<Button variant="secondary" to="/teach/courses">Manage courses</Button>} />
      <div className="grid-4">
        <Metric icon={<LuUsers aria-hidden="true" />} label="Active learners (demo records)" value={learners.length} note={`${mine.reduce((s, c) => s + c.learners, 0)} enrolled in total`} />
        <Metric icon={<LuClipboardList aria-hidden="true" />} label="Submissions to grade" value={toGrade.length} note={toGrade[0] ? `Oldest: ${formatRelative(toGrade[0].submittedAt!)}` : 'All caught up'} />
        <Metric icon={<LuMessageSquare aria-hidden="true" />} label="Unanswered questions" value={unanswered.length} />
        <Metric icon={<LuUndo2 aria-hidden="true" />} label="Refund decisions" value={refunds.length} note="Course-related requests" />
      </div>
      <div className="with-aside" style={{ marginTop: 'var(--space-6)' }}>
        <div className="stack">
          <Card title="Grading queue" actions={<Link to="/teach/submissions" className="small">Open queue</Link>}>
            <DataTable caption="Submissions awaiting grading" rows={toGrade.slice(0, 5)} rowKey={(s) => s.id} empty={<p className="secondary">Nothing to grade right now.</p>} columns={[
              { key: 'l', header: 'Learner', primary: true, render: (s) => <span className="strong">{userById(db, s.userId)!.name}</span> },
              { key: 'a', header: 'Assessment', render: (s) => `${assessmentById(db, s.assessmentId)!.title.split(':')[0]} · v${s.version}` },
              { key: 'w', header: 'Submitted', render: (s) => formatRelative(s.submittedAt!) },
            ]} actions={(s) => <Button size="sm" to={`/teach/submissions/${s.id}`}>Grade<span className="sr-only"> {userById(db, s.userId)!.name}</span></Button>} />
          </Card>
          <Card title="Refund requests needing your decision">
            {refunds.length ? <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>{refunds.map((r) => { const t = db.transactions.find((x) => x.id === r.txnId)!; const lp = lessonProgress(db, r.userId, r.courseId); return (
              <li key={r.id} className="card card-sm card-subtle stack-sm">
                <p className="strong">{userById(db, r.userId)!.name} · {courseById(db, r.courseId)!.title}</p>
                <p className="small secondary">{r.id} · {formatNGN(t.amount)} · {r.reason} · lessons {lp.done}/{lp.total}</p>
                <p className="small">“{r.details}”</p>
                <div className="row"><Button size="sm" onClick={() => { setDecide({ r, approve: true }); setNote(''); setErr(''); }}>Approve</Button><Button size="sm" variant="secondary" onClick={() => { setDecide({ r, approve: false }); setNote(''); setErr(''); }}>Decline</Button></div>
              </li>
            ); })}</ul> : <p className="secondary">No refund requests waiting.</p>}
            <p className="xs muted" style={{ marginTop: 12 }}>You decide course-related requests. Administrators process the money; approval does not move funds.</p>
          </Card>
          <Card title="Unanswered questions" >{unanswered.length ? <ul className="stack-sm" style={{ paddingLeft: 18 }}>{unanswered.map((t) => <li key={t.id}><span className="strong">{t.title}</span> <span className="small muted">· {userById(db, t.authorId)!.name}, {formatRelative(t.at)} · {courseById(db, t.courseId)!.title}</span> <Button size="sm" variant="tertiary" onClick={() => { setReplyTo(t.id); setReply(''); setErr(''); }}>Reply<span className="sr-only"> to {t.title}</span></Button></li>)}</ul> : <p className="secondary">All questions answered.</p>}</Card>
        </div>
        <aside className="stack">
          <Card title="Your courses" headingLevel={2}>{mine.length ? <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{mine.map((c) => <li key={c.id} className="stack-sm" style={{ paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}><Link to={`/teach/courses/${c.id}/${c.status === 'published' ? 'learners' : 'curriculum'}`} className="strong">{c.title}</Link><div className="row-between"><CourseStatusBadge status={c.status} /><span className="xs muted">Updated {formatDate(c.updatedAt)}</span></div></li>)}</ul> : <EmptyState title="No courses yet" />}</Card>
        </aside>
      </div>
      <Dialog open={!!decide} onClose={() => setDecide(null)} title={decide?.approve ? 'Approve refund request?' : 'Decline refund request?'} footer={<><Button variant="secondary" onClick={() => setDecide(null)}>Cancel</Button><Button variant={decide?.approve ? 'primary' : 'danger'} onClick={() => { if (note.trim().length < 5) { setErr('Give a short reason — the learner will see it'); return; } api.decideRefund(decide!.r.id, decide!.approve, note.trim(), 'instructor'); toast(decide!.approve ? 'Approved — sent to administrators to process' : 'Declined — learner notified'); setDecide(null); }}>{decide?.approve ? 'Approve' : 'Decline'}</Button></>}>
        <div className="stack"><p>{decide?.approve ? 'An administrator will process the refund. The learner keeps access until it is completed.' : 'The learner keeps access and can contact support if they disagree.'}</p><Textarea label="Reason (shared with the learner)" value={note} onChange={(e) => setNote(e.target.value)} error={err} rows={3} /><p className="small muted">Simulated decision — no money moves.</p></div>
      </Dialog>
      <Dialog open={!!replyTo} onClose={() => setReplyTo(null)} title="Reply as instructor" footer={<><Button variant="secondary" onClick={() => setReplyTo(null)}>Cancel</Button><Button onClick={() => { if (reply.trim().length < 2) { setErr('Write a reply'); return; } api.reply(replyTo!, u.id, reply.trim()); setReplyTo(null); toast('Reply posted — learners see it marked “Instructor”'); }}>Post reply</Button></>}>
        <div className="stack"><p className="strong">{db.threads.find((t) => t.id === replyTo)?.title}</p><p className="small secondary">{db.threads.find((t) => t.id === replyTo)?.body}</p><Textarea label="Your reply" value={reply} onChange={(e) => setReply(e.target.value)} error={err} rows={4} /></div>
      </Dialog>
    </>
  );
}
