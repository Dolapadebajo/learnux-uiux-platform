import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuMessageSquare, LuPin, LuPlus, LuSearchX } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, enrolmentFor, userById } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { CourseTabs } from './Courses';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Badge, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { SearchInput, TextField, Textarea } from '../../components/ui/form';
import { Dialog } from '../../components/ui/overlay';
import { Post } from '../../components/learning/patterns';
import { formatRelative, pluralise } from '../../utils/format';
import { NotFound } from '../public/System';

export function Discussions() {
  const { courseId } = useParams(); const { db, user } = useSession(); const u = user!; const navigate = useNavigate(); const toast = useToast();
  const c = courseById(db, courseId); useTitle(c ? `Discussions · ${c.title}` : 'Discussions');
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const [f, setF] = useState({ title: '', body: '' }); const [err, setErr] = useState<Record<string, string>>({});
  if (!c) return <NotFound />;
  const canPost = enrolmentFor(db, u.id, c.id)?.status === 'active';
  const threads = db.threads.filter((t) => t.courseId === c.id).filter((t) => !q || (t.title + t.body).toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.at.localeCompare(a.at));
  const post = () => { const e: Record<string, string> = {}; if (f.title.trim().length < 8) e.title = 'Write a short question title (at least 8 characters)'; if (f.body.trim().length < 15) e.body = 'Add a little more detail (at least 15 characters)'; setErr(e); if (Object.keys(e).length) return; const id = api.createThread(c.id, u.id, f.title.trim(), f.body.trim()); setOpen(false); setF({ title: '', body: '' }); toast('Question posted'); navigate(`/learn/courses/${c.id}/discussions/${id}`); };
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Discussions']]} />} title="Discussions" lead="Ask questions, share progress and help each other. Please don’t post assessment answers." actions={canPost && <Button icon={<LuPlus aria-hidden="true" />} onClick={() => setOpen(true)}>Ask a question</Button>} />
      <CourseTabs courseId={c.id} />
      <SearchInput label="Search discussions" value={q} onChange={setQ} placeholder="Search questions" className="form" />
      <div style={{ marginTop: 'var(--space-5)' }} aria-live="polite"><h2 className="sr-only">Questions</h2>
        {threads.length ? <ul className="thread-list">{threads.map((t) => { const a = userById(db, t.authorId)!; const insReplied = t.replies.some((r) => userById(db, r.authorId)?.role === 'instructor'); return (
          <li key={t.id} className="thread-card">
            <LuMessageSquare aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--color-text-muted)', flex: 'none', marginTop: 2 }} />
            <div className="grow stack-sm">
              <div className="row" style={{ gap: 6 }}>{t.pinned && <Badge tone="info" icon={<LuPin aria-hidden="true" />}>Pinned</Badge>}{insReplied && <Badge tone="accent">Instructor replied</Badge>}</div>
              <h3><Link to={`/learn/courses/${c.id}/discussions/${t.id}`}>{t.title}</Link></h3>
              <p className="small secondary">{a.name}{a.role === 'instructor' ? ' (Instructor)' : ''} · {formatRelative(t.at)} · {pluralise(t.replies.length, 'reply', 'replies')}</p>
            </div>
          </li>
        ); })}</ul> : q ? <EmptyState icon={<LuSearchX />} title={`No discussions match “${q}”`} actions={canPost ? <Button onClick={() => { setF({ title: q, body: '' }); setOpen(true); }}>Ask it as a new question</Button> : undefined} /> : <EmptyState icon={<LuMessageSquare />} title="No discussions yet" actions={canPost ? <Button onClick={() => setOpen(true)}>Ask the first question</Button> : undefined}>Questions you and others ask will appear here.</EmptyState>}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ask a question" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={post}>Post question</Button></>}>
        <div className="stack"><TextField label="Question title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={err.title} hint="A clear title helps others answer." /><Textarea label="Details" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} error={err.body} rows={5} /></div>
      </Dialog>
    </>
  );
}

export function DiscussionThread() {
  const { courseId, threadId } = useParams(); const { db, user } = useSession(); const u = user!; const toast = useToast();
  const c = courseById(db, courseId); const t = db.threads.find((x) => x.id === threadId); useTitle(t?.title || 'Discussion');
  const [body, setBody] = useState(''); const [err, setErr] = useState('');
  if (!c || !t) return <NotFound />;
  const canPost = enrolmentFor(db, u.id, c.id)?.status === 'active'; const author = userById(db, t.authorId);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Discussions', `/learn/courses/${c.id}/discussions`], [t.title]]} />} title={t.title} />
      <div className="stack" style={{ maxWidth: 820 }}>
        <Post author={author} at={formatRelative(t.at)} instructor={author?.role === 'instructor'}>{t.body}</Post>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>{pluralise(t.replies.length, 'reply', 'replies')}</h2>
        {t.replies.map((r) => { const a = userById(db, r.authorId); const ins = a?.role === 'instructor'; return <Post key={r.id} author={a} at={formatRelative(r.at)} instructor={ins} highlight={ins}>{r.body}</Post>; })}
        {canPost ? <form className="card stack-sm" onSubmit={(e) => { e.preventDefault(); if (body.trim().length < 2) { setErr('Write a reply before posting'); return; } api.reply(t.id, u.id, body.trim()); setBody(''); setErr(''); toast('Reply posted'); }}>
          <Textarea label="Your reply" value={body} onChange={(e) => setBody(e.target.value)} error={err} rows={4} />
          <div><Button type="submit">Post reply</Button></div>
        </form> : <p className="small secondary">Only learners with active access can reply.</p>}
      </div>
    </>
  );
}
