import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClaimsApi } from '../core/claims-api';
import { mockDocument } from '../core/mock-documents';

/** Shows a claim's document. Mock mode only: real files come from documents-service. */
@Component({
  selector: 'app-document-view',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ file() }}</h1>
        <p class="muted">Document of claim {{ id() }}</p>
      </div>
      <a class="btn" [routerLink]="['/claims', id()]">Back to claim</a>
    </div>

    @if (claim.isLoading()) {
      <p class="muted">Loading…</p>
    } @else if (claim.error()) {
      <p class="error">Claim not found.</p>
    } @else if (!doc()) {
      <div class="card">
        <p>No preview for this file.</p>
        <p class="muted">
          In the prototype, files added in the new-claim form only keep their name. In the real system
          documents-service stores the file itself.
        </p>
      </div>
    } @else if (doc(); as d) {
      <article class="paper" [class.paper-photo]="d.kind === 'PHOTO'">
        <div class="paper-ribbon">Fictional sample document</div>

        <header class="paper-head">
          <div>
            @for (line of d.issuer; track $index) {
              <div [class.paper-issuer]="$first">{{ line }}</div>
            }
          </div>
          <h2>{{ d.title }}</h2>
        </header>

        @if (d.photo; as p) {
          <figure class="photo">
            <svg viewBox="0 0 400 260" role="img" [attr.aria-label]="p.caption">
              @switch (p.scene) {
                @case ('rear-bumper') {
                  <rect width="400" height="260" fill="#6f747b" />
                  <rect x="0" y="200" width="400" height="60" fill="#55595f" />
                  <line x1="0" y1="232" x2="400" y2="232" stroke="#e9e3c9" stroke-width="4" stroke-dasharray="30 18" />
                  <path d="M70 70 Q80 40 120 38 L280 38 Q320 40 330 70 L340 160 L60 160 Z" fill="#9aa1a8" />
                  <rect x="90" y="52" width="220" height="50" rx="6" fill="#3d4a57" />
                  <rect x="70" y="108" width="48" height="22" rx="4" fill="#b8312f" />
                  <rect x="282" y="108" width="48" height="22" rx="4" fill="#b8312f" />
                  <path d="M80 110 L100 128 L88 122 Z" fill="#e2e2e2" />
                  <rect x="168" y="118" width="64" height="16" rx="2" fill="#f2f2f2" />
                  <rect x="50" y="156" width="300" height="34" rx="10" fill="#80878e" />
                  <path d="M70 162 Q95 178 120 166 Q135 182 150 168" fill="none" stroke="#3b3f44" stroke-width="5" />
                  <path d="M72 172 L140 184 M80 166 L150 176 M90 160 L130 170" stroke="#d9dcdf" stroke-width="1.5" />
                }
                @case ('front') {
                  <rect width="400" height="260" fill="#1f2630" />
                  <rect x="0" y="190" width="400" height="70" fill="#2f343a" />
                  <path d="M60 180 L70 110 Q80 90 110 86 L290 86 Q320 90 330 110 L340 180 Z" fill="#8c2f2a" />
                  <path d="M110 86 L150 60 L250 60 L290 86 Z" fill="#33414f" />
                  <path d="M110 110 L150 98 L180 116 L215 96 L250 118 L290 104" fill="none" stroke="#4f1c19" stroke-width="6" />
                  <path d="M150 140 L250 140 L240 175 L160 175 Z" fill="#26292d" />
                  <path d="M160 150 L240 160 M170 170 L230 145" stroke="#5a5f66" stroke-width="3" />
                  <circle cx="100" cy="148" r="16" fill="#f4e7b0" />
                  <path d="M285 140 l18 -6 l6 16 l-14 12 z" fill="#c9c2a0" />
                  <rect x="56" y="176" width="288" height="18" rx="6" fill="#45484d" />
                  <path d="M80 182 L120 190 L100 176 M300 180 L270 192" stroke="#8e9399" stroke-width="2" />
                }
                @case ('windscreen') {
                  <rect width="400" height="260" fill="#202833" />
                  <path d="M40 220 L80 40 L320 40 L360 220 Z" fill="#7fa3bf" />
                  <path d="M80 40 L320 40 L300 60 L100 60 Z" fill="#9dbcd3" opacity="0.6" />
                  <circle cx="250" cy="150" r="6" fill="#f2f6f9" />
                  <path
                    d="M250 150 L210 120 L170 125 L120 95 M250 150 L290 110 L310 80 M250 150 L260 195 M250 150 L215 170 L150 180"
                    fill="none" stroke="#f2f6f9" stroke-width="2"
                  />
                  <rect x="0" y="220" width="400" height="40" fill="#171c22" />
                }
              }
            </svg>
            <figcaption>{{ p.caption }}</figcaption>
          </figure>
        }

        <dl class="paper-fields">
          @for (f of d.fields; track f[0]) {
            <dt>{{ f[0] }}</dt>
            <dd>{{ f[1] }}</dd>
          }
        </dl>

        @for (s of d.sections ?? []; track s.heading) {
          <section class="paper-section">
            <h3>{{ s.heading }}</h3>
            @if (s.rows) {
              <dl class="paper-fields">
                @for (r of s.rows; track r[0]) {
                  <dt>{{ r[0] }}</dt>
                  <dd>{{ r[1] }}</dd>
                }
              </dl>
            }
            @if (s.text) {
              <p>{{ s.text }}</p>
            }
          </section>
        }

        @if (d.lines; as lines) {
          <section class="paper-section">
            <h3>{{ d.linesHeading ?? 'Items' }}</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="num">Qty</th>
                    <th class="num">Unit price</th>
                    <th class="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of lines; track l.item) {
                    <tr>
                      <td>{{ l.item }}</td>
                      <td class="num">{{ l.qty }} {{ l.unit }}</td>
                      <td class="num">{{ l.unitPrice | currency: 'EUR' }}</td>
                      <td class="num">{{ l.qty * l.unitPrice | currency: 'EUR' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  @if (d.vatRate) {
                    <tr>
                      <td colspan="3">Subtotal</td>
                      <td class="num">{{ totals().net | currency: 'EUR' }}</td>
                    </tr>
                    <tr>
                      <td colspan="3">VAT {{ d.vatRate * 100 }}%</td>
                      <td class="num">{{ totals().vat | currency: 'EUR' }}</td>
                    </tr>
                  }
                  <tr class="paper-total">
                    <td colspan="3">Total</td>
                    <td class="num">{{ totals().total | currency: 'EUR' }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        }

        @if (d.note) {
          <p class="muted small">{{ d.note }}</p>
        }

        @if (d.signatures) {
          <div class="paper-signatures">
            @for (s of d.signatures; track s) {
              <div class="signature">{{ s }}</div>
            }
          </div>
        }
      </article>
    }
  `,
})
export class DocumentView {
  private readonly api = inject(ClaimsApi);

  /** Bound from the route: /claims/:id/document?file=name */
  readonly id = input.required<string>();
  readonly file = input.required<string>();

  protected readonly claim = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.api.getClaim(id),
  });

  protected readonly doc = computed(() => {
    const c = this.claim.value();
    return c ? mockDocument(c, this.file()) : null;
  });

  protected readonly totals = computed(() => {
    const d = this.doc();
    const net = (d?.lines ?? []).reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const vat = Math.round(net * (d?.vatRate ?? 0) * 100) / 100;
    return { net, vat, total: net + vat };
  });
}
