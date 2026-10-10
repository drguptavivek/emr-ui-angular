import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
// ponytail: relative path until attestation.models is exported from the controller index.ts (temporary).
import type { AttestationIntent, AttestationViewModel } from '@drguptavivek/emr-controller';

let nextAttestationId = 0;

@Component({
  selector: 'emr-attestation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="at" [attr.aria-labelledby]="titleId()">
      @if (model().title) { <h4 class="at__title" [id]="titleId()">{{ model().title }}</h4> }
      @else { <h4 class="emr-sr-only" [id]="titleId()">Signatures</h4> }

      @if (model().statement) { <p class="at__statement">{{ model().statement }}</p> }

      @if (model().signatories.length) {
        <ul class="at__list" aria-label="Signatories">
          @for (s of model().signatories; track s.id) {
            <li class="at__row">
              <span class="at__who">
                <button class="at__name" type="button" (click)="intent.emit({ type: 'signatorySelected', signatoryId: s.id })">{{ s.displayName }}</button>
                <span class="at__muted">{{ s.roleLabel }}</span>
              </span>
              <span class="emr-badge" [class]="'emr-tone-' + s.status.tone">{{ s.status.label }}@if (s.status.assistiveText) { <span class="emr-sr-only"> {{ s.status.assistiveText }}</span> }</span>
              <span class="at__when"><span class="at__key">Signed</span> {{ s.signedAtLabel || 'Not supplied' }}</span>
            </li>
          }
        </ul>
      }

      @if (model().error) { <p class="at__error" role="alert"><strong>Not completed.</strong> {{ model().error }}</p> }

      @if (!model().readOnly && (model().canSign || model().canAmend)) {
        <div class="at__actions">
          @if (model().canSign) { <button class="emr-button emr-button--small" type="button" (click)="intent.emit({ type: 'signRequested' })">{{ model().signLabel || 'Sign' }}</button> }
          @if (model().canAmend) { <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'amendRequested' })">{{ model().amendLabel || 'Amend' }}</button> }
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .at{display:grid;gap:8px;min-width:0;break-inside:avoid}
    .at__title{margin:0;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;color:var(--emr-text-muted)}
    .at__statement{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .at__list{list-style:none;margin:0;padding:0;display:grid;gap:4px}
    .at__row{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-height:var(--emr-compact-height);font-size:var(--emr-text-md)}
    .at__who{flex:1 1 12rem;min-width:0;overflow-wrap:anywhere;display:flex;flex-wrap:wrap;align-items:center;gap:0 8px}
    .at__name{min-height:44px;padding:0;border:0;background:none;color:var(--emr-text);font:inherit;font-weight:var(--emr-weight-bold);text-align:start;cursor:pointer;overflow-wrap:anywhere}
    .at__name:focus-visible{outline:2px solid var(--emr-focus);outline-offset:2px}
    .at__muted,.at__when{color:var(--emr-text-muted)}
    .at__key{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;margin-inline-end:4px}
    .at__error{margin:0;padding:8px 12px;border:1px solid var(--emr-danger);border-radius:8px;background:var(--emr-danger-soft);color:var(--emr-text);font-size:var(--emr-text-md)}
    .at__actions{display:flex;flex-wrap:wrap;gap:8px}
    @media (max-width:480px){.at__actions .emr-button{flex:1 1 auto}}
    @media print{.at__actions{display:none}}
  `]
})
export class EmrAttestationComponent {
  readonly model = input.required<AttestationViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<AttestationIntent>();

  private readonly generatedId = `emr-attestation-${++nextAttestationId}`;
  readonly titleId = computed(() => this.headingId() ?? this.generatedId);
}
