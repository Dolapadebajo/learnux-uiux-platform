import { useId, useRef, type ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cx } from '../../utils/cx';
import { Button } from './Button';

/** Modal dialog: focus trapped, Escape and backdrop close, focus returns to the opener. */
export function Dialog({ open, onClose, title, children, footer, size }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'lg' }) {
  const ref = useRef<HTMLDivElement>(null); const id = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={id} style={size === 'lg' ? { maxWidth: 720 } : undefined}>
        <div className="dialog-head"><h2 id={id}>{title}</h2><button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}><LuX aria-hidden="true" /></button></div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
/** Confirmation for consequential or destructive actions. Says what will happen, offers a safe default. */
export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel, destructive, disabled, simulated }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; children: ReactNode; confirmLabel: string; destructive?: boolean; disabled?: boolean; simulated?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose} data-autofocus>Cancel</Button><Button variant={destructive ? 'danger' : 'primary'} disabled={disabled} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <div className="stack">{children}{simulated && <p className="small muted">Simulated action — no real money, email or record outside this browser is affected.</p>}</div>
    </Dialog>
  );
}
export function Drawer({ open, onClose, title, children, footer, side = 'right' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; side?: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null); const id = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={cx('drawer', side === 'left' && 'left')} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="dialog-head" style={{ paddingTop: 'var(--space-5)' }}><h2 id={id}>{title}</h2><button type="button" className="icon-btn" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}><LuX aria-hidden="true" /></button></div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
