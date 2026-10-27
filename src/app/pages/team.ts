import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { workload } from '../core/stats';
import { SessionStore } from '../core/session';

@Component({
  selector: 'app-team',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Team</h1>
        <p class="muted">Everyone in {{ session.organisation()?.name }}</p>
      </div>
    </div>

    @if (users.isLoading() || claims.isLoading()) {
      <p class="muted">Loading…</p>
    } @else if (users.error() || claims.error()) {
      <p class="error">Could not load the team.</p>
    } @else {
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Username</th>
              <th>Role</th>
              <th class="num">Open reviews</th>
              <th class="num">Approved</th>
              <th class="num">Rejected</th>
            </tr>
          </thead>
          <tbody>
            @for (w of rows(); track w.user.id) {
              <tr>
                <td><a [routerLink]="['/team', w.user.id]">{{ w.user.name }}</a></td>
                <td>{{ w.user.title }}</td>
                <td class="muted">{{ w.user.username }}</td>
                <td>
                  <span [class]="w.user.role === 'MANAGER' ? 'badge badge-neutral' : 'badge badge-good'">
                    {{ w.user.role === 'MANAGER' ? 'Manager' : 'Employee' }}
                  </span>
                </td>
                <td class="num">{{ w.open }}</td>
                <td class="num">{{ w.approved }}</td>
                <td class="num">{{ w.rejected }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class Team {
  private readonly api = inject(ClaimsApi);
  protected readonly session = inject(SessionStore);

  protected readonly users = rxResource({ stream: () => this.api.listUsers() });
  protected readonly claims = rxResource({ stream: () => this.api.listClaims() });

  protected readonly rows = computed(() =>
    workload(this.claims.value() ?? [], this.users.value() ?? []).sort(
      (a, b) => a.user.role.localeCompare(b.user.role) || a.user.name.localeCompare(b.user.name),
    ),
  );
}
