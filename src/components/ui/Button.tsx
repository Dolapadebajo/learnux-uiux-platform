import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/cx';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'accent';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'md' | 'sm'; icon?: ReactNode; iconRight?: ReactNode; block?: boolean; loading?: boolean; to?: string; wrap?: boolean; }

/** Button. Renders a router link when `to` is given so navigation stays a real link. */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'primary', size = 'md', icon, iconRight, block, loading, to, wrap, className, children, disabled, type = 'button', ...rest }, ref) {
  const cls = cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', wrap && 'btn-wrap', className);
  const content = <>{loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" /> : icon}{children}{iconRight}</>;
  if (to && !disabled) return <Link to={to} className={cls}>{content}</Link>;
  return <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>{content}</button>;
});

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> { label: string; icon: ReactNode; bordered?: boolean; badge?: number; to?: string; }
/** Icon-only button: `label` is required and becomes the accessible name. */
export function IconButton({ label, icon, bordered, badge, to, className, ...rest }: IconProps) {
  const cls = cx('icon-btn', bordered && 'bordered', className);
  const inner = <>{icon}{badge ? <span className="dot" aria-hidden="true">{badge > 9 ? '9+' : badge}</span> : null}</>;
  const name = badge ? `${label} (${badge} unread)` : label;
  if (to) return <Link to={to} className={cls} aria-label={name} title={label}>{inner}</Link>;
  return <button type="button" className={cls} aria-label={name} title={label} {...rest}>{inner}</button>;
}
