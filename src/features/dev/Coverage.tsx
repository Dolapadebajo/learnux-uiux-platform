import { Link } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import { PageHeader } from '../../components/layout/layouts';
import { REFERENCE_VIEWS, STATE_LINKS } from '../../app/coverage';
import { Alert } from '../../components/ui/feedback';

const AREAS: Record<string, string> = { A: 'A. Discovery and first lesson', B: 'B. Account, payments and support', C: 'C. Learning, assessments and certificates', D: 'D. Instructor workspace', E: 'E. Administration' };

/** Coverage matrix: reference views → routes and inspectable states. Not counted as a product view. */
export function Coverage() {
  useTitle('Coverage matrix');
  return (
    <div className="site-main">
      <PageHeader title="Coverage matrix" lead={`${REFERENCE_VIEWS.length} reference views. Each works at 320–1440px from one responsive codebase. Alternative states use ?demo=… or real data, not duplicate routes.`} />
      <Alert tone="info" title="Routes with :params">Example IDs are linked where possible. Persona matters: learner routes need a learner, instructor routes need Tunde Bakare, admin routes need Grace Eze — switch in the Demo bar.</Alert>
      {Object.entries(AREAS).map(([k, title]) => (
        <section key={k} className="stack" style={{ marginTop: 'var(--space-8)' }} aria-labelledby={`cov-${k}`}>
          <h2 id={`cov-${k}`}>{title}</h2>
          <div className="scroll-region" role="region" aria-label={`${title} (scrolls horizontally on small screens)`} tabIndex={0}>
            <table className="table" style={{ minWidth: 720 }}><caption className="sr-only">{title}</caption>
              <thead><tr><th scope="col">#</th><th scope="col">Reference view</th><th scope="col">Route</th><th scope="col">Implemented as</th><th scope="col">State variants</th></tr></thead>
              <tbody>{REFERENCE_VIEWS.filter((v) => v.area === k).map((v) => <tr key={v.n}><td>{v.n}</td><th scope="row" style={{ background: 'none', whiteSpace: 'normal', color: 'var(--color-text)' }}>{v.name}</th><td>{v.route.includes(':') ? <code>{v.route}</code> : <Link to={v.route}><code>{v.route}</code></Link>}</td><td>{v.how}</td><td>{v.states.length ? v.states.join(' · ') : '—'}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ))}
      <section className="stack" style={{ marginTop: 'var(--space-8)' }}><h2>Quick links to alternative states</h2><div className="grid-2">{STATE_LINKS.map((g) => <div key={g.group} className="card card-sm"><h3 style={{ fontSize: 'var(--text-md)' }}>{g.group}</h3><ul className="stack-sm small" style={{ paddingLeft: 18, marginTop: 8 }}>{g.links.map(([l, to]) => <li key={l}><Link to={to}>{l}</Link></li>)}</ul></div>)}</div><p className="small muted">Links that need a persona switch it automatically from the Demo bar’s “States & journeys” panel.</p></section>
    </div>
  );
}
