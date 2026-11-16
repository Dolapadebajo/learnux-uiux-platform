import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuMailCheck, LuMail, LuCircleAlert } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { api } from '../../data/services';
import { courseById } from '../../data/selectors';
import { Button } from '../../components/ui/Button';
import { Checkbox, ErrorSummary, PasswordField, TextField } from '../../components/ui/form';
import { Alert, useToast } from '../../components/ui/feedback';
import { Steps } from '../../components/ui/navigation';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
function CourseContext({ courseId }: { courseId?: string | null }) {
  const { db } = useSession(); const c = courseById(db, courseId || undefined);
  if (!c) return null;
  return <div className="card card-primary card-sm small"><strong>Continuing enrolment:</strong> {c.title}<br /><span className="secondary">We’ll keep this course selected while you set up your account.</span></div>;
}

export function Signup() {
  useTitle('Create account'); const [sp] = useSearchParams(); const navigate = useNavigate(); const courseId = sp.get('course');
  const [f, setF] = useState({ name: '', email: '', password: '', terms: false }); const [errors, setErrors] = useState<[string, string][]>([]); const [exists, setExists] = useState(false);
  const submit = () => {
    const e: [string, string][] = [];
    if (!f.name.trim()) e.push(['su-name', 'Enter your full name']);
    if (!emailOk(f.email)) e.push(['su-email', 'Enter an email address like name@example.com']);
    if (f.password.length < 8) e.push(['su-password', 'Use at least 8 characters for your password']);
    if (!f.terms) e.push(['su-terms', 'Agree to the terms to create an account']);
    setErrors(e); setExists(false); if (e.length) return;
    const r = api.startSignup(f.name, f.email, courseId || undefined);
    if (!r.ok) { setExists(true); return; }
    navigate('/verify-email');
  };
  const err = (id: string) => errors.find((x) => x[0] === id)?.[1];
  return (
    <div className="stack">
      {courseId && <Steps steps={['Account', 'Review order', 'Pay', 'Start learning']} current={0} />}
      <div><h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Create your account</h1><p className="secondary">Already have one? <Link to={`/login${courseId ? `?course=${courseId}` : ''}`}>Log in</Link></p></div>
      <CourseContext courseId={courseId} />
      <ErrorSummary errors={errors} />
      {exists && <Alert tone="warning" title="An account already uses this email" live actions={<><Button size="sm" to={`/login${courseId ? `?course=${courseId}` : ''}`}>Log in instead</Button><Button size="sm" variant="secondary" to="/forgot-password">Reset password</Button></>}>Your course selection will be kept.</Alert>}
      <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <TextField id="su-name" label="Full name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={err('su-name')} hint="As you’d like it on your certificate." />
        <TextField id="su-email" label="Email address" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={err('su-email')} hint="Demo: any fictional address, e.g. ifeoma.n@example.com" />
        <PasswordField id="su-password" label="Password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={err('su-password')} hint="At least 8 characters. Prototype: the password is checked for length and then discarded — never stored." />
        <div className="field">{err('su-terms') && <span className="field-error" id="su-terms-error"><LuCircleAlert aria-hidden="true" />{err('su-terms')}</span>}<Checkbox id="su-terms" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} aria-describedby={err('su-terms') ? 'su-terms-error' : undefined} label={<>I agree to the <Link to="/help/refunds">terms</Link> and privacy notice</>} /></div>
        <Button type="submit" block>Create account</Button>
      </form>
    </div>
  );
}

export function VerifyEmail() {
  useTitle('Verify your email'); const { db } = useSession(); const navigate = useNavigate(); const toast = useToast();
  const demo = useDemoState(['resent', 'expired'] as const); const [state, setState] = useState<'inbox' | 'resent' | 'expired'>(demo || 'inbox'); const [cool, setCool] = useState(false);
  const p = db.session.pendingSignup;
  const email = p?.email || 'ifeoma.n@example.com';
  const open = () => { const r = api.verifyEmail(); if (!r) { toast('Start by creating an account.', 'info'); navigate('/signup'); return; } toast('Email verified — welcome to LearnUX'); navigate(r.courseId ? `/checkout/${r.courseId}` : '/learn'); };
  const resend = () => { setState('resent'); setCool(true); setTimeout(() => setCool(false), 30000); };
  return (
    <div className="stack">
      {p?.courseId && <Steps steps={['Account', 'Review order', 'Pay', 'Start learning']} current={0} />}
      {state === 'expired' ? <>
        <Alert tone="error" title="This verification link has expired">Links last 24 hours. Your details and course selection are saved — request a new link.</Alert>
        <h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Get a new link</h1>
        <TextField label="Email address" type="email" defaultValue={email} autoComplete="email" />
        <Button block onClick={resend}>Send a new link</Button>
      </> : <>
        <span className="status-icon success" style={{ display: 'inline-flex' }}>{state === 'resent' ? <LuMailCheck aria-hidden="true" /> : <LuMail aria-hidden="true" />}</span>
        <h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Check your email</h1>
        <p className="secondary">We sent a verification link to <strong>{email}</strong>. It expires in 24 hours.</p>
        {state === 'resent' && <Alert tone="success" title="New link sent" live>Older links no longer work.</Alert>}
        <CourseContext courseId={p?.courseId} />
        <div className="card card-subtle stack-sm"><p className="small"><span className="badge badge-warning">Demo</span> No email is sent. Use these to continue:</p><div className="row"><Button onClick={open}>Open verification link</Button><Button variant="secondary" onClick={() => setState('expired')}>Open an expired link</Button></div></div>
        <p className="small">Didn’t get it? Check spam, or <button type="button" className="link-btn" onClick={resend} disabled={cool} aria-disabled={cool}>resend the link</button>{cool && <span className="muted"> (you can resend again in 30 seconds)</span>}. <Link to="/signup">Use a different email</Link></p>
      </>}
    </div>
  );
}

