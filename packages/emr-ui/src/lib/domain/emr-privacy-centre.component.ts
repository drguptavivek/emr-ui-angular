import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { PrivacyCentreIntent, PrivacyCentreViewModel } from '@drguptavivek/emr-controller';
import { EmrTabsComponent } from '../primitives/emr-tabs.component';

/** Built-in English; the app overrides any of it through the `labels` input. */
const DEFAULT_LABELS = { sections: 'Privacy sections', summary: 'Summary', contact: 'Need help?' };
export type EmrPrivacyCentreLabels = typeof DEFAULT_LABELS;

let nextId = 0;

type SectionId = PrivacyCentreViewModel['activeSection'];

/** L4 patient self-service home: summary tiles, section tabs and the active section projected by the app. */
@Component({
  selector: 'emr-privacy-centre',
  standalone: true,
  imports: [EmrTabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pcn" [attr.aria-labelledby]="uid + '-title'">
      <h2 class="pcn__title" [id]="uid + '-title'">{{ model().title }}</h2>
      <ul class="pcn__tiles" [attr.aria-label]="l().summary">
        @for (t of model().tiles; track t.key) {
          <li><button type="button" class="pcn__tile" (click)="intent.emit({ type: 'tileSelected', key: t.key })">
            <span class="pcn__label">{{ t.label }}</span>
            <span class="pcn__value">{{ t.value }}</span>
            @if (t.sub) { <span class="pcn__sub">{{ t.sub }}</span> }
            @if (t.status; as s) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + s.tone">{{ s.label }}</span> }
          </button></li>
        }
      </ul>
      <emr-tabs [ariaLabel]="l().sections" [tabs]="tabs()" [active]="model().activeSection" (tabChanged)="intent.emit({ type: 'sectionSelected', id: asSection($event) })" />
      <div class="pcn__panel" role="tabpanel"><ng-content /></div>
      @if (model().contactText) { <p class="pcn__contact"><strong>{{ l().contact }}</strong> {{ model().contactText }}</p> }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .pcn{display:grid;gap:16px}
    .pcn__title{margin:0;font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight)}
    .pcn__tiles{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
    .pcn__tile{width:100%;min-height:44px;height:100%;display:grid;gap:4px;justify-items:start;text-align:left;padding:12px 16px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);color:inherit;font:inherit;cursor:pointer}
    .pcn__tile:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .pcn__label{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .pcn__value{font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);font-variant-numeric:tabular-nums}
    .pcn__sub{font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .pcn__contact{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    @media print{.pcn__tile{border-color:var(--emr-text)}}
  `]
})
export class EmrPrivacyCentreComponent {
  readonly model = input.required<PrivacyCentreViewModel>();
  readonly labels = input<Partial<EmrPrivacyCentreLabels>>({});
  readonly intent = output<PrivacyCentreIntent>();
  protected readonly uid = `emr-privacy-${++nextId}`;
  protected readonly l = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
  protected readonly tabs = computed(() => this.model().sections.map(s => ({ value: s.id, label: s.label })));
  /** Tabs only ever emit values taken from model().sections, so the cast is sound. */
  protected asSection(value: string): SectionId { return value as SectionId; }
}
