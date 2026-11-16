/* LOCAL VERIFICATION SHIM — NOT SHIPPED.
   This sandbox could not install packages, so tools/build-local.mjs aliases 'react-router-dom' to this
   small hash-router that implements only the subset of the React Router v7 API used in src/.
   With network access, `npm install` uses the real react-router-dom and this file is ignored. */
import React, { createContext, useContext, useEffect, useMemo, useState, Children, isValidElement } from 'react';

type Loc = { pathname: string; search: string; hash: string; state?: unknown };
type NavOpts = { replace?: boolean; state?: unknown };
type Ctx = { location: Loc; navigate: (to: string | number, o?: NavOpts) => void };
const RouterCtx = createContext<Ctx | null>(null);
const RouteCtx = createContext<{ outlet: React.ReactNode; params: Record<string, string> }>({ outlet: null, params: {} });

function readLoc(): Loc {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathAndSearch, hash = ''] = raw.split('#');
  const [pathname, search = ''] = pathAndSearch.split('?');
  return { pathname: pathname.startsWith('/') ? pathname : '/' + pathname, search: search ? '?' + search : '', hash: hash ? '#' + hash : '' };
}
let pendingState: unknown;
export function HashRouter({ children }: { children: React.ReactNode }) {
  const [location, setLoc] = useState<Loc>(readLoc);
  useEffect(() => { const on = () => { setLoc({ ...readLoc(), state: pendingState }); pendingState = undefined; }; window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  const navigate = (to: string | number, o: NavOpts = {}) => {
    if (typeof to === 'number') { window.history.go(to); return; }
    const target = to.startsWith('?') ? location.pathname + to : to;
    pendingState = o.state;
    if (o.replace) { window.history.replaceState(null, '', '#' + target); setLoc({ ...readLoc(), state: o.state }); }
    else if ('#' + target === window.location.hash) setLoc({ ...readLoc(), state: o.state });
    else window.location.hash = target;
  };
  return <RouterCtx.Provider value={{ location, navigate }}>{children}</RouterCtx.Provider>;
}
export const BrowserRouter = HashRouter;

type RouteDef = { path?: string; index?: boolean; element?: React.ReactNode; children: RouteDef[] };
export function Route(_: { path?: string; index?: boolean; element?: React.ReactNode; children?: React.ReactNode }): null { return null; }
function collect(children: React.ReactNode): RouteDef[] {
  const out: RouteDef[] = [];
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    if (c.type === React.Fragment) { out.push(...collect((c.props as { children?: React.ReactNode }).children)); return; }
    const p = c.props as { path?: string; index?: boolean; element?: React.ReactNode; children?: React.ReactNode };
    out.push({ path: p.path, index: p.index, element: p.element, children: collect(p.children) });
  });
  return out;
}
const join = (a: string, b: string) => ('/' + [a, b].join('/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
function matchPrefix(pattern: string, pathname: string, end: boolean): { params: Record<string, string>; rest: string } | null {
  const ps = pattern.split('/').filter(Boolean); const xs = pathname.split('/').filter(Boolean); const params: Record<string, string> = {};
  for (let i = 0; i < ps.length; i++) {
    if (ps[i] === '*') { params['*'] = xs.slice(i).join('/'); return { params, rest: '' }; }
    if (i >= xs.length) return null;
    if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(xs[i]);
    else if (ps[i].toLowerCase() !== xs[i].toLowerCase()) return null;
  }
  const rest = xs.slice(ps.length).join('/');
  if (end && rest) return null;
  return { params, rest };
}
type M = { route: RouteDef; params: Record<string, string> };
function matchRoutes(routes: RouteDef[], pathname: string, base: string): M[] | null {
  for (const r of routes) {
    if (r.index) { if (pathname.replace(/\/$/, '') === base.replace(/\/$/, '') || (pathname === '/' && base === '/')) return [{ route: r, params: {} }]; continue; }
    const full = r.path?.startsWith('/') ? r.path : join(base, r.path || '');
    if (r.children.length) {
      const m = matchPrefix(full, pathname, false);
      if (m) { const kids = matchRoutes(r.children, pathname, full); if (kids) return [{ route: r, params: m.params }, ...kids]; if (r.element && !m.rest) return [{ route: r, params: m.params }]; }
    } else {
      const m = matchPrefix(full, pathname, true);
      if (m) return [{ route: r, params: m.params }];
    }
  }
  return null;
}
export function Routes({ children }: { children: React.ReactNode }) {
  const { location } = useRouter();
  const routes = useMemo(() => collect(children), [children]);
  const ms = matchRoutes(routes, location.pathname, '/') || [];
  const params = Object.assign({}, ...ms.map((m) => m.params));
  let el: React.ReactNode = null;
  for (let i = ms.length - 1; i >= 0; i--) el = <RouteCtx.Provider value={{ outlet: el, params }}>{ms[i].route.element ?? <Outlet />}</RouteCtx.Provider>;
  return <>{el}</>;
}
export function Outlet() { return <>{useContext(RouteCtx).outlet}</>; }
function useRouter() { const c = useContext(RouterCtx); if (!c) throw new Error('Router missing'); return c; }
export const useLocation = () => useRouter().location;
export const useNavigate = () => useRouter().navigate;
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() { return useContext(RouteCtx).params as T; }
export function useSearchParams(): [URLSearchParams, (n: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams), o?: NavOpts) => void] {
  const { location, navigate } = useRouter();
  const sp = new URLSearchParams(location.search);
  const set = (n: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams), o?: NavOpts) => {
    const next = typeof n === 'function' ? n(new URLSearchParams(location.search)) : new URLSearchParams(n as Record<string, string>);
    const q = next.toString(); navigate(location.pathname + (q ? '?' + q : ''), o);
  };
  return [sp, set];
}
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; replace?: boolean; state?: unknown };
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, state, onClick, ...rest }, ref) {
  const { navigate } = useRouter();
  return <a ref={ref} href={'#' + to} onClick={(e) => { onClick?.(e); if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.button !== 0) return; e.preventDefault(); navigate(to, { replace, state }); }} {...rest} />;
});
type NavLinkProps = Omit<LinkProps, 'className' | 'children'> & { end?: boolean; className?: string | ((s: { isActive: boolean }) => string); children?: React.ReactNode | ((s: { isActive: boolean }) => React.ReactNode) };
export function NavLink({ end, className, children, ...rest }: NavLinkProps) {
  const { location } = useRouter();
  const target = rest.to.split('?')[0];
  const isActive = end ? location.pathname === target : location.pathname === target || location.pathname.startsWith(target.replace(/\/$/, '') + '/');
  return <Link {...rest} aria-current={isActive ? 'page' : undefined} className={typeof className === 'function' ? className({ isActive }) : className}>{typeof children === 'function' ? children({ isActive }) : children}</Link>;
}
export function Navigate({ to, replace }: { to: string; replace?: boolean }) { const n = useNavigate(); useEffect(() => { n(to, { replace }); }, [to]); return null; }
