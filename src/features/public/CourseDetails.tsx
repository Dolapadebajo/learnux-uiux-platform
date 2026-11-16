import { Link, useParams } from 'react-router-dom';
import { LuCalendar, LuClock, LuSignal, LuVideo, LuBookOpen, LuAward, LuCircleCheck, LuCalendarCheck, LuClipboardList } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, userById, enrolmentFor, promoFor, pendingTxnFor, courseAssessments, allLessons } from '../../data/selectors';
import { CourseCover } from '../../components/learning/CourseCard';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Accordion, Avatar, Card } from '../../components/ui/data';
import { Alert, Badge } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { formatDate, formatNGN, formatUSDEstimate } from '../../utils/format';
import { NotFound } from './System';

export function CourseDetails() {
  const { courseId } = useParams(); const { db, user } = useSession();
  const c = courseById(db, courseId); useTitle(c?.title || 'Course');
  if (!c || c.status !== 'published') return <NotFound />;
  const ins = userById(db, c.instructorId)!; const enr = enrolmentFor(db, user?.id, c.id); const promo = promoFor(db, user?.id, c);
  const pending = user ? pendingTxnFor(db, user.id, c.id) : undefined; const lessons = allLessons(c); const assess = courseAssessments(db, c.id);
  const total = c.price - (promo.eligible ? promo.discount : 0);
  const isLearner = !user || user.role === 'learner';
  const cta = enr?.status === 'active' ? <Button block to={`/learn/courses/${c.id}`}>Go to course</Button>
    : pending ? <Button block to={`/checkout/${c.id}/status/${pending.id}`}>Check payment status</Button>
    : !isLearner ? <Button block disabled>Enrolment is for learner accounts</Button>
    : !user ? <Button block to={`/signup?course=${c.id}`}>{c.price ? 'Enrol now' : 'Enrol for free'}</Button>
    : <Button block to={`/checkout/${c.id}`}>{c.price ? 'Enrol now' : 'Enrol for free'}</Button>;
  const priceBlock = (
    <div className="stack-sm">
      {enr?.status === 'active' ? <Alert tone="success" title="You’re enrolled">Access until {formatDate(enr.accessUntil)}.</Alert> : pending ? <Alert tone="warning" title="A payment for this course is being confirmed">Please don’t pay again. We’ll unlock the course as soon as the bank confirms.</Alert> : (
        <>
          {promo.eligible && <p className="small"><s className="muted">{formatNGN(c.price)}</s> <Badge tone="accent">{db.settings.promoPercent}% first-course offer</Badge></p>}
          <p className="price" style={{ fontSize: 32, lineHeight: '40px' }}>{formatNGN(total)}</p>
          {total > 0 && <p className="small muted">{formatUSDEstimate(total)} — estimate only; you pay in naira</p>}
          {!user && c.price > 0 && <p className="small secondary">Offer applies automatically if this is your first paid course.</p>}
        </>
      )}
      {cta}
      {!user && <p className="small secondary">You’ll create a free account first. We’ll keep this course selected.</p>}
    </div>
  );
  return (
    <>
      <div className="detail-hero">
        <div className="detail-hero-inner">
          <Breadcrumbs items={[['Courses', '/courses'], [c.title]]} />
          <div className="with-aside" style={{ marginTop: 16 }}>
            <div className="stack">
              <div className="row" style={{ gap: 6 }}><Badge tone="info">{c.level}</Badge><Badge>{c.category}</Badge>{c.price === 0 && <Badge tone="accent">Free</Badge>}</div>
              <h1>{c.title}</h1>
              <p className="lead">{c.subtitle}</p>
              <div className="row small secondary"><Avatar initials={ins.initials} size="sm" tone="accent" /><span>Taught by <strong>{ins.name}</strong></span>{c.rating && <span>· {c.rating} average from {c.reviews} reviews</span>}<span>· {c.learners} learners</span></div>
            </div>
            <div className="desktop-only" style={{ display: 'block' }}><CourseCover cover={c.cover} height={200} /></div>
          </div>
        </div>
      </div>
      <div className="site-main">
        <div className="with-aside">
          <div className="stack-lg">
            <section className="card show-mobile-block" aria-label="Price and enrolment">{priceBlock}</section>
            <section aria-labelledby="fit-h" className="card stack">
              <h2 id="fit-h">Is this course right for me?</h2>
              <div className="facts">
                <div className="fact"><LuSignal aria-hidden="true" /><div><p className="strong">Level: {c.level}</p><p className="small secondary">{c.prerequisites}</p></div></div>
                <div className="fact"><LuClock aria-hidden="true" /><div><p className="strong">{c.hoursPerWeek} a week</p><p className="small secondary">for {c.weeks} weeks · self-paced between sessions</p></div></div>
                <div className="fact"><LuCalendar aria-hidden="true" /><div><p className="strong">Live: {c.liveSchedule}</p><p className="small secondary">Next start: {c.nextStart}</p></div></div>
                <div className="fact"><LuVideo aria-hidden="true" /><div><p className="strong">Can’t make it live?</p><p className="small secondary">Recordings with captions within 48 hours</p></div></div>
                <div className="fact"><LuCalendarCheck aria-hidden="true" /><div><p className="strong">One year of access</p><p className="small secondary">from the day the course unlocks</p></div></div>
                <div className="fact"><LuClipboardList aria-hidden="true" /><div><p className="strong">{assess.length} graded {assess.length === 1 ? 'activity' : 'activities'}</p><p className="small secondary">unlimited practice quizzes; 3 graded attempts</p></div></div>
              </div>
            </section>
            <section aria-labelledby="out-h" className="stack"><h2 id="out-h">What you’ll be able to do</h2><ul className="check-list">{c.outcomes.map((o) => <li key={o}><LuCircleCheck aria-hidden="true" />{o}</li>)}</ul></section>
            <section aria-labelledby="syl-h" className="stack">
              <div className="row-between"><h2 id="syl-h">Syllabus</h2><span className="small secondary">{c.modules.length} modules · {lessons.length} lessons</span></div>
              <div>{c.modules.map((m, i) => <Accordion key={m.id} title={`Module ${i + 1}: ${m.title}`} meta={`${m.lessons.length} lessons · ${m.lessons.reduce((s, l) => s + l.minutes, 0)} min`} defaultOpen={i === 0}><ul className="lesson-list">{m.lessons.map((l) => <li key={l.id} className="row small" style={{ padding: '6px 0', flexWrap: 'nowrap' }}>{l.type === 'video' ? <LuVideo aria-hidden="true" /> : <LuBookOpen aria-hidden="true" />}<span className="grow">{l.title}</span><span className="muted nowrap">{l.minutes} min</span></li>)}{assess.filter((a) => a.afterModuleId === m.id).map((a) => <li key={a.id} className="row small" style={{ padding: '6px 0' }}><LuClipboardList aria-hidden="true" /><span className="grow strong">{a.title}</span><Badge tone="info">Graded</Badge></li>)}</ul></Accordion>)}</div>
            </section>
            <Card title="Certificate of completion" as="section">
              <div className="row row-top" style={{ flexWrap: 'nowrap' }}><LuAward aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-accent)', flex: 'none' }} /><p className="secondary">Complete every required lesson and score at least 50% on each required graded activity. Certificates confirm course completion — they are not a professional accreditation. Employers can <Link to="/verify">verify them online</Link>.</p></div>
            </Card>
            <section aria-labelledby="ins-h" className="card row row-top" style={{ flexWrap: 'nowrap' }}><Avatar initials={ins.initials} size="lg" tone="accent" /><div className="stack-sm"><h2 id="ins-h" style={{ fontSize: 'var(--text-xl)' }}>{ins.name}</h2><p className="small strong secondary">{ins.headline}</p><p className="secondary">{ins.bio}</p></div></section>
          </div>
          <aside className="desktop-only" style={{ display: 'block' }} aria-label="Enrolment summary"><div className="card sticky stack-sm"><p className="strong">{c.title}</p><p className="small secondary">{c.weeks} weeks · {c.liveSchedule}</p>{priceBlock}</div></aside>
        </div>
      </div>
      <div className="mobile-cta" aria-label="Enrol">
        <div>{enr?.status === 'active' ? <span className="strong">Enrolled</span> : <><span className="price">{formatNGN(total)}</span>{promo.eligible && <span className="xs muted" style={{ display: 'block' }}>offer applied</span>}</>}</div>
        <div style={{ minWidth: 160 }}>{cta}</div>
      </div>
    </>
  );
}
