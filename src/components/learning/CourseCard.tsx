import { Link } from 'react-router-dom';
import { LuClock, LuCalendar, LuStar, LuUsers } from 'react-icons/lu';
import type { Course, Enrolment } from '../../types';
import { formatDate, formatNGN, formatUSDEstimate } from '../../utils/format';
import { Badge, StatusBadge } from '../ui/feedback';
import { ProgressBar } from '../ui/data';
import { Button } from '../ui/Button';
import { accessDaysLeft } from '../../data/selectors';

const palettes: Record<string, [string, string, string]> = {
  research: ['#1d4ed8', '#93c5fd', '#0f766e'], systems: ['#1e3a8a', '#c7d2fe', '#0f766e'], mobile: ['#0f766e', '#99f6e4', '#1d4ed8'],
  access: ['#1e40af', '#bfdbfe', '#f59e0b'], writing: ['#334155', '#e2e8f0', '#1d4ed8'], thinking: ['#0f766e', '#ccfbf1', '#1e40af'], ops: ['#1e3a8a', '#dbeafe', '#0f766e'],
};
/** Decorative, generated cover art (no stock imagery). Hidden from assistive tech; the title carries meaning. */
export function CourseCover({ cover, height = 148, rounded = true }: { cover: string; height?: number; rounded?: boolean }) {
  const [a, b, c] = palettes[cover] || palettes.research;
  return (
    <svg viewBox="0 0 320 148" width="100%" height={height} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', borderRadius: rounded ? 8 : 0, background: b }}>
      <rect x="18" y="22" width="150" height="104" rx="10" fill="#fff" opacity=".95" />
      <rect x="32" y="38" width="80" height="10" rx="5" fill={a} /><rect x="32" y="56" width="120" height="7" rx="3.5" fill={b} /><rect x="32" y="70" width="104" height="7" rx="3.5" fill={b} />
      <rect x="32" y="92" width="56" height="20" rx="6" fill={a} />
      <circle cx="238" cy="70" r="46" fill={a} opacity=".9" /><circle cx="262" cy="96" r="24" fill={c} />
      <path d="M200 30 h40" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function CourseCard({ course, instructorName, enrolled }: { course: Course; instructorName: string; enrolled?: boolean }) {
  return (
    <article className="course-card">
      <CourseCover cover={course.cover} />
      <div className="course-card-body">
        <div className="row" style={{ gap: 6 }}><Badge tone="info">{course.level}</Badge><Badge>{course.category}</Badge>{course.price === 0 && <Badge tone="accent">Free</Badge>}</div>
        <h3 className="course-card-title"><Link to={`/courses/${course.id}`} className="stretched">{course.title}</Link></h3>
        <p className="small secondary">{instructorName}</p>
        <ul className="meta-list small secondary">
          <li><LuClock aria-hidden="true" />{course.weeks} weeks · {course.hoursPerWeek}/week</li>
          <li><LuCalendar aria-hidden="true" />{course.nextStart}</li>
          {course.rating && <li><LuStar aria-hidden="true" />{course.rating} ({course.reviews} reviews)</li>}
        </ul>
        <div className="course-card-foot">
          {enrolled ? <StatusBadge tone="success">Enrolled</StatusBadge> : <span><span className="price">{formatNGN(course.price)}</span>{course.price > 0 && <span className="xs muted" style={{ display: 'block' }}>{formatUSDEstimate(course.price)} (estimate)</span>}</span>}
          <span className="small secondary row" style={{ gap: 4 }}><LuUsers aria-hidden="true" />{course.learners} learners</span>
        </div>
      </div>
    </article>
  );
}

export function EnrolledCourseCard({ course, enrolment, progress, nextLessonTitle, nextLessonId }: { course: Course; enrolment: Enrolment; progress: { done: number; total: number; pct: number }; nextLessonTitle?: string; nextLessonId?: string }) {
  const left = enrolment.accessUntil ? accessDaysLeft(enrolment.accessUntil) : 0;
  const status = enrolment.status === 'pending_payment' ? <StatusBadge tone="warning">Payment pending</StatusBadge>
    : enrolment.status === 'refunded' ? <StatusBadge tone="neutral">Refunded · access ended</StatusBadge>
    : enrolment.status === 'expired' ? <StatusBadge tone="neutral">Access ended {formatDate(enrolment.accessUntil)}</StatusBadge>
    : progress.pct === 100 ? <StatusBadge tone="success">All lessons complete</StatusBadge>
    : left <= 30 ? <StatusBadge tone="warning">Access ends in {left} days</StatusBadge> : <span className="small muted">Access until {formatDate(enrolment.accessUntil)}</span>;
  return (
    <article className="enrolled-card">
      <div className="enrolled-cover"><CourseCover cover={course.cover} height={120} /></div>
      <div className="stack-sm grow">
        <div className="row-between"><h3 style={{ fontSize: 'var(--text-lg)' }}><Link to={`/learn/courses/${course.id}`}>{course.title}</Link></h3>{status}</div>
        {enrolment.status === 'active' || enrolment.status === 'expired' ? <ProgressBar value={progress.pct} label="Lesson progress" detail={`${progress.done} of ${progress.total} lessons`} /> : null}
        {enrolment.status === 'pending_payment' && <p className="small secondary">Your bank transfer is being confirmed. The course unlocks automatically — please don’t pay again.</p>}
        <div className="row">
          {enrolment.status === 'active' && nextLessonId && <Button size="sm" to={`/learn/courses/${course.id}/lessons/${nextLessonId}`}>{progress.done ? 'Continue' : 'Start'}: {nextLessonTitle}</Button>}
          {enrolment.status === 'pending_payment' && <Button size="sm" variant="secondary" to="/learn/payments">Check payment status</Button>}
          {(enrolment.status === 'expired' || enrolment.status === 'refunded') && <Button size="sm" variant="secondary" to={`/learn/courses/${course.id}`}>View what’s still available</Button>}
        </div>
      </div>
    </article>
  );
}
