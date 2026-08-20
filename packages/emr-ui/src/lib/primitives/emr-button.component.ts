import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

export type EmrButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EmrButtonSize = 'small' | 'medium';

@Component({
  selector: 'emr-button',
  standalone: true,
  template: `
    <button
      class="emr-button"
      [class.emr-button--secondary]="variant === 'secondary'"
      [class.emr-button--outline]="variant === 'outline'"
      [class.emr-button--ghost]="variant === 'ghost'"
      [class.emr-button--danger]="variant === 'danger'"
      [class.emr-button--small]="size === 'small'"
      [class.emr-button--block]="block"
      [attr.type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading"
      (click)="clicked.emit($event)"
    >
      @if (loading) { <span aria-hidden="true">•••</span> }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrButtonComponent {
  @Input() variant: EmrButtonVariant = 'primary';
  @Input() size: EmrButtonSize = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;
  @Output() readonly clicked = new EventEmitter<MouseEvent>();
}
