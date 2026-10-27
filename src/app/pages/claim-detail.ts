import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { nameOf } from '../core/stats';
import { SessionStore } from '../core/session';
import { settings } from '../core/settings';
import { AssignReview } from '../shared/assign-review';
import { ReviewForm } from '../shared/review-form';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-claim-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, AssignReview, ReviewForm],
  template: `
    <div class="page-head">
      <h1>Claim {{ id() }}</h1>
      <a class="btn" routerLink="/claims">Back to claims</a>
    </div>

    @if (claim.isLoading() && !claim.hasValue()) {
      <p class="muted">Loading…</p>
    } @else if (claim.error()) {
      <p class="error">Claim not found.</p>
    } @else if (claim.value(); as c) {
      <div class="grid">
        <section class="card">
          <h2>Details</h2>
          <dl>
            <dt>Status</dt>
            <dd><app-status-badge [status]="c.status" /></dd>
            <dt>Policy</dt>
            <dd>{{ c.policyNumber }}</dd>
            <dt>Claimant</dt>
            <dd>{{ c.claimant }}</dd>
            <dt>Type</dt>
            <dd>{{ c.type }}</dd>
            <dt>Incident date</dt>
            <dd>{{ c.incidentDate | date: 'mediumDate' }}</dd>
            <dt>Amount</dt>
            <dd>{{ c.amount | currency: 'EUR' }}</dd>
            <dt>Entered by</dt>
            <dd>{{ name(c.createdById) }}, {{ c.createdAt | date: 'medium' }}</dd>
            <dt>Documents</dt>
            <dd>
              @for (d of c.documents; track d) {
                <div>
                  @if (mock) {
                    <a [routerLink]="['/claims', c.id, 'document']" [queryParams]="{ file: d }">{{ d }}</a>
                  } @else {
                    <a [href]="documentUrl(c.id, d)" target="_blank" rel="noopener">{{ d }}</a>
                  }
                </div>
              } @empty {
                None
              }
            </dd>
          </dl>
          <h3>Description</h3>
          <p>{{ c.description }}</p>
        </section>

        <section class="card">
          <h2>Automated processing</h2>
          <div class="risk">
            <span>Risk score</span>
            <strong>{{ c.riskScore ?? '–' }}</strong>
            <div class="meter" aria-hidden="true">
              <div
                class="meter-fill"
                [class.meter-high]="(c.riskScore ?? 0) >= 60"
                [style.width.%]="c.riskScore ?? 0"
              ></div>
            </div>
          </div>

          <ol class="steps">
            @for (a of c.agents; track a.agent) {
              <li>
                <div class="step-head">
                  <strong>{{ a.agent }} agent</strong>
                  <app-status-badge [status]="a.outcome" />
                </div>
                <p class="muted">{{ a.note }}</p>
              </li>
            }
          </ol>

          @if (c.assignment || c.status === 'NEEDS_REVIEW') {
            <h3>Human review</h3>
          }

          @if (c.assignment; as a) {
            <p>
              Assigned to <strong>{{ name(a.assigneeId) }}</strong> by {{ name(a.assignedById) }},
              {{ a.assignedAt | date: 'mediumDate' }}
            </p>
            @if (a.note) {
              <p class="note">“{{ a.note }}”</p>
            }
          }

          @if (c.review; as r) {
            <p>
              <app-status-badge [status]="r.decision" />
              by {{ r.reviewerName }} on {{ r.decidedAt | date: 'medium' }}
            </p>
            @if (r.comment) {
              <p class="muted">“{{ r.comment }}”</p>
            }
          } @else if (c.status === 'NEEDS_REVIEW') {
            @if (!c.assignment) {
              <p class="notice">Waiting for a manager to assign this review.</p>
            }
            @if (session.isManager()) {
              <app-assign-review
                [claim]="c"
                [employees]="employees()"
                [withNote]="true"
                (assigned)="claim.reload()"
              />
            }
            @if (canReview()) {
              <app-review-form [claim]="c" (decided)="claim.reload()" />
            }
          }
        </section>
      </div>
    }
  `,
})
export class ClaimDetail {
  private readonly api = inject(ClaimsApi);
  protected readonly session = inject(SessionStore);

  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  protected readonly claim = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.api.getClaim(id),
  });
  protected readonly users = rxResource({ stream: () => this.api.listUsers() });

  protected readonly employees = computed(() =>
    (this.users.value() ?? []).filter((u) => u.role === 'EMPLOYEE'),
  );

  /** The assignee decides; a manager can step in. */
  protected readonly canReview = computed(() => {
    const c = this.claim.value();
    const me = this.session.user();
    return !!c && !!me && (c.assignment?.assigneeId === me.id || me.role === 'MANAGER');
  });

  protected readonly mock = settings.useMockApi;

  /** File download from documents-service (real backend only). */
  protected documentUrl(claimId: string, name: string) {
    return `${settings.apiUrl}/documents/${claimId}/${encodeURIComponent(name)}`;
  }

  protected name(id: string | undefined) {
    return nameOf(this.users.value(), id);
  }
}
