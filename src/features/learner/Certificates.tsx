import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuAward, LuCopy, LuPrinter, LuShieldCheck } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { certificateFor, courseById, eligibility, userById } from '../../data/selectors';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { CourseTabs } from './Courses';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { Card, ProgressBar } from '../../components/ui/data';
import { TextField } from '../../components/ui/form';
import { Dialog } from '../../components/ui/overlay';
import { CertificateDoc, EligibilityChecklist } from '../../components/learning/patterns';
import { formatDate } from '../../utils/format';
import { NotFound } from '../public/System';

export function MyCertificates() {
  const { db, user } = useSession(); const u = user!; useTitle('My certificates');
  const courses = db.enrolments.filter((e) => e.userId === u.id && e.status !== 'pending_payment').map((e) => e.courseId);
  const certs = db.certificates.filter((c) => c.userId === u.id);
  const inProgress = courses.filter((cid) => !certs.some((c) => c.courseId === cid));
  return (
    <>
      <PageHeader title="My certificates" lead="Certificates confirm course completion. Anyone can verify them with the reference." />
      {certs.length ? <div className="grid-2">{certs.map((cert) => { const c = courseById(db, cert.courseId)!; return (
        <article key={cert.id} className="card stack-sm">
          <div className="row-between"><LuAward aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-accent)' }} />{cert.status === 'valid' ? <StatusBadge tone="success">Valid</StatusBadge> : <StatusBadge tone="error">Revoked</StatusBadge>}</div>
          <h2 style={{ fontSize: 'var(--text-lg)' }}><Link to={`/learn/certificates/${c.id}`}>{c.title}</Link></h2>
          <p className="small secondary">Issued {formatDate(cert.issuedAt)} · <span className="mono">{cert.id}</span></p>
        </article>
      ); })}</div> : <EmptyState icon={<LuAward />} title="No certificates yet">Complete every required lesson and score at least 50% on each graded activity to earn one.</EmptyState>}
      {inProgress.length > 0 && <section className="stack" style={{ marginTop: 'var(--space-8)' }}><h2>In progress</h2><div className="grid-2">{inProgress.map((cid) => { const el = eligibility(db, u.id, cid); const met = el.items.filter((i) => i.met).length; return (
        <article key={cid} className="card card-sm stack-sm"><h3 style={{ fontSize: 'var(--text-md)' }}><Link to={`/learn/certificates/${cid}`}>{el.course.title}</Link></h3><ProgressBar value={(met / el.items.length) * 100} label="Requirements met" detail={`${met} of ${el.items.length}`} /></article>
      ); })}</div></section>}
    </>
  );
}

export function CertificateDetails() {
  const { courseId } = useParams(); const { db, user } = useSession(); const u = user!; const toast = useToast();
  const c = courseById(db, courseId); useTitle(c ? `Certificate · ${c.title}` : 'Certificate');
  const [fix, setFix] = useState(false); const [name, setName] = useState(''); const [err, setErr] = useState('');
  if (!c) return <NotFound />;
  const cert = certificateFor(db, u.id, c.id); const el = eligibility(db, u.id, c.id);
  const crumbs = <Breadcrumbs items={[['My certificates', '/learn/certificates'], [c.title]]} />;
  const link = `${location.origin}${location.pathname}#/verify/${cert?.id}`;
  return (
    <>
      <PageHeader crumbs={crumbs} title={cert ? 'Your certificate' : 'Certificate eligibility'} lead={c.title} />
      {db.enrolments.some((e) => e.userId === u.id && e.courseId === c.id) && <CourseTabs courseId={c.id} />}
      {cert ? (
        <div className="with-aside">
          <div className="stack">
            {cert.status === 'revoked' && <Alert tone="error" title="This certificate has been revoked">Reason: {cert.revokedReason}. Public verification shows it as revoked. <Link to="/learn/support/new">Contact support</Link> if you think this is a mistake.</Alert>}
            <CertificateDoc cert={cert} course={c} instructor={userById(db, c.instructorId)} />
          </div>
          <aside className="stack">
            <Card title="Share or download" headingLevel={2}><div className="stack-sm">
              <Button variant="secondary" block icon={<LuPrinter aria-hidden="true" />} onClick={() => window.print()}>Print or save as PDF</Button>
              <Button variant="secondary" block icon={<LuCopy aria-hidden="true" />} onClick={() => navigator.clipboard?.writeText(link).then(() => toast('Verification link copied'), () => toast('Copy isn’t available here. The reference is ' + cert.id, 'info'))}>Copy verification link</Button>
              <Button variant="tertiary" block icon={<LuShieldCheck aria-hidden="true" />} to={`/verify/${cert.id}`}>See what employers see</Button>
            </div></Card>
            <Card title="Something wrong?" headingLevel={2}><p className="small secondary">If your name is misspelt or incomplete, request a correction. An administrator reissues the certificate with the same reference.</p><div style={{ marginTop: 12 }}><Button size="sm" variant="secondary" onClick={() => { setName(cert.nameOnCertificate); setFix(true); }}>Request a name correction</Button></div></Card>
          </aside>
        </div>
      ) : (
        <div className="with-aside">
          <Card title={el.eligible ? 'All requirements met' : `${el.remaining} requirement${el.remaining === 1 ? '' : 's'} left`}>
            {el.items.some((i) => i.pending) && !el.eligible && <Alert tone="info" title="Waiting on grading" className="mt-0">Your eligibility updates automatically when your instructor publishes a grade — even after your access ends.</Alert>}
            <EligibilityChecklist items={el.items} />
          </Card>
          <aside><Card title="About certificates" headingLevel={2}><p className="small secondary">Certificates appear here automatically once every requirement is met. They confirm completion of a LearnUX course and are not a professional accreditation.</p></Card></aside>
        </div>
      )}
      <Dialog open={fix} onClose={() => setFix(false)} title="Request a name correction" footer={<><Button variant="secondary" onClick={() => setFix(false)}>Cancel</Button><Button onClick={() => { if (name.trim().length < 3) { setErr('Enter your full name as it should appear'); return; } const id = api.requestNameCorrection(u.id, cert!.id, name.trim()); setFix(false); toast(`Request ${id} sent to support`); }}>Send request</Button></>}>
        <div className="stack"><TextField label="Name as it should appear" value={name} onChange={(e) => setName(e.target.value)} error={err} autoComplete="name" /><p className="small secondary">Your current certificate stays valid while we review this.</p></div>
      </Dialog>
    </>
  );
}
