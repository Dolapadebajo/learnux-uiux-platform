import { useSearchParams } from 'react-router-dom';
/** Alternative states are inspected with ?demo=<state> on the relevant route (documented in the
 *  coverage matrix and the Demo panel) instead of creating duplicate routes. */
export function useDemoState<T extends string>(allowed: readonly T[]): T | null {
  const [sp] = useSearchParams();
  const v = sp.get('demo') as T | null;
  return v && allowed.includes(v) ? v : null;
}
