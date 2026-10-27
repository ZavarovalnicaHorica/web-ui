import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { claimTotals, nameOf, needsReview, workload } from '../core/stats';
import { SessionStore } from '../core/session';
import { AssignReview } from '../shared/assign-review';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, AssignReview],
  template: `
    <div class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p class="muted">{{ session.organisation()?.name }}</p>
      </div>
      <a class="btn" routerLink="/team">View team</a>
    </div>

    @if (claims.isLoading() && !claims.hasValue()) {
      <p class="muted">Loading…</p>
    } @else if (claims.error() || users.error()) {
      <p class="error">Could not load the dashboard.</p>
    } @else {
      <div class="tiles">
        <a class="tile" routerLink="/claims">
          <span>Claims</span>
          <strong>{{ totals().total }}</strong>
        </a>
        <a class="tile tile-warn" routerLink="/claims" [queryParams]="{ status: 'NEEDS_REVIEW' }">
          <span>Need review</span>
          <strong>{{ totals().needsReview }}</strong>
        </a>
        <div class="tile" [class.tile-bad]="totals().unassigned > 0">
          <span>Not assigned yet</span>
          <strong>{{ totals().unassigned }}</strong>
        </div>
        <a class="tile" routerLink="/claims" [queryParams]="{ status: 'APPROVED' }">
          <span>Approved</span>
          <strong>{{ totals().approved }}</strong>
        </a>
        <a class="tile" routerLink="/claims" [queryParams]="{ status: 'REJECTED' }">
          <span>Rejected</span>
          <strong>{{ totals().rejected }}</strong>
        </a>
        <div class="tile">
          <span>Decided by agents</span>
          <strong>{{ totals().autoDecided }}</strong>
        </div>
      </div>

      <section>
        <h2>Waiting for an assignee</h2>
        @for (c of unassigned(); track c.id) {
          <article class="card row-card">
            <div class="row-card-main">
              <a [routerLink]="['/claims', c.id]"><strong>{{ c.id }}</strong></a>
              · {{ c.claimant }} · {{ c.type }} · {{ c.amount | currency: 'EUR' }}
              <span class="risk-pill" [class.risk-pill-high]="(c.riskScore ?? 0) >= 60">
                Risk {{ c.riskScore }}
              </span>
              <p class="muted">{{ c.agents[c.agents.length - 1]?.note }}</p>
            </div>
            <app-assign-review
              [claim]="c"
              [employees]="employees()"
              [withNote]="true"
              (assigned)="claims.reload()"
            />
          </article>
        } @empty {
          <div class="card"><p class="muted">Every review has an assignee.</p></div>
        }
      </section>

      <div class="grid">
        <section class="card table-wrap">
          <h2 class="table-title">Team workload</h2>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th class="num">Open</th>
                <th class="num">Done</th>
              </tr>
            </thead>
            <tbody>
              @for (w of team(); track w.user.id) {
                <tr>
                  <td><a [routerLink]="['/team', w.user.id]">{{ w.user.name }}</a></td>
                  <td class="num">{{ w.open }}</td>
                  <td class="num">{{ w.completed }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="card table-wrap">
          <h2 class="table-title">Assigned and open</h2>
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Assignee</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              @for (c of assignedOpen(); track c.id) {
                <tr>
                  <td><a [routerLink]="['/claims', c.id]">{{ c.id }}</a></td>
                  <td>{{ name(c.assignment?.assigneeId) }}</td>
                  <td>{{ c.assignment?.assignedAt | date: 'mediumDate' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="muted">No open assigned reviews.</td></tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    }
  `,
})
export class Dashboard {
  private readonly api = inject(ClaimsApi);
  protected readonly session = inject(SessionStore);

  protected readonly claims = rxResource({ stream: () => this.api.listClaims() });
  protected readonly users = rxResource({ stream: () => this.api.listUsers() });

  protected readonly employees = computed(() =>
    (this.users.value() ?? []).filter((u) => u.role === 'EMPLOYEE'),
  );
  protected readonly totals = computed(() => claimTotals(this.claims.value() ?? []));
  protected readonly unassigned = computed(() =>
    (this.claims.value() ?? []).filter((c) => needsReview(c) && !c.assignment),
  );
  protected readonly assignedOpen = computed(() =>
    (this.claims.value() ?? []).filter((c) => needsReview(c) && c.assignment),
  );
  protected readonly team = computed(() => workload(this.claims.value() ?? [], this.employees()));

  protected name(id: string | undefined) {
    return nameOf(this.users.value(), id);
  }
}
