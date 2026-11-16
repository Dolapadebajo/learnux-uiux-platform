import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuArrowUp, LuArrowDown, LuGripVertical, LuPlus, LuVideo, LuFileText, LuSend, LuTrash2, LuCircleCheck, LuCircle } from 'react-icons/lu';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { allLessons, courseAssessments, lessonById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Alert, Badge, useToast } from '../../components/ui/feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/data';
import { Radio, Switch, TextField, Textarea } from '../../components/ui/form';
import { FileUpload, type UploadItem } from '../../components/ui/FileUpload';
import { ConfirmDialog, Dialog } from '../../components/ui/overlay';
import { Breadcrumbs } from '../../components/ui/navigation';
import { CourseStatusBadge, CourseWorkspaceNav, useInstructorCourse } from './shared';
import { ReviewBanner } from './Courses';
import { NotFound } from '../public/System';

export function CurriculumBuilder() {
  const { db, course: c } = useInstructorCourse(); useTitle(c ? `Curriculum · ${c.title}` : 'Curriculum'); const toast = useToast();
  const [mod, setMod] = useState(false); const [mTitle, setMTitle] = useState(''); const [newLesson, setNewLesson] = useState<Record<string, string>>({}); const [submit, setSubmit] = useState(false); const [live, setLive] = useState('');
  if (!c) return <NotFound />;
  const locked = c.status === 'in_review' || c.status === 'published';
  const ls = allLessons(c);
  const checks = [
    { ok: c.outcomes.length >= 3, label: 'At least 3 learning outcomes', to: 'settings' },
    { ok: c.modules.length > 0 && c.modules.every((m) => m.lessons.length > 0), label: 'Every module has at least one lesson', to: 'curriculum' },
    { ok: ls.length > 0 && ls.filter((l) => l.type === 'video').every((l) => l.transcript.length > 0), label: 'Captions and transcripts on every video', to: 'curriculum' },
    { ok: courseAssessments(db, c.id).length > 0 || c.id === 'ROB-130', label: 'At least one graded assessment', to: 'assessments' },
    { ok: c.liveSchedule !== 'To be scheduled', label: 'Live session schedule set', to: 'settings' },
  ];
  const ready = checks.every((x) => x.ok);
  const move = (fn: () => boolean, label: string) => { if (fn()) setLive(label); };
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Curriculum" lead={`${c.modules.length} modules · ${ls.length} lessons`} actions={<CourseStatusBadge status={c.status} />} />
      <ReviewBanner c={c} />
      <p className="sr-only" aria-live="polite">{live}</p>
      <div className="with-aside">
        <div>
          {c.modules.map((m, mi) => (
            <section key={m.id} className="builder-module" aria-labelledby={`mod-${m.id}`}>
              <div className="builder-head"><LuGripVertical aria-hidden="true" className="grip" /><h2 id={`mod-${m.id}`} className="grow" style={{ fontSize: 'var(--text-md)' }}>Module {mi + 1}: {m.title}</h2>
                {!locked && <><IconButton label={`Move module ${m.title} up`} icon={<LuArrowUp aria-hidden="true" />} disabled={mi === 0} onClick={() => move(() => api.moveModule(c.id, m.id, -1), `${m.title} moved to position ${mi}`)} /><IconButton label={`Move module ${m.title} down`} icon={<LuArrowDown aria-hidden="true" />} disabled={mi === c.modules.length - 1} onClick={() => move(() => api.moveModule(c.id, m.id, 1), `${m.title} moved to position ${mi + 2}`)} /></>}
              </div>
              {m.lessons.length === 0 && <p className="small secondary" style={{ padding: 'var(--space-3) var(--space-4)' }}>No lessons yet.</p>}
              {m.lessons.map((l, li) => (
                <div key={l.id} className="builder-lesson">
                  {l.type === 'video' ? <LuVideo aria-hidden="true" /> : <LuFileText aria-hidden="true" />}
                  <Link to={`/teach/courses/${c.id}/lessons/${l.id}`} className="grow">{l.title}</Link>
                  {l.type === 'video' && !l.transcript.length && <Badge tone="warning">Needs captions</Badge>}
                  <span className="small muted">{l.minutes} min</span>
                  {!locked && <><IconButton label={`Move ${l.title} up`} icon={<LuArrowUp aria-hidden="true" />} disabled={li === 0} onClick={() => move(() => api.moveLesson(c.id, m.id, l.id, -1), `${l.title} moved up`)} /><IconButton label={`Move ${l.title} down`} icon={<LuArrowDown aria-hidden="true" />} disabled={li === m.lessons.length - 1} onClick={() => move(() => api.moveLesson(c.id, m.id, l.id, 1), `${l.title} moved down`)} /></>}
                </div>
              ))}
              {!locked && <form className="builder-lesson" onSubmit={(e) => { e.preventDefault(); const t = (newLesson[m.id] || '').trim(); if (!t) return; const id = api.addLesson(c.id, m.id, t); setNewLesson({ ...newLesson, [m.id]: '' }); toast(`Lesson added — open it to add content`); setLive(`Lesson ${t} added`); void id; }}>
                <TextField hideLabel label={`New lesson title in ${m.title}`} placeholder="New lesson title" value={newLesson[m.id] || ''} onChange={(e) => setNewLesson({ ...newLesson, [m.id]: e.target.value })} className="grow" />
                <Button type="submit" size="sm" variant="secondary" icon={<LuPlus aria-hidden="true" />}>Add lesson</Button>
              </form>}
            </section>
          ))}
          {!locked && <div style={{ marginTop: 'var(--space-4)' }}><Button variant="secondary" icon={<LuPlus aria-hidden="true" />} onClick={() => setMod(true)}>Add module</Button></div>}
          <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>Reorder with the arrow buttons (keyboard friendly). Drag-and-drop isn’t implemented in this prototype.</p>
        </div>
        <aside className="stack">
          <Card title="Ready for review?" headingLevel={2}>
            <ul className="checklist">{checks.map((x) => <li key={x.label}>{x.ok ? <LuCircleCheck aria-hidden="true" className="ok" /> : <LuCircle aria-hidden="true" />}<div className="grow"><p className="small strong">{x.label}</p><p className="xs muted">{x.ok ? 'Done' : 'Not yet'}</p></div>{!x.ok && <Link className="small" to={`/teach/courses/${c.id}/${x.to}`}>Fix</Link>}</li>)}</ul>
            {(c.status === 'draft' || c.status === 'changes_requested') && <Button block icon={<LuSend aria-hidden="true" />} disabled={!ready} onClick={() => setSubmit(true)}>{c.status === 'changes_requested' ? 'Resubmit for review' : 'Submit for review'}</Button>}
            {!ready && (c.status === 'draft' || c.status === 'changes_requested') && <p className="xs muted" style={{ marginTop: 8 }}>Complete the checklist to submit.</p>}
            {c.status === 'in_review' && <Alert tone="info" title="Submitted" className="mt-0">Waiting for an administrator.</Alert>}
          </Card>
          <Card title="Preview" headingLevel={2}><p className="small secondary">Published courses appear in the catalogue. Drafts can’t be previewed publicly in this prototype.</p></Card>
        </aside>
      </div>
      <Dialog open={mod} onClose={() => setMod(false)} title="Add a module" footer={<><Button variant="secondary" onClick={() => setMod(false)}>Cancel</Button><Button onClick={() => { if (!mTitle.trim()) return; api.addModule(c.id, mTitle.trim()); setMTitle(''); setMod(false); toast('Module added'); }}>Add module</Button></>}><TextField label="Module title" value={mTitle} onChange={(e) => setMTitle(e.target.value)} /></Dialog>
      <ConfirmDialog open={submit} onClose={() => setSubmit(false)} title="Submit this course for review?" confirmLabel="Submit for review" onConfirm={() => { api.submitForReview(c.id); toast('Submitted — an administrator will review it'); }}><p>Editing is locked while an administrator reviews <strong>{c.title}</strong>. You’ll be notified if changes are requested or when it’s published.</p></ConfirmDialog>
    </>
  );
}

