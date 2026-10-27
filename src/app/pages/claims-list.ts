import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { ClaimStatus } from '../core/models';
import { nameOf } from '../core/stats';
import { StatusBadge } from '../shared/status-badge';

type Filter = 'ALL' | ClaimStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEEDS_REVIEW', label: 'Needs review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

@Component({
  selector: 'app-claims-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge],
  template: `
    <div class="page-head">
      <h1>Claims</h1>
      <a class="btn btn-primary" routerLink="/claims/new">New claim</a>
    </div>

    <div class="filters" role="group" aria-label="Filter by status">
      @for (f of filters; track f.value) {
        <button
          type="button"
          class="chip"
          [class.chip-active]="filter() === f.value"
          (click)="filter.set(f.value)"
        >
          {{ f.label }}
        </button>
      }
    </div>

    @if (claims.isLoading()) {
      <p class="muted">Loading claims…</p>
    } @else if (claims.error()) {
      <p class="error">Could not load claims.</p>
    } @else {
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Claimant</th>
              <th>Type</th>
              <th class="num">Amount</th>
              <th class="num">Risk</th>
              <th>Status</th>
              <th>Reviewer</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            @for (c of visible(); track c.id) {
              <tr>
                <td><a [routerLink]="['/claims', c.id]">{{ c.id }}</a></td>
                <td>{{ c.claimant }}</td>
                <td>{{ c.type }}</td>
                <td class="num">{{ c.amount | currency: 'EUR' }}</td>
                <td class="num">{{ c.riskScore ?? '–' }}</td>
                <td><app-status-badge [status]="c.status" /></td>
                <td>
                  @if (c.review) {
                    {{ c.review.reviewerName }}
                  } @else if (c.assignment) {
                    {{ name(c.assignment.assigneeId) }}
                  } @else if (c.status === 'NEEDS_REVIEW') {
                    <span class="muted">Unassigned</span>
                  } @else {
                    <span class="muted">Agents</span>
                  }
                </td>
                <td>{{ c.createdAt | date: 'mediumDate' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="muted">No claims.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ClaimsList {
  private readonly api = inject(ClaimsApi);

  /** Optional ?status= query parameter, e.g. from the dashboard tiles. */
  readonly status = input<string>();

  protected readonly filters = FILTERS;
  protected readonly filter = linkedSignal<Filter>(() => {
    const s = this.status();
    return FILTERS.some((f) => f.value === s) ? (s as Filter) : 'ALL';
  });

  protected readonly claims = rxResource({ stream: () => this.api.listClaims() });
  protected readonly users = rxResource({ stream: () => this.api.listUsers() });

  protected readonly visible = computed(() => {
    const all = this.claims.value() ?? [];
    const f = this.filter();
    return f === 'ALL' ? all : all.filter((c) => c.status === f);
  });

  protected name(id: string) {
    return nameOf(this.users.value(), id);
  }
}
