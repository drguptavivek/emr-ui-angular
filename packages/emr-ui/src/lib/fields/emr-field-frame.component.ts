import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'emr-field-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'emr-field-frame' },
  template: `
    <div class="emr-field-frame__heading">
      <label class="emr-field-frame__label" [class.emr-sr-only]="labelHidden()" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) { <span class="emr-field__required" aria-hidden="true">*</span> }
      </label>
      @if (required()) { <span class="emr-sr-only">Required</span> }
    </div>
    <div class="emr-field-frame__control"><ng-content /></div>
    <div class="emr-field-frame__messages" aria-live="polite">
      @if (error()) {
        <span class="emr-field__error" [id]="messageId()">{{ error() }}</span>
      } @else if (warning()) {
        <span class="emr-field__warning" [id]="messageId()">{{ warning() }}</span>
      } @else if (hint()) {
        <span class="emr-field__hint" [id]="messageId()">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrFieldFrameComponent {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly required = input(false);
  /** Matrix cells: row and column headers are the visible label; the <label> stays for assistive tech. */
  readonly labelHidden = input(false);
  readonly hint = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();

  readonly messageId = () => `${this.controlId()}-message`;
}
