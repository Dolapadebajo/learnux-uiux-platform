import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LuCircleCheck, LuCircle, LuCircleDot, LuPlay, LuFileText, LuLock, LuClipboardList, LuAward, LuClock } from 'react-icons/lu';
import type { Assessment, Certificate, Course, Module, RubricCriterion, User } from '../../types';
import type { EligibilityItem } from '../../data/selectors';
import { formatDate } from '../../utils/format';
import { Avatar } from '../ui/data';
import { Badge } from '../ui/feedback';
import { cx } from '../../utils/cx';

/* ---------- Curriculum: modules and lesson items ---------- */
export function LessonItem({ title, type, minutes, done, current, locked, to }: { title: string; type: 'video' | 'reading'; minutes: number; done?: boolean; current?: boolean; locked?: boolean; to?: string }) {
  const Icon = done ? LuCircleCheck : current ? LuCircleDot : LuCircle;
  const inner = <><Icon aria-hidden="true" className={cx('li-status', done && 'done', current && 'current')} /><span className="grow">{title}<span className="sr-only">{done ? ' (completed)' : current ? ' (in progress)' : ''}</span></span><span className="li-meta">{locked ? <LuLock aria-label="Locked" /> : type === 'video' ? <LuPlay aria-hidden="true" /> : <LuFileText aria-hidden="true" />}{minutes} min</span></>;
  return <li className={cx('lesson-item', current && 'is-current')}>{to && !locked ? <Link to={to} aria-current={current ? 'page' : undefined}>{inner}</Link> : <span className="lesson-item-static">{inner}</span>}</li>;
}
export function ModuleList({ course, completed, currentLessonId, base, locked, assessments, assessmentStatus }: { course: Course; completed: string[]; currentLessonId?: string; base: string; locked?: boolean; assessments?: Assessment[]; assessmentStatus?: (a: Assessment) => ReactNode }) {
  return (
    <ol className="module-list">
      {course.modules.map((m: Module, i) => {
        const done = m.lessons.filter((l) => completed.includes(l.id)).length;
        return (
          <li key={m.id} className="module">
            <div className="module-head"><h3><span className="muted">Module {i + 1}</span> {m.title}</h3><span className="small muted">{done}/{m.lessons.length} done</span></div>
            <ul className="lesson-list">
              {m.lessons.map((l) => <LessonItem key={l.id} title={l.title} type={l.type} minutes={l.minutes} done={completed.includes(l.id)} current={l.id === currentLessonId} locked={locked} to={`${base}/lessons/${l.id}`} />)}
              {assessments?.filter((a) => a.afterModuleId === m.id).map((a) => (
                <li key={a.id} className="lesson-item assessment-item">
                  <Link to={`${base}/${a.kind === 'quiz' ? 'quiz' : 'assignment'}/${a.id}`}><LuClipboardList aria-hidden="true" className="li-status" /><span className="grow">{a.title}<span className="xs muted" style={{ display: 'block' }}>{a.required ? 'Required · graded' : 'Optional'}</span></span>{assessmentStatus?.(a)}</Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Eligibility checklist ---------- */
export function EligibilityChecklist({ items }: { items: EligibilityItem[] }) {
  return (
    <ul className="checklist">
      {items.map((i) => (
        <li key={i.id} className={cx(i.met && 'met')}>
          {i.met ? <LuCircleCheck aria-hidden="true" className="ok" /> : i.pending ? <LuClock aria-hidden="true" className="wait" /> : <LuCircle aria-hidden="true" />}
          <div className="grow"><p className="strong">{i.label}</p><p className="small secondary">{i.met ? 'Met — ' : i.pending ? 'Waiting — ' : 'Not yet — '}{i.detail}</p></div>
          {!i.met && i.link && <Link to={i.link} className="small nowrap">Go to item</Link>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Certificate ---------- */
export function CertificateDoc({ cert, course, instructor }: { cert: Certificate; course: Course; instructor?: User }) {
  return (
    <figure className={cx('certificate', cert.status === 'revoked' && 'revoked')} aria-label={`Certificate of course completion for ${cert.nameOnCertificate}, ${course.title}, issued ${formatDate(cert.issuedAt)}, reference ${cert.id}${cert.status === 'revoked' ? ', revoked' : ''}`}>
      <div className="certificate-inner">
        <div className="row-between"><span className="brand" style={{ fontSize: 16 }}><span className="brand-mark" aria-hidden="true"><LuAward /></span>LearnUX</span><span className="xs muted mono">{cert.id}{cert.version > 1 ? ` · v${cert.version}` : ''}</span></div>
        <p className="eyebrow" style={{ marginTop: 24 }}>Certificate of course completion</p>
        <p className="cert-name">{cert.nameOnCertificate}</p>
        <p className="secondary">has completed all requirements of</p>
        <p className="cert-course">{course.title}</p>
        <div className="row-between small secondary" style={{ marginTop: 24 }}><span>Issued {formatDate(cert.issuedAt)}</span><span>Instructor: {instructor?.name}</span></div>
        <p className="xs muted" style={{ marginTop: 12 }}>Confirms completion of a LearnUX course. It is not a professional accreditation.</p>
      </div>
      {cert.status === 'revoked' && <p className="cert-stamp">Revoked</p>}
    </figure>
  );
}

/* ---------- Rubric ---------- */
export function RubricView({ rubric, scores }: { rubric: RubricCriterion[]; scores?: Record<string, number> }) {
  const total = scores ? rubric.reduce((s, c) => s + (scores[c.id] ?? 0), 0) : null;
  return (
    <div className="rubric">
      {rubric.map((c) => (
        <div key={c.id} className="rubric-row">
          <div className="grow"><p className="strong">{c.name}</p><p className="small secondary">{c.description}</p></div>
          <p className="rubric-score"><span className="strong">{scores ? scores[c.id] ?? '—' : '—'}</span><span className="muted"> / {c.max}</span></p>
        </div>
      ))}
      {total !== null && <div className="rubric-row rubric-total"><p className="strong grow">Total</p><p className="rubric-score strong">{total}%</p></div>}
    </div>
  );
}

/* ---------- Discussion ---------- */
export function Post({ author, at, children, instructor, highlight }: { author?: User; at: string; children: ReactNode; instructor?: boolean; highlight?: boolean }) {
  return (
    <article className={cx('post', highlight && 'post-instructor')}>
      <Avatar initials={author?.initials || '?'} size="sm" tone={instructor ? 'accent' : undefined} />
      <div className="grow">
        <p className="row" style={{ gap: 8 }}><span className="strong">{author?.name}</span>{instructor && <Badge tone="accent">Instructor</Badge>}<span className="xs muted">{at}</span></p>
        <div className="post-body">{children}</div>
      </div>
    </article>
  );
}
