import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LuClipboardList, LuCircleCheck, LuCircleX, LuArrowLeft, LuArrowRight, LuTrophy } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { assessmentById, assessmentState, courseAssessments, courseById, eligibility, enrolmentFor, lessonProgress } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { CourseTabs } from './Courses';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, DataTable, KeyValue, ProgressBar } from '../../components/ui/data';
import { Radio } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { formatDateTime } from '../../utils/format';
import { NotFound } from '../public/System';

export function CourseAssessments() {
  const { courseId } = useParams(); const { db, user } = useSession(); const u = user!; const c = courseById(db, courseId); useTitle(c ? `Assessments · ${c.title}` : 'Assessments');
  if (!c) return <NotFound />;
  const e = enrolmentFor(db, u.id, c.id); const rows = courseAssessments(db, c.id).map((a) => assessmentState(db, u.id, a));
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Assessments']]} />} title="Assessments" lead={`${c.title} · self-paced within your access period. Score at least 50% on each required graded activity.`} />
      <CourseTabs courseId={c.id} />
      {!e && <Alert tone="info" title="Enrol to take assessments" />}
      <DataTable caption="Assessments" rowKey={(r) => r.a.id} rows={rows} columns={[
        { key: 't', header: 'Activity', primary: true, render: (r) => <span><Link to={`/learn/courses/${c.id}/${r.a.kind === 'quiz' ? 'quiz' : 'assignment'}/${r.a.id}`} className="strong">{r.a.title}</Link><span className="small muted" style={{ display: 'block' }}>{r.a.kind === 'quiz' ? 'Quiz' : 'Assignment'} · {r.a.required ? 'Required' : 'Optional'}</span></span> },
        { key: 'att', header: 'Attempts', render: (r) => r.a.kind === 'quiz' ? `${r.attemptsUsed} of ${r.a.maxAttempts} graded · practice unlimited` : `${r.attemptsUsed} of ${r.a.maxAttempts} submissions` },
        { key: 'best', header: 'Best score', numeric: true, render: (r) => r.best === null ? '—' : `${r.best}%` },
        { key: 'st', header: 'Status', render: (r) => <StatusBadge tone={r.tone}>{r.status}</StatusBadge> },
      ]} actions={(r) => <Button size="sm" variant="secondary" to={`/learn/courses/${c.id}/${r.a.kind === 'quiz' ? 'quiz' : 'assignment'}/${r.a.id}${r.a.kind === 'assignment' && r.submission?.published ? '/feedback' : ''}`}>{r.a.kind === 'assignment' && r.submission?.published ? 'View feedback' : r.passed ? 'Review' : 'Open'}<span className="sr-only"> {r.a.title}</span></Button>} />
      <p className="small muted" style={{ marginTop: 12 }}>Need another attempt after using them all? <Link to={`/learn/support/new?ref=${c.id}`}>Ask your instructor via support</Link>.</p>
    </>
  );
}

