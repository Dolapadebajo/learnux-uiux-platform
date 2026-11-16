import { LuLock, LuCompass } from 'react-icons/lu';
import { Brand } from '../../components/layout/layouts';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/feedback';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import type { Role } from '../../types';

const home = { learner: '/learn', instructor: '/teach', admin: '/admin' };
const areaName = { learner: 'learner workspace', instructor: 'instructor workspace', admin: 'administration area' };

/** Shown instead of a workspace when the visitor isn't signed in or has a different role.
 *  Deliberately renders no workspace navigation. */
export function Restricted({ reason, role }: { reason: 'signed-out' | 'wrong-role'; role: Role }) {
  const { user } = useSession(); useTitle(reason === 'signed-out' ? 'Please log in' : 'Access restricted');
  return (
    <>
      <header className="site-header"><div className="site-header-inner"><Brand /></div></header>
      <main id="main" tabIndex={-1} className="site-main" style={{ maxWidth: 720, outline: 'none' }}>
        <EmptyState level={1} icon={<LuLock />} title={reason === 'signed-out' ? 'Please log in to continue' : 'You don’t have access to this page'}
          actions={reason === 'signed-out' ? <><Button to="/login">Log in</Button><Button variant="secondary" to="/signup">Create account</Button></> : <><Button to={home[user!.role]}>Go to my {areaName[user!.role]}</Button><Button variant="secondary" to="/learn/support/new">Contact support</Button></>}>
          {reason === 'signed-out' ? `This is part of the ${areaName[role]}. After you log in we’ll show it here.` : `This is the ${areaName[role]}. You’re signed in as ${user!.name} (${user!.role}). In this prototype you can switch persona with the Demo bar — that is a demo convenience, not security.`}
        </EmptyState>
      </main>
    </>
  );
}
export function NotFound() {
  useTitle('Page not found');
  return <div className="site-main" style={{ maxWidth: 720 }}><EmptyState level={1} icon={<LuCompass />} title="We can’t find that page" actions={<><Button to="/">Go to the homepage</Button><Button variant="secondary" to="/courses">Browse courses</Button></>}>The link may be old or mistyped.</EmptyState></div>;
}
