import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroChevronRight, heroExclamationTriangle } from '@ng-icons/heroicons/outline';
import type { ClinicalAssessmentStatus, ScoreResultCardIntent, ScoreResultCardViewModel } from '@drguptavivek/emr-controller';

let nextScoreResultCardId = 0;

const STATUS_TEXT: Record<Exclude<ClinicalAssessmentStatus, 'recorded'>, string> = {
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown'
};

@Component({
  selector: 'emr-score-result-card',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroArrowPath, heroChevronRight, heroExclamationTriangle })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sc" [class.sc--compact]="model.compact" [attr.aria-labelledby]="titleId()" [attr.aria-busy]="model.loading ? 'true' : null">
      <h3 class="sc__title" [id]="titleId()">{{ model.instrumentLabel }}</h3>

      <div class="sc__body">
        @if (model.loading) {
          <p class="sc__state" role="status">Calculating score…</p>
        } @else if (model.error) {
          <p class="sc__state sc__state--error" role="alert"><span class="sc__state-key">Score could not be calculated.</span> {{ model.error }}</p>
        } @else if (statusText(); as st) {
          <p class="sc__state"><span class="emr-badge emr-tone-neutral sc__band">{{ st }}</span></p>
        } @else if (model.result; as r) {
          <p class="sc__total"><span class="sc__num">{{ r.total }}</span><span class="sc__total-key"> total</span></p>
          <span class="emr-badge sc__band" [class]="'emr-badge sc__band emr-tone-' + (r.bandLabel ? r.bandTone : 'neutral')"><span class="emr-sr-only">Band: </span>{{ r.bandLabel || 'Band not supplied' }}</span>
          @if (model.stale) {
            <span class="sc__stale"><ng-icon name="heroExclamationTriangle" aria-hidden="true" />{{ model.staleLabel || 'Out of date' }}</span>
          }
        } @else {
          <p class="sc__state">Not supplied</p>
        }
      </div>

      <div class="sc__actions">
        @if (model.canRecompute && !model.loading) {
          <button type="button" [class]="model.compact ? 'emr-icon-button' : 'emr-button emr-button--small emr-button--outline'" (click)="intent.emit({ type: 'recomputeRequested', instrumentId: model.id })"><ng-icon name="heroArrowPath" aria-hidden="true" />@if (model.compact) { <span class="emr-sr-only">{{ model.error ? 'Try again' : 'Recompute' }} {{ model.instrumentLabel }}</span> } @else { {{ model.error ? 'Try again' : 'Recompute' }} }</button>
        }
        @if (model.canViewDetail && model.result && !model.loading) {
          <button type="button" [class]="model.compact ? 'emr-icon-button' : 'emr-button emr-button--small emr-button--ghost'" (click)="intent.emit({ type: 'detailRequested', instrumentId: model.id })">@if (model.compact) { <span class="emr-sr-only">Details for {{ model.instrumentLabel }}</span> } @else { Details<span class="emr-sr-only"> for {{ model.instrumentLabel }}</span> }<ng-icon name="heroChevronRight" aria-hidden="true" /></button>
        }
      </div>

      @if (!model.compact && showResult()) {
        @if (model.result?.interpretation; as text) { <p class="sc__interp">{{ text }}</p> }

        @if (model.result?.components?.length) {
          <div class="sc__table-wrap">
            <table class="sc__table">
              <caption class="emr-sr-only">Score components</caption>
              <thead><tr><th scope="col">Component</th><th scope="col" class="sc__val">Score</th></tr></thead>
              <tbody>
                @for (c of model.result?.components; track c.id) {
                  <tr>
                    <th scope="row"><button type="button" class="sc__pick" (click)="intent.emit({ type: 'componentSelected', componentId: c.id })">{{ c.label }}</button></th>
                    <td class="sc__val">{{ c.value }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (model.result?.computedAt; as at) { <p class="sc__time">Computed <time [attr.datetime]="at">{{ at }}</time></p> }
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .sc{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:12px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;break-inside:avoid}
    .sc__title{margin:0;grid-column:1/-1;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .sc__body{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;min-width:0}
    .sc__band{max-width:100%;white-space:normal;height:auto;line-height:var(--emr-leading-tight);padding-block:4px;border-radius:12px;overflow-wrap:anywhere}
    .sc__total{margin:0;display:flex;align-items:baseline;gap:6px}
    .sc__num{font-size:var(--emr-text-2xl);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);font-variant-numeric:tabular-nums}
    .sc__total-key{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .sc__state{margin:0;font-size:var(--emr-text-md);color:var(--emr-text-muted)}
    .sc__state--error{color:var(--emr-danger)}
    .sc__state-key{font-weight:var(--emr-weight-bold)}
    .sc__stale{display:inline-flex;align-items:center;gap:4px;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);color:var(--emr-warning)}
    .sc__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    .sc__interp,.sc__time{margin:0;grid-column:1/-1;overflow-wrap:anywhere}
    .sc__interp{font-size:var(--emr-text-md);line-height:var(--emr-leading-normal)}
    .sc__time{font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .sc__table-wrap{grid-column:1/-1;overflow-x:auto}
    .sc__table{width:100%;border-collapse:collapse;font-size:var(--emr-text-md)}
    .sc__table th,.sc__table td{padding:0 8px;border-bottom:1px solid var(--emr-border);text-align:left;vertical-align:middle;height:44px}
    .sc__table thead th{height:auto;padding-block:4px;background:var(--emr-surface-raised);font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .sc__table tbody th{font-weight:var(--emr-weight-regular)}
    .sc__table .sc__val{text-align:right;font-variant-numeric:tabular-nums;width:1%;white-space:nowrap;font-weight:var(--emr-weight-bold)}
    .sc__pick{min-height:44px;width:100%;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;text-decoration:underline;text-decoration-color:var(--emr-border);text-underline-offset:3px;overflow-wrap:anywhere}
    .sc__pick:hover{text-decoration-color:currentColor}
    .sc__pick:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px;border-radius:4px}
    .sc--compact{grid-template-columns:auto minmax(0,1fr) auto;min-height:48px;padding:4px 12px;border-radius:8px;gap:4px 12px}
    .sc--compact .sc__title{grid-column:auto;color:var(--emr-text);font-size:var(--emr-text-md)}
    .sc--compact .sc__num{font-size:var(--emr-text-xl)}
    @media(max-width:480px){.sc{padding:10px 12px;grid-template-columns:minmax(0,1fr)}.sc:not(.sc--compact) .sc__actions{grid-column:1/-1;justify-content:flex-start}.sc--compact{grid-template-columns:minmax(0,1fr) auto}.sc--compact .sc__body{grid-column:1/-1;order:3}}
    @media print{.sc__actions{display:none}.sc__table-wrap{overflow:visible}.sc__pick{text-decoration:none}}
  `],
})
export class EmrScoreResultCardComponent {
  @Input({ required: true }) model!: ScoreResultCardViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<ScoreResultCardIntent>();

  private readonly uid = `emr-score-${++nextScoreResultCardId}`;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  /** Text for any status other than 'recorded'; those replace the score. */
  statusText(): string {
    const s = this.model.status;
    return s && s !== 'recorded' ? STATUS_TEXT[s] : '';
  }

  /** The result body (interpretation, breakdown, time) shows only when a recorded result is on display. */
  showResult(): boolean { return !this.model.loading && !this.model.error && !this.statusText() && !!this.model.result; }
}
