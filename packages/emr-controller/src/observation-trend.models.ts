import type { EmrBadge, EmrTone } from './models.js';

export interface TrendPoint {
  readonly id: string;
  /** Position on the x axis, in the same numeric scale as `xMin`/`xMax`. The controller does any date conversion. */
  readonly x: number;
  readonly y: number;
  readonly xLabel: string;
  /** Formatted value with unit, for the tooltip and the screen-reader table. */
  readonly valueLabel: string;
  /** Controller verdict for this point. The component draws a ring and names it; it never derives it. */
  readonly flag?: EmrBadge;
}

export interface TrendSeries {
  readonly id: string;
  readonly label: string;
  readonly tone: EmrTone;
  readonly points: readonly TrendPoint[];
  /** Dashed line, so series differ by more than colour. */
  readonly dashed?: boolean;
  /** Which y axis the series is scaled against. `secondary` falls back to primary when the model has no `secondaryAxis`. */
  readonly axis?: TrendAxis;
  /** Unit shown in the screen-reader table (for example 'mmHg'). Defaults to the resolved axis `yLabel`. */
  readonly unitLabel?: string;
}

export type TrendAxis = 'primary' | 'secondary';

/**
 * A horizontal reference band such as a target, safe or danger range. Bounds are supplied.
 * An absent `yFrom` runs the band to the bottom of the plot, an absent `yTo` to the top.
 * The `label` must name an open-ended band as such ('Below 94 %'); the component never composes it.
 */
export interface TrendBand {
  readonly id: string;
  readonly label: string;
  readonly yFrom?: number;
  readonly yTo?: number;
  readonly tone: EmrTone;
  /** Defaults to primary. */
  readonly axis?: TrendAxis;
  /** Hatched bands differ from solid ones without colour. Defaults to solid. */
  readonly pattern?: 'solid' | 'hatched';
  /** Text drawn at the band's finite bound line (the upper one on a closed band), for example '3.5 mmol/L'. */
  readonly edgeLabel?: string;
}

/** A supplied reference curve (for example a growth-chart percentile line). */
export interface TrendCurve {
  readonly id: string;
  readonly label: string;
  readonly points: readonly { readonly x: number; readonly y: number }[];
}

export interface ObservationTrendViewModel {
  readonly id: string;
  readonly title: string;
  readonly yLabel: string;
  readonly yMin: number;
  readonly yMax: number;
  readonly xMin: number;
  readonly xMax: number;
  readonly xTicks: readonly { readonly x: number; readonly label: string }[];
  readonly yTicks: readonly { readonly y: number; readonly label: string }[];
  /** Right-hand y axis for series and bands with `axis: 'secondary'` (for example insulin units beside glucose). */
  readonly secondaryAxis?: TrendSecondaryAxis;
  /** Caption for the x scale ('Hourly', 'Weekly'). The controller still supplies `xTicks`. */
  readonly xGranularityLabel?: string;
  /** Unlabelled vertical gridlines between the labelled ticks. */
  readonly xMinorTicks?: readonly { readonly x: number }[];
  /** Rendered as a segmented control; choosing one emits `granularityChangeRequested`. */
  readonly granularityOptions?: readonly { readonly id: string; readonly label: string; readonly selected?: boolean }[];
  readonly series: readonly TrendSeries[];
  readonly bands?: readonly TrendBand[];
  readonly referenceCurves?: readonly TrendCurve[];
  readonly selectedPointId?: string;
  /** Plain-language description of the trend, written by the controller. Used as the chart's accessible description. */
  readonly summaryText: string;
  readonly emptyMessage: string;
  /** Points cannot be selected. */
  readonly readOnly?: boolean;
}

export type ObservationTrendIntent =
  | { readonly type: 'pointSelected'; readonly seriesId: string; readonly pointId: string }
  | { readonly type: 'rangeChangeRequested'; readonly xMin: number; readonly xMax: number }
  | { readonly type: 'granularityChangeRequested'; readonly granularityId: string };

export interface TrendSecondaryAxis {
  readonly yLabel: string;
  readonly yMin: number;
  readonly yMax: number;
  readonly yTicks: readonly { readonly y: number; readonly label: string }[];
}

/** The y domain a series or band is drawn against. */
export interface TrendScale {
  readonly axis: TrendAxis;
  readonly yLabel: string;
  readonly yMin: number;
  readonly yMax: number;
}

/** A band clipped to its scale, in data units. */
export interface TrendBandExtent {
  readonly lo: number;
  readonly hi: number;
  /** Supplied bounds that fall inside the scale; each gets a bound line. */
  readonly edges: readonly number[];
  /** Where `edgeLabel` sits: the upper finite bound, else the lower; absent when that bound is off the scale. */
  readonly labelAt?: number;
}
