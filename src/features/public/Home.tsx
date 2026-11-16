import { Link } from 'react-router-dom';
import { LuCalendar, LuVideo, LuAward, LuShieldCheck, LuArrowRight, LuClock } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { publishedCourses, userById, enrolmentFor, promoFor } from '../../data/selectors';
import { CourseCard } from '../../components/learning/CourseCard';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/feedback';
import { formatDate } from '../../utils/format';

export function Home() {
  const { db, user } = useSession(); useTitle('Learn UI/UX design');
  const courses = publishedCourses(db);
  const featured = ['UXF-101', 'DT-100', 'A11Y-150'].map((id) => courses.find((c) => c.id === id)!).filter(Boolean);
  const promo = promoFor(db, user?.id, courses[0]);
  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-inner">
          <div className="stack">
            <p className="eyebrow">Online UI/UX courses · taught live, recorded for you</p>
            <h1 id="hero-h">Learn UX design with real practice and real feedback</h1>
            <p className="lead">Beginner-friendly courses for career changers and people learning around work or study. Join weekly live sessions or catch up with recordings — your access lasts a full year.</p>
            <div className="row"><Button to="/courses" iconRight={<LuArrowRight aria-hidden="true" />}>Browse courses</Button><Button variant="secondary" to="/courses/DT-100">Try the free course</Button></div>
            {db.settings.promoEnabled && <p className="small secondary"><strong>{db.settings.promoPercent}% off your first paid course</strong> until {formatDate(db.settings.promoEnds)}. {user && !promo.eligible ? 'You’ve already used this offer.' : 'Applied automatically at checkout.'}</p>}
          </div>
          <div className="hero-panel" aria-label="What a week looks like">
            <p className="strong">A typical week in UX Foundations</p>
            {[[LuVideo, 'Three short video lessons', 'about 35 minutes, with captions and transcripts'], [LuCalendar, 'One live session', 'Tuesdays 7 pm WAT — recorded within 48 hours'], [LuClock, 'One practice activity', 'feedback from your instructor on graded work'], [LuAward, 'Progress toward a certificate', 'complete lessons and score 50%+ on graded work']].map(([I, t, d]) => { const Icon = I as typeof LuVideo; return (
              <div key={t as string} className="row row-top card card-sm" style={{ flexWrap: 'nowrap' }}><Icon aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--color-accent)', flex: 'none', marginTop: 2 }} /><div><p className="strong">{t as string}</p><p className="small secondary">{d as string}</p></div></div>
            ); })}
          </div>
        </div>
      </section>
      <div className="section stack-lg">
        <section aria-labelledby="pop-h" className="stack">
          <div className="row-between"><h2 id="pop-h">Start with these</h2><Link to="/courses">See all {courses.length} courses</Link></div>
          <div className="course-grid">{featured.map((c) => <CourseCard key={c.id} course={c} instructorName={userById(db, c.instructorId)!.name} enrolled={enrolmentFor(db, user?.id, c.id)?.status === 'active'} />)}</div>
        </section>
        <section aria-labelledby="how-h" className="stack">
          <h2 id="how-h">How LearnUX works</h2>
          <ol className="how-steps">
            <li><h3>Choose a course</h3><p className="secondary">Compare level, prerequisites and weekly workload before you commit.</p></li>
            <li><h3>Create an account</h3><p className="secondary">Browsing is open to everyone. You need a free account to enrol.</p></li>
            <li><h3>Pay in naira, or enrol free</h3><p className="secondary">Card, bank transfer or USSD. Free courses unlock as soon as you confirm.</p></li>
            <li><h3>Learn and get certified</h3><p className="secondary">Complete lessons and graded work to earn a certificate of completion.</p></li>
          </ol>
        </section>
        <section className="grid-2">
          <div className="card card-primary stack-sm"><LuShieldCheck aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-primary)' }} /><h2 style={{ fontSize: 'var(--text-xl)' }}>Hiring? Verify a certificate</h2><p className="secondary">Check that a LearnUX certificate reference is genuine and current. No account needed.</p><div><Button variant="secondary" to="/verify">Verify a certificate</Button></div></div>
          <div className="card stack-sm"><h2 style={{ fontSize: 'var(--text-xl)' }}>Questions before you join?</h2><p className="secondary">Read about payments, refunds, access periods and certificates in the help centre.</p><div><Button variant="secondary" to="/help">Visit the help centre</Button></div></div>
        </section>
        {user && <Alert tone="info" title={`Signed in as ${user.name}`}>Your workspace is one click away. <Link to={{ learner: '/learn', instructor: '/teach', admin: '/admin' }[user.role]}>Open it</Link>.</Alert>}
      </div>
    </>
  );
}
