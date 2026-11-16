import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LuGraduationCap, LuMenu, LuBell, LuLayoutDashboard, LuBookOpen, LuChartLine, LuAward, LuReceipt, LuLifeBuoy, LuUser, LuSettings,
  LuLogOut, LuClipboardList, LuUsers, LuShieldCheck, LuLandmark, LuUndo2, LuFileCheck, LuChartBar, LuSlidersHorizontal, LuBookMarked, LuMegaphone, LuHouse, LuMessageSquare, LuUserCog,
} from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { unreadCount } from '../../data/selectors';
import { api } from '../../data/services';
import { Avatar } from '../ui/data';
import { Button, IconButton } from '../ui/Button';
import { Drawer } from '../ui/overlay';
import type { Role } from '../../types';

export function Brand({ to = '/' }: { to?: string }) {
  return <Link to={to} className="brand" aria-label="LearnUX home"><span className="brand-mark" aria-hidden="true"><LuGraduationCap /></span>LearnUX</Link>;
}
export function PageHeader({ title, lead, actions, crumbs }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; crumbs?: ReactNode }) {
  return <header className="page-header"><div className="grow">{crumbs}<h1>{title}</h1>{lead && <p className="lead">{lead}</p>}</div>{actions && <div className="row">{actions}</div>}</header>;
}
const roleHome: Record<Role, string> = { learner: '/learn', instructor: '/teach', admin: '/admin' };

/* ---------- Public ---------- */
export function PublicLayout() {
  const { user } = useSession(); const [open, setOpen] = useState(false);
  const links: [string, string][] = [['/courses', 'Courses'], ['/help', 'Help centre'], ['/verify', 'Verify a certificate']];
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Brand />
          <nav className="site-nav" aria-label="Main">{links.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}</nav>
          <div className="header-actions">
            {user ? <Button className="desktop-only" variant="secondary" to={roleHome[user.role]}>Go to my {user.role === 'learner' ? 'learning' : 'workspace'}</Button>
              : <><Button className="desktop-only" variant="tertiary" to="/login">Log in</Button><Button className="desktop-only" to="/signup">Create account</Button></>}
            <IconButton className="mobile-only" label="Open menu" icon={<LuMenu aria-hidden="true" />} onClick={() => setOpen(true)} aria-expanded={open} />
          </div>
        </div>
      </header>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <div className="nav-drawer stack"><nav aria-label="Main (mobile)" className="stack-sm" onClick={() => setOpen(false)}>
          {links.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}
          {user ? <NavLink to={roleHome[user.role]}>My {user.role === 'learner' ? 'learning' : 'workspace'}</NavLink> : <><NavLink to="/login">Log in</NavLink><NavLink to="/signup">Create account</NavLink></>}
        </nav></div>
      </Drawer>
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}><Outlet /></main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="stack-sm"><Brand /><p className="secondary">Practical UI/UX courses with live sessions and recordings. A fictional prototype — no real payments or accounts.</p><p className="muted">Prices in naira (₦). Dollar figures are estimates.</p></div>
          <div><h2>Learn</h2><ul><li><Link to="/courses">All courses</Link></li><li><Link to="/courses?level=Beginner">Beginner courses</Link></li><li><Link to="/courses/DT-100">Free course</Link></li></ul></div>
          <div><h2>Support</h2><ul><li><Link to="/help">Help centre</Link></li><li><Link to="/help/bank-transfer-pending">Payment pending?</Link></li><li><Link to="/help/refunds">Refunds</Link></li></ul></div>
          <div><h2>Trust</h2><ul><li><Link to="/verify">Verify a certificate</Link></li><li><Link to="/help/certificates">About certificates</Link></li></ul></div>
        </div>
      </footer>
    </>
  );
}

