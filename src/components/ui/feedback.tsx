import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuTriangleAlert, LuX, LuInbox } from 'react-icons/lu';
import { cx } from '../../utils/cx';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'accent';
const toneIcon = { info: LuInfo, success: LuCircleCheck, warning: LuTriangleAlert, error: LuCircleAlert } as const;

/** Inline alert. Status is conveyed by title text and icon, not colour alone. */
export function Alert({ tone = 'info', title, children, actions, className, live }: { tone?: 'info' | 'success' | 'warning' | 'error'; title: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string; live?: boolean }) {
  const Icon = toneIcon[tone];
  return (
    <div className={cx('alert', `alert-${tone}`, className)} role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}>
      <Icon aria-hidden="true" />
      <div className="grow"><p className="alert-title">{title}</p>{children && <div className="alert-body">{children}</div>}{actions && <div className="alert-actions">{actions}</div>}</div>
    </div>
  );
}
export function Badge({ tone = 'neutral', children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode }) {
  return <span className={cx('badge', `badge-${tone}`)}>{icon}{children}</span>;
}
/** Status badge that always pairs text with an icon so meaning never relies on colour. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = tone === 'success' ? LuCircleCheck : tone === 'warning' ? LuTriangleAlert : tone === 'error' ? LuCircleAlert : tone === 'info' ? LuInfo : null;
  return <Badge tone={tone} icon={Icon ? <Icon aria-hidden="true" /> : undefined}>{children}</Badge>;
}
export function Spinner({ label = 'Loading' }: { label?: string }) { return <span className="row small muted" role="status"><span className="spinner" aria-hidden="true" />{label}…</span>; }
export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: number | string; r?: number }) { return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />; }
export function LoadingCards({ count = 3, label = 'Loading' }: { count?: number; label?: string }) {
  return <div aria-busy="true" aria-label={label} className="grid-3">{Array.from({ length: count }, (_, i) => <div key={i} className="card stack-sm"><Skeleton h={140} r={8} /><Skeleton h={20} w="80%" /><Skeleton h={14} w="60%" /><Skeleton h={14} w="40%" /></div>)}<span className="sr-only" role="status">{label}…</span></div>;
}
export function EmptyState({ icon, title, children, actions, level = 2 }: { icon?: ReactNode; title: string; children?: ReactNode; actions?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2';
  return <div className="empty"><div className="empty-icon" aria-hidden="true">{icon || <LuInbox />}</div><H style={{ fontSize: 'var(--text-xl)', lineHeight: 'var(--lh-xl)' }}>{title}</H>{children && <p>{children}</p>}{actions && <div className="row">{actions}</div>}</div>;
}

type ToastItem = { id: number; tone: 'success' | 'info' | 'error'; text: string };
const ToastCtx = createContext<(text: string, tone?: ToastItem['tone']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
/** Toasts are announced through a polite live region and can be dismissed. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random(); setItems((xs) => [...xs.slice(-2), { id, tone, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 6000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => { const I = t.tone === 'error' ? LuCircleAlert : t.tone === 'info' ? LuInfo : LuCircleCheck; return (
          <div key={t.id} className="toast"><I aria-hidden="true" /><span className="grow">{t.text}</span><button type="button" className="icon-btn" aria-label="Dismiss notification" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}><LuX aria-hidden="true" /></button></div>
        ); })}
      </div>
    </ToastCtx.Provider>
  );
}
