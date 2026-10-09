import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import type { EmrTone } from '@drguptavivek/emr-controller';

/**
 * Controlled visual analogue scale (VAS).
 *
 * A ruler: a continuous track with major markers every `majorInterval` and minor markers
 * every `minorInterval`, which the respondent marks anywhere along its length — by finger,
 * mouse, or keyboard. Horizontal for the usual 0–10 scales, vertical for the EQ-5D-5L style
 * 0–100 health thermometer (min at the bottom, max at the top).
 *
 * This is an L1 primitive: it carries no clinical meaning. It does not know whether a high
 * number is good or bad, does not derive severity, and does not label an unset scale — the
 * controller supplies `anchors`, `tone`, and `valueText`.
 *
 * Geometry is read from the pointer event's own element, never from `window`/`document`, so
 * the component renders identically under SSR (tick positions are pure arithmetic).
 */

export interface EmrVasAnchor {
  /** Value this label is anchored to (typically `min` or `max`). */
  value: number;
  label: string;
  /** Read by screen readers in place of the visible label. */
  assistiveLabel?: string;
}

interface EmrVasTick {
  value: number;
  percent: number;
  major: boolean;
  label: string | null;
}

/** Pathological interval inputs must not generate an unbounded DOM. */
const MAX_TICKS = 400;

@Component({
  selector: 'emr-vas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-vas" [class.emr-vas--vertical]="orientation() === 'vertical'" [attr.data-tone]="tone() ?? null">
      <span class="emr-vas__label" [id]="labelId()">
        {{ label() }}
        @if (required()) { <span class="emr-vas__required" aria-hidden="true">*</span> }
        @if (required()) { <span class="emr-sr-only">Required</span> }
      </span>

      <div class="emr-vas__frame">
        <div
          class="emr-vas__track"
          [id]="controlId()"
          role="slider"
          [attr.tabindex]="disabled() ? null : 0"
          [attr.aria-orientation]="orientation()"
          [attr.aria-labelledby]="labelId()"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value() ?? null"
          [attr.aria-valuetext]="valueText() ?? null"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-disabled]="disabled() || null"
          [attr.aria-invalid]="error() ? 'true' : null"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (keydown)="onKeyDown($event)"
        >
          <span class="emr-vas__rule" aria-hidden="true"></span>

          @for (tick of ticks(); track tick.value) {
            <span
              class="emr-vas__tick"
              [class.emr-vas__tick--major]="tick.major"
              [style.--emr-vas-pos.%]="tick.percent"
              aria-hidden="true"
            ></span>
            @if (tick.label !== null) {
              <span class="emr-vas__tick-label" [style.--emr-vas-pos.%]="tick.percent" aria-hidden="true">{{ tick.label }}</span>
            }
          }

          @if (percent() !== null) {
            <span class="emr-vas__mark" [style.--emr-vas-pos.%]="percent()" aria-hidden="true"></span>
            <span class="emr-vas__thumb" [style.--emr-vas-pos.%]="percent()" aria-hidden="true"></span>
          }
        </div>

        @if (minAnchor() || maxAnchor()) {
          <div class="emr-vas__anchors" aria-hidden="true">
            <span class="emr-vas__anchor emr-vas__anchor--max">{{ maxAnchor()?.label }}</span>
            <span class="emr-vas__anchor emr-vas__anchor--min">{{ minAnchor()?.label }}</span>
          </div>
        }
      </div>

      <div class="emr-vas__messages" aria-live="polite">
        @if (error()) {
          <span class="emr-field__error" [id]="controlId() + '-error'">{{ error() }}</span>
        } @else if (hint()) {
          <span class="emr-field__hint" [id]="controlId() + '-hint'">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
})
export class EmrVasComponent {
  readonly controlId = input('emr-vas');
  readonly label = input('');
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly min = input(0);
  readonly max = input(100);
  readonly value = input<number | null>(null);
  /** Snap granularity. `0` records the raw continuous position. */
  readonly step = input(1);
  /** Labelled marker interval — the numbers printed along the ruler. */
  readonly majorInterval = input(10);
  /** Unlabelled marker interval between the major ones. */
  readonly minorInterval = input(2);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly anchors = input<readonly EmrVasAnchor[]>([]);
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly required = input(false);
  /** Controller-supplied tone for the recorded mark. The primitive derives no severity. */
  readonly tone = input<EmrTone>();
  /** Controller-supplied spoken value (`aria-valuetext`), e.g. "72 out of 100". */
  readonly valueText = input<string>();

