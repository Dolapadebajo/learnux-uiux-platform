import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LuCreditCard, LuLandmark, LuSmartphone, LuCopy, LuCircleCheck, LuClock, LuCircleX, LuLock, LuCircleHelp } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { courseById, enrolmentFor, pendingTxnFor, promoFor, allLessons } from '../../data/selectors';
import { api } from '../../data/services';
import { OrderSummary, Receipt, StatusTimeline } from '../../components/payments/patterns';
import { PageHeader } from '../../components/layout/layouts';
import { Steps, Breadcrumbs } from '../../components/ui/navigation';
import { Alert, useToast } from '../../components/ui/feedback';
import { Button } from '../../components/ui/Button';
import { ErrorSummary, Radio, Select, TextField, Checkbox } from '../../components/ui/form';
import { KeyValue } from '../../components/ui/data';
import { formatDate, formatDateTime, formatNGN, methodLabel } from '../../utils/format';
import type { PaymentMethod } from '../../types';
import { NotFound } from './System';
import { addYears, todayISO } from '../../utils/date';

function CopyRow({ label, value }: { label: string; value: string }) {
  const toast = useToast();
  return <div className="copy-row"><span><span className="small secondary" style={{ display: 'block' }}>{label}</span><span className="strong mono">{value}</span></span><Button variant="secondary" size="sm" icon={<LuCopy aria-hidden="true" />} onClick={() => { navigator.clipboard?.writeText(value.replace(/\s/g, '')).then(() => toast(`${label} copied`), () => toast('Copy isn’t available here — select the text instead.', 'info')); }} aria-label={`Copy ${label}`}>Copy</Button></div>;
}

