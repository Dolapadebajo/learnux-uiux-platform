import { Link } from 'react-router-dom';
import { LuLandmark, LuUsers, LuClock, LuLifeBuoy, LuShieldCheck, LuUndo2 } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, userById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Card, Metric } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/feedback';
import { formatDateTime, formatNGN } from '../../utils/format';

export function AdminDashboard() {
  const { db, user } = useSession(); useTitle('Administration');
  const month = db.transactions.filter((t) => t.status === 'successful' && t.createdAt.startsWith('2026-11'));
  const pending = db.transactions.filter((t) => t.status === 'pending');
  const queues = [
    ...db.courses.filter((c) => c.status === 'in_review').map((c) => ({ to: `/admin/courses/${c.id}`, label: `Review course: ${c.title}`, tag: <StatusBadge tone="info">Course review</StatusBadge> })),
    ...pending.map((t) => ({ to: `/admin/transactions/${t.id}`, label: `Confirm ${t.id} · ${userById(db, t.userId)!.name} · ${formatNGN(t.amount)}`, tag: <StatusBadge tone="warning">Payment pending</StatusBadge> })),
    ...db.refunds.filter((r) => r.status === 'approved').map((r) => ({ to: `/admin/refunds?id=${r.id}`, label: `Process refund ${r.id} · ${courseById(db, r.courseId)!.title}`, tag: <StatusBadge tone="warning">Refund approved</StatusBadge> })),
    ...db.refunds.filter((r) => r.status === 'submitted').map((r) => ({ to: `/admin/refunds?id=${r.id}`, label: `${r.id} awaiting instructor decision`, tag: <StatusBadge tone="neutral">Refund submitted</StatusBadge> })),
    ...db.tickets.filter((t) => t.status === 'open').map((t) => ({ to: `/admin/support/${t.id}`, label: `${t.id}: ${t.subject}`, tag: <StatusBadge tone={t.priority === 'high' ? 'warning' : 'info'}>{t.priority === 'high' ? 'High priority' : 'Support'}</StatusBadge> })),
  ];
  return (
    <>
      <PageHeader title="Administration" lead={`Signed in as ${user!.name}. Every action here is simulated and recorded in the activity log.`} />
      <div className="grid-3">
        <Metric icon={<LuLandmark aria-hidden="true" />} label="Collected in November" value={formatNGN(month.reduce((s, t) => s + t.amount, 0))} note={`${month.length} successful payments`} />
        <Metric icon={<LuUsers aria-hidden="true" />} label="Learners with active access" value={new Set(db.enrolments.filter((e) => e.status === 'active').map((e) => e.userId)).size} note="demo records" />
        <Metric icon={<LuClock aria-hidden="true" />} label="Payments awaiting confirmation" value={pending.length} />
        <Metric icon={<LuShieldCheck aria-hidden="true" />} label="Courses awaiting review" value={db.courses.filter((c) => c.status === 'in_review').length} />
        <Metric icon={<LuUndo2 aria-hidden="true" />} label="Refunds to process" value={db.refunds.filter((r) => r.status === 'approved').length} />
        <Metric icon={<LuLifeBuoy aria-hidden="true" />} label="Open support requests" value={db.tickets.filter((t) => t.status === 'open').length} />
      </div>
      <div className="with-aside" style={{ marginTop: 'var(--space-6)' }}>
        <Card title="Needs action">{queues.length ? <ul className="checklist">{queues.map((q) => <li key={q.to + q.label}><div className="grow"><Link to={q.to} className="strong">{q.label}</Link></div>{q.tag}</li>)}</ul> : <p className="secondary">All queues are clear.</p>}</Card>
        <Card title="Recent activity" headingLevel={2} actions={<Link to="/admin/reports" className="small">Reports</Link>}>
          <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{db.audit.slice(0, 6).map((a) => <li key={a.id} className="small"><span className="strong">{a.action}</span> · {a.target}<span className="xs muted" style={{ display: 'block' }}>{userById(db, a.actorId)?.name || 'System'} · {formatDateTime(a.at)}</span></li>)}</ul>
          <div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" to="/admin/settings">Platform settings</Button></div>
        </Card>
      </div>
    </>
  );
}
