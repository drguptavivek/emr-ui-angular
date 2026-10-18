import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { AttestationIntent, ConsentCaptureIntent, ConsentCaptureViewModel, ConsentDecision } from '@drguptavivek/emr-controller';
import { EmrAttestationComponent } from '../fields/emr-attestation.component';
import { EmrTextInputComponent } from '../primitives/emr-inputs.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  agree: 'Agree',
  doNotAgree: 'Do not agree',
  notDecided: 'Not decided',
  requiredForCare: 'Required for care',
  language: 'Language',
  purposes: 'Purposes',
  givenBy: 'Given by',
  method: 'Method',
  guardianName: 'Guardian name',
  guardianRelationship: 'Relationship to patient',
  captureSignature: 'Capture signature',
  captureThumbprint: 'Capture thumbprint',
  submit: 'Submit',
  cancel: 'Cancel',
  noticeVersion: 'Notice version'
};
export type EmrConsentCaptureLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/**
 * L4 consent capture. Renders the notice, per-category / per-purpose decisions, who is giving consent and
 * how it is evidenced; the app decides every rule (essential purposes, guardian need, canSubmit).
 * Inputs: `model` (required), optional `labels` overrides, `idPrefix` for unique ids when several are on a page.
 * Output: one `intent` stream. Nothing is pre-selected unless the model carries a decision/selection.
 */
