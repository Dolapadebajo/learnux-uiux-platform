import { useTitle } from '../../hooks/useTitle';
import { courseAssessments, lessonProgress, assessmentState } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Card, Metric } from '../../components/ui/data';
import { Alert } from '../../components/ui/feedback';
import { CourseWorkspaceNav, useInstructorCourse } from './shared';
import { NotFound } from '../public/System';

export function Bars({ rows, accent, suffix = '%', label }: { rows: [string, number, number?][]; accent?: boolean; suffix?: string; label: string }) {
  const max = Math.max(...rows.map((r) => r[2] ?? r[1]), 1);
  return (
    <div className="bars" role="table" aria-label={label}>
      <div role="row" className="sr-only"><span role="columnheader">Item</span><span role="columnheader">Value</span></div>
      {rows.map(([l, v, m]) => <div key={l} className="bar-row" role="row"><span role="cell">{l}</span><span className="bar-track" aria-hidden="true"><span className={`bar-fill${accent ? ' accent' : ''}`} style={{ display: 'block', width: `${(v / (m ?? max)) * 100}%` }} /></span><span role="cell" className="strong" style={{ textAlign: 'right' }}>{v}{suffix}</span></div>)}
    </div>
  );
}

export function Analytics() {
  const { db, course: c } = useInstructorCourse(); useTitle(c ? `Analytics · ${c.title}` : 'Analytics');
  if (!c) return <NotFound />;
  const ens = db.enrolments.filter((e) => e.courseId === c.id && e.status === 'active');
  const avg = ens.length ? Math.round(ens.reduce((s, e) => s + lessonProgress(db, e.userId, c.id).pct, 0) / ens.length) : 0;
  const modRows: [string, number, number][] = c.modules.map((m, i) => [`Module ${i + 1}`, Math.round((ens.filter((e) => m.lessons.every((l) => e.completedLessonIds.includes(l.id))).length / Math.max(ens.length, 1)) * 100), 100]);
  const assess = courseAssessments(db, c.id).map((a) => { const sts = ens.map((e) => assessmentState(db, e.userId, a)); return [a.title.split(':')[0], Math.round((sts.filter((s) => s.passed).length / Math.max(sts.length, 1)) * 100), 100] as [string, number, number]; });
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Course analytics" lead="Calculated from the demo learner records. Totals such as enrolled count are sample figures." />
      <div className="grid-4">
        <Metric label="Enrolled (all time)" value={c.learners} note="sample figure" />
        <Metric label="Active demo learners" value={ens.length} />
        <Metric label="Average lesson progress" value={`${avg}%`} />
        <Metric label="Average rating" value={c.rating ?? '—'} note={c.reviews ? `${c.reviews} reviews` : 'No reviews yet'} />
      </div>
      <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
        <Card title="Learners who completed each module"><Bars rows={modRows} accent label="Module completion" /><p className="small muted" style={{ marginTop: 12 }}>Watch for drops between modules — they often signal a difficult lesson.</p></Card>
        <Card title="Pass rate by graded activity">{assess.length ? <Bars rows={assess} label="Pass rates" /> : <p className="secondary">No graded activities.</p>}</Card>
      </div>
      <Alert tone="info" title="What isn’t tracked here" className="subnav">Time-on-video and engagement heatmaps would need real playback events; they aren’t simulated.</Alert>
    </>
  );
}
