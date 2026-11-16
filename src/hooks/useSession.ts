import { useDB } from '../data/store';
import { currentUser } from '../data/selectors';
export function useSession() { const db = useDB(); const user = currentUser(db); return { db, user, userId: user?.id ?? null }; }
