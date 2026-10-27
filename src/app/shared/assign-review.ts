import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClaimsApi } from '../core/claims-api';
import { Claim, User } from '../core/models';

/** Manager control: pick an employee and give them the review. */
@Component({
  selector: 'app-assign-review',
  imports: [FormsModule],
  template: `
    <div class="assign">
      <select [(ngModel)]="assigneeId" [attr.aria-label]="'Assign ' + claim().id">
        <option value="">Choose employee…</option>
        @for (u of employees(); track u.id) {
          <option [value]="u.id">{{ u.name }}</option>
        }
      </select>
      @if (withNote()) {
        <input [(ngModel)]="note" placeholder="Note for the employee (optional)" />
      }
      <button
        class="btn btn-primary"
        type="button"
        [disabled]="!assigneeId || assigneeId === claim().assignment?.assigneeId || busy()"
        (click)="assign()"
      >
        {{ claim().assignment ? 'Reassign' : 'Assign' }}
      </button>
    </div>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
})
export class AssignReview {
  private readonly api = inject(ClaimsApi);

  readonly claim = input.required<Claim>();
  readonly employees = input.required<User[]>();
  readonly withNote = input(false);
  readonly assigned = output<Claim>();

  protected assigneeId = '';
  protected note = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected assign() {
    this.busy.set(true);
    this.error.set('');
    this.api.assignReview(this.claim().id, { assigneeId: this.assigneeId, note: this.note.trim() }).subscribe({
      next: (claim) => {
        this.busy.set(false);
        this.assigneeId = '';
        this.note = '';
        this.assigned.emit(claim);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? 'Could not assign the review.');
      },
    });
  }
}
