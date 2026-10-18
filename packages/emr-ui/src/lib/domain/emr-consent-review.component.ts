import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ConsentReviewIntent, ConsentReviewViewModel } from '@drguptavivek/emr-controller';
import { EmrCheckboxComponent } from '../primitives/emr-choice.component';
import { EmrRightFlyoutComponent } from './emr-right-flyout.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  withdraw: 'Withdraw',
  grant: 'Grant',
  requiredForCare: 'Required for care',
  decided: 'Decided',
  method: 'Method',
  givenBy: 'Given by',
  contactChannels: 'Contact channels',
  printReceipt: 'Print / share receipt',
  close: 'Close',
  purposes: 'Purposes'
};
export type EmrConsentReviewLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/**
 * L4 consent review: each purpose with its status badge, decision details and the actions the app allows
 * (withdraw, grant), contact channels, and a controlled withdraw confirmation in a focus-trapped flyout.
 * Essential purposes never offer Withdraw, whatever the model says. Output: one `intent` stream.
 */
@Component({
  selector: 'emr-consent-review',
  standalone: true,
  imports: [EmrCheckboxComponent, EmrRightFlyoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="cr">
      <header class="cr__patient">
        <h2 class="cr__name">{{ m.patient.name }}</h2>
        <p class="cr__muted">
          @for (i of m.patient.identifiers; track i.system) { {{ i.label }} {{ i.display }} · }{{ m.patient.ageLabel }} · {{ m.patient.sexLabel }}
        </p>
        <p class="cr__muted">{{ m.noticeVersionLabel }}</p>
      </header>
      @if (m.message; as msg) {
        <div class="emr-alert" [class]="'emr-alert emr-tone-' + msg.tone" role="status"><div class="emr-alert__body">{{ msg.text }}</div></div>
      }

      <section class="cr__stack" [attr.aria-labelledby]="idPrefix() + '-purposes'">
        <h3 class="cr__title" [id]="idPrefix() + '-purposes'">{{ l.purposes }}</h3>
        @for (c of m.categories; track c.id) {
          <div class="cr__card">
            <h4 class="cr__heading">{{ c.label }}</h4>
            @if (c.description) { <p class="cr__body">{{ c.description }}</p> }
            @for (p of c.purposes; track p.id) {
              <div class="cr__purpose">
                <strong>{{ p.label }}</strong>
                @if (p.description) { <p class="cr__body">{{ p.description }}</p> }
                <div class="cr__row">
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + p.statusBadge.tone">{{ p.statusBadge.label }}@if (p.statusBadge.assistiveText) { <span class="emr-sr-only"> {{ p.statusBadge.assistiveText }}</span> }</span>
                  @if (p.essential) { <span class="cr__required"><span aria-hidden="true">✓ </span>{{ l.requiredForCare }}</span> }
                </div>
                @if (p.decidedAtLabel) { <p class="cr__muted">{{ l.decided }}: {{ p.decidedAtLabel }}</p> }
                @if (p.methodLabel) { <p class="cr__muted">{{ l.method }}: {{ p.methodLabel }}</p> }
                @if (p.givenByLabel) { <p class="cr__muted">{{ l.givenBy }}: {{ p.givenByLabel }}</p> }
                @if (p.contact; as ct) {
                  <fieldset class="cr__group">
                    <legend class="emr-field__label">{{ l.contactChannels }}</legend>
                    @for (ch of ct.channels; track ch.id) {
                      <emr-checkbox [label]="ch.label" [checked]="ch.selected"
                        (checkedChange)="intent.emit({ type: 'channelToggled', purposeId: p.id, channelId: ch.id })" />
                    }
                    <label class="emr-field" [for]="idPrefix() + '-tel-' + p.id">
                      <span class="emr-field__label">{{ ct.preferredNumberLabel }}</span>
                      <input class="emr-control" type="tel" inputmode="tel" autocomplete="tel" [id]="idPrefix() + '-tel-' + p.id" [value]="ct.preferredNumber ?? ''"
                        [attr.aria-invalid]="!!ct.preferredNumberError" [attr.aria-describedby]="ct.preferredNumberError ? idPrefix() + '-tel-' + p.id + '-error' : null"
                        (input)="numberChanged(p.id, $event)" />
                      @if (ct.preferredNumberError) { <span class="emr-field__error" [id]="idPrefix() + '-tel-' + p.id + '-error'">{{ ct.preferredNumberError }}</span> }
                    </label>
                  </fieldset>
                }
                @if (p.canWithdraw && !p.essential) {
                  <div><button class="emr-button emr-button--outline" type="button" [attr.aria-label]="l.withdraw + ': ' + p.label"
                    (click)="intent.emit({ type: 'withdrawRequested', purposeId: p.id })">{{ l.withdraw }}</button></div>
                }
                @if (p.canGrant) {
                  <div><button class="emr-button" type="button" [attr.aria-label]="l.grant + ': ' + p.label"
                    (click)="intent.emit({ type: 'grantRequested', purposeId: p.id })">{{ l.grant }}</button></div>
                }
              </div>
            }
          </div>
        }
      </section>

      <div class="cr__row" data-emr-print="hide">
        <button class="emr-button" type="button" (click)="intent.emit({ type: 'receiptRequested' })">{{ l.printReceipt }}</button>
        <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'cancelled' })">{{ l.close }}</button>
      </div>
    </div>

    @let w = m.pendingWithdrawal;
    <emr-right-flyout [open]="!!w" [title]="w?.title ?? ''" [headingId]="idPrefix() + '-withdraw'" [showFooter]="true"
      (closeRequested)="intent.emit({ type: 'withdrawDismissed' })">
      <p class="cr__body">{{ w?.body }}</p>
      <div emrFlyoutFooter class="cr__row">
        <button class="emr-button" type="button" (click)="intent.emit({ type: 'withdrawConfirmed', purposeId: w?.purposeId ?? '' })">{{ w?.confirmLabel }}</button>
        <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'withdrawDismissed' })">{{ w?.cancelLabel }}</button>
      </div>
    </emr-right-flyout>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .cr,.cr__stack{display:grid;gap:16px;min-width:0}
    .cr__stack{gap:12px}
    .cr__name{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .cr__title{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .cr__heading{margin:0;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .cr__body{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .cr__muted{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .cr__card{display:grid;gap:8px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .cr__purpose{display:grid;gap:4px;padding-top:8px;border-top:1px solid var(--emr-border);break-inside:avoid}
    .cr__row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    .cr__required{font-weight:var(--emr-weight-bold);color:var(--emr-success)}
    .cr__group{margin:0;padding:0;border:0;min-width:0;display:grid;gap:4px}
  `]
})
export class EmrConsentReviewComponent {
  readonly model = input.required<ConsentReviewViewModel>();
  readonly labels = input<Partial<EmrConsentReviewLabels>>({});
  readonly idPrefix = input(`emr-consent-review-${++nextId}`);
  readonly intent = output<ConsentReviewIntent>();

  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  numberChanged(purposeId: string, event: Event): void {
    this.intent.emit({ type: 'preferredNumberChanged', purposeId, value: (event.target as HTMLInputElement).value });
  }
}
