import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { completedReviewsOf, nameOf, needsReview, openReviewsOf } from '../core/stats';
import { SessionStore } from '../core/session';
import { ReviewForm } from '../shared/review-form';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-my-reviews',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReviewForm, StatusBadge],
  template: `
    <div class="page-head">
      <div>
        <h1>My reviews</h1>
        <p class="muted">
          Claims the agents flagged as risky or incomplete, assigned to you. You make the final decision.
        </p>
      </div>
    </div>

    @if (session.isManager() && unassignedCount() > 0) {
      <p class="notice">
        {{ unassignedCount() }} review(s) have no assignee.
        <a routerLink="/dashboard">Assign them on the dashboard</a>
      </p>
    }

    @if (claims.isLoading() && !claims.hasValue()) {
      <p class="muted">Loading…</p>
    } @else if (claims.error()) {
      <p class="error">Could not load your reviews.</p>
    } @else {
      @for (c of open(); track c.id) {
        <article class="card review">
          <div class="step-head">
            <h2><a [routerLink]="['/claims', c.id]">{{ c.id }}</a> · {{ c.claimant }}</h2>
            <span class="risk-pill" [class.risk-pill-high]="(c.riskScore ?? 0) >= 60">
              Risk {{ c.riskScore }}
            </span>
          </div>
          <p>{{ c.type }} · {{ c.amount | currency: 'EUR' }} · {{ c.description }}</p>
          <p class="muted small">
            Assigned by {{ name(c.assignment?.assignedById) }} on
            {{ c.assignment?.assignedAt | date: 'mediumDate' }}
          </p>
          @if (c.assignment?.note) {
            <p class="note">“{{ c.assignment?.note }}”</p>
          }

          <ul class="flags">
            @for (a of c.agents; track a.agent) {
              @if (a.outcome !== 'PASS') {
                <li><app-status-badge [status]="a.outcome" /> {{ a.agent }}: {{ a.note }}</li>
              }
            }
          </ul>

          <app-review-form [claim]="c" (decided)="claims.reload()" />
        </article>
      } @empty {
        <div class="card"><p class="muted">No reviews assigned to you right now.</p></div>
      }

      @if (done().length) {
        <section class="card table-wrap">
          <h2 class="table-title">Recently completed by you</h2>
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Claimant</th>
                <th>Decision</th>
                <th>Decided</th>
              </tr>
            </thead>
            <tbody>
              @for (c of done(); track c.id) {
                <tr>
                  <td><a [routerLink]="['/claims', c.id]">{{ c.id }}</a></td>
                  <td>{{ c.claimant }}</td>
                  <td><app-status-badge [status]="c.status" /></td>
                  <td>{{ c.review?.decidedAt | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    }
  `,
})
export class MyReviews {
  private readonly api = inject(ClaimsApi);
  protected readonly session = inject(SessionStore);

  protected readonly claims = rxResource({ stream: () => this.api.listClaims() });
  protected readonly users = rxResource({ stream: () => this.api.listUsers() });

  private readonly myId = computed(() => this.session.user()?.id ?? '');
  protected readonly open = computed(() => openReviewsOf(this.claims.value() ?? [], this.myId()));
  protected readonly done = computed(() =>
    completedReviewsOf(this.claims.value() ?? [], this.myId())
      .sort((a, b) => (b.review?.decidedAt ?? '').localeCompare(a.review?.decidedAt ?? ''))
      .slice(0, 5),
  );
  protected readonly unassignedCount = computed(
    () => (this.claims.value() ?? []).filter((c) => needsReview(c) && !c.assignment).length,
  );

  protected name(id: string | undefined) {
    return nameOf(this.users.value(), id);
  }
}
