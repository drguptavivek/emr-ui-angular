import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { RightsRequestsIntent, RightsRequestsViewModel } from '@drguptavivek/emr-controller';
import { EmrTextInputComponent } from '../primitives/emr-inputs.component';
import { EmrRightFlyoutComponent } from './emr-right-flyout.component';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  region: 'Your requests',
  newRequest: 'New request',
  submitted: 'Submitted',
  response: 'Response',
  withdraw: 'Withdraw',
  retry: 'Retry',
  loadingTitle: 'Loading requests',
  emptyTitle: 'No requests yet',
  errorTitle: 'Requests could not be loaded',
  draftHeading: 'New request',
  kind: 'Request type',
  nomineeName: 'Nominee name',
  nomineeRelationship: 'Relationship',
  nomineeContact: 'Nominee contact',
  attach: 'Attach documents',
  submit: 'Submit request',
  cancel: 'Cancel'
};
export type EmrRightsRequestsLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/** L4 controlled rights-requests list plus new-request form. Eligibility (canSubmit, canWithdraw) and guidance are the app's. */
@Component({
  selector: 'emr-rights-requests',
  standalone: true,
  imports: [EmrRightFlyoutComponent, EmrTextInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rr" [attr.aria-label]="l().region" [attr.aria-busy]="model().state === 'loading' ? 'true' : null">
      @if (model().notice; as n) { <div class="emr-alert" [class]="'emr-alert emr-tone-' + n.tone" role="status"><div>{{ n.text }}</div></div> }
      @if (model().draft; as d) {
        <form class="rr__draft" (submit)="$event.preventDefault()" [attr.aria-labelledby]="uid + '-draft'">
          <h3 class="rr__heading" [id]="uid + '-draft'">{{ l().draftHeading }}</h3>
          <fieldset class="rr__kinds">
            <legend class="emr-field__label">{{ l().kind }}</legend>
            @for (o of d.kindOptions; track o.id) {
              <label class="rr__kind" [class.rr__kind--on]="o.id === d.kind">
                <input type="radio" [name]="uid + '-kind'" [value]="o.id" [checked]="o.id === d.kind" (change)="intent.emit({ type: 'kindSelected', kind: o.id })" />
                <span><strong>{{ o.label }}</strong>@if (o.description) { <span class="rr__desc">{{ o.description }}</span> }</span>
              </label>
            }
          </fieldset>
          @if (d.guidance) { <div class="emr-alert emr-tone-info" role="status"><div>{{ d.guidance }}</div></div> }
          <div class="emr-field">
            <label class="emr-field__label" [for]="uid + '-desc'">{{ d.descriptionLabel }}</label>
            <textarea class="emr-control rr__textarea" [id]="uid + '-desc'" rows="4" [value]="d.description ?? ''" [attr.aria-invalid]="!!d.descriptionError"
              [attr.aria-describedby]="d.descriptionError ? uid + '-desc-error' : null" (input)="intent.emit({ type: 'descriptionChanged', value: textValue($event) })"></textarea>
            @if (d.descriptionError) { <span class="emr-field__error" [id]="uid + '-desc-error'">{{ d.descriptionError }}</span> }
          </div>
          @if (d.nominee; as nom) {
            <emr-text-input [controlId]="uid + '-nom-name'" [label]="l().nomineeName" [value]="nom.name ?? ''" [error]="nom.nameError ?? ''" (valueChange)="intent.emit({ type: 'nomineeChanged', name: $event })" />
            <emr-text-input [controlId]="uid + '-nom-rel'" [label]="l().nomineeRelationship" [value]="nom.relationship ?? ''" [error]="nom.relationshipError ?? ''" (valueChange)="intent.emit({ type: 'nomineeChanged', relationship: $event })" />
            <emr-text-input [controlId]="uid + '-nom-contact'" [label]="l().nomineeContact" [value]="nom.contact ?? ''" [error]="nom.contactError ?? ''" (valueChange)="intent.emit({ type: 'nomineeChanged', contact: $event })" />
          }
          @if (d.canAttach || d.attachmentsLabel) {
            <div class="rr__attach">
              @if (d.canAttach) { <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'attachRequested' })">{{ l().attach }}</button> }
              @if (d.attachmentsLabel) { <span class="rr__desc" role="status">{{ d.attachmentsLabel }}</span> }
            </div>
          }
          @if (!d.canSubmit && d.submitError) { <div class="emr-alert emr-tone-danger" role="alert"><div>{{ d.submitError }}</div></div> }
          <div class="rr__actions">
            <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'draftCancelled' })">{{ l().cancel }}</button>
            @if (d.canSubmit) { <button type="button" class="emr-button" (click)="intent.emit({ type: 'draftSubmitted' })">{{ l().submit }}</button> }
          </div>
        </form>
      } @else {
        <div class="rr__toolbar"><button type="button" class="emr-button" (click)="intent.emit({ type: 'newRequestStarted' })">{{ l().newRequest }}</button></div>
      }
      @switch (model().state) {
        @case ('loading') { <div class="emr-empty" role="status"><div><strong>{{ l().loadingTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('empty') { <div class="emr-empty" role="status"><div><strong>{{ l().emptyTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('error') {
          <div class="emr-empty" role="alert"><div><strong>{{ l().errorTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'retryRequested' })">{{ l().retry }}</button></div></div>
        }
        @default {
          <ul class="rr__list">
            @for (r of model().requests; track r.id) {
              <li class="rr__card">
                <div class="rr__head">
                  <button type="button" class="rr__title" (click)="intent.emit({ type: 'requestSelected', id: r.id })">{{ r.kindLabel }}</button>
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + r.statusBadge.tone">{{ r.statusBadge.label }}</span>
                </div>
                <div class="rr__desc">{{ l().submitted }} {{ r.submittedAtLabel }}@if (r.dueLabel) { · {{ r.dueLabel }} }</div>
                @if (r.summary) { <p class="rr__text">{{ r.summary }}</p> }
                @if (r.responseText) { <p class="rr__text rr__response"><strong>{{ l().response }}:</strong> {{ r.responseText }}</p> }
                @if (r.canWithdraw) {
                  <div class="rr__actions"><button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'withdrawRequested', requestId: r.id })"><span>{{ l().withdraw }}</span><span class="emr-sr-only"> {{ r.kindLabel }}</span></button></div>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
    <emr-right-flyout [open]="!!model().pendingWithdrawal" [title]="model().pendingWithdrawal?.title ?? ''" [headingId]="uid + '-flyout'" [showFooter]="true"
      (closeRequested)="intent.emit({ type: 'withdrawDismissed' })">
      @if (model().pendingWithdrawal; as p) {
        <p class="rr__text">{{ p.body }}</p>
        <div emrFlyoutFooter class="rr__actions">
          <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'withdrawDismissed' })">{{ p.cancelLabel }}</button>
          <button type="button" class="emr-button emr-button--danger" (click)="intent.emit({ type: 'withdrawConfirmed', requestId: p.requestId })">{{ p.confirmLabel }}</button>
        </div>
      }
    </emr-right-flyout>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .rr{display:grid;gap:12px}
    .rr__toolbar,.rr__actions,.rr__attach{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .rr__actions{justify-content:flex-end}
    .rr__draft{display:grid;gap:12px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px}
    .rr__heading{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .rr__kinds{display:grid;gap:8px;margin:0;padding:0;border:0;min-width:0}
    .rr__kind{display:flex;gap:10px;align-items:flex-start;min-height:44px;padding:10px 12px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);cursor:pointer}
    .rr__kind--on{border-color:var(--emr-info);background:var(--emr-info-soft);border-width:2px;padding:9px 11px}
    .rr__kind input{margin-top:4px;width:20px;height:20px;flex:none}
    .rr__kind:focus-within{outline:3px solid var(--emr-focus);outline-offset:2px}
    .rr__desc{display:block;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .rr__textarea{height:auto;min-height:96px;resize:vertical;font:inherit}
    .rr__list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
    .rr__card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px;display:grid;gap:6px;break-inside:avoid}
    .rr__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
    .rr__title{min-height:44px;padding:0;border:0;background:transparent;color:inherit;font:inherit;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);text-align:left;cursor:pointer}
    .rr__title:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px;border-radius:4px}
    .rr__text{margin:0;font-size:var(--emr-text-md);line-height:var(--emr-leading-normal);overflow-wrap:anywhere}
    @media print{.rr__toolbar,.rr__actions{display:none}}
  `]
})
export class EmrRightsRequestsComponent {
  readonly model = input.required<RightsRequestsViewModel>();
  readonly labels = input<Partial<EmrRightsRequestsLabels>>({});
  readonly intent = output<RightsRequestsIntent>();
  protected readonly uid = `emr-rights-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  protected textValue(event: Event): string { return (event.target as HTMLTextAreaElement).value; }
}
