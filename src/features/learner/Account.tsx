import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuBell, LuMegaphone, LuClipboardList, LuReceipt, LuLifeBuoy, LuAward, LuBookOpen, LuCheckCheck } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Tabs, TabPanel } from '../../components/ui/navigation';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Avatar, Card } from '../../components/ui/data';
import { ErrorSummary, PasswordField, Select, Switch, TextField, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { formatDate, formatRelative } from '../../utils/format';
import type { Notification } from '../../types';

export function Profile() {
  const { db, user } = useSession(); const u = user!; useTitle('Profile'); const toast = useToast();
  const [f, setF] = useState({ name: u.name, headline: u.headline || '', location: u.location || '', certificateName: u.certificateName || u.name, bio: u.bio || '' });
  const [errors, setErrors] = useState<[string, string][]>([]);
  const certs = db.certificates.filter((c) => c.userId === u.id).length;
  return (
    <>
      <PageHeader title="Profile" lead="How you appear to instructors and classmates." />
      <div className="with-aside">
        <form className="card stack" noValidate onSubmit={(e) => { e.preventDefault(); const er: [string, string][] = []; if (!f.name.trim()) er.push(['pf-name', 'Enter your name']); if (!f.certificateName.trim()) er.push(['pf-cert', 'Enter the name to print on future certificates']); setErrors(er); if (er.length) return; api.updateProfile(u.id, { ...f, initials: f.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase() }); toast('Profile saved'); }}>
          <ErrorSummary errors={errors} />
          <div className="row"><Avatar initials={u.initials} size="lg" /><div><p className="strong">{u.name}</p><p className="small secondary">Member since {formatDate(u.joined)}</p><p className="xs muted">Photo upload isn’t available in this prototype.</p></div></div>
          <div className="form-grid">
            <TextField id="pf-name" label="Display name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.find((x) => x[0] === 'pf-name')?.[1]} autoComplete="name" />
            <TextField id="pf-cert" label="Name on future certificates" value={f.certificateName} onChange={(e) => setF({ ...f, certificateName: e.target.value })} error={errors.find((x) => x[0] === 'pf-cert')?.[1]} hint="Issued certificates need a correction request." />
            <TextField label="Headline" optional value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} />
            <TextField label="Location" optional value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
            <Textarea className="span-2" label="About you" optional value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={4} />
          </div>
          <div><Button type="submit">Save profile</Button></div>
        </form>
        <aside className="stack"><Card title="Summary" headingLevel={2}><ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}><li>{db.enrolments.filter((e) => e.userId === u.id).length} courses</li><li>{certs} certificate{certs === 1 ? '' : 's'}</li><li>{db.threads.filter((t) => t.authorId === u.id).length} discussion questions</li></ul><p className="small" style={{ marginTop: 12 }}><Link to="/learn/settings">Account settings</Link></p></Card></aside>
      </div>
    </>
  );
}

