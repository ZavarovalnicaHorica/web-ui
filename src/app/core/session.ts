import { computed, Injectable, signal } from '@angular/core';
import { Session } from './models';

const STORAGE_KEY = 'claimdesk.session';

function load(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Who is logged in. Kept for the browser tab only (sessionStorage). */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly state = signal<Session | null>(load());

  readonly session = this.state.asReadonly();
  readonly user = computed(() => this.state()?.user ?? null);
  readonly organisation = computed(() => this.state()?.organisation ?? null);
  readonly token = computed(() => this.state()?.token ?? null);
  readonly isLoggedIn = computed(() => this.state() !== null);
  readonly isManager = computed(() => this.state()?.user.role === 'MANAGER');

  start(session: Session) {
    this.state.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage blocked: the login still works until the tab is closed or reloaded.
    }
  }

  end() {
    this.state.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
