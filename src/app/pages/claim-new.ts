import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { CLAIM_TYPES, ClaimType } from '../core/models';

@Component({
  selector: 'app-claim-new',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-head">
      <h1>New claim</h1>
      <a class="btn" routerLink="/claims">Cancel</a>
    </div>

    <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
      <label>
        Policy number
        <input formControlName="policyNumber" list="policies" placeholder="POL-1001" />
        <datalist id="policies">
          @for (p of policies.value() ?? []; track p.number) {
            <option [value]="p.number">{{ p.holder }} · {{ p.type }}</option>
          }
        </datalist>
      </label>

      <label>
        Customer (claimant)
        <input formControlName="claimant" placeholder="Ana Novak" />
      </label>

      <div class="row">
        <label>
          Type
          <select formControlName="type">
            @for (t of types; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </label>

        <label>
          Incident date
          <input type="date" formControlName="incidentDate" [max]="today" />
        </label>

        <label>
          Amount (€)
          <input type="number" min="1" step="0.01" formControlName="amount" />
        </label>
      </div>

      <label>
        What happened?
        <textarea rows="4" formControlName="description"></textarea>
      </label>

      <label>
        Documents
        <input type="file" multiple (change)="onFiles($event)" />
        <span class="hint">
          Prototype: only file names are kept. Use fictional data only.
        </span>
      </label>

      @if (fileNames().length) {
        <ul class="files">
          @for (f of fileNames(); track f) {
            <li>{{ f }}</li>
          }
        </ul>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="actions">
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Submitting…' : 'Submit claim' }}
        </button>
      </div>
    </form>
  `,
})
export class ClaimNew {
  private readonly api = inject(ClaimsApi);
  private readonly router = inject(Router);

  protected readonly types = CLAIM_TYPES;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly policies = rxResource({ stream: () => this.api.listPolicies() });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    policyNumber: ['', Validators.required],
    claimant: ['', Validators.required],
    type: ['CAR' as ClaimType, Validators.required],
    incidentDate: [this.today, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly fileNames = signal<string[]>([]);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected onFiles(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    this.fileNames.set(files ? Array.from(files, (f) => f.name) : []);
  }

  protected submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set('');
    this.api.submitClaim({ ...this.form.getRawValue(), documents: this.fileNames() }).subscribe({
      next: (claim) => this.router.navigate(['/claims', claim.id]),
      error: () => {
        this.error.set('Could not submit the claim. Try again.');
        this.submitting.set(false);
      },
    });
  }
}
