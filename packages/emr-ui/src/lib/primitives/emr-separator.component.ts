import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type EmrSeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Presentation-only divider. Renders a plain rule, an optional centred label
 * (horizontal only), or a vertical divider for inline groupings.
 */
@Component({
  selector: 'emr-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (label(); as text) {
      <div class="emr-separator emr-separator--labelled" role="separator" aria-orientation="horizontal" [attr.aria-label]="text">
        <span class="emr-separator__line" aria-hidden="true"></span>
        <span class="emr-separator__label">{{ text }}</span>
        <span class="emr-separator__line" aria-hidden="true"></span>
      </div>
    } @else {
      <div
        class="emr-separator"
        [class.emr-separator--vertical]="orientation() === 'vertical'"
        role="separator"
        [attr.aria-orientation]="orientation()"
      ></div>
    }
  `
})
export class EmrSeparatorComponent {
  readonly orientation = input<EmrSeparatorOrientation>('horizontal');
  readonly label = input<string>();
}
