import { useState, type ReactNode } from 'react';
import { LuPlus, LuDownload, LuTrash2, LuBell, LuSearch } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { PageHeader } from '../../components/layout/layouts';
import { Button, IconButton } from '../../components/ui/Button';
import { Checkbox, ErrorSummary, PasswordField, Radio, SearchInput, Select, Switch, TextField, Textarea } from '../../components/ui/form';
import { Alert, Badge, EmptyState, Skeleton, Spinner, StatusBadge, useToast } from '../../components/ui/feedback';
import { ConfirmDialog, Dialog, Drawer } from '../../components/ui/overlay';
import { Breadcrumbs, Pagination, Steps, Tabs, TabPanel } from '../../components/ui/navigation';
import { Accordion, Avatar, Card, DataTable, KeyValue, Metric, ProgressBar, ProgressRing } from '../../components/ui/data';
import { FileUpload, type UploadItem } from '../../components/ui/FileUpload';
import { CourseCard, EnrolledCourseCard } from '../../components/learning/CourseCard';
import { CertificateDoc, EligibilityChecklist, LessonItem, Post, RubricView } from '../../components/learning/patterns';
import { OrderSummary, Receipt, StatusTimeline, TxnBadge } from '../../components/payments/patterns';
import { Conversation, TicketBadge } from '../../components/support/Conversation';
import { courseById, eligibility, lessonProgress, userById } from '../../data/selectors';

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => <section id={id} aria-labelledby={`${id}-h`} className="stack" style={{ paddingTop: 'var(--space-8)', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-8)' }}><h2 id={`${id}-h`}>{title}</h2>{children}</section>;
const swatches: [string, string][] = [['--color-primary', 'Primary'], ['--color-primary-hover', 'Primary hover'], ['--color-primary-pressed', 'Primary pressed'], ['--color-primary-subtle', 'Primary subtle'], ['--color-accent', 'Accent'], ['--color-accent-subtle', 'Accent subtle'], ['--color-bg', 'Page background'], ['--color-surface', 'Surface'], ['--color-surface-subtle', 'Subtle surface'], ['--color-text', 'Primary text'], ['--color-text-secondary', 'Secondary text'], ['--color-text-muted', 'Muted text (adjusted)'], ['--color-border', 'Subtle border'], ['--color-border-control', 'Control border'], ['--color-focus', 'Focus ring'], ['--color-success', 'Success'], ['--color-warning', 'Warning'], ['--color-error', 'Error'], ['--color-info', 'Information']];

/** Development page: every component and state in one place. Not counted as a product view. */
export function Showcase() {
  useTitle('Component showcase'); const { db } = useSession(); const toast = useToast();
  const [tab, setTab] = useState<'a' | 'b'>('a'); const [page, setPage] = useState(2); const [sw, setSw] = useState(true); const [files, setFiles] = useState<UploadItem[]>([{ name: 'usability-audit.pdf', size: '3.1 MB', state: 'done', progress: 100 }, { name: 'draft-fail.pdf', size: '1.2 MB', state: 'error', progress: 64, error: 'Upload interrupted — connection reset (simulated).' }]);
  const [dlg, setDlg] = useState(false); const [cfm, setCfm] = useState(false); const [drw, setDrw] = useState(false);
  const c = courseById(db, 'UXF-101')!; const e = db.enrolments.find((x) => x.id === 'E-1001')!; const cert = db.certificates[0]; const txn = db.transactions[0]; const ticket = db.tickets[0];
  return (
    <div className="site-main">
      <PageHeader title="Component showcase" lead="Development reference for tokens, controls and product patterns, with their states. Separate from the 60 product views." />
      <nav aria-label="Showcase sections" className="row small">{[['tokens', 'Tokens'], ['type', 'Typography'], ['buttons', 'Buttons'], ['forms', 'Forms'], ['nav', 'Navigation'], ['feedback', 'Feedback'], ['overlays', 'Overlays'], ['data', 'Data display'], ['learning', 'Learning patterns'], ['payments', 'Payments'], ['support', 'Support']].map(([id, l]) => <a key={id} href={`#${id}`} onClick={(ev) => { ev.preventDefault(); document.getElementById(id)?.scrollIntoView(); }}>{l}</a>)}</nav>

      <Section id="tokens" title="Colour tokens">
        <div className="grid-3">{swatches.map(([v, l]) => <div key={v} className="showcase-swatch"><span style={{ background: `var(${v})` }} aria-hidden="true" /><span><span className="strong small" style={{ display: 'block' }}>{l}</span><code className="xs">{v}</code></span></div>)}</div>
        <p className="small secondary">Contrast of every text/background pair is checked by <code>tools/contrast.mjs</code>. Muted text was darkened to #5E6D83 because #64748B fails 4.5:1 on the subtle surface.</p>
        <div className="row">{['4px', '8px', '12px', '16px', '20px', '24px', '32px', '48px', '64px'].map((s) => <span key={s} className="stack-sm center xs"><span style={{ display: 'block', width: s, height: s, background: 'var(--color-primary)', borderRadius: 2 }} />{s}</span>)}</div>
      </Section>
      <Section id="type" title="Typography">
        <p style={{ fontSize: 'var(--text-4xl)', lineHeight: 'var(--lh-4xl)', fontWeight: 700 }}>Heading 1 · 40/48 (30/38 mobile)</p><h2>Heading 2 · 24/32</h2><h3>Heading 3 · 18/28</h3><p className="lead">Lead · 18/28 secondary</p><p>Body · 16/24 — Inter with system fallback.</p><p className="small">Small / labels · 14/20</p><p className="xs muted">Extra small · 12/16 muted</p>
      </Section>
      <Section id="buttons" title="Buttons">
        <div className="row"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="tertiary">Tertiary</Button><Button variant="accent">Accent</Button><Button variant="danger" icon={<LuTrash2 aria-hidden="true" />}>Danger</Button></div>
        <div className="row"><Button icon={<LuPlus aria-hidden="true" />}>With icon</Button><Button size="sm">Small</Button><Button disabled>Disabled</Button><Button loading>Saving</Button><Button to="/courses">As link</Button></div>
        <div className="row"><IconButton label="Download" icon={<LuDownload aria-hidden="true" />} bordered /><IconButton label="Notifications" icon={<LuBell aria-hidden="true" />} badge={3} /><IconButton label="Search" icon={<LuSearch aria-hidden="true" />} /></div>
      </Section>
      <Section id="forms" title="Form controls">
        <div className="grid-2">
          <div className="stack"><TextField label="Text field" hint="Hint text sits above the control." /><TextField label="With error" defaultValue="amaka@" error="Enter an email address like name@example.com" /><PasswordField label="Password field" hint="Show/hide toggle" /><TextField label="Read only" value="Locked value" readOnly /><Textarea label="Textarea" optional /></div>
          <div className="stack"><Select label="Select" options={['Beginner', 'Intermediate']} /><fieldset><legend>Checkboxes</legend><Checkbox label="Checked" defaultChecked /><Checkbox label="Unchecked" hint="With hint" /></fieldset><fieldset><legend>Radio</legend><Radio name="sr" label="Option one" defaultChecked /><Radio name="sr" label="Option two" /></fieldset><fieldset className="stack-sm"><legend>Radio cards</legend><Radio card name="rc" label="Card payment" hint="Instant" defaultChecked /><Radio card name="rc" label="Bank transfer" hint="Up to 24 hours" /></fieldset><Switch label="Switch" hint="role=switch" checked={sw} onChange={setSw} /></div>
        </div>
        <ErrorSummary errors={[['x', 'Example error summary item (links to the field)']]} />
        <SearchInput label="Search" value="" onChange={() => {}} placeholder="Search input" onSubmit={() => {}} />
        <div className="row" role="group" aria-label="Filter chips"><button className="chip" aria-pressed="true">Selected chip</button><button className="chip" aria-pressed="false">Chip</button></div>
        <FileUpload label="File upload (done + error states)" items={files} onChange={setFiles} />
      </Section>
      <Section id="nav" title="Navigation">
        <Breadcrumbs items={[['Courses', '/courses'], ['UX Foundations', '/courses/UXF-101'], ['Checkout']]} />
        <Tabs idBase="sc" label="Example tabs" value={tab} onChange={setTab} tabs={[{ id: 'a', label: 'First tab', count: 3 }, { id: 'b', label: 'Second tab' }]} /><TabPanel idBase="sc" value={tab}><p>Panel for tab {tab.toUpperCase()} (arrow keys move between tabs).</p></TabPanel>
        <Pagination page={page} pages={4} total={38} onChange={setPage} />
        <Steps steps={['Account', 'Review order', 'Pay', 'Start learning']} current={2} />
      </Section>
      <Section id="feedback" title="Feedback">
        <div className="stack-sm"><Alert tone="info" title="Information">Supporting text.</Alert><Alert tone="success" title="Success" /><Alert tone="warning" title="Warning" actions={<Button size="sm" variant="secondary">Action</Button>}>Don’t pay again.</Alert><Alert tone="error" title="Error">Something failed.</Alert></div>
        <div className="row"><Badge>Neutral</Badge><Badge tone="info">Info</Badge><Badge tone="accent">Accent</Badge><StatusBadge tone="success">Success</StatusBadge><StatusBadge tone="warning">Warning</StatusBadge><StatusBadge tone="error">Error</StatusBadge></div>
        <div className="row"><Button variant="secondary" onClick={() => toast('Saved successfully')}>Show success toast</Button><Button variant="secondary" onClick={() => toast('Something went wrong', 'error')}>Show error toast</Button><Spinner /></div>
        <div className="stack-sm" style={{ maxWidth: 320 }}><Skeleton h={20} w="70%" /><Skeleton h={14} /><Skeleton h={14} w="50%" /></div>
        <EmptyState title="Empty state" actions={<Button>Primary action</Button>}>Explains why it’s empty and what to do next.</EmptyState>
      </Section>
      <Section id="overlays" title="Dialogs and drawers">
        <div className="row"><Button variant="secondary" onClick={() => setDlg(true)}>Open dialog</Button><Button variant="secondary" onClick={() => setCfm(true)}>Open destructive confirmation</Button><Button variant="secondary" onClick={() => setDrw(true)}>Open drawer</Button></div>
        <Dialog open={dlg} onClose={() => setDlg(false)} title="Dialog title" footer={<Button onClick={() => setDlg(false)}>Done</Button>}><p>Focus is trapped; Escape closes; focus returns to the opener. On phones it becomes a bottom sheet.</p></Dialog>
        <ConfirmDialog open={cfm} onClose={() => setCfm(false)} destructive simulated title="Delete this lesson?" confirmLabel="Delete" onConfirm={() => toast('Confirmed (nothing deleted)', 'info')}><p>Explains the consequence before acting.</p></ConfirmDialog>
        <Drawer open={drw} onClose={() => setDrw(false)} title="Drawer"><p>Used for record details and mobile navigation.</p></Drawer>
      </Section>
      <Section id="data" title="Data display">
        <div className="grid-4"><Metric label="Metric" value="₦4.2m" note="Supporting note" /><Metric label="Learners" value={46} /><div className="metric"><ProgressRing value={71} label="Ring" /></div><div className="metric"><ProgressBar value={42} label="Progress bar" /></div></div>
        <DataTable caption="Example table — becomes labelled records under 768px" rows={db.users.slice(0, 4)} rowKey={(u) => u.id} columns={[{ key: 'n', header: 'Name', primary: true, render: (u) => <span className="row"><Avatar initials={u.initials} size="sm" />{u.name}</span> }, { key: 'e', header: 'Email', render: (u) => u.email }, { key: 'r', header: 'Role', render: (u) => u.role }]} actions={() => <Button size="sm" variant="secondary">Open</Button>} />
        <div className="grid-2"><Card title="Card with header" actions={<Button size="sm" variant="tertiary">Action</Button>}><KeyValue items={[['Key', 'Value'], ['Another key', 'Another value']]} /></Card><div><Accordion title="Accordion" meta="Collapsed by default"><p>Panel content.</p></Accordion><Accordion title="Open accordion" defaultOpen><p>Expanded content.</p></Accordion></div></div>
      </Section>
      <Section id="learning" title="Learning patterns">
        <div className="course-grid"><CourseCard course={c} instructorName={userById(db, c.instructorId)!.name} /><CourseCard course={courseById(db, 'DT-100')!} instructorName="Zainab Musa" enrolled /></div>
        <EnrolledCourseCard course={c} enrolment={e} progress={lessonProgress(db, e.userId, c.id)} nextLessonTitle="6.1 Clickable prototypes" nextLessonId="L18" />
        <ul className="lesson-list card card-flush"><LessonItem title="Completed lesson" type="video" minutes={12} done to="#" /><LessonItem title="Current lesson" type="video" minutes={12} current to="#" /><LessonItem title="Not started reading" type="reading" minutes={8} to="#" /><LessonItem title="Locked lesson" type="video" minutes={10} locked /></ul>
        <div className="grid-2"><Card title="Eligibility checklist"><EligibilityChecklist items={eligibility(db, 'u-amaka', 'UXF-101').items} /></Card><Card title="Rubric"><RubricView rubric={db.assessments.find((a) => a.id === 'uxf-a1')!.rubric!} scores={{ r1: 22, r2: 17, r3: 21, r4: 10 }} /></Card></div>
        <CertificateDoc cert={cert} course={courseById(db, cert.courseId)!} instructor={userById(db, 'u-zainab')} />
        <Post author={userById(db, 'u-tunde')} at="Yesterday" instructor highlight>Instructor reply styling.</Post>
      </Section>
      <Section id="payments" title="Payments">
        <div className="grid-2"><OrderSummary course={c} discount={17000} /><Receipt txn={txn} course={courseById(db, txn.courseId)!} user={userById(db, txn.userId)} /></div>
        <div className="row"><TxnBadge status="successful" /><TxnBadge status="pending" /><TxnBadge status="failed" /><TxnBadge status="refunded" /></div>
        <Card title="Status timeline"><StatusTimeline steps={[{ label: 'Done step', state: 'done' }, { label: 'Current step', state: 'current' }, { label: 'Failed step', state: 'failed' }, { label: 'Future step', state: 'todo' }]} /></Card>
      </Section>
      <Section id="support" title="Support">
        <div className="row"><TicketBadge status="open" /><TicketBadge status="awaiting_learner" /><TicketBadge status="resolved" /></div>
        <Conversation db={db} ticket={ticket} viewerId="u-musa" staffView onSend={() => toast('Showcase only — not sent', 'info')} />
      </Section>
    </div>
  );
}
