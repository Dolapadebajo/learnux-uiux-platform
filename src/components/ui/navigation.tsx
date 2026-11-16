import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { cx } from '../../utils/cx';

export function Breadcrumbs({ items }: { items: [string, string?][] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map(([label, to], i) => <li key={i}>{to && i < items.length - 1 ? <Link to={to}>{label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{label}</span>}</li>)}</ol></nav>;
}

/** Route tabs: a nav of links (each tab is its own URL). */
export function NavTabs({ items, label, className }: { items: { to: string; label: ReactNode; end?: boolean; count?: number }[]; label: string; className?: string }) {
  return <nav aria-label={label} className={cx('tabs', className)}>{items.map((t) => <NavLink key={t.to} to={t.to} end={t.end} className="tab">{t.label}{t.count !== undefined && <span className="count">{t.count}</span>}</NavLink>)}</nav>;
}
/** In-page tabs following the ARIA tabs pattern (arrow keys move between tabs). */
export function Tabs<T extends string>({ tabs, value, onChange, label, idBase }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; label: string; idBase: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!dir) return;
    e.preventDefault(); const n = (i + dir + tabs.length) % tabs.length; onChange(tabs[n].id); refs.current[n]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {tabs.map((t, i) => <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" type="button" id={`${idBase}-tab-${t.id}`} aria-controls={`${idBase}-panel`} aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1} className="tab" onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}>{t.label}{t.count !== undefined && <span className="count">{t.count}</span>}</button>)}
    </div>
  );
}
export function TabPanel({ idBase, value, children }: { idBase: string; value: string; children: ReactNode }) {
  return <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0} style={{ paddingTop: 'var(--space-5)' }}>{children}</div>;
}

export function Pagination({ page, pages, onChange, total, label = 'results' }: { page: number; pages: number; onChange: (p: number) => void; total: number; label?: string }) {
  if (pages <= 1) return <p className="small muted" style={{ paddingTop: 'var(--space-3)' }}>{total} {label}</p>;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="small muted">Page {page} of {pages} · {total} {label}</span>
      <ol>
        <li><button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page"><LuChevronLeft aria-hidden="true" /></button></li>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <li key={p}><button className="page-btn" aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)} aria-label={`Page ${p}`}>{p}</button></li>)}
        <li><button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Next page"><LuChevronRight aria-hidden="true" /></button></li>
      </ol>
    </nav>
  );
}
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return <ol className="steps" aria-label={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}>{steps.map((s, i) => <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''} aria-current={i === current ? 'step' : undefined}><span>{s}{i < current && <span className="sr-only"> (done)</span>}</span></li>)}</ol>;
}
