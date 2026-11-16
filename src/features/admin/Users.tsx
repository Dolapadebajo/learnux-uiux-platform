import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuSearchX, LuCheck, LuMinus } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Avatar, Card, DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, TextField } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { formatDate, formatDateTime } from '../../utils/format';
import { NotFound } from '../public/System';
import type { Role, User } from '../../types';

const roleLabel: Record<Role, string> = { learner: 'Learner', instructor: 'Instructor', admin: 'Administrator' };
const statusTone = { active: 'success', suspended: 'error', invited: 'info' } as const;

export function UserManagement() {
  const { db } = useSession(); useTitle('Users');
  const [q, setQ] = useState(''); const [role, setRole] = useState('all'); const [status, setStatus] = useState('all');
  const rows = db.users.filter((u) => (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase())) && (role === 'all' || u.role === role) && (status === 'all' || u.status === status));
  return (
    <>
      <PageHeader title="Users" lead={`${db.users.length} accounts (fictional).`} actions={<Button variant="secondary" to="/admin/roles">Roles & permissions</Button>} />
      <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
        <SearchInput label="Search users" value={q} onChange={setQ} placeholder="Name or email" className="grow" />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: 'all', label: 'All roles' }, { value: 'learner', label: 'Learners' }, { value: 'instructor', label: 'Instructors' }, { value: 'admin', label: 'Administrators' }]} />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'invited', label: 'Invited' }, { value: 'suspended', label: 'Suspended' }]} />
      </div>
      <DataTable caption="Users" rows={rows} rowKey={(u) => u.id} empty={<EmptyState icon={<LuSearchX />} title="No users match these filters" actions={<Button variant="secondary" onClick={() => { setQ(''); setRole('all'); setStatus('all'); }}>Clear filters</Button>} />} columns={[
        { key: 'n', header: 'Name', primary: true, render: (u) => <Link to={`/admin/users/${u.id}`} className="strong">{u.name}</Link> },
        { key: 'e', header: 'Email', render: (u) => u.email },
        { key: 'r', header: 'Role', render: (u) => roleLabel[u.role] },
        { key: 's', header: 'Status', render: (u) => <StatusBadge tone={statusTone[u.status]}>{u.status[0].toUpperCase() + u.status.slice(1)}</StatusBadge> },
        { key: 'j', header: 'Joined', render: (u) => formatDate(u.joined) },
      ]} />
    </>
  );
}