export function AccountSettings() {
  const { db, user } = useSession(); const u = user!; useTitle('Account settings'); const toast = useToast();
  const defaults = { captions: true, transcript: false, autoplay: false, reducedMotion: false, emailGrades: true, emailAnnouncements: true, emailReminders: true, emailNews: false, timezone: 'Africa/Lagos' };
  const p = { ...defaults, ...db.profile[u.id] };
  const [tab, setTab] = useState<'notifications' | 'accessibility' | 'security'>('notifications'); const [del, setDel] = useState(false);
  const set = (k: keyof typeof p, v: boolean | string) => { api.updatePrefs(u.id, { [k]: v }); toast('Setting saved'); };
  return (
    <>
      <PageHeader title="Account settings" />
      <Tabs idBase="set" label="Settings sections" value={tab} onChange={setTab} tabs={[{ id: 'notifications', label: 'Notifications' }, { id: 'accessibility', label: 'Accessibility & media' }, { id: 'security', label: 'Login & security' }]} />
      <TabPanel idBase="set" value={tab}>
        <div className="card stack form" style={{ maxWidth: 680 }}>
          {tab === 'notifications' && <><h2 style={{ fontSize: 'var(--text-lg)' }}>Email me about</h2>
            <Switch label="Grades and feedback" checked={p.emailGrades} onChange={(v) => set('emailGrades', v)} />
            <Switch label="Course announcements" checked={p.emailAnnouncements} onChange={(v) => set('emailAnnouncements', v)} />
            <Switch label="Live session reminders" hint="24 hours and 15 minutes before" checked={p.emailReminders} onChange={(v) => set('emailReminders', v)} />
            <Switch label="Course news and offers" checked={p.emailNews} onChange={(v) => set('emailNews', v)} />
            <p className="small muted">Payment, refund and security emails are always sent. (No emails are sent in this prototype.)</p></>}
          {tab === 'accessibility' && <><h2 style={{ fontSize: 'var(--text-lg)' }}>Lessons and media</h2>
            <Switch label="Show captions by default" checked={p.captions} onChange={(v) => set('captions', v)} />
            <Switch label="Open the transcript with each lesson" checked={p.transcript} onChange={(v) => set('transcript', v)} />
            <Switch label="Play the next lesson automatically" checked={p.autoplay} onChange={(v) => set('autoplay', v)} />
            <Select label="Time zone for live sessions" value={p.timezone} onChange={(e) => set('timezone', e.target.value)} options={[{ value: 'Africa/Lagos', label: 'West Africa Time (Lagos)' }, { value: 'Europe/London', label: 'UK time (London)' }, { value: 'America/New_York', label: 'Eastern Time (New York)' }]} />
            <p className="small muted">Reduced motion follows your device setting automatically.</p></>}
          {tab === 'security' && <><h2 style={{ fontSize: 'var(--text-lg)' }}>Login & security</h2>
            <TextField label="Email" value={u.email} readOnly hint="Changing your email isn’t available in this prototype." />
            <Alert tone="info" title="Passwords are simulated">This prototype never stores a password. The form below checks length only.</Alert>
            <form className="stack-sm" onSubmit={(e) => { e.preventDefault(); toast('Password change simulated — nothing was stored.', 'info'); }}><PasswordField label="Current password" autoComplete="current-password" /><PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters" /><div><Button type="submit" variant="secondary">Update password</Button></div></form>
            <hr className="divider" />
            <div className="stack-sm"><h3>Delete account</h3><p className="small secondary">Removes your profile and progress. Certificates already issued remain verifiable.</p><div><Button variant="danger" onClick={() => setDel(true)}>Delete my account</Button></div></div></>}
        </div>
      </TabPanel>
      <ConfirmDialog open={del} onClose={() => setDel(false)} title="Delete your account?" confirmLabel="I understand — delete" destructive onConfirm={() => toast('Account deletion isn’t available in this prototype — nothing was deleted.', 'info')}><p>This would permanently remove your profile, progress and discussion posts. It can’t be undone.</p></ConfirmDialog>
    </>
  );
}

const kindIcon: Record<Notification['kind'], typeof LuBell> = { announcement: LuMegaphone, grade: LuClipboardList, payment: LuReceipt, support: LuLifeBuoy, certificate: LuAward, course: LuBookOpen };
export function Notifications() {
  const { db, user } = useSession(); const u = user!; useTitle('Notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['kind']>('all');
  const mine = db.notifications.filter((n) => n.userId === u.id).sort((a, b) => b.at.localeCompare(a.at));
  const shown = mine.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.kind === filter));
  const unread = mine.filter((n) => !n.read).length;
  return (
    <>
      <PageHeader title="Notifications" lead={unread ? `${unread} unread` : 'You’re all caught up.'} actions={unread > 0 && <Button variant="secondary" icon={<LuCheckCheck aria-hidden="true" />} onClick={() => api.markAllRead(u.id)}>Mark all as read</Button>} />
      <div className="row" role="group" aria-label="Filter notifications" style={{ marginBottom: 'var(--space-4)' }}>
        {([['all', 'All'], ['unread', `Unread (${unread})`], ['announcement', 'Announcements'], ['grade', 'Grades'], ['payment', 'Payments'], ['support', 'Support']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {shown.length ? <ul className="card card-flush" style={{ listStyle: 'none', padding: 0 }} aria-label="Notifications">{shown.map((n) => { const I = kindIcon[n.kind]; return (
        <li key={n.id} className={`notif${n.read ? '' : ' unread'}`}>
          <span className="notif-icon" aria-hidden="true"><I /></span>
          <div className="grow"><Link to={n.link} className="strong" onClick={() => api.markRead(n.id)}>{n.title}</Link>{!n.read && <span className="sr-only"> (unread)</span>}<p className="small secondary">{n.body}</p><p className="xs muted">{formatRelative(n.at)}</p></div>
          <Button size="sm" variant="tertiary" onClick={() => api.markRead(n.id, !n.read)}>{n.read ? 'Mark unread' : 'Mark read'}<span className="sr-only">: {n.title}</span></Button>
        </li>
      ); })}</ul> : <EmptyState icon={<LuBell />} title={filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}>Announcements, grades, payment updates and support replies appear here.</EmptyState>}
    </>
  );
}
