import type {
  EmrBarChartModel,
  EmrBarDatum,
  EmrBarSeries,
  EmrChartCategory,
  EmrChartIntent,
  EmrDonutChartModel,
  EmrDonutSlice,
  EmrFunnelChartModel,
  EmrFunnelStage,
  EmrFunnelStep,
} from '@drguptavivek/emr-controller';

export type {
  EmrBarChartModel,
  EmrBarDatum,
  EmrBarSeries,
  EmrChartCategory,
  EmrChartIntent,
  EmrDonutChartModel,
  EmrDonutSlice,
  EmrFunnelChartModel,
  EmrFunnelStage,
  EmrFunnelStep,
};

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
