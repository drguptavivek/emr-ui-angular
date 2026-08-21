import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import type { ClinicalAssessmentStatus, ClinicalAssessmentStatusOption, ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue, ClinicalQuantityValue } from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

export interface EmrCustomFieldContext {
  $implicit?: EmrCustomFieldContext;
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
}

/** Shared renderer for schema-defined fields. It renders mechanics only; validation and meaning stay in the controller. */
@Component({
  selector: 'emr-typed-field',
  standalone: true,
  imports: [NgTemplateOutlet, EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <emr-field-frame [label]="definition.label" [controlId]="controlId" [required]="definition.required ?? false" [hint]="definition.hint" [warning]="model?.warning" [error]="model?.error">
      @switch (definition.type) {
        @case ('multiline') { <textarea class="emr-control emr-typed-field__textarea" [id]="controlId" [rows]="definition.rows ?? 3" [value]="textValue()" [placeholder]="definition.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="model?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"></textarea> }
        @case ('integer') { <input class="emr-control" [id]="controlId" type="number" inputmode="numeric" step="1" [value]="numberValue()" [placeholder]="definition.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="model?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('decimal') { <input class="emr-control" [id]="controlId" type="number" inputmode="decimal" [attr.step]="decimalStep()" [value]="numberValue()" [placeholder]="definition.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="model?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('date') { <input class="emr-control" [id]="controlId" type="date" [value]="textValue()" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('select') { <select class="emr-select" [id]="controlId" [value]="textValue()" [disabled]="isChoiceDisabled()" [attr.aria-invalid]="model?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="valueChanged($event)"><option value="">Select</option>@for (option of definition.options ?? []; track option.value) { <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option> }</select> }
        @case ('multiselect') { <select class="emr-select" multiple [id]="controlId" [disabled]="isChoiceDisabled()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="multiChanged($event)">@for (option of definition.options ?? []; track option.value) { <option [value]="option.value" [selected]="selected(option.value)" [disabled]="option.disabled">{{ option.label }}</option> }</select> }
        @case ('boolean') { <label class="emr-checkbox"><input type="checkbox" [id]="controlId" [checked]="model?.value === true" [disabled]="isChoiceDisabled()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="valueChanged($event)"><span>Yes</span></label> }
        @case ('quantity') { <div class="emr-typed-field__quantity"><input class="emr-control" [id]="controlId" type="number" inputmode="decimal" [value]="quantityValue()" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)">@if (definition.unit) { <span class="emr-field__hint" aria-hidden="true">{{ definition.unit }}</span> }</div> }
        @case ('custom') { @if (customTemplate()) { <ng-container *ngTemplateOutlet="customTemplate(); context: { $implicit: { definition, model, controlId }, definition, model, controlId }" /> } @else { <div class="emr-typed-field__unsupported" role="status">Custom renderer “{{ definition.customRendererKey ?? definition.id }}” is not registered.</div> } }
        @default { <input class="emr-control" [id]="controlId" type="text" [value]="textValue()" [placeholder]="definition.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="model?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
      }
      @if (definition.assessmentStatusOptions?.length || model?.assessmentStatus) {
        <div class="emr-typed-field__status">
          @if (model?.assessmentStatus) { <span [class]="'emr-badge ' + statusToneClass()" role="status">{{ statusLabel() }}</span> }
          @if (definition.assessmentStatusOptions?.length) {
            <select class="emr-select emr-typed-field__status-select" [attr.aria-label]="definition.label + ' assessment status'" [disabled]="isChoiceDisabled()" [value]="model?.assessmentStatus ?? ''" (change)="statusChanged($event)"><option value="">Recorded</option>@for (option of definition.assessmentStatusOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select>
          }
        </div>
      }
    </emr-field-frame>
  `,
  styles: [`.emr-typed-field__textarea{resize:vertical;min-height:88px}.emr-typed-field__quantity{display:flex;align-items:center;gap:8px}.emr-typed-field__quantity .emr-control{min-width:0;flex:1}.emr-typed-field__status{display:flex;align-items:center;gap:8px;margin-top:6px}.emr-typed-field__status-select{min-height:44px}.emr-typed-field__unsupported{padding:10px;border:1px dashed var(--emr-border);color:var(--emr-text-muted);font-size:var(--emr-text-md)}`]
})
export class EmrTypedFieldComponent {
  @Input({ required: true }) definition!: ClinicalFieldDefinition;
  @Input() model?: ClinicalFieldState;
  @Input({ required: true }) controlId!: string;
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly valueChange = new EventEmitter<ClinicalFieldValue>();
  @Output() readonly statusChange = new EventEmitter<ClinicalAssessmentStatus | undefined>();
  @Output() readonly focused = new EventEmitter<void>();

  customTemplate(): TemplateRef<EmrCustomFieldContext> | undefined { return this.definition.customRendererKey ? this.customTemplates[this.definition.customRendererKey] : undefined; }
  messageId(): string { return `${this.controlId}-message`; }
  isDisabled(): boolean { return this.readOnly || !!this.model?.disabled; }
  isReadOnly(): boolean { return this.readOnly || !!this.model?.readOnly; }
  isChoiceDisabled(): boolean { return this.isDisabled() || !!this.model?.readOnly; }
  textValue(): string { return typeof this.model?.value === 'string' ? this.model.value : ''; }
  numberValue(): string | number { return typeof this.model?.value === 'number' ? this.model.value : ''; }
  quantityValue(): string | number { return this.quantity()?.value ?? this.numberValue(); }
  quantity(): ClinicalQuantityValue | undefined { return typeof this.model?.value === 'object' && this.model.value !== null && 'value' in this.model.value ? this.model.value as ClinicalQuantityValue : undefined; }
  selected(value: string): boolean { return Array.isArray(this.model?.value) && this.model.value.includes(value); }
  decimalStep(): number { return 1 / 10 ** (this.definition.precision ?? 2); }
  statusLabel(): string { return this.definition.assessmentStatusOptions?.find(option => option.value === this.model?.assessmentStatus)?.label ?? this.model?.assessmentStatus ?? 'Recorded'; }
  statusToneClass(): string { const tone = this.definition.assessmentStatusOptions?.find(option => option.value === this.model?.assessmentStatus)?.tone; return tone ? `emr-tone-${tone}` : ''; }
  valueChanged(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const numericValue = target.value === '' ? null : Number(target.value);
    const value = this.definition.type === 'boolean' ? (target as HTMLInputElement).checked
      : this.definition.type === 'quantity' ? { value: numericValue, unit: this.definition.unit ?? '' }
      : this.definition.type === 'integer' || this.definition.type === 'decimal' ? numericValue : target.value;
    this.valueChange.emit(value);
  }
  multiChanged(event: Event): void { this.valueChange.emit([...(event.target as HTMLSelectElement).selectedOptions].map(option => option.value)); }
  statusChanged(event: Event): void { const value = (event.target as HTMLSelectElement).value; this.statusChange.emit((value || undefined) as ClinicalAssessmentStatus | undefined); }
}
