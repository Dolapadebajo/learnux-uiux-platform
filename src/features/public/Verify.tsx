import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuShieldCheck, LuShieldX, LuCircleHelp, LuCloudOff } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { courseById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { TextField } from '../../components/ui/form';
import { Button } from '../../components/ui/Button';
import { KeyValue } from '../../components/ui/data';
import { Spinner } from '../../components/ui/feedback';
import { formatDate } from '../../utils/format';

const FORMAT = /^CERT-[A-Z0-9]+-\d{2}-\d{4}$/;

/** Public verification. Shows only holder name, course, issue date and status — never email, grades or payments. */
export function VerifyCertificate() {
  const { ref } = useParams(); const navigate = useNavigate(); const { db } = useSession(); useTitle('Verify a certificate');
  const demo = useDemoState(['service'] as const);
  const [value, setValue] = useState(ref || ''); const [error, setError] = useState(''); const [checking, setChecking] = useState(!!ref);
  useEffect(() => { setValue(ref || ''); if (ref) { setChecking(true); const t = setTimeout(() => setChecking(false), 500); return () => clearTimeout(t); } }, [ref]);
  const submit = () => {
    const v = value.trim().toUpperCase();
    if (!v) { setError('Enter the certificate reference'); return; }
    if (!FORMAT.test(v)) { setError('References look like CERT-UXF-26-0871 (letters, then two digits, then four digits)'); return; }
    setError(''); navigate(`/verify/${v}`);
  };
  const cert = ref ? db.certificates.find((c) => c.id === ref.toUpperCase()) : undefined;
  const course = cert ? courseById(db, cert.courseId) : undefined;
  let result = null;
  if (ref && checking) result = <div className="card"><Spinner label="Checking the reference" /></div>;
  else if (ref && demo === 'service') result = (
    <div className="verify-result service stack-sm" role="status"><div className="row"><LuCloudOff aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-warning)' }} /><h2 style={{ fontSize: 'var(--text-xl)' }}>Verification is temporarily unavailable</h2></div><p>This is a problem on our side. It does <strong>not</strong> mean the certificate is invalid. Please try again in a few minutes.</p><div><Button variant="secondary" onClick={() => navigate(`/verify/${ref}`)}>Try again</Button></div></div>);
  else if (ref && !cert) result = (
    <div className="verify-result notfound stack-sm" role="status"><div className="row"><LuCircleHelp aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-error)' }} /><h2 style={{ fontSize: 'var(--text-xl)' }}>We couldn’t find {ref.toUpperCase()}</h2></div><p>Check for typos — the letter O and the number 0 are easy to confuse. If it was copied correctly, ask the holder to share the verification link from their certificate page.</p></div>);
  else if (cert && course) result = (
    <div className={`verify-result ${cert.status} stack`} role="status">
      <div className="row">{cert.status === 'valid' ? <LuShieldCheck aria-hidden="true" style={{ width: 32, height: 32, color: 'var(--color-success)' }} /> : <LuShieldX aria-hidden="true" style={{ width: 32, height: 32, color: 'var(--color-error)' }} />}<h2 style={{ fontSize: 'var(--text-xl)' }}>{cert.status === 'valid' ? 'Valid certificate' : 'This certificate has been revoked'}</h2></div>
      <KeyValue items={[['Reference', <span className="mono">{cert.id}</span>], ['Issued to', cert.nameOnCertificate], ['Course', course.title], ['Issued', formatDate(cert.issuedAt)], ['Status', cert.status === 'valid' ? 'Valid' : `Revoked on ${formatDate(cert.revokedAt)} — ${cert.revokedReason}`], ...(cert.version > 1 ? [['Note', `Reissued (version ${cert.version}) after a name correction`] as [string, string]] : [])]} />
      <p className="small secondary">A LearnUX certificate confirms completion of a course. It is not a professional accreditation.</p>
    </div>);
  return (
    <div className="site-main" style={{ maxWidth: 880 }}>
      <PageHeader title="Verify a LearnUX certificate" lead="For employers and reviewers. Enter the reference printed at the top of the certificate. No account needed." />
      <form className="card stack form" style={{ maxWidth: 'none' }} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <TextField label="Certificate reference" id="cert-ref" value={value} onChange={(e) => setValue(e.target.value)} error={error} hint="Example: CERT-DT-25-0342" autoComplete="off" spellCheck={false} style={{ textTransform: 'uppercase' }} />
        <div><Button type="submit">Verify certificate</Button></div>
      </form>
      <div style={{ marginTop: 'var(--space-6)' }} aria-live="polite">{result}</div>
      <p className="small muted" style={{ marginTop: 'var(--space-6)' }}>We show the holder’s name, course, issue date and status only.</p>
    </div>
  );
}
