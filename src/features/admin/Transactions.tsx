import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseById, userById, enrolmentFor } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, TextField } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { TxnBadge, refundLabel, refundTone } from '../../components/payments/patterns';
import { formatDateTime, formatNGN, methodLabel } from '../../utils/format';
import { NotFound } from '../public/System';

export function TransactionList() {
  const { db } = useSession(); useTitle('Transactions');
  const [q, setQ] = useState(''); const [st, setSt] = useState('all'); const [m, setM] = useState('all');
  const rows = db.transactions.filter((t) => (st === 'all' || t.status === st) && (m === 'all' || t.method === m) && (!q || (t.id + userById(db, t.userId)!.name).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = rows.filter((t) => t.status === 'successful').reduce((s, t) => s + t.amount, 0);
  return (
    <>
      <PageHeader title="Transactions" lead={`${rows.length} shown · ${formatNGN(total, { free: false })} successful in this view. All payments are simulated.`} />
      <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
        <SearchInput label="Search transactions" value={q} onChange={setQ} placeholder="Reference or learner" className="grow" />
        <Select label="Status" value={st} onChange={(e) => setSt(e.target.value)} options={[{ value: 'all', label: 'Any status' }, { value: 'pending', label: 'Pending' }, { value: 'successful', label: 'Successful' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }]} />
        <Select label="Method" value={m} onChange={(e) => setM(e.target.value)} options={[{ value: 'all', label: 'Any method' }, { value: 'card', label: 'Card' }, { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'ussd', label: 'USSD' }]} />
      </div>
      <DataTable caption="Transactions" rows={rows} rowKey={(t) => t.id} empty={<EmptyState title="No transactions match" />} columns={[
        { key: 'r', header: 'Reference', primary: true, render: (t) => <Link to={`/admin/transactions/${t.id}`} className="mono strong">{t.id}</Link> },
        { key: 'l', header: 'Learner', render: (t) => userById(db, t.userId)!.name },
        { key: 'c', header: 'Course', render: (t) => courseById(db, t.courseId)!.title, hideOnMobile: true },
        { key: 'm', header: 'Method', render: (t) => methodLabel(t.method) },
        { key: 'a', header: 'Amount', numeric: true, render: (t) => formatNGN(t.amount, { free: false }) },
        { key: 's', header: 'Status', render: (t) => <TxnBadge status={t.status} /> },
        { key: 'd', header: 'Date', render: (t) => formatDateTime(t.createdAt) },
      ]} />
    </>
  );
}

export function TransactionDetails() {
  const { txnId } = useParams(); const { db } = useSession(); const toast = useToast();
  const t = db.transactions.find((x) => x.id === txnId); useTitle(t ? t.id : 'Transaction');
  const [ev, setEv] = useState(''); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState<null | 'ok' | 'fail'>(null);
  if (!t) return <NotFound />;
  const u = userById(db, t.userId)!; const c = courseById(db, t.courseId)!; const e = enrolmentFor(db, u.id, c.id); const r = db.refunds.find((x) => x.txnId === t.id);
  const tickets = db.tickets.filter((x) => x.relatedRef === t.id);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Transactions', '/admin/transactions'], [t.id]]} />} title={<span className="mono">{t.id}</span>} lead={`${u.name} · ${c.title}`} actions={<TxnBadge status={t.status} />} />
      <div className="with-aside">
        <div className="stack">
          {t.status === 'pending' && (
            <Card title="Resolve pending payment">
              <Alert tone="warning" title="The learner has been told not to pay again" className="mt-0">Confirm only with evidence from the provider. Never ask for a second payment while this is unresolved.</Alert>
              <div className="stack" style={{ marginTop: 16 }}>
                <TextField label="Provider evidence reference" value={ev} onChange={(x) => setEv(x.target.value)} error={err} hint={`Provider reference on file: ${t.providerRef}`} />
                <div className="row"><Button onClick={() => { if (ev.trim().length < 4) { setErr('Enter the provider’s confirmation reference'); return; } setErr(''); setConfirm('ok'); }}>Confirm payment & grant access</Button><Button variant="secondary" onClick={() => setConfirm('fail')}>Mark as not received</Button></div>
              </div>
            </Card>
          )}
          <Card title="Payment"><KeyValue items={[['Amount', formatNGN(t.amount, { free: false })], ['List price', formatNGN(t.listPrice, { free: false })], ['Discount', t.discount ? formatNGN(t.discount) : '—'], ['Method', methodLabel(t.method) + (t.cardLast4 ? ` ending ${t.cardLast4}` : '')], ['Provider reference', <span className="mono">{t.providerRef}</span>], ['Receipt', t.receiptNo || '—'], ['Created', formatDateTime(t.createdAt)], ...(t.failureReason ? [['Failure', t.failureReason] as [string, string]] : [])]} /></Card>
          <Card title="Event log"><ul className="stack-sm" style={{ paddingLeft: 18 }}>{t.events.map((x, i) => <li key={i} className="small"><span className="secondary">{formatDateTime(x.at)}</span> — {x.label}</li>)}</ul></Card>
        </div>
        <aside className="stack">
          <Card title="Learner & access" headingLevel={2}><KeyValue items={[['Learner', <Link to={`/admin/users/${u.id}`}>{u.name}</Link>], ['Enrolment', e ? e.status.replace('_', ' ') : 'None'], ['Access until', e?.accessUntil || '—']]} /></Card>
          {r && <Card title={`Refund ${r.id}`} headingLevel={2}><StatusBadge tone={refundTone[r.status]}>{refundLabel[r.status]}</StatusBadge><div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" to={`/admin/refunds?id=${r.id}`}>Open refund</Button></div></Card>}
          {tickets.length > 0 && <Card title="Related support" headingLevel={2}><ul className="stack-sm" style={{ paddingLeft: 18 }}>{tickets.map((x) => <li key={x.id}><Link to={`/admin/support/${x.id}`}>{x.id}: {x.subject}</Link></li>)}</ul></Card>}
        </aside>
      </div>
      <ConfirmDialog open={confirm === 'ok'} onClose={() => setConfirm(null)} title="Confirm payment and grant access?" confirmLabel="Confirm and grant access" simulated onConfirm={() => { api.confirmTxn(t.id, ev.trim()); toast(`Confirmed — ${u.name} now has access`); }}><p>{t.id} becomes successful, {c.title} unlocks for {u.name}, and their one-year access starts today. They’ll be notified.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'fail'} onClose={() => setConfirm(null)} destructive title="Mark payment as not received?" confirmLabel="Mark as not received" simulated onConfirm={() => { api.failTxn(t.id); toast('Marked as not received — learner notified'); }}><p>{u.name} will be told the payment couldn’t be confirmed and that nothing was charged. They can then choose to pay again.</p></ConfirmDialog>
    </>
  );
}
