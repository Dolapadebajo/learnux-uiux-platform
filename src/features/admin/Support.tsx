import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuLifeBuoy } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { userById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/form';
import { Conversation, TicketBadge } from '../../components/support/Conversation';
import { formatDateTime, formatRelative } from '../../utils/format';
import { NotFound } from '../public/System';
import type { TicketStatus } from '../../types';

export function SupportQueue() {
  const { db, user } = useSession(); useTitle('Support queue');
  const [st, setSt] = useState('open'); const [who, setWho] = useState('all');
  const admins = db.users.filter((u) => u.role === 'admin');
  const rows = db.tickets.filter((t) => (st === 'all' || t.status === st) && (who === 'all' || (who === 'me' ? t.assigneeId === user!.id : who === 'none' ? !t.assigneeId : t.assigneeId === who)))
    .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high') || a.createdAt.localeCompare(b.createdAt));
  return (
    <>
      <PageHeader title="Support queue" lead="High priority first, then oldest." />
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <Select label="Status" value={st} onChange={(e) => setSt(e.target.value)} options={[{ value: 'open', label: 'Open — needs staff reply' }, { value: 'awaiting_learner', label: 'Awaiting learner' }, { value: 'resolved', label: 'Resolved' }, { value: 'all', label: 'All' }]} />
        <Select label="Assignee" value={who} onChange={(e) => setWho(e.target.value)} options={[{ value: 'all', label: 'Anyone' }, { value: 'me', label: 'Assigned to me' }, { value: 'none', label: 'Unassigned' }, ...admins.map((a) => ({ value: a.id, label: a.name }))]} />
      </div>
      <DataTable caption="Support tickets" rows={rows} rowKey={(t) => t.id} empty={<EmptyState icon={<LuLifeBuoy />} title="No tickets in this view" />} columns={[
        { key: 's', header: 'Subject', primary: true, render: (t) => <span><Link to={`/admin/support/${t.id}`} className="strong">{t.subject}</Link><span className="xs muted" style={{ display: 'block' }}>{t.id} · {t.category}</span></span> },
        { key: 'l', header: 'Learner', render: (t) => userById(db, t.userId)!.name },
        { key: 'p', header: 'Priority', render: (t) => t.priority === 'high' ? <StatusBadge tone="warning">High</StatusBadge> : 'Normal' },
        { key: 'a', header: 'Assignee', render: (t) => userById(db, t.assigneeId)?.name || 'Unassigned' },
        { key: 'u', header: 'Last update', render: (t) => formatRelative(t.messages.at(-1)!.at) },
        { key: 'st', header: 'Status', render: (t) => <TicketBadge status={t.status} staff /> },
      ]} />
    </>
  );
}

export function StaffTicket() {
  const { ticketId } = useParams(); const { db, user } = useSession(); const toast = useToast();
  const t = db.tickets.find((x) => x.id === ticketId); useTitle(t ? `${t.id} · ${t.subject}` : 'Ticket');
  if (!t) return <NotFound />;
  const learner = userById(db, t.userId)!; const admins = db.users.filter((u) => u.role === 'admin');
  const txn = t.relatedRef?.startsWith('TXN') ? db.transactions.find((x) => x.id === t.relatedRef) : undefined;
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Support queue', '/admin/support'], [t.id]]} />} title={t.subject} lead={`${learner.name} · ${t.category} · opened ${formatDateTime(t.createdAt)}`} actions={<TicketBadge status={t.status} staff />} />
      <div className="with-aside">
        <Conversation db={db} ticket={t} viewerId={user!.id} staffView onSend={(body, internal) => { api.replyTicket(t.id, user!.id, body, internal); toast(internal ? 'Internal note saved (staff only)' : 'Reply sent — status set to awaiting learner'); }} />
        <aside className="stack">
          <Card title="Ticket controls" headingLevel={2}>
            <div className="stack">
              <Select label="Status" value={t.status} onChange={(e) => { api.setTicket(t.id, { status: e.target.value as TicketStatus }); toast('Status updated'); }} options={[{ value: 'open', label: 'Open' }, { value: 'awaiting_learner', label: 'Awaiting learner' }, { value: 'resolved', label: 'Resolved' }]} />
              <Select label="Assignee" value={t.assigneeId || ''} onChange={(e) => { api.setTicket(t.id, { assigneeId: e.target.value || undefined }); toast('Assignee updated'); }} options={[{ value: '', label: 'Unassigned' }, ...admins.map((a) => ({ value: a.id, label: a.name }))]} />
              <Select label="Priority" value={t.priority} onChange={(e) => { api.setTicket(t.id, { priority: e.target.value as 'normal' | 'high' }); toast('Priority updated'); }} options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} />
            </div>
          </Card>
          <Card title="Learner" headingLevel={2}><KeyValue items={[['Name', <Link to={`/admin/users/${learner.id}`}>{learner.name}</Link>], ['Email', learner.email], ['Related', t.relatedRef || '—']]} />
            {txn && <div className="stack-sm" style={{ marginTop: 12 }}><p className="small">Payment <span className="mono">{txn.id}</span> is <strong>{txn.status}</strong>.</p><Button size="sm" variant="secondary" to={`/admin/transactions/${txn.id}`}>Open transaction</Button></div>}
          </Card>
        </aside>
      </div>
    </>
  );
}
