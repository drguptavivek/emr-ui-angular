import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'emr-right-flyout',
  standalone: true,
  imports: [A11yModule],
  template: `
    @if (open) {
      <div class="emr-flyout-backdrop" aria-hidden="true" (click)="closeRequested.emit()"></div>
      <section class="emr-flyout" role="dialog" aria-modal="true"
        [attr.aria-labelledby]="title ? titleId : null" [attr.aria-label]="title || 'Panel'"
        cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="closeRequested.emit()">
        <header class="emr-flyout__header">
          @if (showBack) { <button class="emr-button emr-button--small emr-button--ghost" type="button" (click)="backRequested.emit()">Back</button> }
          @if (title) { <h2 class="emr-flyout__title" [id]="titleId">{{ title }}</h2> }
          <button class="emr-button emr-button--small emr-button--ghost" type="button" aria-label="Close panel" (click)="closeRequested.emit()">Close</button>
        </header>
        <div class="emr-flyout__body"><ng-content /></div>
        @if (showFooter) { <footer class="emr-flyout__footer"><ng-content select="[emrFlyoutFooter]" /></footer> }
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrRightFlyoutComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() titleId = 'emr-flyout-title';
  @Input() showBack = false;
  @Input() showFooter = false;
  @Output() readonly closeRequested = new EventEmitter<void>();
  @Output() readonly backRequested = new EventEmitter<void>();
}
