import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuChartLine } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, lessonProgress, courseAssessments, assessmentState, eligibility, certificateFor } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Card, ProgressBar, ProgressRing, Metric } from '../../components/ui/data';
import { Select } from '../../components/ui/form';
import { EmptyState, StatusBadge } from '../../components/ui/feedback';
import { EligibilityChecklist } from '../../components/learning/patterns';
import { Button } from '../../components/ui/Button';

export function LearningProgress() {
  const { db, user } = useSession(); const u = user!; useTitle('Learning progress');
  const mine = db.enrolments.filter((e) => e.userId === u.id && (e.status === 'active' || e.status === 'expired'));
  const [cid, setCid] = useState(mine.find((e) => e.status === 'active')?.courseId || mine[0]?.courseId);
  if (!mine.length || !cid) return <><PageHeader title="Learning progress" /><EmptyState icon={<LuChartLine />} title="No progress yet" actions={<Button to="/courses">Browse courses</Button>}>Your lesson progress, grades and certificate requirements will appear here.</EmptyState></>;
  const c = courseById(db, cid)!; const lp = lessonProgress(db, u.id, cid); const el = eligibility(db, u.id, cid);
  const sts = courseAssessments(db, cid).map((a) => assessmentState(db, u.id, a));
  const minutes = c.modules.flatMap((m) => m.lessons).filter((l) => db.enrolments.find((e) => e.userId === u.id && e.courseId === cid)?.completedLessonIds.includes(l.id)).reduce((s, l) => s + l.minutes, 0);
  return (
    <>
      <PageHeader title="Learning progress" lead="Lesson progress, graded work and certificate eligibility are tracked separately." actions={mine.length > 1 && <Select label="Course" value={cid} onChange={(e) => setCid(e.target.value)} options={mine.map((e) => ({ value: e.courseId, label: courseById(db, e.courseId)!.title }))} />} />
      <div className="grid-4">
        <Metric label="Lessons complete" value={`${lp.done}/${lp.total}`} note={`${lp.pct}% of required lessons`} />
        <Metric label="Learning time" value={`${Math.floor(minutes / 60)}h ${minutes % 60}m`} note="Estimated from completed lessons" />
        <Metric label="Graded work passed" value={`${sts.filter((s) => s.passed).length}/${sts.length}`} note="At least 50% each" />
        <Metric label="Certificate" value={certificateFor(db, u.id, cid) ? 'Issued' : el.eligible ? 'Ready' : `${el.remaining} left`} note={certificateFor(db, u.id, cid)?.id || 'requirements remaining'} />
      </div>
      <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
        <Card title="1 · Lessons by module">
          <div className="row" style={{ flexWrap: 'nowrap', marginBottom: 16 }}><ProgressRing value={lp.pct} label={`${c.title} lessons`} /><p className="secondary">{c.title}</p></div>
          <div className="stack-sm">{c.modules.map((m, i) => { const done = m.lessons.filter((l) => db.enrolments.find((e) => e.userId === u.id && e.courseId === cid)?.completedLessonIds.includes(l.id)).length; return <ProgressBar key={m.id} value={(done / m.lessons.length) * 100} label={`Module ${i + 1}: ${m.title}`} detail={`${done}/${m.lessons.length}`} />; })}</div>
        </Card>
        <div className="stack">
          <Card title="2 · Graded work">
            <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{sts.map((s) => <li key={s.a.id} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}><Link to={`/learn/courses/${cid}/${s.a.kind === 'quiz' ? 'quiz' : 'assignment'}/${s.a.id}`}>{s.a.title}</Link><StatusBadge tone={s.tone}>{s.status}</StatusBadge></li>)}</ul>
          </Card>
          <Card title="3 · Certificate eligibility" actions={<Link to={`/learn/certificates/${cid}`} className="small">Certificate page</Link>}><EligibilityChecklist items={el.items} /></Card>
        </div>
      </div>
    </>
  );
}
