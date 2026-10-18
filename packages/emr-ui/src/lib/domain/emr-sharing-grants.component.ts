import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SharingGrantsIntent, SharingGrantsViewModel } from '@drguptavivek/emr-controller';
import { EmrRightFlyoutComponent } from './emr-right-flyout.component';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  region: 'Data sharing',
  filters: 'Filter sharing',
  validPrefix: 'Valid',
  noExpiry: 'No expiry',
  purpose: 'Purpose',
  dataShared: 'Data shared',
  records: 'Records',
  grantedAt: 'Granted',
  grantedBy: 'by',
  revoke: 'Revoke',
  retry: 'Retry',
  loading: 'Loading…',
  loadingTitle: 'Loading data sharing',
  emptyTitle: 'Nothing is shared',
  errorTitle: 'Data sharing could not be loaded'
};
export type EmrSharingGrantsLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/** L4 controlled list of data-sharing grants with revoke confirmation. The app decides who may revoke and the wording. */
@Component({
  selector: 'emr-sharing-grants',
  standalone: true,
  imports: [EmrRightFlyoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sg" [attr.aria-label]="l().region" [attr.aria-busy]="model().state === 'loading' ? 'true' : null">
      @if (model().notice; as n) { <div class="emr-alert sg__notice" [class]="'emr-alert sg__notice emr-tone-' + n.tone" role="status"><div>{{ n.text }}</div></div> }
      @if (model().filters?.length) {
        <div class="sg__filters" role="group" [attr.aria-label]="l().filters">
          @for (f of model().filters; track f.id) {
            <button type="button" class="sg__filter" [attr.aria-pressed]="f.id === model().selectedFilter" (click)="intent.emit({ type: 'filterSelected', id: f.id })">{{ f.label }}</button>
          }
        </div>
      }
      @switch (model().state) {
        @case ('loading') { <div class="emr-empty" role="status"><div><strong>{{ l().loadingTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('empty') { <div class="emr-empty" role="status"><div><strong>{{ l().emptyTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }</div></div> }
        @case ('error') {
          <div class="emr-empty" role="alert"><div><strong>{{ l().errorTitle }}</strong>@if (model().message) { <div>{{ model().message }}</div> }
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'retryRequested' })">{{ l().retry }}</button></div></div>
        }
        @default {
          <ul class="sg__list">
            @for (g of model().grants; track g.id) {
              <li class="sg__card">
                <div class="sg__head">
                  <button type="button" class="sg__title" (click)="intent.emit({ type: 'grantSelected', id: g.id })">
                    {{ g.recipientLabel }}@if (g.recipientTypeLabel) { <span class="sg__type"> · {{ g.recipientTypeLabel }}</span> }
                  </button>
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + g.statusBadge.tone">{{ g.statusBadge.label }}</span>
                </div>
                <dl class="sg__meta">
                  <div><dt>{{ l().purpose }}</dt><dd>{{ g.purposeLabel }}</dd></div>
                  @if (g.recordsPeriodLabel) { <div><dt>{{ l().records }}</dt><dd>{{ g.recordsPeriodLabel }}</dd></div> }
                  <div><dt>{{ l().validPrefix }}</dt><dd>{{ g.validFromLabel }} – {{ g.validToLabel || l().noExpiry }}</dd></div>
                  @if (g.grantedAtLabel) { <div><dt>{{ l().grantedAt }}</dt><dd>{{ g.grantedAtLabel }}@if (g.grantedByLabel) { {{ l().grantedBy }} {{ g.grantedByLabel }} }</dd></div> }
                </dl>
                <div class="sg__scope" role="group" [attr.aria-label]="l().dataShared">
                  @for (s of g.dataScope; track s) { <span class="emr-chip emr-tone-neutral">{{ s }}</span> }
                </div>
                @if (g.canRevoke) {
                  <div class="sg__actions"><button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'revokeRequested', grantId: g.id })"><span>{{ l().revoke }}</span><span class="emr-sr-only"> {{ g.recipientLabel }}</span></button></div>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
    <emr-right-flyout [open]="!!model().pendingRevoke" [title]="model().pendingRevoke?.title ?? ''" [headingId]="uid + '-flyout'" [showFooter]="true"
      (closeRequested)="intent.emit({ type: 'revokeDismissed' })">
      @if (model().pendingRevoke; as p) {
        <p class="sg__confirm">{{ p.body }}</p>
        <div emrFlyoutFooter class="sg__confirm-actions">
          <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'revokeDismissed' })">{{ p.cancelLabel }}</button>
          <button type="button" class="emr-button emr-button--danger" (click)="intent.emit({ type: 'revokeConfirmed', grantId: p.grantId })">{{ p.confirmLabel }}</button>
        </div>
      }
    </emr-right-flyout>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .sg{display:grid;gap:12px}
    .sg__filters{display:flex;flex-wrap:wrap;gap:8px}
    .sg__filter{min-height:44px;padding:0 14px;border:1px solid var(--emr-border);border-radius:999px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-sm);cursor:pointer}
    .sg__filter[aria-pressed="true"]{background:var(--emr-info-soft);color:var(--emr-info);border-color:currentColor;font-weight:var(--emr-weight-bold);text-decoration:underline}
    .sg__list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
    .sg__card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px;display:grid;gap:8px;break-inside:avoid}
    .sg__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
    .sg__title{min-height:44px;padding:0;border:0;background:transparent;color:inherit;font:inherit;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);text-align:left;cursor:pointer;overflow-wrap:anywhere}
    .sg__title:focus-visible,.sg__filter:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px;border-radius:4px}
    .sg__type{font-weight:var(--emr-weight-regular);color:var(--emr-text-muted)}
    .sg__meta{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:4px 16px;font-size:var(--emr-text-sm)}
    .sg__meta dt{color:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    .sg__meta dd{margin:0;overflow-wrap:anywhere}
    .sg__scope{display:flex;flex-wrap:wrap;gap:6px}
    .sg__actions{display:flex;justify-content:flex-end}
    .sg__confirm{margin:0;font-size:var(--emr-text-md);line-height:var(--emr-leading-normal)}
    .sg__confirm-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    @media print{.sg__actions,.sg__filters{display:none}}
  `]
})
export class EmrSharingGrantsComponent {
  readonly model = input.required<SharingGrantsViewModel>();
  readonly labels = input<Partial<EmrSharingGrantsLabels>>({});
  readonly intent = output<SharingGrantsIntent>();
  protected readonly uid = `emr-grants-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
}
