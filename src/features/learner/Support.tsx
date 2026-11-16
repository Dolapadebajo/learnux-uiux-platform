import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LuLifeBuoy, LuPlus } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { ErrorSummary, Select, TextField, Textarea } from '../../components/ui/form';
import { Conversation, TicketBadge } from '../../components/support/Conversation';
import { formatDateTime, formatRelative } from '../../utils/format';
import { NotFound } from '../public/System';

export const CATEGORIES = ['Payment or access', 'Refund', 'Course content', 'Assessment or grading', 'Certificate', 'Account', 'Accessibility', 'Other'];

export function SupportList() {
  const { db, user } = useSession(); const u = user!; useTitle('Support');
  const mine = db.tickets.filter((t) => t.userId === u.id);
  return (
    <>
      <PageHeader title="Support" lead="We usually reply within one working day." actions={<Button to="/learn/support/new" icon={<LuPlus aria-hidden="true" />}>New request</Button>} />
      <DataTable caption="Your support requests" rows={mine} rowKey={(t) => t.id} empty={<EmptyState icon={<LuLifeBuoy />} title="No support requests" actions={<><Button to="/learn/support/new">Contact support</Button><Button variant="secondary" to="/help">Help centre</Button></>}>Many answers are in the help centre.</EmptyState>} columns={[
        { key: 's', header: 'Subject', primary: true, render: (t) => <span><Link to={`/learn/support/${t.id}`} className="strong">{t.subject}</Link><span className="xs muted" style={{ display: 'block' }}>{t.id} · {t.category}</span></span> },
        { key: 'u', header: 'Last update', render: (t) => formatRelative(t.messages.filter((m) => !m.internal).at(-1)!.at) },
        { key: 'st', header: 'Status', render: (t) => <TicketBadge status={t.status} /> },
      ]} />
    </>
  );
}

export function ContactSupport() {
  const { user } = useSession(); const u = user!; useTitle('Contact support'); const navigate = useNavigate(); const toast = useToast(); const [sp] = useSearchParams();
  const ref = sp.get('ref') || '';
  const [f, setF] = useState({ category: ref.startsWith('TXN') ? 'Payment or access' : ref.startsWith('CERT') ? 'Certificate' : '', subject: ref.startsWith('TXN') ? 'Question about my payment' : '', ref, body: '' });
  const [errors, setErrors] = useState<[string, string][]>([]);
  const submit = () => { const e: [string, string][] = []; if (!f.category) e.push(['cs-cat', 'Choose a topic']); if (f.subject.trim().length < 5) e.push(['cs-subj', 'Add a short subject']); if (f.body.trim().length < 15) e.push(['cs-body', 'Describe what’s happening (at least 15 characters)']); setErrors(e); if (e.length) return; const id = api.createTicket(u.id, f.subject.trim(), f.category, f.body.trim(), f.ref.trim() || undefined); toast(`Request ${id} sent`); navigate(`/learn/support/${id}`); };
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Support', '/learn/support'], ['New request']]} />} title="Contact support" lead="Tell us what’s happening. We’ll reply here and by email (simulated)." />
      <div className="with-aside">
        <form className="card stack" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <ErrorSummary errors={errors} />
          {ref.startsWith('TXN') && <Alert tone="info" title="If a payment is pending, please don’t pay again">We’ll investigate {ref} and update you here.</Alert>}
          <Select id="cs-cat" label="Topic" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={[{ value: '', label: 'Choose a topic' }, ...CATEGORIES]} error={errors.find((x) => x[0] === 'cs-cat')?.[1]} />
          <TextField id="cs-subj" label="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} error={errors.find((x) => x[0] === 'cs-subj')?.[1]} />
          <TextField label="Related reference" optional value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} hint="A transaction, course or certificate reference helps us find it faster." />
          <Textarea id="cs-body" label="What’s happening?" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={6} error={errors.find((x) => x[0] === 'cs-body')?.[1]} />
          <div className="row"><Button type="submit">Send request</Button><Button variant="secondary" to="/learn/support">Cancel</Button></div>
        </form>
        <aside><Card title="Before you send" headingLevel={2}><ul className="stack-sm small" style={{ paddingLeft: 18 }}><li><Link to="/help/bank-transfer-pending">My bank transfer is pending</Link></li><li><Link to="/help/attempts">Requesting another attempt</Link></li><li><Link to="/help/name-correction">Name on my certificate</Link></li></ul></Card></aside>
      </div>
    </>
  );
}

export function TicketConversation() {
  const { ticketId } = useParams(); const { db, user } = useSession(); const u = user!; const toast = useToast();
  const t = db.tickets.find((x) => x.id === ticketId && x.userId === u.id); useTitle(t ? t.subject : 'Support');
  if (!t) return <NotFound />;
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Support', '/learn/support'], [t.id]]} />} title={t.subject} actions={<TicketBadge status={t.status} />} />
      <div className="with-aside">
        <div className="stack">
          {t.status === 'awaiting_learner' && <Alert tone="warning" title="Support is waiting for your reply" />}
          {t.status === 'resolved' && <Alert tone="success" title="This request is resolved">Reply below if you still need help — it will reopen.</Alert>}
          <Conversation db={db} ticket={t} viewerId={u.id} onSend={(body) => { api.replyTicket(t.id, u.id, body); toast('Reply sent'); }} />
        </div>
        <aside><Card title="Request details" headingLevel={2}><KeyValue items={[['Reference', t.id], ['Topic', t.category], ['Opened', formatDateTime(t.createdAt)], ...(t.relatedRef ? [['Related', t.relatedRef.startsWith('TXN') ? <Link to={`/learn/payments/${t.relatedRef}`}>{t.relatedRef}</Link> : t.relatedRef] as [string, ReactNode]] : [])]} /></Card></aside>
      </div>
    </>
  );
}