@Component({
  selector: 'emr-consent-capture',
  standalone: true,
  imports: [NgTemplateOutlet, EmrAttestationComponent, EmrTextInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="cc">
      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.language }}</legend>
        <div class="cc__row">
          @for (o of m.languageOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-lang'" [checked]="o.id === m.selectedLanguage"
              (change)="intent.emit({ type: 'languageSelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      <section class="cc__notice-wrap" [attr.aria-labelledby]="idPrefix() + '-notice'">
        <h2 class="cc__title" [id]="idPrefix() + '-notice'">{{ m.notice.title }}</h2>
        <div class="cc__notice" role="region" tabindex="0" [attr.aria-labelledby]="idPrefix() + '-notice'">
          @for (s of m.notice.sections; track $index) {
            <h3 class="cc__heading">{{ s.heading }}</h3>
            <p class="cc__body">{{ s.body }}</p>
          }
        </div>
        <p class="cc__muted">{{ l.noticeVersion }} {{ m.notice.version }} · {{ m.notice.languageLabel }}</p>
      </section>

      <section class="cc__stack" [attr.aria-labelledby]="idPrefix() + '-purposes'">
        <h3 class="cc__title" [id]="idPrefix() + '-purposes'">{{ l.purposes }}</h3>
        @for (c of m.categories; track c.id) {
          <div class="cc__card">
            <h4 class="cc__heading">{{ c.label }}</h4>
            @if (c.description) { <p class="cc__body">{{ c.description }}</p> }
            @if (c.mode === 'whole') {
              @if (!allEssential(c.purposes)) {
                <ng-container [ngTemplateOutlet]="decide" [ngTemplateOutletContext]="{ $implicit: { kind: 'category', id: c.id, legend: c.label, value: c.decision, locked: c.locked } }" />
              }
              @for (p of c.purposes; track p.id) {
                <div class="cc__purpose">
                  <strong>{{ p.label }}</strong>
                  <p class="cc__body">{{ p.description }}</p>
                  @if (p.essential) { <p class="cc__required"><span aria-hidden="true">✓ </span>{{ l.requiredForCare }}</p> }
                </div>
              }
            } @else {
              @for (p of c.purposes; track p.id) {
                @if (p.essential) {
                  <div class="cc__purpose">
                    <strong>{{ p.label }}</strong>
                    <p class="cc__body">{{ p.description }}</p>
                    <p class="cc__required"><span aria-hidden="true">✓ </span>{{ l.requiredForCare }}</p>
                  </div>
                } @else {
                  <div class="cc__purpose">
                    <p class="cc__body" [id]="idPrefix() + '-d-' + p.id">{{ p.description }}</p>
                    <ng-container [ngTemplateOutlet]="decide" [ngTemplateOutletContext]="{ $implicit: { kind: 'purpose', id: p.id, legend: p.label, value: p.decision, locked: p.locked, describedBy: idPrefix() + '-d-' + p.id } }" />
                  </div>
                }
              }
            }
          </div>
        }
      </section>

      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.givenBy }}</legend>
        <div class="cc__row">
          @for (o of m.givenByOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-by'" [checked]="o.id === m.selectedGivenBy"
              (change)="intent.emit({ type: 'givenBySelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      @if (m.guardian; as g) {
        <div class="cc__stack">
          <emr-text-input [controlId]="idPrefix() + '-g-name'" [label]="l.guardianName" [required]="g.required" [value]="g.name ?? ''" [error]="g.nameError ?? ''"
            (valueChange)="intent.emit({ type: 'guardianChanged', name: $event })" />
          <emr-text-input [controlId]="idPrefix() + '-g-rel'" [label]="l.guardianRelationship" [required]="g.required" [value]="g.relationship ?? ''" [error]="g.relationshipError ?? ''"
            (valueChange)="intent.emit({ type: 'guardianChanged', relationship: $event })" />
        </div>
      }

      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.method }}</legend>
        <div class="cc__row">
          @for (o of m.methodOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-method'" [checked]="o.id === m.selectedMethod"
              (change)="intent.emit({ type: 'methodSelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      @switch (m.selectedMethod) {
        @case ('signature') {
          <div class="cc__stack">
            <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'signatureRequested' })">{{ l.captureSignature }}</button>
            @if (m.capture?.signatureLabel; as status) { <p class="cc__muted" role="status">{{ status }}</p> }
          </div>
        }
        @case ('thumbprint') {
          <div class="cc__stack">
            <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'thumbprintRequested' })">{{ l.captureThumbprint }}</button>
            @if (m.capture?.thumbprintLabel; as status) { <p class="cc__muted" role="status">{{ status }}</p> }
          </div>
        }
        @case ('verbal_attested') {
          @if (m.attestation) { <emr-attestation [model]="m.attestation" (intent)="attested($event)" /> }
        }
      }

      <div class="cc__actions" data-emr-print="hide">
        @if (m.canSubmit) {
          <button class="emr-button" type="button" (click)="intent.emit({ type: 'submitRequested' })">{{ l.submit }}</button>
        } @else if (m.submitError) {
          <p class="cc__error" role="alert">{{ m.submitError }}</p>
        }
        <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'cancelled' })">{{ l.cancel }}</button>
      </div>
    </div>

    <ng-template #decide let-d>
      @if (d.locked) {
        <p class="cc__body"><strong>{{ d.legend }}:</strong> {{ decisionText(d.value) }}</p>
      } @else {
        <fieldset class="cc__group" [attr.aria-describedby]="d.describedBy ?? null">
          <legend class="emr-field__label">{{ d.legend }}</legend>
          <div class="cc__row">
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-' + d.kind + '-' + d.id" [checked]="d.value === 'granted'"
              (change)="decided(d.kind, d.id, 'granted')" /><span>{{ text().agree }}</span></label>
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-' + d.kind + '-' + d.id" [checked]="d.value === 'refused'"
              (change)="decided(d.kind, d.id, 'refused')" /><span>{{ text().doNotAgree }}</span></label>
          </div>
        </fieldset>
      }
    </ng-template>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .cc,.cc__stack{display:grid;gap:16px;min-width:0}
    .cc__stack{gap:8px}
    .cc__group{margin:0;padding:0;border:0;min-width:0;display:grid;gap:4px}
    .cc__row{display:flex;flex-wrap:wrap;gap:4px 16px}
    .cc__title{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .cc__heading{margin:0;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .cc__body{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .cc__muted{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .cc__notice{max-height:20rem;overflow-y:auto;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);display:grid;gap:8px}
    .cc__notice:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .cc__card{display:grid;gap:8px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);break-inside:avoid}
    .cc__purpose{display:grid;gap:4px}
    .cc__required{margin:0;font-weight:var(--emr-weight-bold);color:var(--emr-success)}
    .cc__error{margin:0;padding:8px 12px;border:1px solid var(--emr-danger);border-radius:8px;background:var(--emr-danger-soft);font-size:var(--emr-text-md)}
    .cc__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    /* Print: the whole notice must reach the paper, never a clipped scroll box. */
    :host-context(.emr-print) .cc__notice{max-height:none;overflow:visible}
    @media print{.cc__notice{max-height:none;overflow:visible}}
  `]
})
export class EmrConsentCaptureComponent {
  readonly model = input.required<ConsentCaptureViewModel>();
  readonly labels = input<Partial<EmrConsentCaptureLabels>>({});
  readonly idPrefix = input(`emr-consent-capture-${++nextId}`);
  readonly intent = output<ConsentCaptureIntent>();

  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  allEssential(purposes: readonly { essential: boolean }[]): boolean { return purposes.every((p) => p.essential); }

  decisionText(d: ConsentDecision | undefined): string {
    const l = this.text();
    return d === 'granted' ? l.agree : d === 'refused' ? l.doNotAgree : l.notDecided;
  }

  decided(kind: 'category' | 'purpose', id: string, decision: ConsentDecision): void {
    this.intent.emit(kind === 'category' ? { type: 'categoryDecided', id, decision } : { type: 'purposeDecided', id, decision });
  }

  attested(i: AttestationIntent): void {
    if (i.type === 'signRequested') this.intent.emit({ type: 'attestationConfirmed' });
  }
}
