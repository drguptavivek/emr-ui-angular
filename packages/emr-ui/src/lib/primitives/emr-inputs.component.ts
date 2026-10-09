import { ChangeDetectionStrategy, Component, Directive, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { EmrOption } from '@drguptavivek/emr-controller';

@Directive()
abstract class EmrFieldBase {
  @Input() controlId = 'emr-field';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readOnly = false;

  describedBy(): string | null {
    const ids: string[] = [];
    if (this.hint) ids.push(`${this.controlId}-hint`);
    if (this.error) ids.push(`${this.controlId}-error`);
    return ids.length ? ids.join(' ') : null;
  }
}

@Component({
  selector: 'emr-text-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="controlId">
      <span class="emr-field__label">{{ label }} @if (required) { <span class="emr-field__required" aria-hidden="true">*</span> }</span>
      <input class="emr-control" [id]="controlId" [value]="value" [placeholder]="placeholder" [required]="required"
        [disabled]="disabled" [readOnly]="readOnly" [attr.aria-invalid]="!!error" [attr.aria-describedby]="describedBy()"
        (input)="valueChange.emit(inputValue($event))" (blur)="blurred.emit()" />
      @if (hint) { <span class="emr-field__hint" [id]="controlId + '-hint'">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error" [id]="controlId + '-error'">{{ error }}</span> }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrTextInputComponent extends EmrFieldBase {
  @Input() value = '';
  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly blurred = new EventEmitter<void>();
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
}

@Component({
  selector: 'emr-number-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="controlId">
      <span class="emr-field__label">{{ label }} @if (required) { <span class="emr-field__required" aria-hidden="true">*</span> }</span>
      <input class="emr-control" [id]="controlId" type="number" [attr.inputmode]="mode === 'integer' ? 'numeric' : 'decimal'"
        [attr.step]="mode === 'integer' ? 1 : step" [attr.min]="min" [attr.max]="max" [value]="value ?? ''" [placeholder]="placeholder"
        [required]="required" [disabled]="disabled" [readOnly]="readOnly" [attr.aria-invalid]="!!error"
        [attr.aria-describedby]="describedBy()" (input)="emitValue($event)" (blur)="blurred.emit()" />
      @if (hint) { <span class="emr-field__hint" [id]="controlId + '-hint'">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error" [id]="controlId + '-error'">{{ error }}</span> }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrNumberInputComponent extends EmrFieldBase {
  @Input() mode: 'integer' | 'decimal' = 'decimal';
  @Input() value: number | null = null;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step = 0.01;
  @Output() readonly valueChange = new EventEmitter<number | null>();
  @Output() readonly blurred = new EventEmitter<void>();
  emitValue(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.valueChange.emit(raw === '' ? null : Number(raw));
  }
}

@Component({
  selector: 'emr-date-input',
  standalone: true,
  template: `
    <label class="emr-field" [for]="controlId">
      <span class="emr-field__label">{{ label }} @if (required) { <span class="emr-field__required" aria-hidden="true">*</span> }</span>
      <input class="emr-control" [id]="controlId" type="date" [value]="value" [attr.min]="min" [attr.max]="max"
        [required]="required" [disabled]="disabled" [readOnly]="readOnly" [attr.aria-invalid]="!!error"
        [attr.aria-describedby]="describedBy()" (input)="valueChange.emit(inputValue($event))" />
      @if (hint) { <span class="emr-field__hint" [id]="controlId + '-hint'">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error" [id]="controlId + '-error'">{{ error }}</span> }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrDateInputComponent extends EmrFieldBase {
  @Input() value = '';
  @Input() min = '';
  @Input() max = '';
  @Output() readonly valueChange = new EventEmitter<string>();
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
}

@Component({
  selector: 'emr-select',
  standalone: true,
  template: `
    <label class="emr-field" [for]="controlId">
      <span class="emr-field__label">{{ label }} @if (required) { <span class="emr-field__required" aria-hidden="true">*</span> }</span>
      <select class="emr-select" [id]="controlId" [value]="value ?? ''" [disabled]="disabled" [required]="required" [attr.aria-readonly]="readOnly || null"
        [attr.aria-invalid]="!!error" [attr.aria-describedby]="describedBy()" (change)="onSelectChange($event)">
        @if (placeholder) { <option value="">{{ placeholder }}</option> }
        @for (option of options; track option.value) {
          <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option>
        }
      </select>
      @if (hint) { <span class="emr-field__hint" [id]="controlId + '-hint'">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error" [id]="controlId + '-error'">{{ error }}</span> }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrSelectComponent extends EmrFieldBase {
  @Input() value: string | null = null;
  @Input() options: readonly EmrOption[] = [];
  @Output() readonly valueChange = new EventEmitter<string | null>();
  selectValue(event: Event): string | null {
    const value = (event.target as HTMLSelectElement).value;
    return value || null;
  }
  /** `<select>` has no native readonly: keep it focusable/announceable, but revert any change. */
  onSelectChange(event: Event): void {
    if (this.readOnly) { (event.target as HTMLSelectElement).value = this.value ?? ''; return; }
    this.valueChange.emit(this.selectValue(event));
  }
}

@Component({
  selector: 'emr-quantity-input',
  standalone: true,
  template: `
    <div class="emr-field">
      <label class="emr-field__label" [for]="controlId + '-value'">{{ label }} @if (required) { <span class="emr-field__required" aria-hidden="true">*</span> }</label>
      <div class="emr-quantity">
        <input class="emr-control" [id]="controlId + '-value'" type="number" inputmode="decimal" [value]="value ?? ''"
          [required]="required" [disabled]="disabled" [readOnly]="readOnly" [attr.aria-label]="label + ' value'"
          [attr.aria-invalid]="!!error" [attr.aria-describedby]="describedBy()" (input)="emitQuantityValue($event)" />
        <select class="emr-select" [id]="controlId + '-unit'" [value]="unit ?? ''" [disabled]="disabled" [attr.aria-readonly]="readOnly || null"
          [attr.aria-label]="label + ' unit'" [attr.aria-describedby]="describedBy()" (change)="emitUnit($event)">
          @for (option of units; track option.value) { <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option> }
        </select>
      </div>
      @if (hint) { <span class="emr-field__hint" [id]="controlId + '-hint'">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error" [id]="controlId + '-error'">{{ error }}</span> }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrQuantityInputComponent extends EmrFieldBase {
  @Input() value: number | null = null;
  @Input() unit: string | null = null;
  @Input() units: readonly EmrOption[] = [];
  @Output() readonly valueChange = new EventEmitter<number | null>();
  @Output() readonly unitChange = new EventEmitter<string | null>();
  emitQuantityValue(event: Event): void { const raw = (event.target as HTMLInputElement).value; this.valueChange.emit(raw === '' ? null : Number(raw)); }
  emitUnit(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.readOnly) { target.value = this.unit ?? ''; return; }
    this.unitChange.emit(target.value || null);
  }
}

@Component({
  selector: 'emr-paired-input',
  standalone: true,
  template: `
    <div class="emr-field">
      <label class="emr-field__label" [for]="controlId + '-first'">{{ label }}</label>
      <div class="emr-paired-control">
        <span class="emr-paired-control__prefix" aria-hidden="true">{{ firstLabel }}</span>
        <input class="emr-control" [id]="controlId + '-first'" [value]="firstValue" [disabled]="disabled" [readOnly]="readOnly"
          [attr.aria-label]="label + ', ' + firstLabel" (input)="firstValueChange.emit(inputValue($event))" />
        <span class="emr-field-row__separator" aria-hidden="true">{{ separator }}</span>
        <span class="emr-paired-control__prefix" aria-hidden="true">{{ secondLabel }}</span>
        <input class="emr-control" [id]="controlId + '-second'" [value]="secondValue" [disabled]="disabled" [readOnly]="readOnly"
          [attr.aria-label]="label + ', ' + secondLabel" (input)="secondValueChange.emit(inputValue($event))" />
      </div>
      @if (hint) { <span class="emr-field__hint">{{ hint }}</span> }
      @if (error) { <span class="emr-field__error">{{ error }}</span> }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrPairedInputComponent extends EmrFieldBase {
  @Input() firstLabel = 'First';
  @Input() secondLabel = 'Second';
  @Input() firstValue = '';
  @Input() secondValue = '';
  @Input() separator = '/';
  @Output() readonly firstValueChange = new EventEmitter<string>();
  @Output() readonly secondValueChange = new EventEmitter<string>();
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
}
