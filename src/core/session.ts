import { useSyncExternalStore } from 'react';
import type { Session } from './models';

const STORAGE_KEY = 'horica.session';

function load(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Who is logged in. Kept for this browser tab only (sessionStorage). */
let current: Session | null = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSession(): Session | null {
  return current;
}

export function startSession(session: Session) {
  current = session;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the login lasts until the page is reloaded.
  }
  emit();
}

export function endSession() {
  current = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook: the current session, re-renders on login and logout. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession);
}
