import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroCheckCircle, heroClock } from '@ng-icons/heroicons/outline';
import type { EmrOption, QueueCard, QueueStation, WorkQueueIntent, WorkQueueViewModel } from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrButtonComponent } from '../primitives/emr-button.component';
import { EmrTabsComponent } from '../primitives/emr-tabs.component';

let nextWorkQueueId = 0;

@Component({
  selector: 'emr-work-queue',
  standalone: true,
  imports: [EmrBadgeComponent, EmrButtonComponent, EmrTabsComponent, NgIcon],
  providers: [...provideIcons({ heroArrowPath, heroCheckCircle, heroClock })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wq" [class.wq--single]="model.stations.length === 1" [attr.aria-labelledby]="titleId()" [attr.aria-busy]="model.loading ? 'true' : null">
      <header class="wq__head">
        <h2 class="wq__title" [id]="titleId()">{{ model.title }}</h2>
        <p class="wq__updated" role="status">{{ model.updatedLabel }}</p>
        <button type="button" class="emr-button emr-button--outline emr-icon-button" aria-label="Refresh queue" (click)="intent.emit({ type: 'refreshRequested' })">
          <ng-icon name="heroArrowPath" size="20" aria-hidden="true" />
        </button>
      </header>

      @if (model.error) {
        <div class="wq__state wq__state--error" role="alert">
          <p>{{ model.error }}</p>
          <emr-button variant="outline" size="small" (clicked)="intent.emit({ type: 'retryRequested' })">Retry</emr-button>
        </div>
      } @else if (model.loading) {
        <p class="wq__state" role="status">Loading queue…</p>
      } @else if (!model.stations.length) {
        <p class="emr-empty">{{ model.emptyMessage }}</p>
      } @else {
        @if (total > 0) {
          <div class="wq__filter">
            <label class="emr-sr-only" [attr.for]="uid + '-filter'">Filter patients by name, MRN or token</label>
            <input class="emr-search-input" type="search" [id]="uid + '-filter'" placeholder="Filter by name, MRN or token" [value]="query" (input)="onFilter($event)" />
            <p class="wq__shown" role="status">@if (query.trim()) { Showing {{ shown() }} of {{ total }} patients }</p>
          </div>
        }

        @if (model.stations.length > 1) {
          <div class="wq__tabs">
            <emr-tabs ariaLabel="Stations" [tabs]="tabs" [active]="activeId()" (tabChanged)="stationTab = $event" />
          </div>
        }

        <div class="wq__board" tabindex="0" role="region" aria-label="Stations">
          @for (station of model.stations; track station.id) {
            <section class="wq__col" [class.wq__col--off]="station.id !== activeId()" [attr.aria-labelledby]="colId(station)">
              <header class="wq__colhead">
                <h3 class="wq__station" [id]="colId(station)">{{ station.label }}</h3>
                <span class="wq__count">{{ station.countLabel }}</span>
                @if (!model.readOnly) {
                  <emr-button variant="outline" size="small" [disabled]="!station.canCallNext" (clicked)="intent.emit({ type: 'callNextRequested', stationId: station.id })">Call next<span class="emr-sr-only"> in {{ station.label }}</span></emr-button>
                }
              </header>

              @if (station.cards.length) {
                <ul class="wq__list">
                  @for (card of visible(station); track card.id) {
                    <li class="wq__item">
                      <button type="button" class="wq__card" [attr.aria-pressed]="card.id === model.selectedCardId" [attr.aria-label]="cardLabel(card)" (click)="intent.emit({ type: 'cardSelected', cardId: card.id })">
                        <span class="wq__r1">
                          <span class="wq__mrn">{{ card.primaryIdentifier }}</span>
                          @if (card.id === model.selectedCardId) { <ng-icon class="wq__tick" name="heroCheckCircle" size="18" aria-hidden="true" /> }
                        </span>
                        <span class="wq__name" [attr.title]="card.displayName">{{ card.displayName }}@if (card.ageSexLabel) { <span class="wq__age"> {{ card.ageSexLabel }}</span> }</span>
                        <span class="wq__meta"><span class="wq__token">{{ card.tokenLabel }}</span><span class="wq__wait"><ng-icon name="heroClock" size="14" aria-hidden="true" /> {{ card.waitLabel }}</span></span>
                        @if (anyNext) { <span class="wq__next" [attr.title]="card.nextStepLabel">{{ card.nextStepLabel }}</span> }
                        @if (anyBadges) {
                          <span class="wq__flags">
                            @if (card.priority; as p) { <emr-badge [tone]="p.tone">{{ p.label }}@if (p.assistiveText) { <span class="emr-sr-only"> {{ p.assistiveText }}</span> }</emr-badge> }
                            @for (f of card.flags; track $index) { <emr-badge [tone]="f.tone">{{ f.label }}@if (f.assistiveText) { <span class="emr-sr-only"> {{ f.assistiveText }}</span> }</emr-badge> }
                          </span>
                        }
                      </button>
                      @if (card.id === model.selectedCardId) {
                        <div class="wq__tray">
                          @if (!model.readOnly && !card.readOnly && model.moveTargets.length) {
                            <label class="wq__move">
                              <span class="wq__movelabel">Move to</span>
                              <select #sel class="emr-select" (change)="onMove(card, sel)">
                                <option value="">Select station</option>
                                @for (t of model.moveTargets; track t.value) { <option [value]="t.value" [disabled]="t.disabled || t.value === station.id">{{ t.label }}</option> }
                              </select>
                            </label>
                          }
                          <emr-button variant="outline" size="small" (clicked)="intent.emit({ type: 'patientOpenRequested', patientId: card.patientId })">Open patient<span class="emr-sr-only"> {{ card.displayName }}</span></emr-button>
                        </div>
                      }
                    </li>
                  }
                </ul>
              } @else {
                <p class="wq__none">{{ model.emptyMessage }}</p>
              }
            </section>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family);min-width:0}
    .wq{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0}
    .wq__head{display:flex;align-items:center;gap:12px}
    .wq__title{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
    .wq__updated{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-sm);text-align:right}
    .wq__filter{display:grid;gap:4px;max-width:28rem}
    .wq__shown{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-sm);min-height:1.2em}
    .wq__tabs{display:none}
    .wq__board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(176px,1fr);gap:8px;overflow-x:auto;align-items:start;padding-bottom:4px}
    .wq--single .wq__board{grid-auto-columns:minmax(0,28rem)}
    .wq__col{display:flex;flex-direction:column;gap:8px;min-width:0;padding:8px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface-soft)}
    .wq__colhead{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
    .wq__station{margin:0;font-size:var(--emr-text-md);flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
    .wq__count{color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium)}
    .wq__list{list-style:none;margin:0;padding:3px;display:grid;gap:8px;max-height:min(70vh,44rem);overflow-y:auto}
    .wq__item{display:grid;gap:4px;min-width:0}
    .wq__card{display:grid;gap:2px;width:100%;min-height:var(--emr-control-height);padding:8px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);font:inherit;text-align:left;cursor:pointer;min-width:0}
    .wq__card:hover{background:var(--emr-primary-soft)}
    .wq__card:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .wq__card[aria-pressed="true"]{border-color:var(--emr-primary);box-shadow:inset 0 0 0 2px var(--emr-primary);background:var(--emr-primary-soft)}
    .wq__card[aria-pressed="true"] :is(.wq__age,.wq__wait,.wq__next){color:var(--emr-text)}
    .wq__card>span:not(.wq__flags,.wq__r1,.wq__meta){min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .wq__r1{display:flex;align-items:center;justify-content:space-between;gap:6px}
    .wq__mrn{font-family:var(--emr-font-mono);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .wq__tick{flex:none;color:var(--emr-primary)}
    .wq__name{font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium)}
    .wq__age,.wq__meta,.wq__next{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .wq__meta{display:flex;justify-content:space-between;gap:8px}
    .wq__wait{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--emr-text-muted);font-size:var(--emr-text-sm);display:inline-flex;align-items:center;gap:3px;justify-content:flex-end}
    .wq__token{flex:none;font-weight:var(--emr-weight-bold);color:var(--emr-text)}
    .wq__flags{display:flex;flex-wrap:wrap;gap:4px;min-height:var(--emr-compact-height);align-items:center}
    .wq__tray{display:flex;flex-wrap:wrap;align-items:end;gap:8px;padding:4px 2px}
    .wq__move{display:grid;gap:2px;flex:1 1 9rem;min-width:0}
    .wq__movelabel{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);color:var(--emr-text-muted)}
    .wq__none,.wq__state{margin:0;padding:12px;color:var(--emr-text-muted);font-size:var(--emr-text-md);text-align:center}
    .wq__state--error{display:grid;justify-items:center;gap:8px;border:1px solid var(--emr-danger);border-radius:8px;background:var(--emr-danger-soft);color:var(--emr-text)}
    .wq__state--error p{margin:0}
    @media(max-width:767px){
      .wq__tabs{display:block}
      .wq__board{grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:minmax(0,1fr);overflow-x:visible}
      .wq--single .wq__board{grid-auto-columns:auto}
      .wq__col--off{display:none}
      .wq__updated{display:none}
    }
    @media print{
      .wq__tabs,.wq__filter,.wq__tray,.wq__head button{display:none}
      .wq__board{display:grid;grid-auto-flow:row;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));overflow:visible}
      .wq__col,.wq__col--off{display:flex !important;break-inside:avoid}
      .wq__list{max-height:none;overflow:visible}
      .wq__card>span,.wq__wait{white-space:normal !important;overflow:visible !important;text-overflow:clip !important}
      .wq__updated{display:block !important}
    }
  `],
})
export class EmrWorkQueueComponent implements OnChanges {
  @Input({ required: true }) model!: WorkQueueViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<WorkQueueIntent>();

  protected readonly uid = `emr-wq-${++nextWorkQueueId}`;
  /** View-only state: the station tab shown on narrow screens and the free-text filter. */
  protected stationTab?: string;
  protected query = '';
  protected tabs: readonly EmrOption[] = [];
  protected total = 0;
  protected anyNext = false;
  protected anyBadges = false;

  ngOnChanges(): void {
    const cards = this.model.stations.flatMap((s) => s.cards);
    this.tabs = this.model.stations.map((s) => ({ value: s.id, label: `${s.label} (${s.countLabel})` }));
    this.total = cards.length;
    this.anyNext = cards.some((c) => !!c.nextStepLabel);
    this.anyBadges = cards.some((c) => !!c.priority || !!c.flags?.length);
  }

  protected titleId(): string { return this.headingId ?? `${this.uid}-title`; }
  protected colId(s: QueueStation): string { return `${this.uid}-col-${s.id}`; }

  /** The tab to show: the user's pick if it still exists, else the station holding the selected card, else the first. */
  protected activeId(): string {
    const ids = this.model.stations;
    if (this.stationTab && ids.some((s) => s.id === this.stationTab)) return this.stationTab;
    return (ids.find((s) => s.cards.some((c) => c.id === this.model.selectedCardId)) ?? ids[0])?.id ?? '';
  }

  protected visible(s: QueueStation): readonly QueueCard[] {
    const q = this.query.trim().toLowerCase();
    return q ? s.cards.filter((c) => [c.primaryIdentifier, c.displayName, c.tokenLabel].some((t) => t.toLowerCase().includes(q))) : s.cards;
  }

  protected shown(): number { return this.model.stations.reduce((n, s) => n + this.visible(s).length, 0); }

  protected cardLabel(c: QueueCard): string {
    return [c.primaryIdentifier, c.tokenLabel, c.displayName, `waiting ${c.waitLabel}`, c.priority?.label, ...(c.flags ?? []).map((f) => f.label), c.nextStepLabel].filter(Boolean).join(', ');
  }

  protected onFilter(e: Event): void { this.query = (e.target as HTMLInputElement).value; }

  protected onMove(card: QueueCard, sel: HTMLSelectElement): void {
    const stationId = sel.value;
    sel.value = '';
    if (stationId) this.intent.emit({ type: 'moveRequested', cardId: card.id, stationId });
  }
}