  readonly valueChange = output<number | null>();

  protected readonly labelId = computed(() => `${this.controlId()}-label`);

  protected readonly percent = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? null : this.toPercent(value);
  });

  protected readonly minAnchor = computed(() => this.anchors().find(anchor => anchor.value === this.min()));
  protected readonly maxAnchor = computed(() => this.anchors().find(anchor => anchor.value === this.max()));

  protected readonly ticks = computed<EmrVasTick[]>(() => {
    const min = this.min();
    const max = this.max();
    const span = max - min;
    if (!(span > 0)) return [];

    const major = this.majorInterval() > 0 ? this.majorInterval() : span;
    const minor = this.minorInterval() > 0 ? this.minorInterval() : major;
    const smallest = Math.min(major, minor);
    // Widen the step rather than emit thousands of nodes for a pathological interval.
    const stride = span / smallest > MAX_TICKS ? span / MAX_TICKS : smallest;

    const ticks: EmrVasTick[] = [];
    for (let value = min; value <= max + stride / 1000; value += stride) {
      const rounded = Number(value.toFixed(6));
      const isMajor = this.isMultiple(rounded - min, major);
      ticks.push({
        value: rounded,
        percent: this.toPercent(rounded),
        major: isMajor,
        label: isMajor ? this.formatTick(rounded) : null,
      });
    }
    return ticks;
  });

  protected describedBy(): string | null {
    if (this.error()) return `${this.controlId()}-error`;
    if (this.hint()) return `${this.controlId()}-hint`;
    return null;
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.interactive()) return;
    const target = event.currentTarget as HTMLElement;
    // Capture so a stroke that leaves the track keeps tracking and cannot be resumed on re-entry.
    target.setPointerCapture(event.pointerId);
    target.focus();
    event.preventDefault();
    this.emitFromPointer(event, target);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.interactive()) return;
    const target = event.currentTarget as HTMLElement;
    if (!target.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    this.emitFromPointer(event, target);
  }

  protected onPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const stepSize = this.step() > 0 ? this.step() : 1;
    const page = this.majorInterval() > 0 ? this.majorInterval() : stepSize;
    const current = this.value() ?? this.min();
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': next = current + stepSize; break;
      case 'ArrowLeft':
      case 'ArrowDown': next = current - stepSize; break;
      case 'PageUp': next = current + page; break;
      case 'PageDown': next = current - page; break;
      case 'Home': next = this.min(); break;
      case 'End': next = this.max(); break;
      default: return;
    }

    event.preventDefault();
    this.emit(next);
  }

  private interactive(): boolean {
    return !this.disabled() && !this.readOnly();
  }

  private emitFromPointer(event: PointerEvent, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const ratio = this.orientation() === 'vertical'
      // Vertical scales read bottom-up: min at the bottom, max at the top.
      ? rect.height > 0 ? (rect.bottom - event.clientY) / rect.height : 0
      : rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    this.emit(this.min() + ratio * (this.max() - this.min()));
  }

  private emit(raw: number): void {
    const next = this.snap(raw);
    if (next === this.value()) return;
    this.valueChange.emit(next);
  }

  private snap(raw: number): number {
    const min = this.min();
    const max = this.max();
    const bounded = Math.min(Math.max(raw, Math.min(min, max)), Math.max(min, max));
    const step = this.step();
    if (!(step > 0)) return Number(bounded.toFixed(4));
    return Number((min + Math.round((bounded - min) / step) * step).toFixed(4));
  }

  private toPercent(value: number): number {
    const span = this.max() - this.min();
    if (!(span > 0)) return 0;
    const ratio = (value - this.min()) / span;
    return Math.min(100, Math.max(0, ratio * 100));
  }

  private isMultiple(offset: number, interval: number): boolean {
    if (!(interval > 0)) return false;
    const remainder = Math.abs(offset % interval);
    return remainder < interval / 1000 || Math.abs(remainder - interval) < interval / 1000;
  }

  private formatTick(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  }
}
