import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

/**
 * Modular, presentation-only layout primitives shared across catalogue screens.
 * They provide alignment (equal row heights, configurable column widths) without
 * owning any workflow state. Business content is supplied via content projection
 * or strongly typed string inputs.
 */

/** Single card surface wrapper with an optional heading. */
@Component({
  selector: 'emr-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-card',
    '[class.emr-card--flush]': '!padded()'
  },
  template: `
    @if (label(); as text) {
      <div class="emr-card__title">{{ text }}</div>
    }
    <div class="emr-card__body"><ng-content /></div>
  `
})
export class EmrCardComponent {
  readonly label = input<string>();
  readonly padded = input(true);
}

/**
 * Configurable multi-column card layout. `count` covers the common 2- and
 * 3-column cases; `widths` overrides with explicit CSS track sizes
 * (e.g. `['2fr', '1fr']`). Columns stack to a single column on narrow screens.
 */
@Component({
  selector: 'emr-columns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-columns',
    '[style.grid-template-columns]': 'template()',
    '[style.gap]': 'gap()'
  },
  template: `<ng-content />`
})
export class EmrColumnsComponent {
  readonly count = input(2);
  readonly widths = input<readonly string[]>();
  readonly gap = input('16px');

  protected readonly template = computed(() => {
    const explicit = this.widths();
    if (explicit && explicit.length > 0) {
      return explicit.join(' ');
    }
    return `repeat(${this.count()}, minmax(0, 1fr))`;
  });
}

/**
 * Full-width clinical row presenting a field label, its value, remarks, and
 * notes in aligned columns. Set `heading` for the column-title row. Values are
 * controller-supplied strings; distinct clinical states must not be collapsed.
 */
@Component({
  selector: 'emr-field-value-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-field-value-row',
    '[class.emr-field-value-row--heading]': 'heading()',
    role: 'row'
  },
  template: `
    <div class="emr-fvr__cell emr-fvr__field" role="cell" data-label="Field">{{ field() }}</div>
    <div class="emr-fvr__cell emr-fvr__value" role="cell" data-label="Value">
      {{ heading() ? value() : (value() || placeholder()) }}
    </div>
    <div class="emr-fvr__cell emr-fvr__remarks" role="cell" data-label="Remarks">{{ remarks() }}</div>
    <div class="emr-fvr__cell emr-fvr__notes" role="cell" data-label="Notes">{{ notes() }}</div>
  `
})
export class EmrFieldValueRowComponent {
  readonly field = input<string>('');
  readonly value = input<string>('');
  readonly remarks = input<string>('');
  readonly notes = input<string>('');
  readonly heading = input(false);
  readonly placeholder = input('—');
}
