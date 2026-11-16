import { DEMO_TODAY, daysBetween } from './date';

/* Money: prices are stored as whole naira. One formatter for every price on screen. */
const ngn = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
export const formatNGN = (amount: number, opts: { free?: boolean } = {}) => (amount === 0 && opts.free !== false ? 'Free' : ngn.format(amount).replace('NGN', '₦').replace(/\s/g, ''));
/* Illustrative exchange rate (decision D-13). Always labelled as an estimate in the UI. */
export const USD_RATE = 1550;
export const formatUSDEstimate = (amount: number) => (amount ? `≈ US$${Math.round(amount / USD_RATE).toLocaleString('en-US')}` : '');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatDate = (iso?: string) => { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d} ${months[m - 1]} ${y}`; };
export const formatTime = (iso: string) => { const t = iso.slice(11, 16); if (!t) return ''; let [h, mi] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(mi).padStart(2, '0')} ${ap}`; };
export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;
export const formatRelative = (iso: string) => {
  const d = daysBetween(iso, DEMO_TODAY);
  if (d <= 0) return `Today, ${formatTime(iso)}`; if (d === 1) return 'Yesterday'; if (d < 7) return `${d} days ago`; return formatDate(iso);
};
export const pluralise = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const methodLabel = (m: string) => ({ card: 'Card', bank_transfer: 'Bank transfer', ussd: 'USSD' }[m] || m);
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
