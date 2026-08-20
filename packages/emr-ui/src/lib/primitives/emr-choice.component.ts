import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { EmrOption } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-checkbox',
  standalone: true,
  template: `<label class="emr-checkbox"><input type="checkbox" [checked]="checked" [disabled]="disabled" (change)="checkedChange.emit(checkedValue($event))" /><span>{{ label }}</span></label>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrCheckboxComponent {
  @Input() label = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() readonly checkedChange = new EventEmitter<boolean>();
  checkedValue(event: Event): boolean { return (event.target as HTMLInputElement).checked; }
}

@Component({
  selector: 'emr-toggle',
  standalone: true,
  template: `<label class="emr-toggle"><input type="checkbox" role="switch" [checked]="checked" [disabled]="disabled" (change)="checkedChange.emit(checkedValue($event))" /><span class="emr-toggle__track"><span class="emr-toggle__thumb"></span></span><span>{{ label }}</span></label>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrToggleComponent {
  @Input() label = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() readonly checkedChange = new EventEmitter<boolean>();
  checkedValue(event: Event): boolean { return (event.target as HTMLInputElement).checked; }
}

@Component({
  selector: 'emr-radio-group',
  standalone: true,
  template: `
    <fieldset class="emr-field" [disabled]="disabled">
      <legend class="emr-field__label">{{ label }}</legend>
      @for (option of options; track option.value) {
        <label class="emr-radio"><input type="radio" [name]="name" [value]="option.value" [checked]="value === option.value"
          [disabled]="option.disabled" (change)="valueChange.emit(option.value)" /><span>{{ option.label }}</span></label>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrRadioGroupComponent {
  @Input() name = 'emr-radio';
  @Input() label = '';
  @Input() value: string | null = null;
  @Input() options: readonly EmrOption[] = [];
  @Input() disabled = false;
  @Output() readonly valueChange = new EventEmitter<string>();
}
