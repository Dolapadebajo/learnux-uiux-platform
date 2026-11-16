import { useId, useState, type ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cx } from '../../utils/cx';

export function Card({ children, className, as: As = 'section', title, actions, headingLevel = 2, ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'aside'; title?: ReactNode; actions?: ReactNode; headingLevel?: 2 | 3; 'aria-label'?: string }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return <As className={cx('card', className)} {...rest}>{(title || actions) && <div className="card-header">{title && <H>{title}</H>}{actions && <div className="row">{actions}</div>}</div>}{children}</As>;
}
export function Accordion({ title, meta, children, defaultOpen = false, headingLevel = 3 }: { title: ReactNode; meta?: ReactNode; children: ReactNode; defaultOpen?: boolean; headingLevel?: 2 | 3 | 4 }) {
  const [open, setOpen] = useState(defaultOpen); const id = useId();
  const H = (`h${headingLevel}`) as 'h3';
  return (
    <div className="accordion">
      <H style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
        <button type="button" className="accordion-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          <span className="grow"><span className="strong" style={{ display: 'block' }}>{title}</span>{meta && <span className="small muted" style={{ fontWeight: 400 }}>{meta}</span>}</span><LuChevronDown aria-hidden="true" />
        </button>
      </H>
      <div id={id} className="accordion-panel" hidden={!open}>{children}</div>
    </div>
  );
}

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode; numeric?: boolean; primary?: boolean; hideOnMobile?: boolean; }
/** Desktop table that becomes labelled record cards below 768px. */
export function DataTable<T>({ rows, columns, rowKey, caption, actions, selectedKey, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; caption: string; actions?: (r: T) => ReactNode; selectedKey?: string; empty?: ReactNode }) {
  if (!rows.length && empty) return <>{empty}</>;
  const primary = columns.find((c) => c.primary) || columns[0];
  return (
    <div className="table-wrap responsive">
      <table className="table card-flush" style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', borderCollapse: 'separate', borderSpacing: 0 }}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? 'num' : undefined}>{c.header}</th>)}{actions && <th scope="col"><span className="sr-only">Actions</span></th>}</tr></thead>
        <tbody>{rows.map((r) => <tr key={rowKey(r)} className={selectedKey === rowKey(r) ? 'is-selected' : undefined}>{columns.map((c) => <td key={c.key} className={c.numeric ? 'num' : undefined}>{c.render(r)}</td>)}{actions && <td className="nowrap">{actions(r)}</td>}</tr>)}</tbody>
      </table>
      <ul className="records" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="record">
            <div className="record-title">{primary.render(r)}</div>
            <dl>{columns.filter((c) => c !== primary && !c.hideOnMobile).map((c) => <div key={c.key} style={{ display: 'contents' }}><dt>{c.header}</dt><dd>{c.render(r)}</dd></div>)}</dl>
            {actions && <div className="record-actions">{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
export function ProgressBar({ value, label, detail, tone = 'accent', hideLabel }: { value: number; label: string; detail?: ReactNode; tone?: 'accent' | 'primary'; hideLabel?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress">
      {!hideLabel && <div className="progress-top"><span>{label}</span><span className="strong">{detail ?? `${v}%`}</span></div>}
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-valuetext={typeof detail === 'string' ? detail : `${v}%`}><div className={cx('progress-fill', tone === 'primary' && 'primary')} style={{ width: `${v}%` }} /></div>
    </div>
  );
}
export function ProgressRing({ value, label, size = 72 }: { value: number; label: string; size?: number }) {
  const r = (size - 8) / 2; const c = 2 * Math.PI * r; const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
      <svg width={size} height={size} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth="8" fill="none" /><circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-accent)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} /></svg>
      <span className="ring-label" aria-hidden="true">{Math.round(v)}%</span>
    </div>
  );
}
export function Metric({ label, value, note, icon }: { label: string; value: ReactNode; note?: ReactNode; icon?: ReactNode }) {
  return <div className="metric"><p className="metric-label">{icon}{label}</p><p className="metric-value">{value}</p>{note && <p className="metric-note">{note}</p>}</div>;
}
export function KeyValue({ items }: { items: [ReactNode, ReactNode][] }) {
  return <dl className="kv">{items.map(([k, v], i) => <div key={i} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}
export function Avatar({ initials, size, tone }: { initials: string; size?: 'sm' | 'lg'; tone?: 'accent' }) { return <span className={cx('avatar', size, tone)} aria-hidden="true">{initials}</span>; }