export function Checkout() {
  const { courseId } = useParams(); const { db, user } = useSession(); const navigate = useNavigate(); const toast = useToast();
  const c = courseById(db, courseId); useTitle(c ? `Checkout · ${c.title}` : 'Checkout');
  const methods = (['card', 'bank_transfer', 'ussd'] as PaymentMethod[]).filter((m) => db.settings.methods[m]);
  const [method, setMethod] = useState<PaymentMethod>(methods[0] || 'card');
  const [card, setCard] = useState({ name: user?.name || '', number: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState<[string, string][]>([]); const [scenario, setScenario] = useState('auto');
  const [bank, setBank] = useState('Example Bank (fictional)'); const [agree, setAgree] = useState(true); const [busy, setBusy] = useState(false);
  if (!c || c.status !== 'published') return <NotFound />;
  if (!user) return <Navigate to={`/signup?course=${c.id}`} replace />;
  const enr = enrolmentFor(db, user.id, c.id); const pending = pendingTxnFor(db, user.id, c.id); const promo = promoFor(db, user.id, c);
  const discount = promo.eligible ? promo.discount : 0; const total = c.price - discount;
  const steps = <Steps steps={['Account', 'Review order', 'Pay', 'Start learning']} current={c.price === 0 ? 1 : 2} />;
  const header = <PageHeader crumbs={<Breadcrumbs items={[['Courses', '/courses'], [c.title, `/courses/${c.id}`], ['Checkout']]} />} title={c.price === 0 ? 'Confirm your free enrolment' : 'Checkout'} />;

  if (user.role !== 'learner') return <div className="site-main">{header}<Alert tone="info" title="Checkout is for learner accounts">You’re signed in as {user.role === 'admin' ? 'an administrator' : 'an instructor'}. Switch to a learner persona in the Demo bar to try checkout.</Alert></div>;
  if (enr?.status === 'active') return <div className="site-main">{header}<Alert tone="success" title="You’re already enrolled" actions={<Button to={`/learn/courses/${c.id}`}>Go to course</Button>}>Access until {formatDate(enr.accessUntil)}.</Alert></div>;
  if (pending) return (
    <div className="site-main" style={{ maxWidth: 760 }}>{header}
      <Alert tone="warning" title="You already have a payment in progress for this course" actions={<><Button to={`/checkout/${c.id}/status/${pending.id}`}>Check payment status</Button><Button variant="secondary" to={`/learn/support/new?ref=${pending.id}`}>Contact support</Button></>}>
        {methodLabel(pending.method)} {pending.id} for {formatNGN(pending.amount)} is waiting for confirmation (started {formatDateTime(pending.createdAt)}). To protect you from being charged twice, we don’t allow a new payment until this one is resolved.
      </Alert>
    </div>);

  if (c.price === 0) return (
    <div className="site-main"><div className="checkout">
      <div className="stack">{header}{steps}
        <section className="card stack"><h2 style={{ fontSize: 'var(--text-lg)' }}>What you get</h2><KeyValue items={[['Format', `Self-paced lessons · ${c.liveSchedule}`], ['Workload', `${c.hoursPerWeek} a week for ${c.weeks} weeks`], ['Access', `One year from today (until ${formatDate(addYears(todayISO(), 1))})`], ['Certificate', 'Certificate of completion when requirements are met']]} />
          <Alert tone="info" title="Free courses unlock as soon as you confirm">No payment details needed.</Alert>
          <div className="row"><Button onClick={() => { api.enrolFree(user.id, c.id); toast(`You’re enrolled in ${c.title}`); navigate(`/learn/courses/${c.id}`); }}>Confirm enrolment</Button><Button variant="secondary" to={`/courses/${c.id}`}>Back to course</Button></div>
        </section>
      </div>
      <OrderSummary course={c} discount={0} />
    </div></div>);

  const validate = () => {
    const e: [string, string][] = [];
    if (method === 'card') {
      if (!card.name.trim()) e.push(['card-name', 'Enter the name on the card']);
      if (card.number.replace(/\s/g, '').length < 12 || /\D/.test(card.number.replace(/\s/g, ''))) e.push(['card-number', 'Enter a card number using digits only']);
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.push(['card-expiry', 'Enter the expiry date as MM/YY']);
      if (!/^\d{3,4}$/.test(card.cvc)) e.push(['card-cvc', 'Enter the 3 or 4-digit security code']);
    }
    if (!agree) e.push(['agree', 'Confirm you understand the access period and refund process']);
    setErrors(e); return !e.length;
  };
  const pay = () => {
    if (!validate()) return;
    const outcome = method === 'card' ? (scenario === 'failed' || card.number.replace(/\s/g, '').endsWith('0002') ? 'failed' : 'success') : method === 'bank_transfer' ? (scenario === 'success' ? 'success' : 'pending') : (scenario === 'pending' ? 'pending' : 'success');
    setBusy(true);
    setTimeout(() => { const t = api.pay(user.id, c.id, method, outcome as 'success', method === 'card' ? card.number.replace(/\s/g, '').slice(-4) : undefined); navigate(`/checkout/${c.id}/status/${t.id}`); }, 600);
  };
  const err = (id: string) => errors.find((x) => x[0] === id)?.[1];
  return (
    <div className="site-main"><div className="checkout">
      <div className="stack">
        {header}{steps}
        <ErrorSummary errors={errors} />
        <fieldset className="stack-sm"><legend style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--lh-lg)' }}>Payment method</legend>
          {methods.includes('card') && <Radio card name="method" checked={method === 'card'} onChange={() => setMethod('card')} label={<span className="row" style={{ gap: 8 }}><LuCreditCard aria-hidden="true" />Debit or credit card</span>} hint="Instant confirmation. Verve, Visa or Mastercard." />}
          {methods.includes('bank_transfer') && <Radio card name="method" checked={method === 'bank_transfer'} onChange={() => setMethod('bank_transfer')} label={<span className="row" style={{ gap: 8 }}><LuLandmark aria-hidden="true" />Bank transfer</span>} hint={`Transfer to a dedicated account. Confirmation can take up to ${db.settings.bankTransferHours} hours.`} />}
          {methods.includes('ussd') && <Radio card name="method" checked={method === 'ussd'} onChange={() => setMethod('ussd')} label={<span className="row" style={{ gap: 8 }}><LuSmartphone aria-hidden="true" />USSD</span>} hint="Dial a code from your phone. No internet needed." />}
          {methods.length < 3 && <p className="small muted">Some payment methods are temporarily turned off by the platform.</p>}
        </fieldset>
        <section className="card stack" aria-label={`${methodLabel(method)} details`}>
          {method === 'card' && <div className="form-grid">
            <TextField className="span-2" id="card-name" label="Name on card" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} error={err('card-name')} />
            <TextField className="span-2" id="card-number" label="Card number" inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} error={err('card-number')} hint="Demo only — use 4111 1111 1111 1111. A number ending 0002 is declined. Never enter a real card." />
            <TextField id="card-expiry" label="Expiry (MM/YY)" inputMode="numeric" autoComplete="off" placeholder="08/28" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} error={err('card-expiry')} />
            <TextField id="card-cvc" label="Security code" inputMode="numeric" autoComplete="off" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} error={err('card-cvc')} hint="3 digits on the back" />
          </div>}
          {method === 'bank_transfer' && <div className="stack-sm">
            <p>After you confirm, we’ll show the account details again on your payment page. Use the exact amount and reference.</p>
            <div className="transfer-box"><CopyRow label="Bank" value="Example Bank (fictional)" /><CopyRow label="Account number" value="0123 456 789" /><CopyRow label="Amount" value={formatNGN(total)} /><CopyRow label="Reference" value="LUX-YOUR-ORDER-REF" /></div>
            <p className="small secondary">Pay within {db.settings.bankTransferHours} hours. We unlock the course as soon as your bank confirms.</p>
          </div>}
          {method === 'ussd' && <div className="stack-sm">
            <Select label="Your bank" value={bank} onChange={(e) => setBank(e.target.value)} options={['Example Bank (fictional)', 'Sample Microfinance (fictional)', 'Demo Trust Bank (fictional)']} />
            <ol className="stack-sm"><li>Dial <strong className="mono">*000*123*{total}#</strong> <span className="small muted">(fictional code)</span></li><li>Enter the payment code we show next</li><li>Approve with your bank PIN</li></ol>
            <p className="small secondary">Codes expire after {db.settings.ussdMinutes} minutes. If it times out before you approve, no money is taken.</p>
          </div>}
          <fieldset className="card card-subtle stack-sm" style={{ padding: 'var(--space-4)' }}>
            <legend className="row" style={{ gap: 6 }}><span className="badge badge-warning">Demo</span> Simulated outcome</legend>
            <Select hideLabel label="Simulated outcome" value={scenario} onChange={(e) => setScenario(e.target.value)} options={method === 'card' ? [{ value: 'auto', label: 'Approved (or declined if the number ends 0002)' }, { value: 'failed', label: 'Declined by bank' }] : method === 'bank_transfer' ? [{ value: 'auto', label: 'Awaiting bank confirmation (pending)' }, { value: 'success', label: 'Confirmed immediately' }] : [{ value: 'auto', label: 'Approved on phone' }, { value: 'pending', label: 'Awaiting provider confirmation (pending)' }]} />
            <p className="xs muted">No real payment is made. Nothing you type here is stored.</p>
          </fieldset>
        </section>
        <Checkbox id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} label={<>I understand access lasts one year from when the course unlocks and how <Link to="/help/refunds">refunds</Link> work.</>} />
        <div className="stack-sm"><Button block onClick={pay} loading={busy} icon={<LuLock aria-hidden="true" />}>{method === 'card' ? `Pay ${formatNGN(total)}` : method === 'bank_transfer' ? 'I’ll pay by bank transfer' : `Pay ${formatNGN(total)} with USSD`}</Button><p className="xs muted center">Simulated payment — you will not be charged.</p></div>
      </div>
      <OrderSummary course={c} discount={discount} promoNote={promo.eligible ? <Alert tone="success" title="First-course offer applied">{promo.reason} Once per account; can’t be combined.</Alert> : c.price > 0 && db.settings.promoEnabled ? <p className="muted">{promo.reason}</p> : null} />
    </div></div>
  );
}

