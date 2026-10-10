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
}

/** A horizontal reference band such as a target range. Bounds are supplied. */
export interface TrendBand {
  readonly id: string;
  readonly label: string;
  readonly yFrom: number;
  readonly yTo: number;
  readonly tone: EmrTone;
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
  | { readonly type: 'rangeChangeRequested'; readonly xMin: number; readonly xMax: number };
