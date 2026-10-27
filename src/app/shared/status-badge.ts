import { Component, computed, input } from '@angular/core';
import { AgentOutcome, ClaimStatus } from '../core/models';

const LABELS: Record<ClaimStatus | AgentOutcome, string> = {
  PROCESSING: 'Processing',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REVIEW: 'Needs review',
  PASS: 'Pass',
  FLAG: 'Flag',
  FAIL: 'Fail',
};

const TONES: Record<ClaimStatus | AgentOutcome, string> = {
  PROCESSING: 'neutral',
  APPROVED: 'good',
  PASS: 'good',
  REJECTED: 'bad',
  FAIL: 'bad',
  NEEDS_REVIEW: 'warn',
  FLAG: 'warn',
};

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="'badge badge-' + tone()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<ClaimStatus | AgentOutcome>();
  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly tone = computed(() => TONES[this.status()]);
}
