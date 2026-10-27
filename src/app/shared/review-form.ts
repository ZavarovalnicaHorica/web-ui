import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClaimsApi } from '../core/claims-api';
import { Claim, ReviewDecision } from '../core/models';

/** Approve or reject a flagged claim, with an optional comment. */
@Component({
  selector: 'app-review-form',
  imports: [FormsModule],
  template: `
    <textarea rows="2" placeholder="Comment (optional)" [(ngModel)]="comment"></textarea>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <div class="actions">
      <button class="btn btn-danger" type="button" [disabled]="busy()" (click)="decide('REJECTED')">
        Reject
      </button>
      <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="decide('APPROVED')">
        Approve
      </button>
    </div>
  `,
  host: { class: 'review-form' },
})
export class ReviewForm {
  private readonly api = inject(ClaimsApi);

  readonly claim = input.required<Claim>();
  readonly decided = output<Claim>();

  protected comment = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected decide(decision: ReviewDecision) {
    this.busy.set(true);
    this.error.set('');
    this.api.submitReview(this.claim().id, { decision, comment: this.comment.trim() }).subscribe({
      next: (claim) => {
        this.busy.set(false);
        this.decided.emit(claim);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? 'Could not save the review.');
      },
    });
  }
}
