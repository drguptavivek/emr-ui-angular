'use client';

import { EmrStateMessage } from './l1-display';
import type { EmrBarChartProps, EmrChartLabels, EmrFunnelChartProps } from './charts.types';

export type * from './charts.types';

const DEFAULTS: Pick<EmrChartLabels, 'nativeUnavailable'> = {
  nativeUnavailable: 'This chart is available on the web app.',
};

/** Native fallback: charts are web-only (`charts.web.tsx`); Metro resolves this notice instead. */
export function EmrBarChart({ labels }: EmrBarChartProps) {
  return <EmrStateMessage kind="empty" message={labels?.nativeUnavailable ?? DEFAULTS.nativeUnavailable} />;
}

export function EmrFunnelChart({ labels }: EmrFunnelChartProps) {
  return <EmrStateMessage kind="empty" message={labels?.nativeUnavailable ?? DEFAULTS.nativeUnavailable} />;
}
