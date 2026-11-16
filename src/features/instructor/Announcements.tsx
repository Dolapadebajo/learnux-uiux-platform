import { useState } from 'react';
import { LuMegaphone } from 'react-icons/lu';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Badge, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/data';
import { Checkbox, ErrorSummary, TextField, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { CourseWorkspaceNav, useInstructorCourse } from './shared';
import { formatDateTime } from '../../utils/format';
import { NotFound } from '../public/System';

export function Announcements() {
  const { db, course: c } = useInstructorCourse(); useTitle(c ? `Announcements · ${c.title}` : 'Announcements'); const toast = useToast();
  const [f, setF] = useState({ title: '', body: '', email: true }); const [errors, setErrors] = useState<[string, string][]>([]); const [confirm, setConfirm] = useState(false);
  if (!c) return <NotFound />;
  const list = db.announcements.filter((a) => a.courseId === c.id);
  const recipients = db.enrolments.filter((e) => e.courseId === c.id && e.status === 'active').length;
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Announcements" lead="Send updates to everyone with active access to this course." />
      <div className="split-view">
        <form className="card stack" noValidate onSubmit={(e) => { e.preventDefault(); const er: [string, string][] = []; if (f.title.trim().length < 5) er.push(['an-title', 'Add a title']); if (f.body.trim().length < 20) er.push(['an-body', 'Write the message (at least 20 characters)']); setErrors(er); if (!er.length) setConfirm(true); }}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>New announcement</h2>
          <ErrorSummary errors={errors} />
          <TextField id="an-title" label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.find((x) => x[0] === 'an-title')?.[1]} />
          <Textarea id="an-body" label="Message" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={6} error={errors.find((x) => x[0] === 'an-body')?.[1]} />
          <Checkbox label="Also send by email (simulated)" checked={f.email} onChange={(e) => setF({ ...f, email: e.target.checked })} />
          <div><Button type="submit">Post announcement</Button></div>
        </form>
        <section className="stack" aria-labelledby="past-h"><h2 id="past-h" style={{ fontSize: 'var(--text-lg)' }}>Posted</h2>
          {list.length ? list.map((a) => <Card key={a.id} as="article" title={a.title} headingLevel={3} actions={a.emailed ? <Badge tone="info">Emailed</Badge> : undefined}><p className="small muted">{formatDateTime(a.at)}</p><p style={{ marginTop: 8 }}>{a.body}</p></Card>) : <EmptyState icon={<LuMegaphone />} title="No announcements yet" />}
        </section>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Post this announcement?" confirmLabel="Post" simulated onConfirm={() => { api.postAnnouncement(c.id, f.title.trim(), f.body.trim(), f.email); setF({ title: '', body: '', email: true }); toast(`Posted to ${recipients} learners`); }}><p>{recipients} learners with active access will get it in their notifications{f.email ? ' and by email' : ''}.</p></ConfirmDialog>
    </>
  );
}
