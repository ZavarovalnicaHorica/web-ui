import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { DEMO_PASSWORD, USERS } from '../core/mock-data';
import { APP_NAME } from '../core/models';
import { SessionStore } from '../core/session';
import { settings } from '../core/settings';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login">
      <div class="login-brand">
        <span class="logo" aria-hidden="true">CD</span>
        <h1>{{ appName }}</h1>
        <p class="muted">Internal claims workspace for insurance staff</p>
      </div>

      <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Organisation
          <select formControlName="orgId">
            <option value="" disabled>Choose your organisation…</option>
            @for (o of organisations.value() ?? []; track o.id) {
              <option [value]="o.id">{{ o.name }}</option>
            }
          </select>
        </label>

        <label>
          Username
          <input formControlName="username" autocomplete="username" />
        </label>

        <label>
          Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || busy()">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      @if (mock) {
        <aside class="card demo">
          <strong>Demo accounts</strong> (mock mode only, fictional data)
          <p class="muted">
            Password for every account: <code>{{ demoPassword }}</code>
          </p>
          @if (demoUsers().length) {
            <ul>
              @for (u of demoUsers(); track u.id) {
                <li>
                  <button type="button" class="link" (click)="pick(u.username)">{{ u.username }}</button>
                  · {{ u.name }}
                  @if (u.role === 'MANAGER') {
                    <span class="badge badge-neutral">Manager</span>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="muted">Choose an organisation to see its accounts.</p>
          }
        </aside>
      }
    </div>
  `,
})
export class Login {
  private readonly api = inject(ClaimsApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly appName = APP_NAME;
  protected readonly mock = settings.useMockApi;
  protected readonly demoPassword = DEMO_PASSWORD;

  protected readonly organisations = rxResource({ stream: () => this.api.listOrganisations() });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    orgId: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  private readonly orgId = signal('');
  protected readonly demoUsers = computed(() => USERS.filter((u) => u.orgId === this.orgId()));

  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    this.form.controls.orgId.valueChanges.subscribe((id) => this.orgId.set(id));
  }

  protected pick(username: string) {
    this.form.patchValue({ username, password: this.demoPassword });
  }

  protected submit() {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    this.api.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.session.start(session);
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? 'Sign in failed.');
      },
    });
  }
}
