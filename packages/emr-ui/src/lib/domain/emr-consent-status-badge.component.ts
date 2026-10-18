import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ConsentStatusViewModel } from '@drguptavivek/emr-controller';

/** Emitted only by the tappable variant (`interactive` true). */
export type ConsentStatusBadgeIntent = { type: 'consentDetailsRequested' };

/**
 * Compact consent state for banners and lists: controller-supplied badge plus optional detail.
 * Static by default; set `interactive` to make it one button that emits `consentDetailsRequested`.
 */
@Component({
  selector: 'emr-consent-status-badge',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <ng-template #content>
      <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.badge.tone">{{ m.badge.label }}</span>
      @if (m.detail) { <span class="cs__detail">{{ m.detail }}</span> }
    </ng-template>
    @if (interactive()) {
      <button class="cs cs--button" type="button" [attr.aria-label]="accessibleName()" (click)="intent.emit({ type: 'consentDetailsRequested' })">
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    } @else {
      <span class="cs">
        <ng-container [ngTemplateOutlet]="content" />
        @if (m.badge.assistiveText) { <span class="emr-sr-only"> {{ m.badge.assistiveText }}</span> }
      </span>
    }
  `,
  styles: [`
    :host{display:inline-block;max-width:100%;font-family:var(--emr-font-family)}
    .cs{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px 8px;max-width:100%;color:var(--emr-text)}
    .cs--button{min-height:44px;padding:0 4px;border:0;border-radius:8px;background:none;font:inherit;text-align:start;cursor:pointer}
    .cs--button:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .cs__detail{font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
  `]
})
export class EmrConsentStatusBadgeComponent {
  readonly model = input.required<ConsentStatusViewModel>();
  readonly interactive = input(false);
  readonly intent = output<ConsentStatusBadgeIntent>();

  readonly accessibleName = computed(() => {
    const { badge, detail } = this.model();
    return [badge.assistiveText ?? badge.label, detail].filter(Boolean).join(', ');
  });
}
