import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewEncapsulation
} from '@angular/core';

/**
 * Controlled Likert / numeric rating scale.
 *
 * Layout: legend (label row) → pip track → anchors → hint/error.
 * Matches the two-row field-frame convention visually; uses native
 * <fieldset>/<legend> for correct radiogroup semantics.
 *
 * Anchor labels are suppressed when disabled — they are meaningless
 * if no assessment has started.
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
    <fieldset class="emr-likert" [disabled]="disabled || readOnly">
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
            [attr.data-zone]="zoneFor(point)"
          >
            <input
              type="radio"
              class="emr-sr-only"
              [name]="name"
              [value]="point"
              [checked]="value === point"
              [disabled]="disabled || readOnly"
              [attr.aria-label]="ariaLabelFor(point)"
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

  @Input() name = 'emr-likert';
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

  protected onSelect(point: number): void {
    if (!this.disabled && !this.readOnly) {
      this.valueChange.emit(point);
    }
  }

  /**
   * Maps a point to a pain-severity zone for CSS colour coding.
   * Boundaries are proportional to the configured range so 1–5 and 0–10
   * both colour sensibly.
   */
  protected zoneFor(point: number): string {
    const range = this.max - this.min;
    const ratio = range > 0 ? (point - this.min) / range : 0;
    if (ratio <= 0.2) return 'none';
    if (ratio <= 0.4) return 'mild';
    if (ratio <= 0.6) return 'moderate';
    if (ratio <= 0.8) return 'severe';
    return 'worst';
  }
}
