import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuReceipt, LuPrinter } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, lessonProgress, courseAssessments, assessmentState } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { Checkbox, ErrorSummary, Select, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { Receipt, StatusTimeline, TxnBadge, refundLabel, refundSteps, refundTone } from '../../components/payments/patterns';
import { formatDate, formatDateTime, formatNGN, methodLabel } from '../../utils/format';
import { NotFound } from '../public/System';

export function PaymentHistory() {
  const { db, user } = useSession(); const u = user!; useTitle('Payments & refunds');
  const txns = db.transactions.filter((t) => t.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const refunds = db.refunds.filter((r) => r.userId === u.id);
  return (
    <>
      <PageHeader title="Payments & refunds" lead="Every payment, its status and receipt. Amounts in naira." />
      {refunds.length > 0 && <section className="stack-sm" style={{ marginBottom: 'var(--space-6)' }} aria-label="Refund requests">{refunds.map((r) => <Alert key={r.id} tone={r.status === 'completed' ? 'success' : r.status === 'declined' ? 'error' : 'info'} title={`${r.id} · ${refundLabel[r.status]}`} actions={<Button size="sm" variant="secondary" to={`/learn/payments/${r.txnId}`}>Track refund</Button>}>{courseById(db, r.courseId)!.title}</Alert>)}</section>}
      <DataTable caption="Your transactions" rows={txns} rowKey={(t) => t.id} empty={<EmptyState icon={<LuReceipt />} title="No payments yet" actions={<Button to="/courses">Browse courses</Button>}>Free enrolments don’t appear here.</EmptyState>} columns={[
        { key: 'c', header: 'Course', primary: true, render: (t) => <span><Link to={`/learn/payments/${t.id}`} className="strong">{courseById(db, t.courseId)!.title}</Link><span className="xs muted mono" style={{ display: 'block' }}>{t.id}</span></span> },
        { key: 'd', header: 'Date', render: (t) => formatDate(t.createdAt) },
        { key: 'm', header: 'Method', render: (t) => methodLabel(t.method) },
        { key: 'a', header: 'Amount', numeric: true, render: (t) => formatNGN(t.amount, { free: false }) },
        { key: 's', header: 'Status', render: (t) => <TxnBadge status={t.status} /> },
      ]} actions={(t) => <Button size="sm" variant="secondary" to={`/learn/payments/${t.id}`}>{t.status === 'successful' || t.status === 'refunded' ? 'Receipt' : 'Details'}<span className="sr-only"> for {t.id}</span></Button>} />
    </>
  );
}

export function TransactionReceipt() {
  const { txnId } = useParams(); const { db, user } = useSession(); const u = user!;
  const t = db.transactions.find((x) => x.id === txnId && x.userId === u.id); useTitle(t ? `Payment ${t.id}` : 'Payment');
  if (!t) return <NotFound />;
  const c = courseById(db, t.courseId)!; const r = db.refunds.find((x) => x.txnId === t.id);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Payments & refunds', '/learn/payments'], [t.id]]} />} title={c.title} lead={`${methodLabel(t.method)} · ${formatDateTime(t.createdAt)}`} actions={<TxnBadge status={t.status} />} />
      <div className="with-aside">
        <div className="stack">
          {t.status === 'pending' && <Alert tone="warning" title="Waiting for confirmation" actions={<Button size="sm" variant="secondary" to={`/checkout/${c.id}/status/${t.id}`}>Payment status</Button>}>Please don’t pay again. The course unlocks automatically once confirmed.</Alert>}
          {t.status === 'failed' && <Alert tone="info" title="This payment didn’t go through">{t.failureReason} No money was taken.</Alert>}
          {r && <Card title={`Refund ${r.id}`} actions={<StatusBadge tone={refundTone[r.status]}>{refundLabel[r.status]}</StatusBadge>}>
            {r.status === 'approved' && <Alert tone="info" title="Approved — not yet refunded" className="mt-0">An administrator will process the refund next. You keep course access until the refund is completed.</Alert>}
            <div style={{ marginTop: 16 }}><StatusTimeline steps={refundSteps(r)} /></div>
            <p className="small secondary">Reason: {r.reason}</p>
          </Card>}
          {(t.status === 'successful' || t.status === 'refunded') && <Receipt txn={t} course={c} user={u} />}
          <Card title="Activity"><ul className="stack-sm" style={{ paddingLeft: 18 }}>{t.events.map((e, i) => <li key={i} className="small"><span className="secondary">{formatDateTime(e.at)}</span> — {e.label}</li>)}</ul></Card>
        </div>
        <aside className="stack">
          <Card title="Actions" headingLevel={2}><div className="stack-sm">
            {(t.status === 'successful' || t.status === 'refunded') && <Button variant="secondary" block icon={<LuPrinter aria-hidden="true" />} onClick={() => window.print()}>Print receipt</Button>}
            {t.status === 'successful' && !r && <Button variant="secondary" block to={`/learn/payments/${t.id}/refund`}>Request a refund</Button>}
            <Button variant="tertiary" block to={`/learn/support/new?ref=${t.id}`}>Get help with this payment</Button>
          </div></Card>
        </aside>
      </div>
    </>
  );
}

const REASONS = ['Course isn’t what I expected', 'Schedule doesn’t work for me', 'Technical problems', 'Bought by mistake', 'Charged twice or wrong amount', 'Other'];
export function RefundRequest() {
  const { txnId } = useParams(); const { db, user } = useSession(); const u = user!; const navigate = useNavigate(); const toast = useToast();
  const t = db.transactions.find((x) => x.id === txnId && x.userId === u.id); useTitle('Request a refund');
  const [reason, setReason] = useState(''); const [details, setDetails] = useState(''); const [ack, setAck] = useState(false); const [errors, setErrors] = useState<[string, string][]>([]); const [confirm, setConfirm] = useState(false);
  if (!t) return <NotFound />;
  const c = courseById(db, t.courseId)!; const existing = db.refunds.find((r) => r.txnId === t.id);
  const crumbs = <Breadcrumbs items={[['Payments & refunds', '/learn/payments'], [t.id, `/learn/payments/${t.id}`], ['Request a refund']]} />;
  if (existing) return <><PageHeader crumbs={crumbs} title="Request a refund" /><Alert tone="info" title={`You already requested a refund (${existing.id})`} actions={<Button size="sm" to={`/learn/payments/${t.id}`}>Track it</Button>}>{refundLabel[existing.status]}.</Alert></>;
  if (t.status !== 'successful') return <><PageHeader crumbs={crumbs} title="Request a refund" /><Alert tone="info" title="Refunds are only available for successful payments" actions={<Button size="sm" variant="secondary" to={`/learn/support/new?ref=${t.id}`}>Contact support</Button>}>This payment is {t.status}. If you were charged for a pending or failed payment, contact support.</Alert></>;
  const lp = lessonProgress(db, u.id, c.id); const graded = courseAssessments(db, c.id).map((a) => assessmentState(db, u.id, a)).filter((s) => s.attemptsUsed > 0).length;
  const submit = () => { const e: [string, string][] = []; if (!reason) e.push(['rf-reason', 'Choose a reason']); if (details.trim().length < 10) e.push(['rf-details', 'Tell us a little more (at least 10 characters)']); if (!ack) e.push(['rf-ack', 'Confirm you understand what happens to your access']); setErrors(e); if (!e.length) setConfirm(true); };
  return (
    <>
      <PageHeader crumbs={crumbs} title="Request a refund" lead={`${c.title} · ${formatNGN(t.amount)} paid ${formatDate(t.createdAt)}`} />
      <div className="with-aside">
        <form className="stack form" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <ErrorSummary errors={errors} />
          <Select id="rf-reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} options={[{ value: '', label: 'Choose a reason' }, ...REASONS]} error={errors.find((x) => x[0] === 'rf-reason')?.[1]} />
          <Textarea id="rf-details" label="Tell us more" value={details} onChange={(e) => setDetails(e.target.value)} rows={5} hint="Course-related requests are read by the instructor." error={errors.find((x) => x[0] === 'rf-details')?.[1]} />
          <div className="field">{errors.find((x) => x[0] === 'rf-ack') && <span className="field-error">{errors.find((x) => x[0] === 'rf-ack')?.[1]}</span>}<Checkbox id="rf-ack" checked={ack} onChange={(e) => setAck(e.target.checked)} label="I understand I keep access while the request is reviewed, and access ends when a refund is completed." /></div>
          <div className="row"><Button type="submit">Submit refund request</Button><Button variant="secondary" to={`/learn/payments/${t.id}`}>Cancel</Button></div>
        </form>
        <aside className="stack">
          <Card title="Your course activity" headingLevel={2}><KeyValue items={[['Lessons', `${lp.done} of ${lp.total}`], ['Graded work started', String(graded)], ['Paid', `${formatNGN(t.amount)} by ${methodLabel(t.method)}`]]} /><p className="xs muted" style={{ marginTop: 12 }}>Shared with the reviewer as context. Refund eligibility rules are still being defined (decision D-03).</p></Card>
          <Card title="What happens next" headingLevel={2}><StatusTimeline steps={[{ label: 'You submit the request', state: 'current' }, { label: 'Instructor decides (course-related)', state: 'todo' }, { label: 'Administrator processes approved refunds', state: 'todo' }, { label: 'Refund completed', state: 'todo' }]} /></Card>
        </aside>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Submit refund request?" confirmLabel="Submit request" simulated onConfirm={() => { const id = api.requestRefund(u.id, t.id, reason, details.trim()); toast(`Refund request ${id} submitted`); navigate(`/learn/payments/${t.id}`); }}>
        <p>We’ll ask for a refund of {formatNGN(t.amount)} for {c.title}. You’ll be notified at each step.</p>
      </ConfirmDialog>
    </>
  );
}
