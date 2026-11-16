import type { ReactNode } from 'react';
import { useSession } from '../hooks/useSession';
import { Restricted } from '../features/public/System';
import type { Role } from '../types';

/** Frontend-only guard for the prototype. It shapes what is shown; it is NOT security —
 *  a real backend must enforce permissions on every request. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useSession();
  if (!user) return <Restricted reason="signed-out" role={role} />;
  if (user.role !== role) return <Restricted reason="wrong-role" role={role} />;
  return <>{children}</>;
}