export function Login() {
  useTitle('Log in'); const [sp] = useSearchParams(); const navigate = useNavigate(); const toast = useToast(); const courseId = sp.get('course');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [errors, setErrors] = useState<[string, string][]>([]); const [failed, setFailed] = useState(false);
  const submit = () => {
    const e: [string, string][] = [];
    if (!emailOk(email)) e.push(['li-email', 'Enter your email address']);
    if (!pw) e.push(['li-pw', 'Enter your password']);
    setErrors(e); setFailed(false); if (e.length) return;
    const r = api.login(email);
    if (!r.ok) { setFailed(true); setPw(''); return; }
    toast(`Welcome back, ${r.user.name.split(' ')[0]}`);
    navigate(courseId ? `/checkout/${courseId}` : { learner: '/learn', instructor: '/teach', admin: '/admin' }[r.user.role]);
  };
  return (
    <div className="stack">
      <div><h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Log in</h1><p className="secondary">New to LearnUX? <Link to={`/signup${courseId ? `?course=${courseId}` : ''}`}>Create an account</Link></p></div>
      <CourseContext courseId={courseId} />
      <ErrorSummary errors={errors} />
      {failed && <Alert tone="error" title="Email or password is incorrect" live>Check both and try again, or reset your password.</Alert>}
      <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <TextField id="li-email" label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.find((x) => x[0] === 'li-email')?.[1]} />
        <PasswordField id="li-pw" label="Password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} error={errors.find((x) => x[0] === 'li-pw')?.[1]} />
        <div className="row-between"><Link to="/forgot-password">Forgot your password?</Link></div>
        <Button type="submit" block>Log in</Button>
      </form>
      <div className="card card-subtle small stack-sm"><p><span className="badge badge-warning">Demo</span> Any password works for these fictional accounts:</p><ul className="stack-sm" style={{ paddingLeft: 18 }}>{['amaka.obi@example.com', 'bola.a@example.com', 'tunde.b@example.com', 'grace.e@example.com'].map((x) => <li key={x}><button type="button" className="link-btn" onClick={() => { setEmail(x); setPw('demo-password'); }}>{x}</button></li>)}</ul></div>
    </div>
  );
}

export function ForgotPassword() {
  useTitle('Forgot password'); const [email, setEmail] = useState(''); const [err, setErr] = useState(''); const [sent, setSent] = useState(false);
  if (sent) return (
    <div className="stack"><span className="status-icon success" style={{ display: 'inline-flex' }}><LuMailCheck aria-hidden="true" /></span><h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Check your email</h1>
      <p className="secondary" role="status">If an account exists for <strong>{email}</strong>, we’ve sent a link to reset your password. It expires in 1 hour.</p>
      <div className="card card-subtle stack-sm"><p className="small"><span className="badge badge-warning">Demo</span> No email is sent.</p><div className="row"><Button to="/reset-password">Open reset link</Button><Button variant="secondary" to="/reset-password?demo=expired">Open an expired link</Button></div></div>
      <Link to="/login">Back to log in</Link></div>);
  return (
    <div className="stack">
      <h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Reset your password</h1>
      <p className="secondary">Enter the email you signed up with and we’ll send a reset link. Any course you were enrolling in stays selected.</p>
      <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); if (!emailOk(email)) { setErr('Enter an email address like name@example.com'); return; } setSent(true); }}>
        <TextField label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err} />
        <Button type="submit" block>Send reset link</Button>
      </form>
      <Link to="/login">Back to log in</Link>
    </div>
  );
}

export function ResetPassword() {
  useTitle('Choose a new password'); const demo = useDemoState(['expired'] as const); const navigate = useNavigate();
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [errors, setErrors] = useState<[string, string][]>([]); const [done, setDone] = useState(false);
  if (demo === 'expired') return <div className="stack"><h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Reset link expired</h1><Alert tone="error" title="This reset link has expired">Reset links last 1 hour. Request a new one — nothing else has changed.</Alert><Button to="/forgot-password">Request a new link</Button></div>;
  if (done) return <div className="stack"><Alert tone="success" title="Password updated" live>You can now log in with your new password. (Prototype: nothing was stored.)</Alert><Button onClick={() => navigate('/login')}>Continue to log in</Button></div>;
  return (
    <div className="stack">
      <h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--lh-3xl)' }}>Choose a new password</h1>
      <ErrorSummary errors={errors} />
      <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); const er: [string, string][] = []; if (a.length < 8) er.push(['rp-a', 'Use at least 8 characters']); else if (a !== b) er.push(['rp-b', 'The passwords don’t match']); setErrors(er); if (!er.length) setDone(true); }}>
        <PasswordField id="rp-a" label="New password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} hint="At least 8 characters" error={errors.find((x) => x[0] === 'rp-a')?.[1]} />
        <PasswordField id="rp-b" label="Confirm new password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} error={errors.find((x) => x[0] === 'rp-b')?.[1]} />
        <Button type="submit" block>Save new password</Button>
      </form>
    </div>
  );
}
