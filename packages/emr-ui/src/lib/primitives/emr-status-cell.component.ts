import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EmrBadge } from '@drguptavivek/emr-controller';

export interface EmrStatusCellAttribution {
  nameLabel: string;
  roleLabel?: string;
  timeLabel?: string;
}

export interface EmrStatusCellAction {
  label: string;
  icon?: string;
}

/**
 * Mechanical state cell: caller-supplied badge, optional value, attribution line and ONE action.
 * No clinical meaning: every label and tone is supplied. Reuses the global `.emr-badge`/`.emr-tone-*`
 * classes (no L1 sibling import). `selectable` makes the cell body a role="button"; the action is a
 * sibling button, never nested inside it. `compact` shows the badge only, full text stays for AT.
 */
@Component({
  selector: 'emr-status-cell',
  standalone: true,
  template: `
    <div class="emr-status-cell">
      <div
        class="emr-status-cell__body"
        [class.emr-status-cell__body--selectable]="selectable()"
        [attr.id]="controlId()"
        [attr.role]="selectable() ? 'button' : null"
        [attr.tabindex]="selectable() ? 0 : null"
        (click)="selectable() && selected.emit()"
        (keydown.enter)="onKey($event)"
        (keydown.space)="onKey($event)"
      >
        <span class="emr-status-cell__main">
          <span class="emr-badge emr-tone-{{ status().tone }}">{{ status().label }}</span>
          @if (status().assistiveText) {
            <span class="emr-sr-only">{{ status().assistiveText }}</span>
          }
          @if (!compact() && valueLabel()) {
            <span class="emr-status-cell__value">{{ valueLabel() }}</span>
          }
        </span>
        @if (!compact()) {
          @if (attributionText()) {
            <span class="emr-status-cell__meta">{{ attributionText() }}</span>
          }
          @if (secondaryNote()) {
            <span class="emr-status-cell__meta">{{ secondaryNote() }}</span>
          }
        } @else if (hiddenText()) {
          <span class="emr-sr-only">{{ hiddenText() }}</span>
        }
      </div>
      @if (action() && !readOnly() && !compact()) {
        <button type="button" class="emr-button emr-button--outline emr-status-cell__action" (click)="actionClicked.emit()">
          @if (action()!.icon) {
            <span aria-hidden="true">{{ action()!.icon }}</span>
          }
          {{ action()!.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .emr-status-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
      .emr-status-cell__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; max-width: 100%; border-radius: 8px; }
      .emr-status-cell__body--selectable { min-height: 44px; min-width: 44px; justify-content: center; cursor: pointer; padding: 2px 4px; }
      .emr-status-cell__body--selectable:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
      .emr-status-cell__main { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
      .emr-status-cell__value { font-size: var(--emr-text-sm); font-weight: 650; color: var(--emr-text); overflow-wrap: anywhere; }
      .emr-status-cell__meta { font-size: var(--emr-text-xs); color: var(--emr-text-muted); overflow-wrap: anywhere; }
      .emr-status-cell__action { min-height: 44px; min-width: 44px; max-width: 100%; }
      .emr-status-cell .emr-badge { max-width: 100%; white-space: normal; height: auto; min-height: var(--emr-compact-height); line-height: 1.2; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrStatusCellComponent {
  readonly status = input.required<EmrBadge>();
  readonly valueLabel = input<string>();
  readonly attribution = input<EmrStatusCellAttribution>();
  readonly action = input<EmrStatusCellAction>();
  readonly secondaryNote = input<string>();
  readonly readOnly = input(false);
  readonly compact = input(false);
  /** Makes the cell body focusable and emits `selected`; a signal output exposes no listener count. */
  readonly selectable = input(false);
  readonly controlId = input<string>();

  readonly actionClicked = output<void>();
  readonly selected = output<void>();

  protected readonly attributionText = computed(() => {
    const a = this.attribution();
    return a ? [a.nameLabel, a.roleLabel, a.timeLabel].filter(Boolean).join(' · ') : '';
  });

  /** Full content for assistive tech when compact hides it visually. */
  protected readonly hiddenText = computed(() =>
    [this.valueLabel(), this.attributionText(), this.secondaryNote()].filter(Boolean).join('. ')
  );

  protected onKey(event: Event): void {
    if (!this.selectable()) return;
    event.preventDefault();
    this.selected.emit();
  }
}