export function QuizView() {
  const { courseId, assessmentId } = useParams(); const { db, user } = useSession(); const u = user!; const navigate = useNavigate();
  const demo = useDemoState(['exhausted'] as const);
  const a = assessmentById(db, assessmentId); const c = courseById(db, courseId); useTitle(a?.title || 'Quiz');
  const [mode, setMode] = useState<'graded' | 'practice' | null>(null); const [answers, setAnswers] = useState<(number | null)[]>([]); const [q, setQ] = useState(0); const [confirm, setConfirm] = useState(false);
  if (!a || !c || a.kind !== 'quiz') return <NotFound />;
  const e = enrolmentFor(db, u.id, c.id); const st = assessmentState(db, u.id, a);
  const exhausted = demo === 'exhausted' || st.attemptsLeft <= 0;
  const crumbs = <Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Assessments', `/learn/courses/${c.id}/assessments`], [a.title]]} />;
  if (e?.status !== 'active') return <><PageHeader crumbs={crumbs} title={a.title} /><EmptyState title="This quiz isn’t available" actions={<Button to={`/learn/courses/${c.id}`}>Back to course</Button>}>{e ? 'New attempts close when your course access ends.' : 'Enrol in this course to take its quizzes.'}</EmptyState></>;
  const qs = a.questions!;
  if (!mode) return (
    <>
      <PageHeader crumbs={crumbs} title={a.title} lead={`${qs.length} questions · about ${qs.length * 2} minutes · no time limit`} />
      <div className="with-aside">
        <div className="stack">
          {exhausted && <Alert tone="error" title={`You’ve used all ${a.maxAttempts} graded attempts`} actions={<Button size="sm" variant="secondary" to={`/learn/support/new?ref=${a.id}`}>Request an additional attempt</Button>}>Your best graded score is {demo === 'exhausted' ? 40 : st.best}%{(demo === 'exhausted' ? 40 : st.best ?? 0) < a.passMark ? `, below the ${a.passMark}% needed for the certificate` : ''}. Practice attempts are still unlimited, and your instructor can grant another graded attempt.</Alert>}
          {st.passed && <Alert tone="success" title={`Passed — best graded score ${st.best}%`}>You can keep practising; graded attempts left: {st.attemptsLeft}.</Alert>}
          <Card title="How this quiz works"><ul className="stack-sm"><li><strong>Practice:</strong> unlimited attempts with answers and explanations. Doesn’t count.</li><li><strong>Graded:</strong> {a.maxAttempts} attempts. Your highest graded score counts.</li><li>Move between questions freely and change answers before you submit.</li><li>Pass mark for the certificate: <strong>{a.passMark}%</strong>.</li></ul></Card>
          <fieldset className="stack-sm"><legend style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--lh-lg)' }}>Choose how to take it</legend>
            <Radio card name="mode" disabled={exhausted} label={`Graded attempt ${exhausted ? '' : `${st.attemptsUsed + 1} of ${a.maxAttempts}`}`} hint={exhausted ? 'No graded attempts left' : 'Counts toward your certificate'} onChange={() => setMode('graded')} checked={false} />
            <Radio card name="mode" label="Practice attempt" hint="Unlimited · not graded" onChange={() => setMode('practice')} checked={false} />
          </fieldset>
        </div>
        <aside><Card title="Your graded attempts" headingLevel={2}>{st.attemptsUsed ? <ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{db.quizAttempts.filter((x) => x.userId === u.id && x.assessmentId === a.id && x.mode === 'graded').map((x, i) => <li key={x.id} className="row-between small"><span>Attempt {i + 1} · {formatDateTime(x.submittedAt)}</span><strong>{x.score}%</strong></li>)}</ul> : <p className="small secondary">None yet.</p>}</Card></aside>
      </div>
    </>
  );
  const cur = qs[q]; const answered = answers.filter((x) => x !== null && x !== undefined).length; const unanswered = qs.length - answered;
  const submit = () => { const id = api.submitQuiz(u.id, a.id, qs.map((_, i) => answers[i] ?? -1), mode); navigate(`/learn/courses/${c.id}/quiz/${a.id}/results?attempt=${id}`); };
  return (
    <>
      <PageHeader crumbs={crumbs} title={a.title} lead={mode === 'graded' ? `Graded attempt ${st.attemptsUsed + 1} of ${a.maxAttempts}` : 'Practice attempt — not graded'} />
      <div className="quiz-layout">
        <form className="card stack" onSubmit={(ev) => { ev.preventDefault(); }}>
          <ProgressBar value={((q + 1) / qs.length) * 100} label={`Question ${q + 1} of ${qs.length}`} detail={`${answered} answered`} tone="primary" />
          <fieldset className="stack">
            <legend><h2 style={{ fontSize: 'var(--text-xl)', lineHeight: 'var(--lh-xl)' }}>{q + 1}. {cur.prompt}</h2></legend>
            <div className="option-list">{cur.options.map((o, k) => <Radio card key={k} name={`q-${cur.id}`} label={o} checked={answers[q] === k} onChange={() => { const n = [...answers]; n[q] = k; setAnswers(n); }} />)}</div>
          </fieldset>
          <div className="player-nav">
            <Button variant="secondary" disabled={q === 0} onClick={() => setQ(q - 1)} icon={<LuArrowLeft aria-hidden="true" />}>Previous</Button>
            {q < qs.length - 1 ? <Button onClick={() => setQ(q + 1)} iconRight={<LuArrowRight aria-hidden="true" />}>Next question</Button> : <Button onClick={() => setConfirm(true)}>Review and submit</Button>}
          </div>
        </form>
        <aside className="card card-sm stack-sm" aria-label="Question navigator">
          <p className="strong small">Questions</p>
          <div className="qmap">{qs.map((x, k) => <button key={x.id} type="button" className={answers[k] != null ? 'answered' : undefined} aria-current={k === q ? 'step' : undefined} onClick={() => setQ(k)} aria-label={`Question ${k + 1}${answers[k] != null ? ', answered' : ', not answered'}`}>{k + 1}</button>)}</div>
          <p className="xs muted">Filled = answered</p>
          <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>Submit {mode === 'graded' ? 'attempt' : 'practice'}</Button>
          <Button variant="tertiary" size="sm" onClick={() => { setMode(null); setAnswers([]); setQ(0); }}>Leave without submitting</Button>
        </aside>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} title={mode === 'graded' ? 'Submit graded attempt?' : 'Submit practice attempt?'} confirmLabel="Submit">
        {unanswered > 0 ? <Alert tone="warning" title={`${unanswered} question${unanswered > 1 ? 's are' : ' is'} unanswered`}>Unanswered questions score zero. You can go back and answer them first.</Alert> : <p>You’ve answered all {qs.length} questions.</p>}
        {mode === 'graded' && <p>This uses attempt {st.attemptsUsed + 1} of {a.maxAttempts}. Your highest graded score counts.</p>}
      </ConfirmDialog>
    </>
  );
}

