import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LuLifeBuoy, LuSearchX, LuThumbsUp, LuThumbsDown } from 'react-icons/lu';
import { ARTICLES, TOPICS } from '../../data/help';
import { useTitle } from '../../hooks/useTitle';
import { useSession } from '../../hooks/useSession';
import { PageHeader } from '../../components/layout/layouts';
import { SearchInput } from '../../components/ui/form';
import { Card } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/feedback';
import { Breadcrumbs } from '../../components/ui/navigation';
import { NotFound } from './System';

export function HelpCentre() {
  useTitle('Help centre'); const { user } = useSession();
  const [sp, setSp] = useSearchParams(); const [q, setQ] = useState(sp.get('q') || ''); const active = (sp.get('q') || '').toLowerCase();
  const hits = active ? ARTICLES.filter((a) => (a.title + a.summary + a.body.join(' ')).toLowerCase().includes(active)) : [];
  const supportLink = user?.role === 'learner' ? '/learn/support/new' : '/login';
  return (
    <div className="site-main">
      <PageHeader title="Help centre" lead="Answers about courses, payments, access and certificates." />
      <SearchInput label="Search help articles" value={q} onChange={setQ} placeholder="e.g. bank transfer pending" onSubmit={() => setSp(q.trim() ? { q: q.trim() } : {})} className="form" />
      <div style={{ marginTop: 'var(--space-8)' }} aria-live="polite">
        {active ? (hits.length ? (
          <section className="stack"><h2 style={{ fontSize: 'var(--text-lg)' }}>{hits.length} result{hits.length > 1 ? 's' : ''} for “{sp.get('q')}”</h2><ul className="stack-sm" style={{ listStyle: 'none', padding: 0 }}>{hits.map((a) => <li key={a.slug} className="card card-sm"><Link to={`/help/${a.slug}`} className="strong">{a.title}</Link><p className="small secondary">{a.summary}</p></li>)}</ul><Button variant="tertiary" onClick={() => { setQ(''); setSp({}); }}>Clear search</Button></section>
        ) : <EmptyState icon={<LuSearchX />} title={`No articles match “${sp.get('q')}”`} actions={<><Button variant="secondary" onClick={() => { setQ(''); setSp({}); }}>Browse all topics</Button><Button to={supportLink}>Contact support</Button></>}>Try words like “payment”, “certificate” or “live session”.</EmptyState>
        ) : (
          <div className="grid-3">{TOPICS.map((t) => <Card key={t} title={t} headingLevel={2}><ul className="stack-sm" style={{ paddingLeft: 18 }}>{ARTICLES.filter((a) => a.topic === t).map((a) => <li key={a.slug}><Link to={`/help/${a.slug}`}>{a.title}</Link></li>)}</ul></Card>)}</div>
        )}
      </div>
      <section className="card card-primary row-between" style={{ marginTop: 'var(--space-8)' }} aria-label="Contact support">
        <div className="row row-top" style={{ flexWrap: 'nowrap' }}><LuLifeBuoy aria-hidden="true" style={{ width: 28, height: 28, color: 'var(--color-primary)', flex: 'none' }} /><div><h2 style={{ fontSize: 'var(--text-lg)' }}>Still need help?</h2><p className="secondary">{user?.role === 'learner' ? 'Open a support request — we usually reply within one working day.' : 'Log in to open a support request so we can see your courses and payments.'}</p></div></div>
        <Button to={supportLink}>{user?.role === 'learner' ? 'Contact support' : 'Log in to contact support'}</Button>
      </section>
    </div>
  );
}

export function HelpArticle() {
  const { slug } = useParams(); const a = ARTICLES.find((x) => x.slug === slug); useTitle(a?.title || 'Help');
  const [vote, setVote] = useState<null | boolean>(null); const { user } = useSession();
  if (!a) return <NotFound />;
  return (
    <div className="site-main">
      <div className="with-aside">
        <article className="stack prose">
          <Breadcrumbs items={[['Help centre', '/help'], [a.topic], [a.title]]} />
          <h1>{a.title}</h1>
          {a.body.map((p, i) => <p key={i} className={i === 0 ? 'lead' : undefined}>{p}</p>)}
          {a.steps && <><h2>What to do</h2><ol className="stack-sm">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol></>}
          <div className="card card-subtle stack-sm" role="group" aria-labelledby="helpful-h">
            <p id="helpful-h" className="strong">Was this article helpful?</p>
            {vote === null ? <div className="row"><Button variant="secondary" size="sm" icon={<LuThumbsUp aria-hidden="true" />} onClick={() => setVote(true)}>Yes</Button><Button variant="secondary" size="sm" icon={<LuThumbsDown aria-hidden="true" />} onClick={() => setVote(false)}>No</Button></div>
              : <p role="status" className="small">{vote ? 'Thanks for letting us know.' : <>Sorry it didn’t help. <Link to={user?.role === 'learner' ? '/learn/support/new' : '/login'}>Contact support</Link> and we’ll answer directly.</>} (Feedback isn’t stored in this prototype.)</p>}
          </div>
        </article>
        <aside className="stack"><Card title="Related articles" headingLevel={2}><ul className="stack-sm" style={{ paddingLeft: 18 }}>{a.related.map((r) => { const x = ARTICLES.find((y) => y.slug === r)!; return <li key={r}><Link to={`/help/${r}`}>{x.title}</Link></li>; })}</ul></Card></aside>
      </div>
    </div>
  );
}
