export interface EmrChartCategory { id: string; label: string }

export interface EmrBarSeries {
  id: string;
  label: string;
  /** Keyed by category id. `null` (or a missing key) means "no data", never a zero bar. Values must be >= 0. */
  values: Record<string, number | null>;
  /** Pre-formatted by the app (units, rounding); falls back to String(value). */
  valueLabels?: Record<string, string>;
}

export interface EmrBarChartModel {
  title: string;
  description?: string;
  categories: EmrChartCategory[];
  series: EmrBarSeries[];
  orientation?: 'vertical' | 'horizontal';
  /** Label for the value axis (vertical or horizontal). */
  yAxisLabel?: string;
  /** Lower bound for the scale top, e.g. 100 for percentages; data above it still wins. */
  maxValue?: number;
}

export interface EmrFunnelStep {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  /** Supplied by the app (e.g. "78% of referred"); the component never computes rates. */
  conversionLabel?: string;
}

export interface EmrFunnelChartModel {
  title: string;
  description?: string;
  steps: EmrFunnelStep[];
}

export type EmrChartIntent =
  | { type: 'categorySelected'; categoryId: string; seriesId?: string }
  | { type: 'stepSelected'; stepId: string };

export interface EmrChartLabels {
  showTable: string;
  hideTable: string;
  noData: string;
  categoryColumn: string;
  stepColumn: string;
  valueColumn: string;
  conversionColumn: string;
  legend: string;
  nativeUnavailable: string;
}

export interface EmrBarChartProps {
  model: EmrBarChartModel;
  onIntent?: (intent: EmrChartIntent) => void;
  labels?: Partial<EmrChartLabels>;
}

export interface EmrFunnelChartProps {
  model: EmrFunnelChartModel;
  onIntent?: (intent: EmrChartIntent) => void;
  labels?: Partial<EmrChartLabels>;
}
