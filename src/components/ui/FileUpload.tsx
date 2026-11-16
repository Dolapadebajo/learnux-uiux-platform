import { useId, useRef, useState } from 'react';
import { LuFileText, LuUpload, LuCircleAlert, LuCircleCheck, LuX, LuRefreshCw } from 'react-icons/lu';
import { cx } from '../../utils/cx';

export type UploadItem = { name: string; size: string; state: 'uploading' | 'done' | 'error'; progress: number; error?: string };
const fmtSize = (b: number) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');

/** File upload with simulated transfer. Files never leave the browser: only the name and size are kept.
 *  Files whose name contains "fail" simulate an upload error so the error/retry state can be inspected. */
export function FileUpload({ label, hint, items, onChange, accept = '.pdf,.png,.jpg,.docx', maxMB = 20, error, multiple = true }: { label: string; hint?: string; items: UploadItem[]; onChange: (items: UploadItem[]) => void; accept?: string; maxMB?: number; error?: string; multiple?: boolean }) {
  const id = useId(); const input = useRef<HTMLInputElement>(null); const [over, setOver] = useState(false);
  const latest = useRef(items); latest.current = items;
  const simulate = (name: string, fail: boolean) => {
    let p = 0;
    const tick = () => {
      p += 34;
      const next = latest.current.map((x) => x.name !== name ? x : fail && p > 60 ? { ...x, state: 'error' as const, progress: 64, error: 'Upload interrupted — connection reset (simulated). Nothing was submitted.' } : p >= 100 ? { ...x, state: 'done' as const, progress: 100 } : { ...x, progress: p });
      onChange(next); latest.current = next;
      if (p < 100 && !(fail && p > 60)) setTimeout(tick, 250);
    };
    setTimeout(tick, 200);
  };
  const add = (files: FileList | null) => {
    if (!files) return;
    const added: UploadItem[] = Array.from(files).map((f) => f.size > maxMB * 1e6
      ? { name: f.name, size: fmtSize(f.size), state: 'error', progress: 0, error: `This file is larger than ${maxMB} MB. Choose a smaller file.` }
      : { name: f.name, size: fmtSize(f.size), state: 'uploading', progress: 5 });
    const next = multiple ? [...items.filter((x) => !added.some((a) => a.name === x.name)), ...added] : added.slice(0, 1);
    onChange(next); latest.current = next;
    added.filter((a) => a.state === 'uploading').forEach((a) => simulate(a.name, /fail/i.test(a.name)));
  };
  const retry = (name: string) => { const next = items.map((x) => x.name === name ? { ...x, state: 'uploading' as const, progress: 5, error: undefined } : x); onChange(next); latest.current = next; simulate(name, false); };
  return (
    <div className="field">
      <span className="field-label" id={id + '-l'}>{label}</span>
      {hint && <span className="field-hint" id={id + '-h'}>{hint}</span>}
      {error && <span className="field-error" id={id + '-e'}><LuCircleAlert aria-hidden="true" />{error}</span>}
      <div className={cx('dropzone', over && 'is-over')} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
        <LuUpload aria-hidden="true" />
        <p>Drag a file here, or</p>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => input.current?.click()} aria-describedby={[hint && id + '-h', error && id + '-e'].filter(Boolean).join(' ') || undefined}>Choose file</button>
        <input ref={input} id={id} type="file" accept={accept} multiple={multiple} className="sr-only" tabIndex={-1} aria-labelledby={id + '-l'} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <p className="small muted" style={{ marginTop: 8 }}>{accept.replaceAll(',', ', ').toUpperCase()} · up to {maxMB} MB. Files stay in your browser in this prototype.</p>
      </div>
      {items.length > 0 && <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, marginTop: 8 }} aria-live="polite">
        {items.map((f) => (
          <li key={f.name} className={cx('file-item', f.state === 'error' && 'is-error')}>
            {f.state === 'error' ? <LuCircleAlert aria-hidden="true" color="var(--color-error)" /> : f.state === 'done' ? <LuCircleCheck aria-hidden="true" color="var(--color-success)" /> : <LuFileText aria-hidden="true" />}
            <span className="grow"><span className="strong" style={{ display: 'block' }}>{f.name}</span><span className="small secondary">{f.size} · {f.state === 'uploading' ? `Uploading ${f.progress}%` : f.state === 'done' ? 'Uploaded' : f.error}</span>
              {f.state === 'uploading' && <span className="progress-track" style={{ display: 'block', marginTop: 6 }} role="progressbar" aria-label={`Uploading ${f.name}`} aria-valuenow={f.progress} aria-valuemin={0} aria-valuemax={100}><span className="progress-fill primary" style={{ display: 'block', width: f.progress + '%' }} /></span>}
            </span>
            {f.state === 'error' && !f.error?.includes('larger') && <button type="button" className="btn btn-secondary btn-sm" onClick={() => retry(f.name)}><LuRefreshCw aria-hidden="true" />Retry</button>}
            <button type="button" className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => onChange(items.filter((x) => x.name !== f.name))}><LuX aria-hidden="true" /></button>
          </li>
        ))}
      </ul>}
    </div>
  );
}
