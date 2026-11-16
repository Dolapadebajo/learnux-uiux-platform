import { useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { PageHeader } from '../../components/layout/layouts';
import { Alert, useToast } from '../../components/ui/feedback';
import { Card } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { ErrorSummary, Switch, TextField, Textarea } from '../../components/ui/form';
import { ConfirmDialog } from '../../components/ui/overlay';
import type { PaymentMethod } from '../../types';

export function PlatformSettings() {
  const { db } = useSession(); useTitle('Platform settings'); const toast = useToast();
  const s = db.settings;
  const [f, setF] = useState({ promoEnabled: s.promoEnabled, promoPercent: String(s.promoPercent), promoEnds: s.promoEnds, supportEmail: s.supportEmail, bankTransferHours: String(s.bankTransferHours), ussdMinutes: String(s.ussdMinutes), revisionWindowDays: String(s.revisionWindowDays), maintenanceNotice: s.maintenanceNotice });
  const [errors, setErrors] = useState<[string, string][]>([]); const [off, setOff] = useState<PaymentMethod | null>(null);
  const save = () => {
    const e: [string, string][] = [];
    if (!/^\d+$/.test(f.promoPercent) || +f.promoPercent < 1 || +f.promoPercent > 50) e.push(['ps-pct', 'Offer percentage must be between 1 and 50']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.promoEnds)) e.push(['ps-end', 'Use the format YYYY-MM-DD']);
    if (!/^\S+@\S+\.\S+$/.test(f.supportEmail)) e.push(['ps-email', 'Enter a valid support email']);
    ['bankTransferHours', 'ussdMinutes', 'revisionWindowDays'].forEach((k) => { if (!/^\d+$/.test((f as Record<string, string | boolean>)[k] as string)) e.push([`ps-${k}`, 'Enter a whole number']); });
    setErrors(e); if (e.length) return;
    api.updateSettings({ promoEnabled: f.promoEnabled, promoPercent: +f.promoPercent, promoEnds: f.promoEnds, supportEmail: f.supportEmail, bankTransferHours: +f.bankTransferHours, ussdMinutes: +f.ussdMinutes, revisionWindowDays: +f.revisionWindowDays, maintenanceNotice: f.maintenanceNotice });
    toast('Settings saved and logged');
  };
  const err = (id: string) => errors.find((x) => x[0] === id)?.[1];
  return (
    <>
      <PageHeader title="Platform settings" lead="Changes apply immediately across the prototype (catalogue, checkout and help copy)." />
      <ErrorSummary errors={errors} />
      <div className="grid-2" style={{ marginTop: errors.length ? 16 : 0 }}>
        <Card title="First-course offer"><div className="stack">
          <Switch label="Offer enabled" hint="Shown on course pages and applied at checkout." checked={f.promoEnabled} onChange={(v) => setF({ ...f, promoEnabled: v })} />
          <div className="form-grid"><TextField id="ps-pct" label="Discount (%)" inputMode="numeric" value={f.promoPercent} onChange={(e) => setF({ ...f, promoPercent: e.target.value })} error={err('ps-pct')} /><TextField id="ps-end" label="Ends (YYYY-MM-DD)" value={f.promoEnds} onChange={(e) => setF({ ...f, promoEnds: e.target.value })} error={err('ps-end')} /></div>
          <p className="small muted">Rule: once per account, first eligible paid course, can’t be combined.</p>
        </div></Card>
        <Card title="Payment methods"><div className="stack">
          {(['card', 'bank_transfer', 'ussd'] as PaymentMethod[]).map((m) => <Switch key={m} label={{ card: 'Card', bank_transfer: 'Bank transfer', ussd: 'USSD' }[m]} checked={s.methods[m]} onChange={(v) => v ? (api.updateSettings({ methods: { ...s.methods, [m]: true } }), toast('Payment method turned on')) : setOff(m)} />)}
          <div className="form-grid"><TextField id="ps-bankTransferHours" label="Bank transfer window (hours)" inputMode="numeric" value={f.bankTransferHours} onChange={(e) => setF({ ...f, bankTransferHours: e.target.value })} error={err('ps-bankTransferHours')} /><TextField id="ps-ussdMinutes" label="USSD code expiry (minutes)" inputMode="numeric" value={f.ussdMinutes} onChange={(e) => setF({ ...f, ussdMinutes: e.target.value })} error={err('ps-ussdMinutes')} /></div>
          <p className="small muted">Stripe/PayPal are not configured — an open implementation decision.</p>
        </div></Card>
        <Card title="Learning rules"><div className="stack">
          <TextField id="ps-revisionWindowDays" label="Revision window after expiry (days)" inputMode="numeric" value={f.revisionWindowDays} onChange={(e) => setF({ ...f, revisionWindowDays: e.target.value })} error={err('ps-revisionWindowDays')} />
          <Alert tone="info" title="Fixed by policy" className="mt-0">Access period (1 year), pass mark (50%) and attempt limits are product rules and aren’t editable here.</Alert>
        </div></Card>
        <Card title="Support & notices"><div className="stack">
          <TextField id="ps-email" label="Support email" type="email" value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} error={err('ps-email')} />
          <Textarea label="Maintenance notice" optional value={f.maintenanceNotice} onChange={(e) => setF({ ...f, maintenanceNotice: e.target.value })} rows={3} hint="Not displayed anywhere in this prototype yet." />
        </div></Card>
      </div>
      <div className="row" style={{ marginTop: 'var(--space-6)' }}><Button onClick={save}>Save settings</Button></div>
      <ConfirmDialog open={!!off} onClose={() => setOff(null)} destructive title="Turn off this payment method?" confirmLabel="Turn off" simulated onConfirm={() => { api.updateSettings({ methods: { ...s.methods, [off!]: false } }); toast('Payment method turned off at checkout'); }}><p>Learners won’t see it at checkout. Payments already pending with this method are unaffected.</p></ConfirmDialog>
    </>
  );
}