export function QuizResults() {
  const { courseId, assessmentId } = useParams(); const [sp] = useSearchParams(); const { db, user } = useSession(); const u = user!;
  const a = assessmentById(db, assessmentId); const c = courseById(db, courseId); useTitle(a ? `Results · ${a.title}` : 'Results');
  if (!a || !c) return <NotFound />;
  const mine = db.quizAttempts.filter((x) => x.userId === u.id && x.assessmentId === a.id);
  const att = mine.find((x) => x.id === sp.get('attempt')) || mine.at(-1);
  const st = assessmentState(db, u.id, a);
  if (!att) return <EmptyState title="No attempts yet" actions={<Button to={`/learn/courses/${c.id}/quiz/${a.id}`}>Take the quiz</Button>}>Your results appear here after you submit.</EmptyState>;
  const pass = att.score >= a.passMark; const el = eligibility(db, u.id, c.id); const lp = lessonProgress(db, u.id, c.id);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['My courses', '/learn/courses'], [c.title, `/learn/courses/${c.id}`], ['Assessments', `/learn/courses/${c.id}/assessments`], ['Results']]} />} title={`${a.title}: results`} lead={att.mode === 'practice' ? 'Practice attempt — not graded' : `Graded attempt submitted ${formatDateTime(att.submittedAt)}`} />
      <div className="with-aside">
        <div className="stack">
          <div className={`card status-hero stack`} role="status">
            <div><span className={`status-icon ${pass ? 'success' : 'warning'}`}>{pass ? <LuTrophy aria-hidden="true" /> : <LuClipboardList aria-hidden="true" />}</span></div>
            <h2 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>You scored {att.score}%</h2>
            <p className="lead">{att.mode === 'practice' ? `Practice only. ${pass ? 'You’d pass this — try a graded attempt.' : `The pass mark is ${a.passMark}%.`}` : pass ? `Requirement met — the pass mark is ${a.passMark}%.` : `Below the ${a.passMark}% pass mark. You have ${st.attemptsLeft} graded attempt${st.attemptsLeft === 1 ? '' : 's'} left.`}</p>
            <div className="row" style={{ justifyContent: 'center' }}>{!pass && st.attemptsLeft > 0 && <Button to={`/learn/courses/${c.id}/quiz/${a.id}`}>Try again</Button>}<Button variant="secondary" to="/learn/progress">View my progress</Button></div>
          </div>
          <section className="stack" aria-labelledby="review-h"><h2 id="review-h">Review your answers</h2>
            {a.questions!.map((q, i) => { const ok = att.answers[i] === q.answer; return (
              <article key={q.id} className={`result-item ${ok ? 'correct' : 'incorrect'} stack-sm`}>
                <p className="row" style={{ gap: 8 }}>{ok ? <LuCircleCheck aria-hidden="true" color="var(--color-success)" /> : <LuCircleX aria-hidden="true" color="var(--color-error)" />}<span className="strong">{ok ? 'Correct' : att.answers[i] < 0 ? 'Not answered' : 'Incorrect'}</span></p>
                <p className="strong">{i + 1}. {q.prompt}</p>
                <KeyValue items={[['Your answer', att.answers[i] >= 0 ? q.options[att.answers[i]] : '—'], ...(!ok ? [['Correct answer', q.options[q.answer]] as [string, string]] : [])]} />
                <p className="small secondary">{q.explanation}</p>
              </article>
            ); })}
          </section>
        </div>
        <aside className="stack">
          <Card title="Your progress, updated" headingLevel={2}><div className="stack-sm"><ProgressBar value={lp.pct} label="Lessons" detail={`${lp.done}/${lp.total}`} /><p className="small">{a.title.split(':')[0]}: <StatusBadge tone={st.tone}>{st.status}</StatusBadge></p><p className="small secondary">{el.eligible ? 'All certificate requirements are met.' : `${el.remaining} certificate requirement${el.remaining === 1 ? '' : 's'} left.`}</p><Button size="sm" variant={el.eligible ? 'primary' : 'secondary'} to={`/learn/certificates/${c.id}`}>{el.eligible ? 'View your certificate' : 'See what’s left'}</Button></div></Card>
        </aside>
      </div>
    </>
  );
}
