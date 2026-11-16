import { useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseById, userById, lessonProgress } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { EmptyState, StatusBadge, useToast, type Tone } from '../../components/ui/feedback';
import { DataTable, KeyValue, ProgressBar } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, TextField } from '../../components/ui/form';
import { ConfirmDialog, Drawer } from '../../components/ui/overlay';
import { formatDate } from '../../utils/format';
import type { Enrolment } from '../../types';

const tone: Record<Enrolment['status'], Tone> = { active: 'success', expired: 'neutral', refunded: 'neutral', pending_payment: 'warning' };
const label: Record<Enrolment['status'], string> = { active: 'Active', expired: 'Access ended', refunded: 'Refunded', pending_payment: 'Awaiting payment' };

export function EnrolmentManagement() {
  const { db } = useSession(); useTitle('Enrolments'); const toast = useToast();
  const [q, setQ] = useState(''); const [st, setSt] = useState('all'); const [course, setCourse] = useState('all'); const [sel, setSel] = useState<string | null>(null);
  const [days, setDays] = useState('30'); const [reason, setReason] = useState(''); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState<null | 'extend' | 'end'>(null);
  const rows = db.enrolments.filter((e) => (st === 'all' || e.status === st) && (course === 'all' || e.courseId === course) && (!q || userById(db, e.userId)!.name.toLowerCase().includes(q.toLowerCase())));
  const e = db.enrolments.find((x) => x.id === sel);
  const ask = (k: 'extend' | 'end') => { if (reason.trim().length < 5) { setErr('Give a reason (at least 5 characters)'); return; } if (k === 'extend' && !/^\d+$/.test(days)) { setErr('Enter days as a number'); return; } setErr(''); setConfirm(k); };
  return (
    <>
      <PageHeader title="Enrolment management" lead="Look up access dates and adjust them with a recorded reason." />
      <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
        <SearchInput label="Search by learner" value={q} onChange={setQ} placeholder="Learner name" className="grow" />
        <Select label="Status" value={st} onChange={(x) => setSt(x.target.value)} options={[{ value: 'all', label: 'Any status' }, ...Object.entries(label).map(([value, l]) => ({ value, label: l }))]} />
        <Select label="Course" value={course} onChange={(x) => setCourse(x.target.value)} options={[{ value: 'all', label: 'All courses' }, ...db.courses.map((c) => ({ value: c.id, label: c.title }))]} />
      </div>
      <DataTable caption="Enrolments" rows={rows} rowKey={(r) => r.id} selectedKey={sel || undefined} empty={<EmptyState title="No enrolments match" />} columns={[
        { key: 'l', header: 'Learner', primary: true, render: (r) => <span className="strong">{userById(db, r.userId)!.name}</span> },
        { key: 'c', header: 'Course', render: (r) => courseById(db, r.courseId)!.title },
        { key: 's', header: 'Status', render: (r) => <StatusBadge tone={tone[r.status]}>{label[r.status]}</StatusBadge> },
        { key: 'a', header: 'Access until', render: (r) => formatDate(r.accessUntil) },
      ]} actions={(r) => <Button size="sm" variant="secondary" onClick={() => { setSel(r.id); setReason(''); setErr(''); }}>Details<span className="sr-only"> for {userById(db, r.userId)!.name}</span></Button>} />
      <Drawer open={!!e} onClose={() => setSel(null)} title="Enrolment details">
        {e && <div className="stack">
          <KeyValue items={[['Learner', userById(db, e.userId)!.name], ['Course', courseById(db, e.courseId)!.title], ['Reference', <span className="mono">{e.id}</span>], ['Status', <StatusBadge tone={tone[e.status]}>{label[e.status]}</StatusBadge>], ['Enrolled', formatDate(e.enrolledAt)], ['Access until', formatDate(e.accessUntil)]]} />
          <ProgressBar value={lessonProgress(db, e.userId, e.courseId).pct} label="Lesson progress" />
          {e.status !== 'pending_payment' ? <>
            <hr className="divider" />
            <TextField label="Extend by (days)" inputMode="numeric" value={days} onChange={(x) => setDays(x.target.value)} />
            <TextField label="Reason" value={reason} onChange={(x) => setReason(x.target.value)} error={err} hint="Required. Saved in the activity log." />
            <div className="row"><Button onClick={() => ask('extend')}>Extend access</Button>{e.status === 'active' && <Button variant="danger" onClick={() => ask('end')}>End access</Button>}</div>
          </> : <p className="small secondary">Access starts when the payment is confirmed in Transactions.</p>}
        </div>}
      </Drawer>
      <ConfirmDialog open={confirm === 'extend'} onClose={() => setConfirm(null)} title={`Extend access by ${days} days?`} confirmLabel="Extend access" simulated onConfirm={() => { api.extendAccess(e!.id, +days, reason); toast('Access extended and logged'); }}><p>The learner keeps access until the new date. Reason: “{reason}”.</p></ConfirmDialog>
      <ConfirmDialog open={confirm === 'end'} onClose={() => setConfirm(null)} destructive title="End this learner’s access now?" confirmLabel="End access" simulated onConfirm={() => { api.endAccess(e!.id, reason); toast('Access ended and logged'); }}><p>Lessons close immediately. Grades, submitted work and certificates remain. Reason: “{reason}”.</p></ConfirmDialog>
    </>
  );
}
