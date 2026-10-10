import type { ObservationTrendViewModel, TrendAxis, TrendBand, TrendBandExtent, TrendScale } from '@drguptavivek/emr-controller';

// Pure geometry for EmrObservationTrend. Lives in the UI package so the UI's only runtime
// dependency on the controller stays type-only (the SSR smoke loads the built bundle without it).

/**
 * Resolves which y axis an item (series or band) uses. `secondary` is honoured only when the model
 * supplies `secondaryAxis`; otherwise the item falls back to the primary axis rather than vanishing.
 */
export function resolveTrendAxis(
  item: { readonly axis?: TrendAxis },
  model: Pick<ObservationTrendViewModel, 'yLabel' | 'yMin' | 'yMax' | 'secondaryAxis'>
): TrendScale {
  const s = item.axis === 'secondary' ? model.secondaryAxis : undefined;
  return s
    ? { axis: 'secondary', yLabel: s.yLabel, yMin: s.yMin, yMax: s.yMax }
    : { axis: 'primary', yLabel: model.yLabel, yMin: model.yMin, yMax: model.yMax };
}

/**
 * Clips a band (open-ended or closed, bounds in either order) to the scale's y domain.
 * Returns null when nothing of the band is visible. Pure geometry; it judges no value.
 */
export function clipTrendBand(band: Pick<TrendBand, 'yFrom' | 'yTo'>, scale: Pick<TrendScale, 'yMin' | 'yMax'>): TrendBandExtent | null {
  const min = Math.min(scale.yMin, scale.yMax);
  const max = Math.max(scale.yMin, scale.yMax);
  const a = band.yFrom ?? -Infinity;
  const b = band.yTo ?? Infinity;
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  const lo = Math.max(lower, min);
  const hi = Math.min(upper, max);
  if (!(hi > lo)) return null;
  const inside = (y: number): boolean => Number.isFinite(y) && y >= min && y <= max;
  const at = Number.isFinite(upper) ? upper : lower;
  return { lo, hi, edges: [lower, upper].filter(inside), labelAt: inside(at) ? at : undefined };
}
