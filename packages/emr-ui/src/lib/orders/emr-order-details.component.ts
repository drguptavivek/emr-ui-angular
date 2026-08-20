import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { EmrOption, SelectedOrder } from '@drguptavivek/emr-controller';
import { EmrCheckboxComponent } from '../primitives/emr-choice.component';
import { EmrSelectComponent, EmrTextInputComponent } from '../primitives/emr-inputs.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroClipboardDocumentCheck } from '@ng-icons/heroicons/outline';

export interface OrderDetailChange {
  orderId: string;
  field: string;
  value: string | boolean | null;
}

@Component({
  selector: 'emr-order-details',
  standalone: true,
  imports: [EmrCheckboxComponent, EmrSelectComponent, EmrTextInputComponent, NgIcon],
  providers: [...provideIcons({ heroClipboardDocumentCheck })],
  template: `
    <article class="emr-order-card">
      <header class="emr-order-card__header">
        <ng-icon class="emr-card-header-icon" name="heroClipboardDocumentCheck" aria-hidden="true" />
        <div class="emr-order-card__title">{{ order.label }} @if (order.code) { <span class="emr-field__hint">{{ order.code }}</span> }</div>
        <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Remove ' + order.label" (click)="removeRequested.emit(order.id)">Remove</button>
      </header>
      <div class="emr-order-fields">
        <emr-select [inputId]="order.id + '-urgency'" label="Urgency" [value]="stringDetail('urgency')" [options]="urgencyOptions"
          [error]="errorFor('urgency')" (valueChange)="changed('urgency', $event)" />
        @if (order.kind === 'laboratory') {
          <emr-checkbox label="Fasting required" [checked]="booleanDetail('fasting')" (checkedChange)="changed('fasting', $event)" />
          <emr-text-input [inputId]="order.id + '-notes'" label="Notes" [value]="stringDetail('notes') ?? ''" [error]="errorFor('notes')"
            (valueChange)="changed('notes', $event)" />
        }
        @if (order.kind === 'radiology') {
          <emr-text-input [inputId]="order.id + '-site'" label="Body site" [value]="stringDetail('bodySite') ?? ''" [error]="errorFor('bodySite')"
            (valueChange)="changed('bodySite', $event)" />
          <emr-select [inputId]="order.id + '-laterality'" label="Laterality" [value]="stringDetail('laterality')" [options]="lateralityOptions"
            [error]="errorFor('laterality')" (valueChange)="changed('laterality', $event)" />
          <emr-checkbox label="Contrast requested" [checked]="booleanDetail('contrast')" (checkedChange)="changed('contrast', $event)" />
          <emr-text-input [inputId]="order.id + '-indication'" label="Clinical indication" [value]="stringDetail('clinicalIndication') ?? ''"
            [error]="errorFor('clinicalIndication')" (valueChange)="changed('clinicalIndication', $event)" />
        }
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrOrderDetailsComponent {
  @Input({ required: true }) order!: SelectedOrder;
  @Input() urgencyOptions: readonly EmrOption[] = [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'stat', label: 'STAT' }
  ];
  @Input() lateralityOptions: readonly EmrOption[] = [
    { value: 'not-applicable', label: 'Not applicable' },
    { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' },
    { value: 'bilateral', label: 'Bilateral' }
  ];
  @Output() readonly detailChanged = new EventEmitter<OrderDetailChange>();
  @Output() readonly removeRequested = new EventEmitter<string>();

  stringDetail(field: string): string | null { const value = this.order.details?.[field]; return typeof value === 'string' ? value : null; }
  booleanDetail(field: string): boolean { return this.order.details?.[field] === true; }
  errorFor(field: string): string { return this.order.errors?.[field] ?? ''; }
  changed(field: string, value: string | boolean | null): void { this.detailChanged.emit({ orderId: this.order.id, field, value }); }
}
