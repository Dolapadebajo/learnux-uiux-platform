import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { LuCircleAlert, LuEye, LuEyeOff, LuSearch } from 'react-icons/lu';
import { cx } from '../../utils/cx';

interface FieldShell { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; className?: string; hideLabel?: boolean; }
/** Wires label, hint and error to the control via id / aria-describedby / aria-invalid. */
function useFieldIds(id?: string) { const auto = useId(); const fid = id || 'f' + auto.replace(/[:«»]/g, ''); return { fid, hid: fid + '-hint', eid: fid + '-error' }; }
function Shell({ fid, hid, eid, label, hint, error, optional, className, hideLabel, children }: FieldShell & { fid: string; hid: string; eid: string; children: ReactNode }) {
  return (
    <div className={cx('field', className)}>
      <label htmlFor={fid} className={cx('field-label', hideLabel && 'sr-only')}>{label}{optional && <span className="opt"> (optional)</span>}</label>
      {hint && <span id={hid} className="field-hint">{hint}</span>}
      {error && <span id={eid} className="field-error"><LuCircleAlert aria-hidden="true" />{error}</span>}
      {children}
    </div>
  );
}
const describe = (hint: unknown, error: unknown, hid: string, eid: string) => [hint ? hid : '', error ? eid : ''].filter(Boolean).join(' ') || undefined;

type TextProps = FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { icon?: ReactNode };
export function TextField({ label, hint, error, optional, className, hideLabel, id, icon, ...rest }: TextProps) {
  const { fid, hid, eid } = useFieldIds(id);
  const input = <input id={fid} className="input" aria-invalid={error ? true : undefined} aria-describedby={describe(hint, error, hid, eid)} {...rest} />;
  return <Shell {...{ fid, hid, eid, label, hint, error, optional, className, hideLabel }}>{icon ? <div className="input-prefix">{icon}{input}</div> : input}</Shell>;
}
export function PasswordField({ label, hint, error, optional, className, id, ...rest }: TextProps) {
  const { fid, hid, eid } = useFieldIds(id); const [show, setShow] = useState(false);
  return (
    <Shell {...{ fid, hid, eid, label, hint, error, optional, className }}>
      <div className="input-wrap">
        <input id={fid} type={show ? 'text' : 'password'} className="input" aria-invalid={error ? true : undefined} aria-describedby={describe(hint, error, hid, eid)} {...rest} />
        <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}</button>
      </div>
    </Shell>
  );
}
export function Textarea({ label, hint, error, optional, className, id, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { fid, hid, eid } = useFieldIds(id);
  return <Shell {...{ fid, hid, eid, label, hint, error, optional, className }}><textarea id={fid} className="textarea" aria-invalid={error ? true : undefined} aria-describedby={describe(hint, error, hid, eid)} {...rest} /></Shell>;
}
export function Select({ label, hint, error, optional, className, id, options, hideLabel, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
  const { fid, hid, eid } = useFieldIds(id);
  return (
    <Shell {...{ fid, hid, eid, label, hint, error, optional, className, hideLabel }}>
      <select id={fid} className="select" aria-invalid={error ? true : undefined} aria-describedby={describe(hint, error, hid, eid)} {...rest}>
        {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  );
}
export function Checkbox({ label, hint, className, ...rest }: { label: ReactNode; hint?: ReactNode; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className={cx('choice', className)}><input type="checkbox" {...rest} /><span className="choice-body">{label}{hint && <span className="field-hint" style={{ display: 'block' }}>{hint}</span>}</span></label>;
}
export function Radio({ label, hint, card, className, ...rest }: { label: ReactNode; hint?: ReactNode; card?: boolean; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className={cx('choice', card && 'choice-card', className)}><input type="radio" {...rest} /><span className="choice-body"><span className="strong">{label}</span>{hint && <span className="field-hint" style={{ display: 'block' }}>{hint}</span>}</span></label>;
}
export function Switch({ label, hint, checked, onChange, id }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  const { fid } = useFieldIds(id);
  return (
    <label className="switch" htmlFor={fid}>
      <span><span className="strong">{label}</span>{hint && <span className="field-hint" style={{ display: 'block' }}>{hint}</span>}</span>
      <input id={fid} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-checked={checked} />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
/** Error summary: rendered at the top of a form after submit; links move focus to each field. */
export function ErrorSummary({ errors, title = 'There is a problem' }: { errors: [string, string][]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null); const sig = errors.map((e) => e.join(':')).join('|');
  useEffect(() => { if (sig) ref.current?.focus(); }, [sig]); // focus once per new set of errors, not on every render
  if (!errors.length) return null;
  return (
    <div className="error-summary" role="alert" tabIndex={-1} ref={ref}>
      <h2>{errors.length === 1 ? title : `There are ${errors.length} problems`}</h2>
      <ul>{errors.map(([id, msg]) => <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.focus(); }}>{msg}</a></li>)}</ul>
    </div>
  );
}
export function SearchInput({ label, value, onChange, placeholder, onSubmit, buttonLabel = 'Search', className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; onSubmit?: () => void; buttonLabel?: string; className?: string }) {
  const id = useId();
  return (
    <form role="search" className={cx('search', className)} onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="input-prefix"><LuSearch aria-hidden="true" /><input id={id} className="input" type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>
      {onSubmit && <button className="btn btn-primary" type="submit">{buttonLabel}</button>}
    </form>
  );
}
