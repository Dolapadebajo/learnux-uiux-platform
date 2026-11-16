/* Tiny client-side store. Simulates a backend: every write goes through a service function in
   services.ts, the result is persisted to localStorage (if available) and all views re-render. */
import { useSyncExternalStore } from 'react';
import type { DB } from '../types';
import { createSeed } from './seed';

const KEY = 'learnux-demo-db';
let current: DB = load();
const listeners = new Set<() => void>();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw) as DB; if (parsed.version === createSeed().version) return parsed; }
  } catch { /* storage unavailable or corrupt — fall back to seed */ }
  return structuredClone(createSeed());
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore quota/private mode */ } }
function emit() { listeners.forEach((l) => l()); }

export const store = {
  get: () => current,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Run a mutation against a draft copy, then commit. Returns the mutation's result. */
  run<R>(mutate: (draft: DB) => R): R {
    const draft = structuredClone(current);
    const result = mutate(draft);
    current = draft; persist(); emit();
    return result;
  },
  reset() { current = structuredClone(createSeed()); persist(); emit(); },
};

export function useDB(): DB { return useSyncExternalStore(store.subscribe, store.get, store.get); }
