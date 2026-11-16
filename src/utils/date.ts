/* The prototype runs on a fixed demo calendar so seeded copy ("access ends in 5 days") stays consistent.
   Clock time is real; the date is pinned to DEMO_TODAY. */
export const DEMO_TODAY = '2026-11-16';
export function now(): Date { const d = new Date(); const [y, m, day] = DEMO_TODAY.split('-').map(Number); d.setFullYear(y, m - 1, day); return d; }
export const nowISO = () => { const d = now(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
export const todayISO = () => DEMO_TODAY;
export const addDays = (iso: string, days: number) => { const d = new Date(iso.slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
export const addYears = (iso: string, y: number) => { const d = new Date(iso.slice(0, 10) + 'T12:00:00'); d.setFullYear(d.getFullYear() + y); return d.toISOString().slice(0, 10); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b.slice(0, 10) + 'T12:00:00').getTime() - new Date(a.slice(0, 10) + 'T12:00:00').getTime()) / 86400000);
