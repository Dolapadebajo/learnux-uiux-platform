import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LuPlay, LuPause, LuCaptions, LuMaximize, LuVolume2, LuFileText, LuDownload, LuCircleCheck, LuArrowLeft, LuArrowRight, LuWifiOff, LuVideoOff, LuListOrdered, LuLock } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { allLessons, courseById, enrolmentFor, lessonById, lessonProgress } from '../../data/selectors';
import { api } from '../../data/services';
import { ModuleList } from '../../components/learning/patterns';
import { Breadcrumbs, Tabs, TabPanel } from '../../components/ui/navigation';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Accordion, ProgressBar } from '../../components/ui/data';
import { NotFound } from '../public/System';

export function LessonPlayer() {
  const { courseId, lessonId } = useParams(); const { db, user } = useSession(); const u = user!; const toast = useToast();
  const demo = useDemoState(['unavailable', 'offline'] as const);
  const c = courseById(db, courseId); const l = c ? lessonById(c, lessonId) : undefined; const e = enrolmentFor(db, u.id, courseId);
  const prefs = db.profile[u.id];
  const [playing, setPlaying] = useState(false); const [captions, setCaptions] = useState(prefs?.captions ?? true); const [pos, setPos] = useState(38);
  const [tab, setTab] = useState<'overview' | 'transcript' | 'resources'>(prefs?.transcript ? 'transcript' : 'overview');
  useTitle(l ? `${l.title} · ${c!.title}` : 'Lesson');
  useEffect(() => {
    if (e?.status === 'active' && l) api.openLesson(u.id, c!.id, l.id); setPlaying(false);
    const box = document.querySelector<HTMLElement>('.player-contents'); const cur = box?.querySelector<HTMLElement>('.is-current');
    if (box && cur) box.scrollTop = cur.offsetTop - box.offsetTop - 120;
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c || !l) return <NotFound />;
  if (e?.status !== 'active') return <EmptyState level={1} icon={<LuLock />} title="This lesson is locked" actions={<Button to={e ? `/learn/courses/${c.id}` : `/courses/${c.id}`}>{e ? 'Back to course' : 'View course details'}</Button>}>{e ? 'Your access to this course has ended, so lessons are closed. Grades and certificates remain available.' : 'Enrol in this course to open its lessons.'}</EmptyState>;
  const ls = allLessons(c); const i = ls.findIndex((x) => x.id === l.id); const prev = ls[i - 1]; const next = ls[i + 1];
  const done = e.completedLessonIds.includes(l.id); const p = lessonProgress(db, u.id, c.id);
  const lineIdx = Math.min(l.transcript.length - 1, Math.floor((pos / 100) * l.transcript.length));
  const complete = () => { api.completeLesson(u.id, c.id, l.id, !done); toast(done ? 'Marked as not complete' : `Lesson complete · ${Math.min(p.done + 1, p.total)} of ${p.total} lessons`); };
  const contents = <ModuleList course={c} completed={e.completedLessonIds} currentLessonId={l.id} base={`/learn/courses/${c.id}`} />;
  const total = l.minutes * 60; const cur = Math.round((pos / 100) * total); const t = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <>
      <Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], [l.moduleTitle]]} />
      <div className="player" style={{ marginTop: 'var(--space-3)' }}>
        <div className="stack">
          {demo === 'offline' && <Alert tone="warning" title="You’re offline" live actions={<Button size="sm" variant="secondary" onClick={() => toast('Still offline — we’ll keep trying (simulated).', 'info')}>Retry now</Button>}><span className="row" style={{ gap: 6 }}><LuWifiOff aria-hidden="true" />Your place ({t(cur)}) and notes are saved on this device and will sync when you reconnect. Completing the lesson will also sync later.</span></Alert>}
          <div className="row-between"><h1 style={{ fontSize: 28, lineHeight: '36px' }}>{l.title}</h1>{done && <span className="badge badge-success"><LuCircleCheck aria-hidden="true" />Completed</span>}</div>
          <div className="show-mobile-block"><Accordion headingLevel={2} title={<span className="row" style={{ gap: 8 }}><LuListOrdered aria-hidden="true" />Course contents</span>} meta={`${p.done} of ${p.total} lessons complete`}>{contents}</Accordion></div>
          {l.type === 'video' ? (
            <div className="video" role="region" aria-label={`Video player: ${l.title}`}>
              <div className="video-poster" aria-hidden="true" />
              {demo === 'unavailable' ? (
                <div className="video-message stack-sm" role="alert"><LuVideoOff aria-hidden="true" style={{ width: 32, height: 32, margin: '0 auto' }} /><p className="strong" style={{ color: '#fff' }}>This video can’t be played right now</p><p className="small" style={{ color: '#cbd5e1' }}>It’s a temporary problem with our video service. Your progress is safe. You can read the transcript instead.</p><div className="row" style={{ justifyContent: 'center' }}><Button size="sm" variant="secondary" onClick={() => toast('Still unavailable (simulated). Try the transcript.', 'info')}>Try again</Button><Button size="sm" variant="secondary" onClick={() => setTab('transcript')}>Read transcript</Button></div></div>
              ) : <>
                {!playing && <button type="button" className="video-play" aria-label="Play video" onClick={() => setPlaying(true)}><LuPlay aria-hidden="true" /></button>}
                {captions && <p className="video-captions" aria-hidden="true">{l.transcript[lineIdx]?.text.slice(0, 90)}{(l.transcript[lineIdx]?.text.length || 0) > 90 ? '…' : ''}</p>}
                <div className="video-controls">
                  <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)}>{playing ? <LuPause aria-hidden="true" /> : <LuPlay aria-hidden="true" />}</button>
                  <span className="time">{t(cur)}</span>
                  <input type="range" min={0} max={100} value={pos} onChange={(ev) => setPos(Number(ev.target.value))} aria-label="Seek" aria-valuetext={`${t(cur)} of ${t(total)}`} />
                  <span className="time">{t(total)}</span>
                  <button type="button" aria-label="Captions" aria-pressed={captions} onClick={() => setCaptions(!captions)}><LuCaptions aria-hidden="true" /></button>
                  <button type="button" aria-label="Volume (simulated)" className="desktop-only" style={{ display: 'inline-flex' }}><LuVolume2 aria-hidden="true" /></button>
                  <button type="button" aria-label="Full screen (not available in this prototype)" onClick={() => toast('Full screen isn’t available in this prototype.', 'info')}><LuMaximize aria-hidden="true" /></button>
                </div>
              </>}
            </div>
          ) : (
            <article className="reading prose" style={{ maxWidth: 'none' }}><p className="eyebrow">Reading · {l.minutes} min</p><p style={{ marginTop: 12 }}>{l.summary}</p>{l.transcript.map((x) => <p key={x.t}>{x.text}</p>)}</article>
          )}
          <Tabs idBase="lp" label="Lesson materials" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'transcript', label: 'Transcript' }, { id: 'resources', label: 'Resources', count: l.resources.length }]} />
          <TabPanel idBase="lp" value={tab}>
            {tab === 'overview' && <div className="stack-sm prose"><p>{l.summary}</p><p className="small secondary">Live session for this module: {c.liveSchedule}. Recording available within 48 hours.</p></div>}
            {tab === 'transcript' && <ol className="transcript" aria-label="Transcript">{l.transcript.map((x, k) => <li key={x.t} className={k === lineIdx && l.type === 'video' ? 'active' : undefined}><button type="button" onClick={() => setPos(Math.round((k / l.transcript.length) * 100) + 1)} aria-label={`Jump to ${x.t}`}>{x.t}</button><span>{x.text}</span></li>)}</ol>}
            {tab === 'resources' && (l.resources.length ? <ul className="resource-list">{l.resources.map((r) => <li key={r.name}><LuFileText aria-hidden="true" /><span className="grow">{r.name} <span className="small muted">· {r.size}</span>{!r.available && <span className="small" style={{ display: 'block', color: 'var(--color-warning)' }}>Temporarily unavailable — we’re fixing the file.</span>}</span>{r.available ? <Button size="sm" variant="secondary" icon={<LuDownload aria-hidden="true" />} onClick={() => toast('Downloads are simulated in this prototype.', 'info')}>Download<span className="sr-only"> {r.name}</span></Button> : <Button size="sm" variant="tertiary" to={`/learn/support/new?ref=${encodeURIComponent(l.title)}`}>Report</Button>}</li>)}</ul> : <p className="secondary">No resources for this lesson.</p>)}
          </TabPanel>
          <div className="card card-sm row-between">
            <ProgressBar value={p.pct} label="Course lesson progress" detail={`${p.done}/${p.total}`} />
            <Button variant={done ? 'secondary' : 'accent'} icon={<LuCircleCheck aria-hidden="true" />} onClick={complete}>{done ? 'Mark as not complete' : 'Mark lesson complete'}</Button>
          </div>
          <nav className="player-nav" aria-label="Lesson navigation">
            {prev ? <Button variant="secondary" to={`/learn/courses/${c.id}/lessons/${prev.id}`} icon={<LuArrowLeft aria-hidden="true" />}><span className="sr-only">Previous lesson: </span>{prev.title.replace(/^\d+\.\d+ /, '')}</Button> : <span />}
            {next ? <Button to={`/learn/courses/${c.id}/lessons/${next.id}`} iconRight={<LuArrowRight aria-hidden="true" />} wrap><span className="sr-only">Next lesson: </span>{next.title.replace(/^\d+\.\d+ /, '')}</Button> : <Button to={`/learn/certificates/${c.id}`}>Check certificate eligibility</Button>}
          </nav>
        </div>
        <aside className="player-contents desktop-only" style={{ display: 'block' }} aria-labelledby="contents-h"><h2 id="contents-h" className="sr-only">Course contents</h2>{contents}</aside>
      </div>
    </>
  );
}
