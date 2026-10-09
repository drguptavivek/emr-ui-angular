import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewEncapsulation
} from '@angular/core';
import type { EmrTone } from '@drguptavivek/emr-controller';

/**
 * Controlled Likert / numeric rating scale.
 *
 * Layout: legend (label row) → pip track → anchors → hint/error.
 * Matches the two-row field-frame convention visually; uses native
 * <fieldset>/<legend> for correct radiogroup semantics.
 *
 * Anchor labels are suppressed when disabled — they are meaningless
 * if no assessment has started.
 *
 * This is an L1 primitive: it carries no clinical meaning. The colour of the
 * selected pip comes from the controller-supplied `tone` (e.g. a pain-score
 * controller maps 8/10 → 'danger'; a muscle-strength controller maps 5/5 →
 * 'success'). The component never derives severity from the number.
 */

export interface EmrLikertAnchor {
  /** Value this label is anchored to (typically `min` or `max`). */
  value: number;
  label: string;
  /** Short description read by screen readers in place of the numeric label. */
  assistiveLabel?: string;
}

@Component({
  selector: 'emr-likert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <fieldset class="emr-likert" [disabled]="disabled" [attr.aria-readonly]="readOnly || null">
      <legend class="emr-likert__legend">
        {{ label }}
        @if (required) { <span class="emr-likert__required" aria-hidden="true">*</span> }
        @if (required) { <span class="emr-sr-only">Required</span> }
      </legend>

      <div
        class="emr-likert__track"
        [attr.aria-required]="required || null"
        [attr.aria-readonly]="readOnly || null"
      >
        @for (point of points; track point) {
          <label
            class="emr-likert__option"
            [class.emr-likert__option--selected]="value === point"
            [attr.data-tone]="value === point ? (tone ?? null) : null"
          >
            <input
              type="radio"
              class="emr-sr-only"
              [name]="name || groupId"
              [value]="point"
              [checked]="value === point"
              [disabled]="disabled"
              [attr.aria-readonly]="readOnly || null"
              [attr.aria-label]="ariaLabelFor(point)"
              (click)="onClick($event)"
              (change)="onSelect(point)"
            />
            <span class="emr-likert__pip" aria-hidden="true">{{ point }}</span>
          </label>
        }
      </div>

      @if (!disabled && (minAnchor || maxAnchor)) {
        <div class="emr-likert__anchors" aria-hidden="true">
          <span class="emr-likert__anchor">{{ minAnchor?.label }}</span>
          <span class="emr-likert__anchor">{{ maxAnchor?.label }}</span>
        </div>
      }

      <div class="emr-likert__messages" aria-live="polite">
        @if (error) {
          <span class="emr-field__error">{{ error }}</span>
        } @else if (!disabled && hint) {
          <span class="emr-field__hint">{{ hint }}</span>
        }
      </div>
    </fieldset>
  `
})
export class EmrLikertComponent implements OnChanges {
  static _idSeq = 0;

  /** Radio-group name. Defaults to a per-instance id so two likerts never share a native group. */
  @Input() name = '';
  @Input() label = '';
  @Input() hint: string | undefined;
  @Input() error: string | undefined;
  @Input() min = 0;
  @Input() max = 10;
  @Input() value: number | null = null;
  @Input() anchors: readonly EmrLikertAnchor[] = [];
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() required = false;
  /** Controller-supplied tone for the selected pip. Absent → neutral selection styling. */
  @Input() tone: EmrTone | undefined;

  @Output() readonly valueChange = new EventEmitter<number>();

  readonly groupId = `emr-likert-${++EmrLikertComponent._idSeq}`;

  points: number[] = [];
  minAnchor: EmrLikertAnchor | undefined;
  maxAnchor: EmrLikertAnchor | undefined;

  ngOnChanges(): void {
    const pts: number[] = [];
    for (let i = this.min; i <= this.max; i++) pts.push(i);
    this.points = pts;
    this.minAnchor = this.anchors.find(a => a.value === this.min);
    this.maxAnchor = this.anchors.find(a => a.value === this.max);
  }

  protected ariaLabelFor(point: number): string {
    const anchor = this.anchors.find(a => a.value === point);
    const base = anchor?.assistiveLabel ?? anchor?.label ?? String(point);
    return `${point} – ${base}`;
  }

  /** Read-only keeps the control focusable and announceable, but blocks the native toggle. */
  protected onClick(event: Event): void {
    if (this.readOnly) event.preventDefault();
  }

  protected onSelect(point: number): void {
    if (!this.disabled && !this.readOnly) {
      this.valueChange.emit(point);
    }
  }
}
