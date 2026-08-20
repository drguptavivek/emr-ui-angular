import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import type { ClinicalAssessmentStatus, ClinicalAssessmentStatusOption, ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue, ClinicalQuantityValue } from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

export interface EmrCustomFieldContext {
  $implicit?: EmrCustomFieldContext;
  field: ClinicalFieldDefinition;
  state?: ClinicalFieldState;
  controlId: string;
}

/** Shared renderer for schema-defined fields. It renders mechanics only; validation and meaning stay in the controller. */
@Component({
  selector: 'emr-typed-field',
  standalone: true,
  imports: [NgTemplateOutlet, EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <emr-field-frame [label]="field.label" [controlId]="controlId" [required]="field.required ?? false" [hint]="field.hint" [warning]="state?.warning" [error]="state?.error">
      @switch (field.type) {
        @case ('multiline') { <textarea class="emr-control emr-typed-field__textarea" [id]="controlId" [rows]="field.rows ?? 3" [value]="textValue()" [placeholder]="field.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="state?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"></textarea> }
        @case ('integer') { <input class="emr-control" [id]="controlId" type="number" inputmode="numeric" step="1" [value]="numberValue()" [placeholder]="field.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="state?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('decimal') { <input class="emr-control" [id]="controlId" type="number" inputmode="decimal" [attr.step]="decimalStep()" [value]="numberValue()" [placeholder]="field.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="state?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('date') { <input class="emr-control" [id]="controlId" type="date" [value]="textValue()" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
        @case ('select') { <select class="emr-select" [id]="controlId" [value]="textValue()" [disabled]="isChoiceDisabled()" [attr.aria-invalid]="state?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="valueChanged($event)"><option value="">Select</option>@for (option of field.options ?? []; track option.value) { <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option> }</select> }
        @case ('multiselect') { <select class="emr-select" multiple [id]="controlId" [disabled]="isChoiceDisabled()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="multiChanged($event)">@for (option of field.options ?? []; track option.value) { <option [value]="option.value" [selected]="selected(option.value)" [disabled]="option.disabled">{{ option.label }}</option> }</select> }
        @case ('boolean') { <label class="emr-checkbox"><input type="checkbox" [id]="controlId" [checked]="state?.value === true" [disabled]="isChoiceDisabled()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (change)="valueChanged($event)"><span>Yes</span></label> }
        @case ('quantity') { <div class="emr-typed-field__quantity"><input class="emr-control" [id]="controlId" type="number" inputmode="decimal" [value]="quantityValue()" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)">@if (field.unit) { <span class="emr-field__hint" aria-hidden="true">{{ field.unit }}</span> }</div> }
        @case ('custom') { @if (customTemplate()) { <ng-container *ngTemplateOutlet="customTemplate(); context: { $implicit: { field, state, controlId }, field, state, controlId }" /> } @else { <div class="emr-typed-field__unsupported" role="status">Custom renderer “{{ field.customRendererKey ?? field.id }}” is not registered.</div> } }
        @default { <input class="emr-control" [id]="controlId" type="text" [value]="textValue()" [placeholder]="field.placeholder ?? ''" [disabled]="isDisabled()" [readOnly]="isReadOnly()" [attr.aria-invalid]="state?.error ? 'true' : null" [attr.aria-describedby]="messageId()" (focus)="focused.emit()" (input)="valueChanged($event)"> }
      }
      @if (field.assessmentStatusOptions?.length || state?.assessmentStatus) {
        <div class="emr-typed-field__status">
          @if (state?.assessmentStatus) { <span [class]="'emr-badge ' + statusToneClass()" role="status">{{ statusLabel() }}</span> }
          @if (field.assessmentStatusOptions?.length) {
            <select class="emr-select emr-typed-field__status-select" [attr.aria-label]="field.label + ' assessment status'" [disabled]="isChoiceDisabled()" [value]="state?.assessmentStatus ?? ''" (change)="statusChanged($event)"><option value="">Recorded</option>@for (option of field.assessmentStatusOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select>
          }
        </div>
      }
    </emr-field-frame>
  `,
  styles: [`.emr-typed-field__textarea{resize:vertical;min-height:88px}.emr-typed-field__quantity{display:flex;align-items:center;gap:8px}.emr-typed-field__quantity .emr-control{min-width:0;flex:1}.emr-typed-field__status{display:flex;align-items:center;gap:8px;margin-top:6px}.emr-typed-field__status-select{min-height:44px}.emr-typed-field__unsupported{padding:10px;border:1px dashed var(--emr-border);color:var(--emr-text-muted);font-size:.875rem}`]
})
export class EmrTypedFieldComponent {
  @Input({ required: true }) field!: ClinicalFieldDefinition;
  @Input() state?: ClinicalFieldState;
  @Input({ required: true }) controlId!: string;
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly valueChange = new EventEmitter<ClinicalFieldValue>();
  @Output() readonly statusChange = new EventEmitter<ClinicalAssessmentStatus | undefined>();
  @Output() readonly focused = new EventEmitter<void>();

  customTemplate(): TemplateRef<EmrCustomFieldContext> | undefined { return this.field.customRendererKey ? this.customTemplates[this.field.customRendererKey] : undefined; }
  messageId(): string { return `${this.controlId}-message`; }
  isDisabled(): boolean { return this.readOnly || !!this.state?.disabled; }
  isReadOnly(): boolean { return this.readOnly || !!this.state?.readOnly; }
  isChoiceDisabled(): boolean { return this.isDisabled() || !!this.state?.readOnly; }
  textValue(): string { return typeof this.state?.value === 'string' ? this.state.value : ''; }
  numberValue(): string | number { return typeof this.state?.value === 'number' ? this.state.value : ''; }
  quantityValue(): string | number { return this.quantity()?.value ?? this.numberValue(); }
  quantity(): ClinicalQuantityValue | undefined { return typeof this.state?.value === 'object' && this.state.value !== null && 'value' in this.state.value ? this.state.value as ClinicalQuantityValue : undefined; }
  selected(value: string): boolean { return Array.isArray(this.state?.value) && this.state.value.includes(value); }
  decimalStep(): number { return 1 / 10 ** (this.field.precision ?? 2); }
  statusLabel(): string { return this.field.assessmentStatusOptions?.find(option => option.value === this.state?.assessmentStatus)?.label ?? this.state?.assessmentStatus ?? 'Recorded'; }
  statusToneClass(): string { const tone = this.field.assessmentStatusOptions?.find(option => option.value === this.state?.assessmentStatus)?.tone; return tone ? `emr-tone-${tone}` : ''; }
  valueChanged(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const numericValue = target.value === '' ? null : Number(target.value);
    const value = this.field.type === 'boolean' ? (target as HTMLInputElement).checked
      : this.field.type === 'quantity' ? { value: numericValue, unit: this.field.unit ?? '' }
      : this.field.type === 'integer' || this.field.type === 'decimal' ? numericValue : target.value;
    this.valueChange.emit(value);
  }
  multiChanged(event: Event): void { this.valueChange.emit([...(event.target as HTMLSelectElement).selectedOptions].map(option => option.value)); }
  statusChanged(event: Event): void { const value = (event.target as HTMLSelectElement).value; this.statusChange.emit((value || undefined) as ClinicalAssessmentStatus | undefined); }
}
