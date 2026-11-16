import type { ReactNode } from 'react';
import { LuCircleCheck, LuCircle, LuClock, LuCircleX } from 'react-icons/lu';
import type { Course, Refund, Transaction, TxnStatus, User } from '../../types';
import { formatDateTime, formatNGN, formatUSDEstimate, methodLabel } from '../../utils/format';
import { StatusBadge, type Tone } from '../ui/feedback';
import { KeyValue } from '../ui/data';
import { CourseCover } from '../learning/CourseCard';
import { cx } from '../../utils/cx';

export const txnTone: Record<TxnStatus, Tone> = { successful: 'success', pending: 'warning', failed: 'error', refunded: 'neutral' };
export const txnLabel: Record<TxnStatus, string> = { successful: 'Successful', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' };
export const TxnBadge = ({ status }: { status: TxnStatus }) => <StatusBadge tone={txnTone[status]}>{txnLabel[status]}</StatusBadge>;
export const refundLabel: Record<Refund['status'], string> = { submitted: 'Awaiting instructor review', approved: 'Approved · awaiting processing', declined: 'Declined', completed: 'Refund completed' };
export const refundTone: Record<Refund['status'], Tone> = { submitted: 'info', approved: 'warning', declined: 'error', completed: 'success' };

/** Order summary — shown before the final payment action on every screen size. */
export function OrderSummary({ course, discount, promoNote, children }: { course: Course; discount: number; promoNote?: ReactNode; children?: ReactNode }) {
  const total = course.price - discount;
  return (
    <section className="card order-summary" aria-labelledby="order-summary-h">
      <h2 id="order-summary-h" style={{ fontSize: 'var(--text-lg)' }}>Order summary</h2>
      <div className="row row-top" style={{ marginTop: 12, flexWrap: 'nowrap' }}><div style={{ width: 88, flex: 'none' }}><CourseCover cover={course.cover} height={56} /></div><div className="grow"><p className="strong">{course.title}</p><p className="small secondary">{course.level} · {course.weeks} weeks · starts {course.nextStart}</p></div></div>
      <dl className="summary-lines">
        <div><dt>Course fee</dt><dd>{formatNGN(course.price, { free: false })}</dd></div>
        {discount > 0 && <div><dt>First-course offer</dt><dd>− {formatNGN(discount, { free: false })}</dd></div>}
        <div className="total"><dt>Total to pay</dt><dd>{formatNGN(total)}</dd></div>
      </dl>
      {total > 0 && <p className="xs muted">{formatUSDEstimate(total)} — estimated dollar equivalent for reference only. You are charged in naira.</p>}
      {promoNote && <div className="small" style={{ marginTop: 12 }}>{promoNote}</div>}
      {children}
    </section>
  );
}

export function Receipt({ txn, course, user }: { txn: Transaction; course: Course; user?: User }) {
  return (
    <section className="receipt" aria-labelledby="receipt-h">
      <div className="row-between"><h2 id="receipt-h" style={{ fontSize: 'var(--text-lg)' }}>Receipt</h2><TxnBadge status={txn.status} /></div>
      <KeyValue items={[
        ['Receipt number', <span className="mono">{txn.receiptNo || '—'}</span>], ['Transaction', <span className="mono">{txn.id}</span>], ['Billed to', user?.name], ['Course', course.title],
        ['Course fee', formatNGN(txn.listPrice, { free: false })], ...(txn.discount ? [['First-course offer', '− ' + formatNGN(txn.discount, { free: false })] as [string, string]] : []),
        ['Total', <strong>{formatNGN(txn.amount, { free: false })}</strong>], ['Method', methodLabel(txn.method) + (txn.cardLast4 ? ` ending ${txn.cardLast4}` : '')], ['Date', formatDateTime(txn.createdAt)],
      ]} />
    </section>
  );
}

/** Timeline used for payments and refunds. Steps state completion in text, not colour only. */
export function StatusTimeline({ steps }: { steps: { label: string; detail?: ReactNode; state: 'done' | 'current' | 'todo' | 'failed' }[] }) {
  return (
    <ol className="timeline">
      {steps.map((s, i) => { const I = s.state === 'done' ? LuCircleCheck : s.state === 'current' ? LuClock : s.state === 'failed' ? LuCircleX : LuCircle; return (
        <li key={i} className={cx('tl-item', `tl-${s.state}`)} aria-current={s.state === 'current' ? 'step' : undefined}>
          <I aria-hidden="true" /><div><p className="strong">{s.label}<span className="sr-only"> — {s.state === 'done' ? 'complete' : s.state === 'current' ? 'in progress' : s.state === 'failed' ? 'did not happen' : 'not started'}</span></p>{s.detail && <p className="small secondary">{s.detail}</p>}</div>
        </li>
      ); })}
    </ol>
  );
}
export function refundSteps(r: Refund) {
  const decided = r.status !== 'submitted';
  return [
    { label: 'Request submitted', detail: r.history[0] && formatDateTime(r.history[0].at), state: 'done' as const },
    { label: r.status === 'declined' ? 'Declined' : 'Instructor decision', detail: decided ? r.decisionNote : 'Course-related requests are reviewed by the instructor', state: (r.status === 'declined' ? 'failed' : decided ? 'done' : 'current') as 'done' },
    { label: 'Administrator processes refund', detail: 'Money is returned to the original payment method', state: (r.status === 'completed' ? 'done' : r.status === 'approved' ? 'current' : 'todo') as 'done' },
    { label: 'Refund completed — course access ends', state: (r.status === 'completed' ? 'done' : 'todo') as 'done' },
  ];
}
