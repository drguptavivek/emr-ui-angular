import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroSquaresPlus } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'emr-section-card',
  standalone: true,
  imports: [EmrBadgeComponent, NgIcon],
  providers: [...provideIcons({ heroSquaresPlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'emr-section-card' },
  template: `
    <section [attr.aria-labelledby]="headingId()">
      <header class="emr-section-card__header">
        <ng-icon class="emr-card-header-icon" name="heroSquaresPlus" aria-hidden="true" />
        <div class="emr-section-card__heading">
          <h2 [id]="headingId()">{{ label() }}</h2>
          @if (description()) { <p>{{ description() }}</p> }
        </div>
        @if (status(); as badge) { <emr-badge [tone]="badge.tone">{{ badge.label }}</emr-badge> }
        @if (collapsible()) {
          <button
            class="emr-button emr-button--ghost emr-button--small"
            type="button"
            [attr.aria-expanded]="!collapsed()"
            [attr.aria-controls]="contentId()"
            (click)="toggleRequested.emit()"
          >{{ collapsed() ? 'Show' : 'Hide' }}</button>
        }
      </header>
      @if (!collapsed()) {
        <div class="emr-section-card__content" [id]="contentId()"><ng-content /></div>
      }
    </section>
  `,
})
export class EmrSectionCardComponent {
  readonly sectionId = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly status = input<EmrBadge>();
  readonly collapsible = input(false);
  readonly collapsed = input(false);
  readonly toggleRequested = output<void>();

  readonly headingId = () => `emr-section-${this.sectionId()}-heading`;
  readonly contentId = () => `emr-section-${this.sectionId()}-content`;
}
