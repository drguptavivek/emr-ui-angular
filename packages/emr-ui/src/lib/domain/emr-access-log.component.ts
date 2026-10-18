import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { AccessLogIntent, AccessLogViewModel } from '@drguptavivek/emr-controller';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = {
  region: 'Access log',
  periods: 'Period',
  purpose: 'Purpose',
  reportConcern: 'Report a concern',
  loadMore: 'Load more',
  retry: 'Retry',
  loadingTitle: 'Loading access log',
  emptyTitle: 'No access recorded',
  errorTitle: 'Access log could not be loaded'
};
export type EmrAccessLogLabels = typeof DEFAULT_LABELS;

/** L4 controlled list of who accessed the patient's data. Period filtering and paging are the app's. */
@Component({
  selector: 'emr-access-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="al" [attr.aria-label]="l().region" [attr.aria-busy]="model().state === 'loading' ? 'true' : null">
      @if (model().periodOptions?.length) {
        <div class="al__periods" role="group" [attr.aria-label]="l().periods">
          @for (p of model().periodOptions; track p.id) {
            <button type="button" class="al__period" [attr.aria-pressed]="p.id === model().selectedPeriod" (click)="intent.emit({ type: 'periodSelected', id: p.id })">{{ p.label }}</button>
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
          <ul class="al__list">
            @for (e of model().entries; track e.id) {
              <li class="al__entry">
                <div class="al__row">
                  <time class="al__time">{{ e.atLabel }}</time>
                  @if (e.badge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span> }
                </div>
                <div class="al__actor">{{ e.actorLabel }}@if (e.actorRoleLabel) { <span class="al__muted"> · {{ e.actorRoleLabel }}</span> }@if (e.organisationLabel) { <span class="al__muted"> · {{ e.organisationLabel }}</span> }</div>
                <button type="button" class="al__data" (click)="intent.emit({ type: 'entrySelected', id: e.id })"><strong>{{ e.actionLabel }}</strong>: {{ e.dataLabel }}</button>
                @if (e.purposeLabel) { <div class="al__muted">{{ l().purpose }}: {{ e.purposeLabel }}</div> }
                @if (e.canReportConcern) {
                  <div><button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="intent.emit({ type: 'concernRequested', entryId: e.id })"><span>{{ l().reportConcern }}</span><span class="emr-sr-only">: {{ e.actionLabel }}, {{ e.atLabel }}</span></button></div>
                }
              </li>
            }
          </ul>
          @if (model().canLoadMore) {
            <div class="al__more"><button type="button" class="emr-button emr-button--secondary" (click)="intent.emit({ type: 'loadMoreRequested' })">{{ l().loadMore }}</button></div>
          }
        }
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .al{display:grid;gap:12px}
    .al__periods{display:flex;flex-wrap:wrap;gap:8px}
    .al__period{min-height:44px;padding:0 14px;border:1px solid var(--emr-border);border-radius:999px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-sm);cursor:pointer}
    .al__period[aria-pressed="true"]{background:var(--emr-info-soft);color:var(--emr-info);border-color:currentColor;font-weight:var(--emr-weight-bold);text-decoration:underline}
    .al__period:focus-visible,.al__data:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px;border-radius:4px}
    .al__list{list-style:none;margin:0;padding:0;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface)}
    .al__entry{padding:12px 16px;display:grid;gap:4px;border-bottom:1px solid var(--emr-border);font-size:var(--emr-text-md);break-inside:avoid}
    .al__entry:last-child{border-bottom:0}
    .al__row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
    .al__time{font-size:var(--emr-text-sm);color:var(--emr-text-muted);font-variant-numeric:tabular-nums}
    .al__actor{font-weight:var(--emr-weight-medium);overflow-wrap:anywhere}
    .al__muted{color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:var(--emr-weight-regular)}
    .al__data{min-height:44px;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;overflow-wrap:anywhere}
    .al__more{display:flex;justify-content:center}
    @media print{.al__periods,.al__more,.emr-button{display:none}}
  `]
})
export class EmrAccessLogComponent {
  readonly model = input.required<AccessLogViewModel>();
  readonly labels = input<Partial<EmrAccessLogLabels>>({});
  readonly intent = output<AccessLogIntent>();
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
}
