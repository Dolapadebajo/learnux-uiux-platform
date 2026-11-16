import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuUndo2 } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseById, userById, lessonProgress } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { Select, TextField, Textarea } from '../../components/ui/form';
import { ConfirmDialog, Drawer } from '../../components/ui/overlay';
import { StatusTimeline, refundLabel, refundSteps, refundTone } from '../../components/payments/patterns';
import { formatDateTime, formatNGN } from '../../utils/format';

export function RefundReview() {
  const { db } = useSession(); useTitle('Refund review'); const toast = useToast();
  const [sp, setSp] = useSearchParams(); const sel = sp.get('id'); const [st, setSt] = useState('open');
  const [ref, setRef] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState<null | 'complete' | 'approve' | 'decline'>(null);
  const rows = db.refunds.filter((r) => st === 'all' || (st === 'open' ? r.status === 'submitted' || r.status === 'approved' : r.status === st));
  const r = db.refunds.find((x) => x.id === sel); const t = r && db.transactions.find((x) => x.id === r.txnId);
  return (
    <>
      <PageHeader title="Refund review" lead="Instructors decide course-related requests; administrators process approved refunds and decide payment problems." />
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}><Select label="Show" value={st} onChange={(e) => setSt(e.target.value)} options={[{ value: 'open', label: 'Needs action or waiting' }, { value: 'approved', label: 'Approved — to process' }, { value: 'completed', label: 'Completed' }, { value: 'declined', label: 'Declined' }, { value: 'all', label: 'All' }]} /></div>
      <DataTable caption="Refund requests" rows={rows} rowKey={(x) => x.id} selectedKey={sel || undefined} empty={<EmptyState icon={<LuUndo2 />} title="No refund requests in this view" />} columns={[
        { key: 'i', header: 'Request', primary: true, render: (x) => <span className="strong">{x.id}</span> },
        { key: 'l', header: 'Learner', render: (x) => userById(db, x.userId)!.name },
        { key: 'c', header: 'Course', render: (x) => courseById(db, x.courseId)!.title },
        { key: 'a', header: 'Amount', numeric: true, render: (x) => formatNGN(db.transactions.find((y) => y.id === x.txnId)!.amount) },
        { key: 's', header: 'Status', render: (x) => <StatusBadge tone={refundTone[x.status]}>{refundLabel[x.status]}</StatusBadge> },
      ]} actions={(x) => <Button size="sm" variant={x.status === 'approved' ? 'primary' : 'secondary'} onClick={() => { setSp({ id: x.id }); setErr(''); setNote(''); setRef(''); }}>{x.status === 'approved' ? 'Process' : 'Open'}<span className="sr-only"> {x.id}</span></Button>} />
      <Drawer open={!!r} onClose={() => setSp({})} title={r ? `Refund ${r.id}` : 'Refund'}>
        {r && t && <div className="stack">
          <KeyValue items={[['Learner', userById(db, r.userId)!.name], ['Course', courseById(db, r.courseId)!.title], ['Transaction', <Link to={`/admin/transactions/${t.id}`} className="mono">{t.id}</Link>], ['Amount', formatNGN(t.amount)], ['Reason', r.reason], ['Lessons done', `${lessonProgress(db, r.userId, r.courseId).done} of ${lessonProgress(db, r.userId, r.courseId).total}`], ['Requested', formatDateTime(r.createdAt)]]} />
          <p className="small">“{r.details}”</p>
          <StatusTimeline steps={refundSteps(r)} />
          {r.status === 'approved' && <>
            <Alert tone="info" title="Approved — money not yet returned" className="mt-0">Process the refund with the provider, then record its reference. Course access ends at completion.</Alert>
            <TextField label="Provider refund reference" value={ref} onChange={(e) => setRef(e.target.value)} error={err} />
            <Button onClick={() => { if (ref.trim().length < 4) { setErr('Enter the provider’s refund reference'); return; } setErr(''); setConfirm('complete'); }}>Mark refund completed</Button>
          </>}
          {r.status === 'submitted' && <>
            <Alert tone="info" title="Waiting for the instructor’s decision" className="mt-0">{r.reason === 'Charged twice or wrong amount' ? 'This looks like a payment problem — administrators can decide it directly.' : 'Course-related requests are decided by the instructor. Administrators can override for payment problems.'}</Alert>
            <Textarea label="Administrator decision note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} error={err} hint="Shared with the learner." />
            <div className="row"><Button variant="secondary" onClick={() => { if (note.trim().length < 5) { setErr('Add a short note'); return; } setErr(''); setConfirm('approve'); }}>Approve as administrator</Button><Button variant="tertiary" onClick={() => { if (note.trim().length < 5) { setErr('Add a short note'); return; } setErr(''); setConfirm('decline'); }}>Decline</Button></div>
          </>}
          {(r.status === 'completed' || r.status === 'declined') && <p className="small secondary">{r.decisionNote}</p>}
        </div>}
      </Drawer>
      <ConfirmDialog open={confirm === 'complete'} onClose={() => setConfirm(null)} title="Mark this refund as completed?" confirmLabel="Mark completed" simulated onConfirm={() => { api.completeRefund(r!.id, ref.trim()); toast('Refund completed — learner notified; access ended'); }}><p>{formatNGN(t?.amount || 0)} is recorded as returned. The transaction becomes “Refunded” and the learner’s access to {courseById(db, r?.courseId)?.title} ends now.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'approve'} onClose={() => setConfirm(null)} title="Approve this refund?" confirmLabel="Approve" simulated onConfirm={() => { api.decideRefund(r!.id, true, note.trim(), 'admin'); toast('Approved — now process it'); }}><p>The learner will be told it’s approved and still needs processing.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'decline'} onClose={() => setConfirm(null)} destructive title="Decline this refund?" confirmLabel="Decline" simulated onConfirm={() => { api.decideRefund(r!.id, false, note.trim(), 'admin'); toast('Declined — learner notified'); }}><p>The learner keeps access and sees your note.</p></ConfirmDialog>
    </>
  );
}