/* ---------- Auth ---------- */
export function AuthLayout() {
  return (
    <div className="auth-shell">
      <aside className="auth-aside" aria-label="About LearnUX">
        <Brand />
        <div className="stack"><h2>Learn at your pace, with people who teach for a living.</h2><p>Weekly live sessions, recordings within 48 hours, and a year of access to every course you join.</p></div>
        <p className="small" style={{ color: '#c7d2fe' }}>Prototype: accounts and emails are simulated. Never enter a real password.</p>
      </aside>
      <main id="main" className="auth-main" tabIndex={-1} style={{ outline: 'none' }}><div className="auth-card"><div className="mobile-only" style={{ marginBottom: 24 }}><Brand /></div><Outlet /></div></main>
    </div>
  );
}

/* ---------- Workspaces ---------- */
type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean; count?: number } | { group: string };
function navFor(role: Role, unread: number, extras: { grading: number; approvals: number; tickets: number; refunds: number }): NavItem[] {
  if (role === 'learner') return [
    { to: '/learn', label: 'Dashboard', icon: <LuLayoutDashboard />, end: true }, { to: '/learn/courses', label: 'My courses', icon: <LuBookOpen /> },
    { to: '/learn/progress', label: 'Progress', icon: <LuChartLine /> }, { to: '/learn/certificates', label: 'Certificates', icon: <LuAward /> },
    { to: '/learn/notifications', label: 'Notifications', icon: <LuBell />, count: unread }, { group: 'Account' },
    { to: '/learn/payments', label: 'Payments & refunds', icon: <LuReceipt /> }, { to: '/learn/support', label: 'Support', icon: <LuLifeBuoy /> },
    { to: '/learn/profile', label: 'Profile', icon: <LuUser /> }, { to: '/learn/settings', label: 'Settings', icon: <LuSettings /> }];
  if (role === 'instructor') return [
    { to: '/teach', label: 'Dashboard', icon: <LuLayoutDashboard />, end: true }, { to: '/teach/courses', label: 'Courses', icon: <LuBookMarked /> },
    { to: '/teach/submissions', label: 'Submissions', icon: <LuClipboardList />, count: extras.grading }, { to: '/teach/courses/UXF-101/learners', label: 'Learners', icon: <LuUsers /> },
    { to: '/teach/courses/UXF-101/announcements', label: 'Announcements', icon: <LuMegaphone /> }, { to: '/teach/courses/UXF-101/analytics', label: 'Analytics', icon: <LuChartBar /> }];
  return [
    { to: '/admin', label: 'Dashboard', icon: <LuLayoutDashboard />, end: true }, { group: 'People' },
    { to: '/admin/users', label: 'Users', icon: <LuUsers /> }, { to: '/admin/roles', label: 'Roles & permissions', icon: <LuUserCog /> },
    { group: 'Learning' }, { to: '/admin/courses', label: 'Course review', icon: <LuShieldCheck />, count: extras.approvals }, { to: '/admin/enrolments', label: 'Enrolments', icon: <LuBookOpen /> }, { to: '/admin/certificates', label: 'Certificates', icon: <LuFileCheck /> },
    { group: 'Money & service' }, { to: '/admin/transactions', label: 'Transactions', icon: <LuLandmark /> }, { to: '/admin/refunds', label: 'Refunds', icon: <LuUndo2 />, count: extras.refunds },
    { to: '/admin/support', label: 'Support queue', icon: <LuLifeBuoy />, count: extras.tickets }, { group: 'Platform' }, { to: '/admin/reports', label: 'Reports', icon: <LuChartBar /> }, { to: '/admin/settings', label: 'Platform settings', icon: <LuSlidersHorizontal /> }];
}
function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return <>{items.map((n, i) => 'group' in n ? <div key={i} className="group" aria-hidden="true">{n.group}</div> : <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}><span aria-hidden="true">{n.icon}</span>{n.label}{n.count ? <span className="count" aria-label={`${n.count} items`}>{n.count}</span> : null}</NavLink>)}</>;
}
export function WorkspaceLayout({ role }: { role: Role }) {
  const { db, user } = useSession(); const [open, setOpen] = useState(false); const navigate = useNavigate(); const loc = useLocation();
  const unread = unreadCount(db, user?.id);
  const extras = { grading: db.submissions.filter((s) => s.status === 'submitted' && db.courses.find((c) => c.assessmentIds.includes(s.assessmentId))?.instructorId === user?.id).length, approvals: db.courses.filter((c) => c.status === 'in_review').length, tickets: db.tickets.filter((t) => t.status === 'open').length, refunds: db.refunds.filter((r) => r.status === 'approved' || (r.status === 'submitted')).length };
  const items = navFor(role, unread, extras);
  const label = { learner: 'Learner', instructor: 'Instructor', admin: 'Administrator' }[role];
  const wide = /\/admin\/(support|transactions|users|enrolments)|\/teach\/submissions\//.test(loc.pathname);
  return (
    <>
      <div className="ws">
        <aside className="ws-sidebar" aria-label={`${label} navigation`}>
          <Brand to={roleHome[role]} />
          <p className="ws-role">{label} workspace</p>
          <nav className="ws-nav" aria-label={`${label} sections`}><NavList items={items} /></nav>
          <div style={{ marginTop: 'auto' }} className="ws-nav"><Link to="/" style={{ minHeight: 40 }}><LuHouse aria-hidden="true" />Public site</Link></div>
        </aside>
        <div style={{ minWidth: 0 }}>
          <header className="ws-topbar">
            <span className="mobile-only"><IconButton label="Open navigation" icon={<LuMenu aria-hidden="true" />} onClick={() => setOpen(true)} /></span>
            <span className="mobile-only"><Brand to={roleHome[role]} /></span>
            <span className="small muted desktop-only" style={{ display: 'inline' }}>{label} workspace</span>
            <span className="grow" />
            {role === 'learner' && <Button variant="tertiary" size="sm" to="/courses" className="desktop-only">Browse courses</Button>}
            {role === 'learner' && <IconButton label="Notifications" to="/learn/notifications" icon={<LuBell aria-hidden="true" />} badge={unread} />}
            {role === 'learner' && <IconButton className="hide-xs" label="Course discussions" to="/learn/courses/UXF-101/discussions" icon={<LuMessageSquare aria-hidden="true" />} />}
            {user && <Link to={role === 'learner' ? '/learn/profile' : roleHome[role]} className="user-chip"><Avatar initials={user.initials} size="sm" /><span>{user.name}</span></Link>}
            <IconButton label="Sign out" icon={<LuLogOut aria-hidden="true" />} onClick={() => { api.logout(); navigate('/'); }} />
          </header>
          <main id="main" tabIndex={-1} className={'ws-main' + (wide ? ' wide' : '')} style={{ outline: 'none' }}><Outlet /></main>
        </div>
      </div>
      {role === 'learner' && (
        <nav className="bottom-nav" aria-label="Learner quick navigation">
          <NavLink to="/learn" end><LuLayoutDashboard aria-hidden="true" />Home</NavLink>
          <NavLink to="/learn/courses"><LuBookOpen aria-hidden="true" />Courses</NavLink>
          <NavLink to="/learn/progress"><LuChartLine aria-hidden="true" />Progress</NavLink>
          <NavLink to="/learn/notifications"><LuBell aria-hidden="true" />Alerts{unread ? <span className="sr-only"> ({unread} unread)</span> : null}</NavLink>
          <NavLink to="/learn/profile"><LuUser aria-hidden="true" />Account</NavLink>
        </nav>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} title={`${label} menu`} side="left">
        <nav className="ws-nav nav-drawer" aria-label={`${label} sections (mobile)`}><NavList items={items} onNavigate={() => setOpen(false)} /><Link to="/" onClick={() => setOpen(false)}><LuHouse aria-hidden="true" />Public site</Link></nav>
      </Drawer>
    </>
  );
}