export function PaymentStatus() {
  const { courseId, txnId } = useParams(); const { db, user } = useSession(); const navigate = useNavigate();
  const demo = useDemoState(['interrupted'] as const); const [checked, setChecked] = useState(0);
  const c = courseById(db, courseId); const t = db.transactions.find((x) => x.id === txnId);
  useTitle(t ? (t.status === 'successful' ? 'Payment successful' : t.status === 'pending' ? 'Payment pending' : 'Payment didn’t go through') : 'Payment');
  if (!c || !t || !user || t.userId !== user.id) return <NotFound />;
  const first = allLessons(c)[0];
  if (demo === 'interrupted' && checked === 0) return (
    <div className="site-main" style={{ maxWidth: 760 }}>
      <div className="card status-hero stack"><div><span className="status-icon warning"><LuCircleHelp aria-hidden="true" /></span></div><h1>We’re not sure your payment finished</h1><p className="lead">The connection dropped before we received a result. Your bank may still have processed it, so <strong>please don’t pay again yet</strong>.</p></div>
      <div className="stack" style={{ marginTop: 24 }}><KeyValue items={[['Reference', <span className="mono">{t.id}</span>], ['Amount', formatNGN(t.amount)], ['Status', 'Checking with the provider']]} />
        <div className="row"><Button onClick={() => setChecked(1)}>Check payment result</Button><Button variant="secondary" to={`/learn/support/new?ref=${t.id}`}>Contact support</Button></div>
        <p className="small muted">There is deliberately no “Pay again” button while the outcome is unknown.</p></div>
    </div>);
  if (t.status === 'successful') return (
    <div className="site-main"><div className="with-aside">
      <div className="stack">
        <Steps steps={['Account', 'Review order', 'Pay', 'Start learning']} current={3} />
        <div className="card status-hero stack"><div><span className="status-icon success"><LuCircleCheck aria-hidden="true" /></span></div><h1>Payment successful — you’re enrolled</h1><p className="lead">{c.title} is unlocked. Your access runs until {formatDate(db.enrolments.find((e) => e.userId === user.id && e.courseId === c.id)?.accessUntil)}.</p>
          <div className="row" style={{ justifyContent: 'center' }}><Button to={`/learn/courses/${c.id}/lessons/${first.id}`}>Start lesson 1: {first.title.replace(/^\d+\.\d+ /, '')}</Button><Button variant="secondary" to="/learn">Go to my dashboard</Button></div></div>
        <Alert tone="info" title="Your first live session">{c.liveSchedule}. Recordings follow within 48 hours.</Alert>
      </div>
      <aside className="stack"><Receipt txn={t} course={c} user={user} /><Button variant="secondary" onClick={() => window.print()}>Print receipt</Button><p className="xs muted">A receipt email would be sent here (simulated — no email is sent).</p></aside>
    </div></div>);
  if (t.status === 'pending') return (
    <div className="site-main"><div className="with-aside">
      <div className="stack">
        <div className="card status-hero stack"><div><span className="status-icon warning"><LuClock aria-hidden="true" /></span></div><h1>Payment pending</h1><p className="lead">We’re waiting for {t.method === 'bank_transfer' ? 'your bank' : 'the payment provider'} to confirm {formatNGN(t.amount)}. <strong>Please don’t pay again</strong> — if it doesn’t arrive, nothing else is charged.</p></div>
        {t.method === 'bank_transfer' && <section className="card stack-sm" aria-label="Transfer details"><h2 style={{ fontSize: 'var(--text-lg)' }}>Transfer details</h2><div className="transfer-box"><CopyRow label="Account number" value="0123 456 789" /><CopyRow label="Amount" value={formatNGN(t.amount)} /><CopyRow label="Reference" value={`LUX-${t.id.slice(4)}`} /></div></section>}
        <section className="card"><StatusTimeline steps={[{ label: 'Payment started', detail: formatDateTime(t.createdAt), state: 'done' }, { label: 'Waiting for confirmation', detail: `Usually within ${db.settings.bankTransferHours} hours`, state: 'current' }, { label: 'Course unlocks', detail: 'Your year of access starts then', state: 'todo' }]} /></section>
      </div>
      <aside className="card stack-sm"><h2 style={{ fontSize: 'var(--text-lg)' }}>What can I do?</h2>
        <Button variant="secondary" block onClick={() => setChecked((n) => n + 1)}>Check status again</Button>
        {checked > 0 && <p className="small" role="status">Checked just now — still waiting for confirmation.</p>}
        <Button variant="secondary" block to={`/learn/support/new?ref=${t.id}`}>Contact support about this payment</Button>
        <Button variant="tertiary" block to={`/learn/payments/${t.id}`}>View transaction</Button>
        <p className="xs muted">Staff can confirm this payment in Admin → Transactions (simulated).</p></aside>
    </div></div>);
  // failed (or interrupted → checked → declined)
  return (
    <div className="site-main" style={{ maxWidth: 760 }}>
      <div className="card status-hero stack"><div><span className="status-icon error"><LuCircleX aria-hidden="true" /></span></div><h1>Your payment didn’t go through</h1><p className="lead">{t.failureReason || 'The bank declined the payment.'} Your order is saved.</p></div>
      <div className="stack" style={{ marginTop: 24 }}>
        <Alert tone="info" title="No money was taken">You can safely try again with another card or a different payment method.</Alert>
        <div className="row"><Button onClick={() => navigate(`/checkout/${c.id}`)}>Try again</Button><Button variant="secondary" to="/help/bank-transfer-pending">Payment help</Button><Button variant="tertiary" to={`/courses/${c.id}`}>Back to course</Button></div>
      </div>
    </div>);
}