export function LessonEditor() {
  const { lessonId } = useParams(); const { course: c } = useInstructorCourse(); const navigate = useNavigate(); const toast = useToast();
  const l = c ? lessonById(c, lessonId) : undefined; useTitle(l ? `Edit · ${l.title}` : 'Lesson editor');
  const [f, setF] = useState(() => l ? { title: l.title, type: l.type, minutes: String(l.minutes), required: l.required, summary: l.summary, transcript: l.transcript.map((x) => `${x.t} | ${x.text}`).join('\n') } : null);
  const [caps, setCaps] = useState<UploadItem[]>([]); const [del, setDel] = useState(false); const [err, setErr] = useState<Record<string, string>>({});
  if (!c || !l || !f) return <NotFound />;
  const locked = c.status === 'in_review' || c.status === 'published';
  const save = () => {
    const e: Record<string, string> = {}; if (f.title.trim().length < 3) e.title = 'Enter a lesson title'; if (!/^\d+$/.test(f.minutes)) e.minutes = 'Enter minutes as a number';
    setErr(e); if (Object.keys(e).length) return;
    const transcript = f.transcript.split('\n').map((x) => x.split('|')).filter((p) => p.length > 1).map(([t, ...rest]) => ({ t: t.trim(), text: rest.join('|').trim() }));
    api.updateLesson(c.id, l.id, { title: f.title.trim(), type: f.type, minutes: +f.minutes, required: f.required, summary: f.summary, transcript }); toast('Lesson saved');
  };
  const needsCaptions = f.type === 'video' && !f.transcript.trim() && !caps.some((x) => x.state === 'done');
  return (
    <>
      <Breadcrumbs items={[['Courses', '/teach/courses'], [c.title, `/teach/courses/${c.id}/curriculum`], ['Lesson editor']]} />
      <PageHeader title={f.title || 'Untitled lesson'} actions={<CourseStatusBadge status={c.status} />} />
      <ReviewBanner c={c} />
      <div className="with-aside">
        <form className="card stack" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <fieldset disabled={locked} className="stack">
            <TextField label="Lesson title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={err.title} />
            <fieldset><legend>Lesson type</legend><div className="row"><Radio name="lt" label="Video" checked={f.type === 'video'} onChange={() => setF({ ...f, type: 'video' })} /><Radio name="lt" label="Reading" checked={f.type === 'reading'} onChange={() => setF({ ...f, type: 'reading' })} /></div></fieldset>
            {f.type === 'video' && <div className="video" style={{ maxWidth: 520 }}><div className="video-poster" aria-hidden="true" /><p style={{ position: 'relative' }} className="small">Video file: {l.title.replace(/\s/g, '-').toLowerCase()}.mp4 (simulated)</p></div>}
            <div className="form-grid"><TextField label="Duration (minutes)" inputMode="numeric" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} error={err.minutes} /><div className="field"><Switch label="Required for completion" checked={f.required} onChange={(v) => setF({ ...f, required: v })} /></div></div>
            <Textarea label="Summary" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} rows={3} />
            {needsCaptions && <Alert tone="warning" title="Captions are required before this course can be submitted">Upload a caption file or paste a transcript below.</Alert>}
            {f.type === 'video' && <FileUpload label="Caption file" hint="WebVTT or SRT. Files stay in your browser in this prototype." accept=".vtt,.srt" items={caps} onChange={setCaps} multiple={false} />}
            <Textarea label={f.type === 'video' ? 'Transcript' : 'Lesson text'} value={f.transcript} onChange={(e) => setF({ ...f, transcript: e.target.value })} rows={8} hint="One line per segment: “0:42 | text”." />
          </fieldset>
          {!locked && <div className="row-between"><div className="row"><Button type="submit">Save lesson</Button><Button variant="secondary" to={`/teach/courses/${c.id}/curriculum`}>Back to curriculum</Button></div><Button variant="tertiary" icon={<LuTrash2 aria-hidden="true" />} onClick={() => setDel(true)}>Delete lesson</Button></div>}
        </form>
        <aside><Card title="Resources" headingLevel={2}>{l.resources.length ? <ul className="stack-sm" style={{ paddingLeft: 18 }}>{l.resources.map((r) => <li key={r.name} className="small">{r.name} · {r.size}{!r.available && <span style={{ color: 'var(--color-warning)' }}> · file missing</span>}</li>)}</ul> : <p className="small secondary">No resources.</p>}<p className="xs muted" style={{ marginTop: 12 }}>Give files descriptive names; tag PDFs for accessibility.</p></Card></aside>
      </div>
      <ConfirmDialog open={del} onClose={() => setDel(false)} destructive title="Delete this lesson?" confirmLabel="Delete lesson" onConfirm={() => { api.deleteLesson(c.id, l.id); toast('Lesson deleted'); navigate(`/teach/courses/${c.id}/curriculum`); }}><p>“{l.title}” and its transcript will be removed from this draft. This can’t be undone.</p></ConfirmDialog>
    </>
  );
}
