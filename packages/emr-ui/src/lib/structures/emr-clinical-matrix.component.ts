import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalColumn,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalQuantityValue,
  ClinicalRow
} from '@drguptavivek/emr-controller';

export interface ClinicalCellRendererContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  emit: (action: string, payload?: unknown) => void;
}

@Directive({ selector: 'ng-template[emrClinicalCellRenderer]', standalone: true })
export class EmrClinicalCellRendererDirective {
  @Input('emrClinicalCellRenderer') key = '';
  constructor(readonly template: TemplateRef<{ $implicit: ClinicalCellRendererContext }>) {}
}

@Component({
  selector: 'emr-clinical-matrix',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <section class="emr-matrix" [attr.aria-labelledby]="definition.id + '-title'">
      <h2 class="emr-matrix__title" [id]="definition.id + '-title'">{{ definition.label }}</h2>
      <ng-template #cellTemplate let-row="row" let-column="column">
        @if (!isApplicable(row, column.id)) {
          <div class="emr-matrix__na"><span aria-hidden="true">—</span><span class="emr-sr-only">Not applicable</span></div>
        } @else {
          @let cell = cellFor(row.id, column.id);
          @if (isCellReadOnly(cell)) {
            <div class="emr-control" [attr.aria-label]="row.label + ', ' + column.label">{{ formatValue(cell?.value) }}</div>
          } @else {
            @switch (row.type) {
              @case ('select') {
                <select class="emr-select" [value]="primitiveValue(cell)" [disabled]="cell?.disabled" [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (change)="selectChanged(row, column, $event)">
                  <option value="" [selected]="primitiveValue(cell) === ''">Select</option>
                  @for (option of row.options ?? []; track option.value) { <option [value]="option.value" [selected]="option.value === primitiveValue(cell)" [disabled]="option.disabled">{{ option.label }}</option> }
                </select>
              }
              @case ('boolean') {
                <select class="emr-select" [value]="booleanValue(cell)" [disabled]="cell?.disabled" [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (change)="booleanChanged(row, column, $event)">
                  <option value="">Not recorded</option><option value="true">Yes</option><option value="false">No</option>
                </select>
              }
              @case ('integer') {
                <input class="emr-control" type="number" inputmode="numeric" step="1" [value]="primitiveValue(cell)" [disabled]="cell?.disabled"
                  [attr.aria-label]="row.label + ', ' + column.label" [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (input)="numberChanged(row, column, $event)" />
              }
              @case ('decimal') {
                <input class="emr-control" type="number" inputmode="decimal" [attr.step]="decimalStep(row)" [value]="primitiveValue(cell)" [disabled]="cell?.disabled"
                  [attr.aria-label]="row.label + ', ' + column.label" [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (input)="numberChanged(row, column, $event)" />
              }
              @case ('date') {
                <input class="emr-control" type="date" [value]="primitiveValue(cell)" [disabled]="cell?.disabled" [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (input)="textChanged(row, column, $event)" />
              }
              @case ('quantity') {
                <div class="emr-quantity">
                  <input class="emr-control" type="number" inputmode="decimal" [value]="quantityValue(cell)" [disabled]="cell?.disabled"
                    [attr.aria-label]="row.label + ' value, ' + column.label" [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)"
                    (input)="quantityChanged(row, column, $event)" />
                  <div class="emr-control" [attr.aria-label]="row.label + ' unit'">{{ quantityUnit(row, cell) }}</div>
                </div>
              }
              @case ('custom') {
                @if (rendererFor(row.customRendererKey); as renderer) {
                  <ng-container *ngTemplateOutlet="renderer; context: customContext(row, column, cell)" />
                } @else {
                  <div class="emr-matrix__na">Custom renderer unavailable</div>
                }
              }
              @default {
                <input class="emr-control" type="text" [value]="primitiveValue(cell)" [disabled]="cell?.disabled" [attr.aria-label]="row.label + ', ' + column.label"
                  [attr.aria-invalid]="!!cell?.error" (focus)="focus(row.id, column.id)" (input)="textChanged(row, column, $event)" />
              }
            }
            @if (cell?.warning) { <span class="emr-matrix__message">Warning: {{ cell?.warning }}</span> }
            @if (cell?.error) { <span class="emr-matrix__message emr-matrix__error" role="alert">{{ cell?.error }}</span> }
          }
          @if (cell?.assessmentStatus; as status) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + status.tone">{{ status.label }}</span>
          }
          @if (!isCellReadOnly(cell) && row.assessmentStatusOptions?.length) {
            <select class="emr-select" [value]="cell?.assessmentStatus?.value ?? ''" [disabled]="cell?.disabled"
              [attr.aria-label]="'Assessment status for ' + row.label + ', ' + column.label"
              (change)="assessmentStatusChanged(row, column, $event)">
              <option value="" [selected]="!cell?.assessmentStatus?.value">Status not set</option>
              @for (option of row.assessmentStatusOptions; track option.value) { <option [value]="option.value" [selected]="option.value === cell?.assessmentStatus?.value">{{ option.label }}</option> }
            </select>
          }
        }
      </ng-template>

      <table>
        <thead>
          @if (definition.columnGroups?.length) {
            <tr><th rowspan="2">Clinical field</th>@for (group of definition.columnGroups; track group.id) { <th [attr.colspan]="group.columnIds.length">{{ group.label }}</th> }<th rowspan="2">Remarks</th></tr>
          }
          <tr>@if (!definition.columnGroups?.length) { <th>Clinical field</th> }@for (column of definition.columns; track column.id) { <th scope="col">{{ column.label }}</th> }@if (!definition.columnGroups?.length) { <th scope="col">Remarks</th> }</tr>
        </thead>
        <tbody>
          @for (row of definition.rows; track row.id) {
            <tr>
              <th class="emr-matrix__row-label" scope="row">{{ row.label }}@if (row.unit) { <span class="emr-field__hint"> ({{ row.unit }})</span> }@if (row.helpText) { <span class="emr-matrix__message">{{ row.helpText }}</span> }</th>
              @for (column of definition.columns; track column.id) { <td><ng-container *ngTemplateOutlet="cellTemplate; context: { row, column }" /></td> }
              <td><input class="emr-control" type="text" [value]="remarkFor(row.id)" [readOnly]="isRemarkReadOnly(row.id)" [disabled]="isRemarkDisabled(row.id)" [attr.aria-label]="'Remarks for ' + row.label" [attr.aria-invalid]="!!remarkError(row.id)" (input)="remarkChanged(row.id, $event)" />@if (remarkError(row.id)) { <span class="emr-matrix__message emr-matrix__error">{{ remarkError(row.id) }}</span> }</td>
            </tr>
          }
        </tbody>
      </table>

      <div class="emr-matrix-cards">
        @for (row of definition.rows; track row.id) {
          <article class="emr-matrix-card">
            <div class="emr-matrix-card__title">{{ row.label }} @if (row.unit) { <span class="emr-field__hint">({{ row.unit }})</span> }</div>
            @for (column of definition.columns; track column.id) {
              <div class="emr-matrix-card__cell"><span class="emr-matrix-card__label">{{ column.label }}</span><ng-container *ngTemplateOutlet="cellTemplate; context: { row, column }" /></div>
            }
            <div class="emr-matrix-card__cell"><label class="emr-matrix-card__label" [for]="definition.id + '-' + row.id + '-remark'">Remarks</label><input class="emr-control" [id]="definition.id + '-' + row.id + '-remark'" type="text" [value]="remarkFor(row.id)" [readOnly]="isRemarkReadOnly(row.id)" [disabled]="isRemarkDisabled(row.id)" (input)="remarkChanged(row.id, $event)" /></div>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrClinicalMatrixComponent {
  @Input({ required: true }) definition!: ClinicalMatrixSchema;
  @Input() model: ClinicalMatrixValues = {};
  @Input() readOnly = false;
  @Output() readonly intent = new EventEmitter<ClinicalMatrixIntent>();
  @ContentChildren(EmrClinicalCellRendererDirective) private renderers!: QueryList<EmrClinicalCellRendererDirective>;

  isApplicable(row: ClinicalRow, columnId: string): boolean { return !row.applicableColumnIds || row.applicableColumnIds.includes(columnId); }
  cellFor(rowId: string, columnId: string): ClinicalCellState | undefined { return this.model[rowId]?.cells[columnId]; }
  isCellReadOnly(cell?: ClinicalCellState): boolean { return this.readOnly || !!cell?.readOnly; }
  isRemarkReadOnly(rowId: string): boolean { return this.readOnly || !!this.model[rowId]?.remarkReadOnly; }
  isRemarkDisabled(rowId: string): boolean { return !!this.model[rowId]?.remarkDisabled; }
  remarkFor(rowId: string): string { return this.model[rowId]?.remark ?? ''; }
  remarkError(rowId: string): string { return this.model[rowId]?.remarkError ?? ''; }
  primitiveValue(cell?: ClinicalCellState): string | number { return typeof cell?.value === 'string' || typeof cell?.value === 'number' ? cell.value : ''; }
  booleanValue(cell?: ClinicalCellState): string { return typeof cell?.value === 'boolean' ? String(cell.value) : ''; }
  quantityValue(cell?: ClinicalCellState): string | number { return this.isQuantity(cell?.value) ? cell.value.value ?? '' : ''; }
  quantityUnit(row: ClinicalRow, cell?: ClinicalCellState): string { return this.isQuantity(cell?.value) ? cell.value.unit : row.unit ?? ''; }
  decimalStep(row: ClinicalRow): number { return 1 / 10 ** (row.precision ?? 2); }
  formatValue(value: ClinicalCellState['value'] | undefined): string {
    if (this.isQuantity(value)) return `${value.value ?? 'Not recorded'} ${value.unit}`.trim();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value === null || value === undefined || value === '' ? 'Not recorded' : String(value);
  }
  rendererFor(key?: string): TemplateRef<{ $implicit: ClinicalCellRendererContext }> | null { return this.renderers?.find(item => item.key === key)?.template ?? null; }
  customContext(row: ClinicalRow, column: ClinicalColumn, cell?: ClinicalCellState): { $implicit: ClinicalCellRendererContext } {
    return { $implicit: { row, column, cell, emit: (action, payload) => this.intent.emit({ type: 'customCellIntent', rowId: row.id, columnId: column.id, action, payload }) } };
  }
  focus(rowId: string, columnId: string): void { this.intent.emit({ type: 'cellFocused', rowId, columnId }); }
  textChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { this.emitCell(row, column, (event.target as HTMLInputElement).value); }
  numberChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { const raw = (event.target as HTMLInputElement).value; this.emitCell(row, column, raw === '' ? null : Number(raw)); }
  booleanChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { const raw = (event.target as HTMLSelectElement).value; this.emitCell(row, column, raw === '' ? null : raw === 'true'); }
  selectChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { const raw = (event.target as HTMLSelectElement).value; this.emitCell(row, column, raw || null); }
  quantityChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { const raw = (event.target as HTMLInputElement).value; this.emitCell(row, column, { value: raw === '' ? null : Number(raw), unit: this.quantityUnit(row, this.cellFor(row.id, column.id)) }); }
  assessmentStatusChanged(row: ClinicalRow, column: ClinicalColumn, event: Event): void { this.intent.emit({ type: 'cellAssessmentStatusEditRequested', rowId: row.id, columnId: column.id, status: ((event.target as HTMLSelectElement).value || null) as ClinicalAssessmentStatus | null }); }
  remarkChanged(rowId: string, event: Event): void { this.intent.emit({ type: 'remarkEditRequested', rowId, remark: (event.target as HTMLInputElement).value }); }
  private emitCell(row: ClinicalRow, column: ClinicalColumn, value: ClinicalCellState['value']): void { this.intent.emit({ type: 'cellEditRequested', rowId: row.id, columnId: column.id, value }); }
  private isQuantity(value: ClinicalCellState['value'] | undefined): value is ClinicalQuantityValue { return typeof value === 'object' && value !== null && 'unit' in value; }
}