export function UserDetails() {
  const { userId } = useParams(); const { db, user: me } = useSession(); const toast = useToast();
  const u = db.users.find((x) => x.id === userId); useTitle(u ? u.name : 'User');
  const [role, setRole] = useState<Role | ''>(''); const [reason, setReason] = useState(''); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState<null | 'role' | 'suspend'>(null);
  if (!u) return <NotFound />;
  const self = u.id === me!.id; const isSupportOnly = me!.id === 'u-musa';
  const enr = db.enrolments.filter((e) => e.userId === u.id); const log = db.audit.filter((a) => a.target === u.name || a.actorId === u.id).slice(0, 6);
  const go = (kind: 'role' | 'suspend') => { if (reason.trim().length < 5) { setErr('Give a reason (at least 5 characters) — it’s saved in the activity log'); return; } setErr(''); setConfirm(kind); };
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Users', '/admin/users'], [u.name]]} />} title={u.name} lead={`${u.email} · joined ${formatDate(u.joined)}`} actions={<StatusBadge tone={statusTone[u.status]}>{u.status}</StatusBadge>} />
      <div className="with-aside">
        <div className="stack">
          <Card title="Role and access">
            {self && <Alert tone="info" title="You can’t change your own role or status" className="mt-0">Ask another administrator.</Alert>}
            {isSupportOnly && !self && <Alert tone="info" title="Read-only for support staff" className="mt-0">Musa Ibrahim’s persona demonstrates a support-focused admin who can’t change roles.</Alert>}
            <fieldset disabled={self || isSupportOnly} className="stack" style={{ marginTop: 12 }}>
              <Select label="Role" value={role || u.role} onChange={(e) => setRole(e.target.value as Role)} options={[{ value: 'learner', label: 'Learner' }, { value: 'instructor', label: 'Instructor' }, { value: 'admin', label: 'Administrator' }]} hint="Administrators can see payment data and approve courses." />
              <TextField label="Reason for change" value={reason} onChange={(e) => setReason(e.target.value)} error={err} hint="Required for any role or status change." />
              <div className="row"><Button disabled={!role || role === u.role} onClick={() => go('role')}>Save role</Button><Button variant={u.status === 'suspended' ? 'secondary' : 'danger'} onClick={() => go('suspend')}>{u.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}</Button></div>
            </fieldset>
          </Card>
          <Card title="Enrolments"><DataTable caption="Enrolments" rows={enr} rowKey={(e) => e.id} empty={<p className="secondary">No enrolments.</p>} columns={[{ key: 'c', header: 'Course', primary: true, render: (e) => courseById(db, e.courseId)!.title }, { key: 's', header: 'Status', render: (e) => e.status.replace('_', ' ') }, { key: 'a', header: 'Access until', render: (e) => formatDate(e.accessUntil) }]} /><div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" to="/admin/enrolments">Manage enrolments</Button></div></Card>
        </div>
        <aside className="stack">
          <Card title="Profile" headingLevel={2}><div className="row" style={{ marginBottom: 12 }}><Avatar initials={u.initials} size="lg" /><div><p className="strong">{u.name}</p><p className="small secondary">{roleLabel[u.role]}</p></div></div><KeyValue items={[['User ID', <span className="mono">{u.id}</span>], ['Location', u.location || '—'], ['Payments', String(db.transactions.filter((t) => t.userId === u.id).length)], ['Tickets', String(db.tickets.filter((t) => t.userId === u.id).length)]]} /></Card>
          <Card title="Activity" headingLevel={2}>{log.length ? <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{log.map((a) => <li key={a.id} className="small"><span className="strong">{a.action}</span><span className="xs muted" style={{ display: 'block' }}>{formatDateTime(a.at)} · {a.detail}</span></li>)}</ul> : <p className="small secondary">No recorded admin activity.</p>}</Card>
        </aside>
      </div>
      <ConfirmDialog open={confirm === 'role'} onClose={() => setConfirm(null)} title={`Change ${u.name} to ${role && roleLabel[role as Role]}?`} confirmLabel="Change role" simulated onConfirm={() => { api.updateUser(u.id, { role: role as Role }, reason); setReason(''); setRole(''); toast('Role updated and logged'); }}><p>Their workspace and permissions change immediately. Reason: “{reason}”.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'suspend'} onClose={() => setConfirm(null)} destructive={u.status !== 'suspended'} title={u.status === 'suspended' ? 'Reactivate this account?' : 'Suspend this account?'} confirmLabel={u.status === 'suspended' ? 'Reactivate' : 'Suspend account'} simulated onConfirm={() => { api.updateUser(u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' }, reason); setReason(''); toast('Account status updated and logged'); }}><p>{u.status === 'suspended' ? 'They’ll be able to sign in again.' : 'They won’t be able to sign in. Issued certificates stay verifiable.'}</p></ConfirmDialog>
    </>
  );
}

const PERMS: [string, boolean[]][] = [
  ['Browse courses, help and verification', [true, true, true, true]], ['Enrol and pay', [true, false, false, false]], ['Learn, submit work, see own grades', [true, false, false, false]],
  ['Request refunds and extra attempts', [true, false, false, false]], ['Edit own draft courses', [false, true, false, false]], ['Grade and publish feedback (own courses)', [false, true, false, false]],
  ['Decide course-related refund requests', [false, true, true, false]], ['See learner payment details', [false, false, true, false]], ['Confirm payments, process refunds', [false, false, true, false]],
  ['Approve and publish courses', [false, false, true, false]], ['Manage support tickets and internal notes', [false, false, true, true]], ['Revoke or correct certificates', [false, false, true, false]],
  ['Change user roles', [false, false, true, false]], ['Change platform settings', [false, false, true, false]],
];
export function RolesPermissions() {
  useTitle('Roles & permissions'); const cols = ['Learner', 'Instructor', 'Administrator', 'Admin (support)'];
  return (
    <>
      <PageHeader title="Roles and permissions" lead="What each role can do. In production these rules are enforced by the server; this prototype only reflects them in the interface." />
      <Alert tone="warning" title="The demo role switcher is not security" className="subnav">Anyone can switch persona in this prototype. Real permissions must be checked on every server request.</Alert>
      <div className="scroll-region" role="region" aria-label="Permission matrix (scrolls horizontally on small screens)" tabIndex={0}>
        <table className="table" style={{ minWidth: 640 }}><caption className="sr-only">Permissions by role</caption>
          <thead><tr><th scope="col">Capability</th>{cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>{PERMS.map(([cap, v]) => <tr key={cap}><th scope="row" style={{ background: 'none', fontWeight: 500, whiteSpace: 'normal', color: 'var(--color-text)' }}>{cap}</th>{v.map((x, i) => <td key={i}>{x ? <span className="perm-yes row" style={{ gap: 4 }}><LuCheck aria-hidden="true" />Allowed</span> : <span className="perm-no row" style={{ gap: 4 }}><LuMinus aria-hidden="true" />No</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Certificate reviewers (employers) use public verification and need no account. Role editing per capability isn’t part of this prototype.</p>
    </>
  );
}
export type { User };
