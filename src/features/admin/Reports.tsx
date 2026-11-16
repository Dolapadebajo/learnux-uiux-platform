import { LuDownload } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { courseById, lessonProgress } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Card, Metric } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/feedback';
import { Bars } from '../instructor/Analytics';
import { formatNGN, methodLabel } from '../../utils/format';

export function PlatformReports() {
  const { db } = useSession(); useTitle('Reports'); const toast = useToast();
  const ok = db.transactions.filter((t) => t.status === 'successful');
  const revenue = ok.reduce((s, t) => s + t.amount, 0);
  const byCourse = db.courses.filter((c) => c.status === 'published').map((c) => [c.title, ok.filter((t) => t.courseId === c.id).reduce((s, t) => s + t.amount, 0)] as [string, number]).filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
  const methods = (['card', 'bank_transfer', 'ussd'] as const).map((m) => [methodLabel(m), db.transactions.filter((t) => t.method === m).length] as [string, number]);
  const completion = db.courses.filter((c) => c.status === 'published').map((c) => { const es = db.enrolments.filter((e) => e.courseId === c.id && e.status === 'active'); return [c.title, es.length ? Math.round(es.reduce((s, e) => s + lessonProgress(db, e.userId, c.id).pct, 0) / es.length) : 0] as [string, number]; }).filter((r) => r[1] > 0);
  const exportCsv = () => {
    const csv = ['reference,learner,course,method,amount_ngn,status,created', ...db.transactions.map((t) => [t.id, t.userId, courseById(db, t.courseId)!.title.replace(/,/g, ''), t.method, t.amount, t.status, t.createdAt].join(','))].join('\n');
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'learnux-transactions-demo.csv'; a.click(); toast('CSV prepared. If nothing downloaded, your browser or this preview blocked downloads.', 'info'); } catch { toast('Downloads aren’t available here.', 'error'); }
  };
  return (
    <>
      <PageHeader title="Platform reports" lead="Calculated live from the demo records. Figures are fictional." actions={<Button variant="secondary" icon={<LuDownload aria-hidden="true" />} onClick={exportCsv}>Export transactions (CSV)</Button>} />
      <div className="grid-4">
        <Metric label="Revenue (all time, demo)" value={formatNGN(revenue)} note={`${ok.length} successful payments`} />
        <Metric label="Refunded" value={formatNGN(db.transactions.filter((t) => t.status === 'refunded').reduce((s, t) => s + t.amount, 0), { free: false })} />
        <Metric label="Certificates issued" value={db.certificates.filter((c) => c.status === 'valid').length} note={`${db.certificates.filter((c) => c.status === 'revoked').length} revoked`} />
        <Metric label="Support tickets" value={db.tickets.length} note={`${db.tickets.filter((t) => t.status === 'resolved').length} resolved`} />
      </div>
      <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
        <Card title="Revenue by course"><Bars rows={byCourse.map(([l, v]) => [l, Math.round(v / 1000)])} suffix="k ₦" label="Revenue by course in thousands of naira" /></Card>
        <Card title="Payment methods used"><Bars rows={methods} suffix="" accent label="Transactions by method" /></Card>
        <Card title="Average lesson progress by course"><Bars rows={completion.map(([l, v]) => [l, v, 100])} accent label="Average lesson progress" /></Card>
        <Card title="Payment outcomes"><Bars rows={(['successful', 'pending', 'failed', 'refunded'] as const).map((s) => [s[0].toUpperCase() + s.slice(1), db.transactions.filter((t) => t.status === s).length])} suffix="" label="Transactions by outcome" /></Card>
      </div>
    </>
  );
}
