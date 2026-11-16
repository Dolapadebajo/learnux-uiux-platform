import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuSlidersHorizontal, LuSearchX } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { useDemoState } from '../../hooks/useDemoState';
import { publishedCourses, userById, enrolmentFor } from '../../data/selectors';
import { CourseCard } from '../../components/learning/CourseCard';
import { PageHeader } from '../../components/layout/layouts';
import { Button } from '../../components/ui/Button';
import { Checkbox, Radio, SearchInput, Select } from '../../components/ui/form';
import { EmptyState, LoadingCards } from '../../components/ui/feedback';
import { Drawer } from '../../components/ui/overlay';
import type { Course } from '../../types';

const SORTS = [{ value: 'relevance', label: 'Most relevant' }, { value: 'popular', label: 'Most popular' }, { value: 'price-asc', label: 'Price: low to high' }, { value: 'price-desc', label: 'Price: high to low' }, { value: 'short', label: 'Shortest first' }];

export function Catalogue() {
  const { db, user } = useSession(); useTitle('Courses');
  const [sp, setSp] = useSearchParams(); const demo = useDemoState(['loading'] as const);
  const [query, setQuery] = useState(sp.get('q') || ''); const [open, setOpen] = useState(false);
  const all = publishedCourses(db);
  const levels = sp.getAll('level'); const cats = sp.getAll('category'); const price = sp.get('price') || 'any'; const dur = sp.get('duration') || 'any'; const sort = sp.get('sort') || 'relevance'; const q = (sp.get('q') || '').trim().toLowerCase();
  const update = (fn: (p: URLSearchParams) => void) => setSp((prev) => { const n = new URLSearchParams(prev); n.delete('demo'); fn(n); return n; }, { replace: true });
  const toggle = (key: string, v: string) => update((n) => { const cur = n.getAll(key); n.delete(key); (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => n.append(key, x)); });
  const results = useMemo(() => {
    let r = all.filter((c: Course) =>
      (!q || [c.title, c.subtitle, c.category, c.description, ...c.outcomes].join(' ').toLowerCase().includes(q)) &&
      (!levels.length || levels.includes(c.level)) && (!cats.length || cats.includes(c.category)) &&
      (price === 'any' || (price === 'free' ? c.price === 0 : c.price > 0)) && (dur === 'any' || (dur === 'short' ? c.weeks <= 4 : c.weeks > 4)));
    if (sort === 'popular') r = [...r].sort((a, b) => b.learners - a.learners);
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'short') r = [...r].sort((a, b) => a.weeks - b.weeks);
    return r;
  }, [all, q, levels.join(), cats.join(), price, dur, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = levels.length + cats.length + (price !== 'any' ? 1 : 0) + (dur !== 'any' ? 1 : 0);
  const clear = () => update((n) => { ['level', 'category', 'price', 'duration'].forEach((k) => n.delete(k)); });
  const categories = Array.from(new Set(all.map((c) => c.category)));
  const filters = (
    <div className="stack">
      <fieldset><legend>Level</legend>{['Beginner', 'Intermediate'].map((l) => <Checkbox key={l} label={`${l} (${all.filter((c) => c.level === l).length})`} checked={levels.includes(l)} onChange={() => toggle('level', l)} />)}</fieldset>
      <fieldset><legend>Topic</legend>{categories.map((l) => <Checkbox key={l} label={l} checked={cats.includes(l)} onChange={() => toggle('category', l)} />)}</fieldset>
      <fieldset><legend>Price</legend>{[['any', 'Any price'], ['free', 'Free'], ['paid', 'Paid']].map(([v, l]) => <Radio key={v} name="price" label={l} checked={price === v} onChange={() => update((n) => { v === 'any' ? n.delete('price') : n.set('price', v); })} />)}</fieldset>
      <fieldset><legend>Length</legend>{[['any', 'Any length'], ['short', 'Up to 4 weeks'], ['long', '5 weeks or more']].map(([v, l]) => <Radio key={v} name="duration" label={l} checked={dur === v} onChange={() => update((n) => { v === 'any' ? n.delete('duration') : n.set('duration', v); })} />)}</fieldset>
      {active > 0 && <Button variant="tertiary" onClick={clear}>Clear all filters</Button>}
    </div>
  );
  return (
    <div className="site-main">
      <PageHeader title="UI/UX courses" lead="Practical courses taught live and recorded. Prices are in naira; dollar figures are estimates." />
      <SearchInput label="Search courses" value={query} onChange={setQuery} placeholder="Search by topic, skill or title" onSubmit={() => update((n) => { query.trim() ? n.set('q', query.trim()) : n.delete('q'); })} className="form" />
      <div className="catalogue" style={{ marginTop: 'var(--space-6)' }}>
        <aside className="filters desktop card card-sm" aria-label="Filters"><h2 style={{ fontSize: 'var(--text-md)', marginBottom: 8 }}>Filter courses</h2>{filters}</aside>
        <section aria-labelledby="results-h">
          <div className="toolbar">
            <h2 id="results-h" style={{ fontSize: 'var(--text-md)' }} aria-live="polite">{demo === 'loading' ? 'Loading courses…' : `${results.length} ${results.length === 1 ? 'course' : 'courses'}${q ? ` for “${sp.get('q')}”` : ''}`}</h2>
            <div className="row">
              <span className="mobile-only"><Button variant="secondary" size="sm" icon={<LuSlidersHorizontal aria-hidden="true" />} onClick={() => setOpen(true)}>Filters{active ? ` (${active})` : ''}</Button></span>
              <Select label="Sort by" options={SORTS} value={sort} onChange={(e) => update((n) => n.set('sort', e.target.value))} className="nowrap" />
            </div>
          </div>
          {demo === 'loading' ? <LoadingCards label="Loading courses" /> : results.length ? (
            <div className="course-grid" style={{ gridTemplateColumns: undefined }}>{results.map((c) => <CourseCard key={c.id} course={c} instructorName={userById(db, c.instructorId)!.name} enrolled={enrolmentFor(db, user?.id, c.id)?.status === 'active'} />)}</div>
          ) : (
            <EmptyState icon={<LuSearchX />} title="No courses match your search" actions={<><Button onClick={() => { setQuery(''); setSp(new URLSearchParams(), { replace: true }); }}>Clear search and filters</Button><Button variant="secondary" to="/help">Ask us for a recommendation</Button></>}>
              {q ? `Nothing matched “${sp.get('q')}”. Try a broader word such as “research”, “mobile” or “writing”.` : 'Try removing a filter.'}
            </EmptyState>
          )}
        </section>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filter courses" footer={<Button block onClick={() => setOpen(false)}>Show {results.length} {results.length === 1 ? 'course' : 'courses'}</Button>}>{filters}</Drawer>
    </div>
  );
}
