import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { api } from '../data/services';
import { ConfirmDialog, Drawer } from '../components/ui/overlay';
import { useToast } from '../components/ui/feedback';
import { STATE_LINKS } from './coverage';

const personas = [
  { id: '', label: 'Visitor (signed out)', home: '/' },
  { id: 'u-amaka', label: 'Learner — Amaka Obi (mid-course)', home: '/learn' },
  { id: 'u-bola', label: 'Learner — Bola Adeyemi (one quiz from a certificate)', home: '/learn' },
  { id: 'u-tunde', label: 'Instructor — Tunde Bakare', home: '/teach' },
  { id: 'u-grace', label: 'Administrator — Grace Eze', home: '/admin' },
  { id: 'u-musa', label: 'Administrator — Musa Ibrahim (support)', home: '/admin/support' },
];

/** Clearly labelled prototype controls. A frontend role switcher is NOT security. */
export function DemoBar() {
  const { user } = useSession(); const navigate = useNavigate(); const toast = useToast();
  const [states, setStates] = useState(false); const [reset, setReset] = useState(false);
  const value = personas.some((p) => p.id === user?.id) ? user!.id : user ? 'other' : '';
  return (
    <div className="demo-bar" role="region" aria-label="Prototype demo controls">
      <div className="demo-bar-inner">
        <span className="tag">DEMO</span>
        <label htmlFor="demo-role" className="hide-sm">View as</label>
        <select id="demo-role" value={value} onChange={(e) => { const p = personas.find((x) => x.id === e.target.value)!; api.switchUser(p.id || null); navigate(p.home); toast(`Now viewing as ${p.label.split(' (')[0]}`, 'info'); }}>
          {value === 'other' && <option value="other">{user?.name} (new account)</option>}
          {personas.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button type="button" onClick={() => setStates(true)}>States<span className="hide-sm"> & journeys</span></button>
        <span className="spacer" />
        <Link to="/showcase" className="hide-sm">Components</Link>
        <Link to="/coverage" className="hide-sm">Coverage</Link>
        <button type="button" onClick={() => setReset(true)}>Reset<span className="hide-sm"> demo data</span></button>
      </div>
      <ConfirmDialog open={reset} onClose={() => setReset(false)} title="Reset all demo data?" confirmLabel="Reset demo data" destructive onConfirm={() => { api.reset(); navigate('/'); toast('Demo data reset to the starting records. You are now signed out.'); }}>
        <p>This restores every course, payment, grade, ticket and certificate to the original fictional data and signs you out. Changes you made in this browser will be lost.</p>
      </ConfirmDialog>
      <Drawer open={states} onClose={() => setStates(false)} title="States & journeys">
        <div className="stack">
          <p className="small secondary">Alternative states open with <code>?demo=</code> on the relevant route, so there are no duplicate pages. Journeys use the real controls; switch persona above where noted.</p>
          {STATE_LINKS.map((g) => (
            <section key={g.group} className="stack-sm"><h3 style={{ fontSize: 'var(--text-md)' }}>{g.group}</h3>
              <ul className="stack-sm small" style={{ paddingLeft: 18 }}>{g.links.map(([label, to, persona]) => <li key={to + label}><Link to={to} onClick={() => { if (persona !== undefined) api.switchUser(persona || null); setStates(false); }}>{label}</Link>{persona !== undefined && <span className="muted"> · as {persona ? personas.find((p) => p.id === persona)?.label.split(' — ')[1]?.split(' (')[0] : 'visitor'}</span>}</li>)}</ul>
            </section>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
