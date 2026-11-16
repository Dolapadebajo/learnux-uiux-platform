import { useState } from 'react';
import { LuPlus, LuTrash2, LuLock } from 'react-icons/lu';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseAssessments } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Alert, EmptyState, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Accordion, Card, KeyValue } from '../../components/ui/data';
import { Radio, TextField, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import { RubricView } from '../../components/learning/patterns';
import { CourseStatusBadge, CourseWorkspaceNav, useInstructorCourse } from './shared';
import { NotFound } from '../public/System';
import type { QuizQuestion } from '../../types';

function QuestionEditor({ aid, q, i, locked, onRemove }: { aid: string; q: QuizQuestion; i: number; locked: boolean; onRemove: () => void }) {
  const toast = useToast(); const [d, setD] = useState(q); const [err, setErr] = useState('');
  return (
    <Accordion title={`Question ${i + 1}`} meta={q.prompt} headingLevel={3}>
      <fieldset disabled={locked} className="stack">
        <TextField label="Question" value={d.prompt} onChange={(e) => setD({ ...d, prompt: e.target.value })} error={err} />
        <fieldset><legend>Answer options — select the correct one</legend><div className="stack-sm">{d.options.map((o, k) => (
          <div key={k} className="row" style={{ flexWrap: 'nowrap' }}><Radio name={`correct-${q.id}`} label={<span className="sr-only">Option {k + 1} is correct</span>} checked={d.answer === k} onChange={() => setD({ ...d, answer: k })} /><TextField hideLabel label={`Option ${k + 1}`} value={o} onChange={(e) => { const n = [...d.options]; n[k] = e.target.value; setD({ ...d, options: n }); }} className="grow" /></div>
        ))}</div></fieldset>
        <Textarea label="Explanation shown after answering" value={d.explanation} onChange={(e) => setD({ ...d, explanation: e.target.value })} rows={2} />
        <div className="row-between"><Button size="sm" onClick={() => { if (d.prompt.trim().length < 5 || d.options.some((o) => !o.trim())) { setErr('Write the question and fill every option'); return; } setErr(''); api.updateQuestion(aid, i, d); toast(`Question ${i + 1} saved`); }}>Save question</Button><Button size="sm" variant="tertiary" icon={<LuTrash2 aria-hidden="true" />} onClick={onRemove}>Remove</Button></div>
      </fieldset>
    </Accordion>
  );
}

export function AssessmentBuilder() {
  const { db, course: c } = useInstructorCourse(); useTitle(c ? `Assessments · ${c.title}` : 'Assessments'); const toast = useToast();
  const list = c ? courseAssessments(db, c.id) : []; const [sel, setSel] = useState(list[0]?.id); const [remove, setRemove] = useState<number | null>(null);
  if (!c) return <NotFound />;
  const a = list.find((x) => x.id === sel) || list[0];
  const locked = c.status === 'in_review';
  return (
    <>
      <CourseWorkspaceNav courseId={c.id} title={c.title} />
      <PageHeader title="Assessment builder" actions={<CourseStatusBadge status={c.status} />} />
      {c.status === 'published' && <Alert tone="warning" title="This course is published" className="subnav">Edits here are saved immediately in this prototype. In production, changing a required assessment is a material change needing administrator review; completed attempts and issued certificates never change.</Alert>}
      {!list.length ? <EmptyState title="No assessments yet">Assessment creation for new courses isn’t implemented in this prototype — UX Foundations shows a full example.</EmptyState> : (
        <div className="split-view">
          <nav aria-label="Assessments" className="stack-sm">{list.map((x) => <button key={x.id} type="button" className="card card-sm" style={{ textAlign: 'left', cursor: 'pointer', borderColor: x.id === a.id ? 'var(--color-primary)' : undefined, background: x.id === a.id ? 'var(--color-primary-subtle)' : undefined }} aria-current={x.id === a.id ? 'true' : undefined} onClick={() => setSel(x.id)}><span className="strong" style={{ display: 'block' }}>{x.title}</span><span className="small secondary">{x.kind === 'quiz' ? `Quiz · ${x.questions?.length} questions` : 'Assignment · rubric'} · {x.required ? 'Required' : 'Optional'}</span></button>)}</nav>
          <div className="stack">
            <Card title={a.title}><KeyValue items={[['Type', a.kind === 'quiz' ? 'Quiz' : 'Assignment'], ['Pass mark', <span className="row" style={{ gap: 6 }}><LuLock aria-hidden="true" />{a.passMark}% (platform rule)</span>], ['Attempts', <span className="row" style={{ gap: 6 }}><LuLock aria-hidden="true" />{a.kind === 'quiz' ? '3 graded + unlimited practice' : '1 submission + 2 resubmissions'}</span>], ['Placement', `After ${c.modules.find((m) => m.id === a.afterModuleId)?.title || '—'}`]]} /></Card>
            {a.kind === 'quiz' ? <>
              {a.questions!.map((q, i) => <QuestionEditor key={q.id + i} aid={a.id} q={q} i={i} locked={locked} onRemove={() => setRemove(i)} />)}
              <div><Button variant="secondary" icon={<LuPlus aria-hidden="true" />} disabled={locked} onClick={() => { api.addQuestion(a.id); toast('Question added'); }}>Add question</Button></div>
            </> : <Card title="Brief and rubric"><p className="prose">{a.brief}</p><div style={{ marginTop: 16 }}><RubricView rubric={a.rubric!} /></div><p className="xs muted" style={{ marginTop: 8 }}>Rubric editing isn’t implemented in this prototype.</p></Card>}
          </div>
        </div>
      )}
      <ConfirmDialog open={remove !== null} onClose={() => setRemove(null)} destructive title="Remove this question?" confirmLabel="Remove question" onConfirm={() => { api.removeQuestion(a.id, remove!); toast('Question removed'); }}><p>Learners’ past attempts keep their scores.</p></ConfirmDialog>
    </>
  );
}
