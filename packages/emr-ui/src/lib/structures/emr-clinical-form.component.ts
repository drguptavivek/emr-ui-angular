import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import type { ClinicalFieldDefinition, ClinicalFieldState, ClinicalMatrixBlockDefinition, ClinicalMatrixBlockRow, ClinicalFieldValue, ClinicalFormIntent, ClinicalFormViewModel, RepeatableItemState } from '@drguptavivek/emr-controller';
import { EmrSectionCardComponent } from './emr-section-card.component';
import { EmrCustomFieldContext, EmrTypedFieldComponent } from '../fields/emr-typed-field.component';

function isEmptyValue(value: ClinicalFieldState['value']): boolean {
  return value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

@Component({
  selector: 'emr-clinical-form',
  standalone: true,
  imports: [EmrSectionCardComponent, EmrTypedFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="emr-clinical-form" novalidate (submit)="$event.preventDefault()" [attr.aria-label]="model.schema.label">
      @if (model.schema.description) { <p class="emr-clinical-form__description">{{ model.schema.description }}</p> }
      @for (section of model.schema.sections; track section.id) {
        <emr-section-card [sectionId]="domId(model.schema.id + '-' + section.id)" [label]="section.label" [description]="section.description"
          [collapsible]="section.collapsible ?? false" [collapsed]="isCollapsed(section.id)"
          [status]="model.sectionStatuses?.[section.id]" (toggleRequested)="emit({ type: 'sectionToggleRequested', sectionId: section.id })">
          <div class="emr-clinical-form__grid">
            @for (block of section.blocks; track block.id) {
              @if (block.kind === 'repeatable') {
                <div class="emr-clinical-form__repeatable" [style.grid-column]="'span 12'">
                  <div class="emr-clinical-form__repeat-heading">
                    <div><h3>{{ block.label }}</h3>@if (block.description) { <p>{{ block.description }}</p> }</div>
                    <button class="emr-button emr-button--outline emr-button--small" type="button" [disabled]="model.readOnly" (click)="emit({ type: 'repeatItemAddRequested', groupId: block.id })">{{ block.addLabel ?? 'Add' }}</button>
                  </div>
                  @for (item of itemsFor(block.id); track item.id) {
                    <div class="emr-clinical-form__repeat-item">
                      <div class="emr-clinical-form__repeat-item-heading"><span>{{ item.label ?? ('Entry ' + ($index + 1)) }}</span><button class="emr-button emr-button--ghost emr-button--small" type="button" [disabled]="model.readOnly || item.readOnly" (click)="emit({ type: 'repeatItemRemoveRequested', groupId: block.id, itemId: item.id })">Remove</button></div>
                      <div class="emr-clinical-form__grid">@for (field of block.fields; track field.id) { @if (shown(item.fields[field.id])) { <div class="emr-clinical-form__field" [style.grid-column]="'span ' + (field.span ?? 6)"><emr-typed-field [definition]="field" [model]="item.fields[field.id]" [controlId]="controlId(field, item.id)" [readOnly]="model.readOnly || !!item.readOnly" [customTemplates]="customTemplates" (focused)="focus(field.id)" (valueChange)="valueChanged(field, $event, item, block.id)" (statusChange)="statusChanged(field, $event, item, block.id)" /></div> } }</div>
                    </div>
                  } @empty { <p class="emr-clinical-form__empty">No entries recorded.</p> }
                </div>
              } @else if (block.kind === 'matrix') {
                @if (matrixRows(block).length) {
                  <div class="emr-clinical-form__matrix" role="table" [attr.aria-label]="block.label" [style.grid-column]="'span 12'" [style.--emr-matrix-cols]="block.columns.length">
                    <h3>{{ block.label }}</h3>@if (block.description) { <p>{{ block.description }}</p> }
                    <div class="emr-clinical-form__matrix-row" role="row"><span aria-hidden="true"></span>@for (column of block.columns; track column.id) { <span role="columnheader">{{ column.label }}</span> }</div>
                    @for (row of matrixRows(block); track row.id) {
                      <div class="emr-clinical-form__matrix-row" role="row">
                        <span role="rowheader">{{ row.label }}@if (rowRequired(row)) { <span class="emr-field__required" aria-hidden="true"> *</span> }</span>
                        @for (column of block.columns; track column.id) {
                          <div role="cell">@if (row.cells[column.id]; as cell) { @if (shown(model.fields[cell.id])) { <emr-typed-field [definition]="cell" [model]="model.fields[cell.id]" [controlId]="controlId(cell)" [labelHidden]="true" [readOnly]="model.readOnly ?? false" [customTemplates]="customTemplates" (focused)="focus(cell.id)" (valueChange)="valueChanged(cell, $event)" (statusChange)="statusChanged(cell, $event)" /> } }</div>
                        }
                      </div>
                    }
                  </div>
                }
              } @else if (shown(model.fields[block.id])) {
                <div class="emr-clinical-form__field" [style.grid-column]="'span ' + (block.span ?? 6)"><emr-typed-field [definition]="block" [model]="model.fields[block.id]" [controlId]="controlId(block)" [readOnly]="model.readOnly ?? false" [customTemplates]="customTemplates" (focused)="focus(block.id)" (valueChange)="valueChanged(block, $event)" (statusChange)="statusChanged(block, $event)" /></div>
              }
            }
          </div>
        </emr-section-card>
      }
    </form>
  `,
  styles: [`.emr-clinical-form{display:grid;gap:16px}.emr-clinical-form__description{margin:0;color:var(--emr-text-muted)}.emr-clinical-form__grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.emr-clinical-form__repeatable{border:1px solid var(--emr-border);border-radius:8px;padding:16px;background:var(--emr-surface-slate)}.emr-clinical-form__repeat-heading,.emr-clinical-form__repeat-item-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.emr-clinical-form__repeat-heading h3{margin:0;font-size:var(--emr-text-lg)}.emr-clinical-form__repeat-heading p{margin:4px 0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}.emr-clinical-form__repeat-item{margin-top:12px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}.emr-clinical-form__repeat-item-heading{margin-bottom:12px;font-weight:600}.emr-clinical-form__matrix{display:grid;gap:8px}.emr-clinical-form__matrix h3{margin:0;font-size:var(--emr-text-lg)}.emr-clinical-form__matrix p{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}.emr-clinical-form__matrix-row{display:grid;grid-template-columns:22% repeat(var(--emr-matrix-cols),minmax(0,1fr));gap:16px;align-items:start;padding-top:8px;border-top:1px solid var(--emr-border)}.emr-clinical-form__matrix-row:first-of-type{border-top:0}.emr-clinical-form__matrix-row>[role=columnheader],.emr-clinical-form__matrix-row>[role=rowheader]{font-weight:var(--emr-weight-bold);font-size:var(--emr-text-md)}.emr-clinical-form__matrix-row>[role=rowheader]{padding-top:12px}.emr-clinical-form__empty{color:var(--emr-text-muted);margin:12px 0}.emr-clinical-form__textarea{resize:vertical;min-height:88px}.emr-clinical-form__quantity{display:flex;align-items:center;gap:8px}.emr-clinical-form__quantity .emr-control{min-width:0;flex:1}@media(max-width:720px){.emr-clinical-form__matrix-row{grid-template-columns:repeat(var(--emr-matrix-cols),minmax(0,1fr))}.emr-clinical-form__matrix-row>[role=rowheader]{grid-column:1/-1;padding-top:0}.emr-clinical-form__matrix-row>span[aria-hidden]{display:none}.emr-clinical-form__grid{grid-template-columns:1fr}.emr-clinical-form__field,.emr-clinical-form__repeatable,.emr-clinical-form__matrix{grid-column:span 1!important}.emr-clinical-form__repeat-item{padding:10px}}`]
})
export class EmrClinicalFormComponent {
  @Input({ required: true }) model!: ClinicalFormViewModel;
  @Input() idPrefix = '';
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly intent = new EventEmitter<ClinicalFormIntent>();
  /** A hidden field is skipped only while empty: a hidden field that still holds a value is clinical data and stays visible. */
  shown(state?: ClinicalFieldState): boolean { return !state?.hidden || !isEmptyValue(state.value); }
  /** A row is drawn while any of its cells is shown. */
  matrixRows(block: ClinicalMatrixBlockDefinition): readonly ClinicalMatrixBlockRow[] { return block.rows.filter(row => Object.values(row.cells).some(cell => this.shown(this.model.fields[cell.id]))); }
  rowRequired(row: ClinicalMatrixBlockRow): boolean { return Object.values(row.cells).some(cell => this.model.fields[cell.id]?.required ?? cell.required ?? false); }
  isCollapsed(sectionId: string): boolean { return this.model.collapsedSectionIds?.includes(sectionId) ?? false; }
  itemsFor(groupId: string): readonly RepeatableItemState[] { return this.model.repeatableGroups[groupId] ?? []; }
  domId(value: string): string { return this.idPrefix ? `${this.idPrefix}-${value}` : value; }
  controlId(field: ClinicalFieldDefinition, itemId?: string): string { return this.domId(`${this.model.schema.id}-${itemId ? itemId + '-' : ''}${field.id}`); }
  focus(fieldId: string): void { this.emit({ type: 'fieldFocused', fieldId }); }
  valueChanged(field: ClinicalFieldDefinition, value: ClinicalFieldValue, item?: RepeatableItemState, groupId?: string): void {
    this.emit(item && groupId ? { type: 'repeatItemEditRequested', groupId, itemId: item.id, fieldId: field.id, value } : { type: 'fieldEditRequested', fieldId: field.id, value });
  }
  statusChanged(field: ClinicalFieldDefinition, status: ClinicalFieldState['assessmentStatus'], item?: RepeatableItemState, groupId?: string): void { this.emit(item && groupId ? { type: 'repeatItemStatusEditRequested', groupId, itemId: item.id, fieldId: field.id, status } : { type: 'fieldStatusEditRequested', fieldId: field.id, status }); }
  emit(intent: ClinicalFormIntent): void { this.intent.emit(intent); }
}
