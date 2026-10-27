import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { completedReviewsOf, openReviewsOf } from '../core/stats';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-employee-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ user()?.name ?? 'Employee' }}</h1>
        @if (user(); as u) {
          <p class="muted">{{ u.title }} · {{ u.username }}</p>
        }
      </div>
      <a class="btn" routerLink="/team">Back to team</a>
    </div>

    @if (users.isLoading() || claims.isLoading()) {
      <p class="muted">Loading…</p>
    } @else if (!user()) {
      <p class="error">Employee not found.</p>
    } @else {
      <div class="tiles">
        <div class="tile tile-warn">
          <span>Open reviews</span>
          <strong>{{ open().length }}</strong>
        </div>
        <div class="tile">
          <span>Completed</span>
          <strong>{{ done().length }}</strong>
        </div>
        <div class="tile">
          <span>Approved</span>
          <strong>{{ approved() }}</strong>
        </div>
        <div class="tile">
          <span>Rejected</span>
          <strong>{{ done().length - approved() }}</strong>
        </div>
      </div>

      <section class="card table-wrap">
        <h2 class="table-title">Assigned reviews</h2>
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Claimant</th>
              <th class="num">Amount</th>
              <th class="num">Risk</th>
              <th>Assigned</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            @for (c of open(); track c.id) {
              <tr>
                <td><a [routerLink]="['/claims', c.id]">{{ c.id }}</a></td>
                <td>{{ c.claimant }}</td>
                <td class="num">{{ c.amount | currency: 'EUR' }}</td>
                <td class="num">{{ c.riskScore }}</td>
                <td>{{ c.assignment?.assignedAt | date: 'mediumDate' }}</td>
                <td class="muted">{{ c.assignment?.note || '–' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="muted">No open reviews.</td></tr>
            }
          </tbody>
        </table>
      </section>

      <section class="card table-wrap">
        <h2 class="table-title">Completed reviews</h2>
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Claimant</th>
              <th>Decision</th>
              <th>Decided</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            @for (c of done(); track c.id) {
              <tr>
                <td><a [routerLink]="['/claims', c.id]">{{ c.id }}</a></td>
                <td>{{ c.claimant }}</td>
                <td><app-status-badge [status]="c.status" /></td>
                <td>{{ c.review?.decidedAt | date: 'mediumDate' }}</td>
                <td class="muted">{{ c.review?.comment || '–' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="muted">No completed reviews yet.</td></tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class EmployeeDetail {
  private readonly api = inject(ClaimsApi);

  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  protected readonly users = rxResource({ stream: () => this.api.listUsers() });
  protected readonly claims = rxResource({ stream: () => this.api.listClaims() });

  protected readonly user = computed(() => this.users.value()?.find((u) => u.id === this.id()));
  protected readonly open = computed(() => openReviewsOf(this.claims.value() ?? [], this.id()));
  protected readonly done = computed(() => completedReviewsOf(this.claims.value() ?? [], this.id()));
  protected readonly approved = computed(
    () => this.done().filter((c) => c.review?.decision === 'APPROVED').length,
  );
}
