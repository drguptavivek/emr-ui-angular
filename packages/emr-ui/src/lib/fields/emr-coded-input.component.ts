import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';
import type { ClinicalAssessmentStatus, CodedInputIntent, CodedInputViewModel, EmrCodedValue, EmrOption } from '@drguptavivek/emr-controller';
import { EmrSearchSelectComponent } from '../primitives/emr-search-select.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

let nextCodedInputId = 0;

interface CodedChip {
  readonly concept: EmrCodedValue;
  readonly key: string;
  readonly system: string;
}

const keyOf = (c: EmrCodedValue): string => `${c.system}|${c.code}`;

@Component({
  selector: 'emr-coded-input',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSearchSelectComponent, NgIcon],
  providers: [...provideIcons({ heroXMark })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <emr-field-frame [label]="label" [controlId]="inputId" [required]="required" [hint]="model.definition.presentation.hint">
      <div class="ci" role="group" [attr.aria-labelledby]="headingId ?? null" [attr.aria-label]="headingId ? null : label" [attr.aria-describedby]="describedBy || null">
        @if (chips.length) {
          <ul class="ci__chips" [attr.aria-label]="label + ' selected'">
            @for (chip of chips; track chip.key) {
              <li class="ci__chip">
                <span class="ci__text">
                  <strong class="ci__display">{{ chip.concept.display }}</strong>
                  <span class="ci__code"><span class="ci__system">{{ chip.system }}</span> {{ chip.concept.code }}</span>
                </span>
                @if (!model.readOnly) {
                  <button class="ci__remove" type="button" [attr.aria-label]="'Remove ' + chip.concept.display"
                    (click)="intent.emit({ type: 'conceptRemoveRequested', code: chip.concept.code, system: chip.concept.system })">
                    <ng-icon name="heroXMark" aria-hidden="true" />
                  </button>
                }
              </li>
            }
          </ul>
        } @else if (model.readOnly && !model.status) {
          <p class="ci__none">Not supplied</p>
        }

        @if (!model.readOnly) {
          <emr-search-select class="ci__search" [controlId]="inputId" label="Search terminology" [labelHidden]="true" [placeholder]="placeholder"
            [query]="model.query" [options]="searchOptions" [selected]="selectedOptions" [open]="model.open && (model.options.length > 0 || model.loading)" [loading]="model.loading"

            (queryChanged)="intent.emit({ type: 'queryChangeRequested', query: $event })"
            (searchRequested)="search()" (openRequested)="intent.emit({ type: 'openRequested' })"
            (closeRequested)="intent.emit({ type: 'closeRequested' })" (optionSelected)="select($event)" />
        }

        @if (model.open && !model.loading && !model.options.length && !model.readOnly) { <p class="ci__empty" role="status">{{ model.emptyMessage }}</p> }

        @if (model.status || (statusOptions.length && !model.readOnly)) {
          <div class="ci__status">
            @if (model.status) { <span [class]="'emr-badge ' + statusTone" role="status">{{ statusLabel }}</span> }
            @if (statusOptions.length && !model.readOnly) {
              <select class="emr-select ci__status-select" [attr.aria-label]="label + ' assessment status'" [value]="model.status ?? ''" (change)="statusChanged($event)">
                <option value="">Status not set</option>
                @for (option of statusOptions; track option.value) { <option [value]="option.value" [selected]="option.value === model.status">{{ option.label }}</option> }
              </select>
            }
          </div>
        }

        @if (model.messages.length) {
          <ul class="ci__messages" aria-live="polite">
            @for (m of model.messages; track $index) {
              <li [id]="inputId + '-msg-' + $index" [class]="'ci__message ci__message--' + m.severity">
                <strong>{{ severityLabel(m.severity) }}:</strong> {{ m.message }}
              </li>
            }
          </ul>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .ci{display:grid;gap:8px;min-width:0}
    .ci__chips{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
    .ci__chip{display:inline-flex;align-items:stretch;min-height:44px;max-width:100%;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-soft)}
    .ci__text{display:grid;align-content:center;gap:1px;min-width:0;padding:5px 10px;overflow-wrap:anywhere}
    .ci__display{font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight)}
    .ci__code{font-size:var(--emr-text-xs);color:var(--emr-text-muted);line-height:var(--emr-leading-tight)}
    .ci__system{font-weight:var(--emr-weight-medium)}
    .ci__remove{flex:0 0 auto;width:44px;min-height:44px;display:inline-grid;place-items:center;border:0;border-left:1px solid var(--emr-border);border-radius:0 7px 7px 0;background:transparent;color:var(--emr-text);font-size:var(--emr-text-lg);cursor:pointer}
    .ci__remove:hover{background:var(--emr-danger-soft);color:var(--emr-danger)}
    .ci__remove:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px}
    .ci__empty{margin:0;padding:10px 12px;border:1px dashed var(--emr-border);border-radius:8px;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .ci__none{margin:0;min-height:44px;display:flex;align-items:center;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .ci__status{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    .ci__status-select{width:auto;max-width:100%;min-width:0}
    .ci__messages{display:grid;gap:3px;margin:0;padding:0;list-style:none}
    .ci__message{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-medium);color:var(--emr-text-muted)}
    .ci__message--error{color:var(--emr-danger)}
    .ci__message--warning{color:var(--emr-warning)}
  `]
})
export class EmrCodedInputComponent implements OnChanges {
  @Input({ required: true }) model!: CodedInputViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<CodedInputIntent>();

  readonly inputId = `emr-coded-input-${++nextCodedInputId}`;
  chips: readonly CodedChip[] = [];
  searchOptions: readonly EmrOption[] = [];
  selectedOptions: readonly EmrOption[] = [];
  describedBy = '';

  ngOnChanges(): void {
    const m = this.model;
    const value = m.value === null ? [] : Array.isArray(m.value) ? (m.value as readonly EmrCodedValue[]) : [m.value as EmrCodedValue];
    this.chips = value.map((concept) => ({ concept, key: keyOf(concept), system: this.systemName(concept) }));
    this.searchOptions = m.options.map((c) => ({ value: keyOf(c), label: c.display, description: `${this.systemName(c)} ${c.code}` }));
    this.selectedOptions = this.chips.map((c) => ({ value: c.key, label: c.concept.display }));
    const ids = m.messages.map((_, i) => `${this.inputId}-msg-${i}`);
    if (m.definition.presentation.hint) ids.unshift(`${this.inputId}-message`);
    this.describedBy = ids.join(' ');
  }

  get label(): string { return this.model.definition.presentation.label; }
  get placeholder(): string { return this.model.definition.presentation.placeholder ?? 'Search by name or code'; }
  get required(): boolean { return this.model.definition.contract.cardinality.min >= 1; }
  get statusOptions() { return this.model.definition.presentation.assessmentStatusOptions ?? []; }
  get statusLabel(): string { return this.statusOptions.find((o) => o.value === this.model.status)?.label ?? String(this.model.status).replaceAll('-', ' '); }
  get statusTone(): string { const tone = this.statusOptions.find((o) => o.value === this.model.status)?.tone; return tone ? `emr-tone-${tone}` : 'emr-tone-neutral'; }

  severityLabel(severity: 'error' | 'warning' | 'info'): string { return severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Note'; }

  search(): void {
    const valueSetCanonical = this.model.definition.contract.terminology.find((b) => b.role === 'answer-value-set')?.valueSetCanonical;
    this.intent.emit({ type: 'searchRequested', query: this.model.query, ...(valueSetCanonical ? { valueSetCanonical } : {}) });
  }

  select(key: string): void {
    const concept = this.model.options.find((c) => keyOf(c) === key);
    if (concept) this.intent.emit({ type: 'conceptSelected', concept });
  }

  statusChanged(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as ClinicalAssessmentStatus | '';
    if (status) this.intent.emit({ type: 'statusChangeRequested', status });
  }

  private systemName(c: EmrCodedValue): string { return this.model.systemLabels?.[c.system] ?? c.system; }
}
