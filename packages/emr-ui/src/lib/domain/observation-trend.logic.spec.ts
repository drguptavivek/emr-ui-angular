import { describe, expect, it } from 'vitest';
import { clipTrendBand, resolveTrendAxis } from './observation-trend.logic';

const scale = { yMin: 2, yMax: 7 };

describe('clipTrendBand', () => {
  it('keeps a closed band inside the scale, with both bound lines', () => {
    expect(clipTrendBand({ yFrom: 3.5, yTo: 5 }, scale)).toEqual({ lo: 3.5, hi: 5, edges: [3.5, 5], labelAt: 5 });
  });

  it('accepts bounds in either order', () => {
    expect(clipTrendBand({ yFrom: 5, yTo: 3.5 }, scale)).toEqual({ lo: 3.5, hi: 5, edges: [3.5, 5], labelAt: 5 });
  });

  it('runs an open-top band to yMax and labels its lower bound', () => {
    expect(clipTrendBand({ yFrom: 6 }, scale)).toEqual({ lo: 6, hi: 7, edges: [6], labelAt: 6 });
  });

  it('runs an open-bottom band to yMin and labels its upper bound', () => {
    expect(clipTrendBand({ yTo: 3 }, scale)).toEqual({ lo: 2, hi: 3, edges: [3], labelAt: 3 });
  });

  it('fills the whole plot when both bounds are absent, with no bound line', () => {
    expect(clipTrendBand({}, scale)).toEqual({ lo: 2, hi: 7, edges: [], labelAt: undefined });
  });

  it('clips a band that overhangs the scale and drops the off-scale bound line', () => {
    expect(clipTrendBand({ yFrom: 1, yTo: 4 }, scale)).toEqual({ lo: 2, hi: 4, edges: [4], labelAt: 4 });
    expect(clipTrendBand({ yFrom: 6, yTo: 9 }, scale)).toEqual({ lo: 6, hi: 7, edges: [6], labelAt: undefined });
  });

  it('returns null for a band entirely off the scale or of zero height', () => {
    expect(clipTrendBand({ yFrom: 8 }, scale)).toBeNull();
    expect(clipTrendBand({ yTo: 1 }, scale)).toBeNull();
    expect(clipTrendBand({ yFrom: 4, yTo: 4 }, scale)).toBeNull();
  });
});

describe('resolveTrendAxis', () => {
  const primary = { yLabel: 'beats/min', yMin: 40, yMax: 160 };
  const dual = { ...primary, secondaryAxis: { yLabel: 'mmHg', yMin: 40, yMax: 200, yTicks: [] } };

  it('defaults to the primary axis', () => {
    expect(resolveTrendAxis({}, dual)).toEqual({ axis: 'primary', yLabel: 'beats/min', yMin: 40, yMax: 160 });
  });

  it('uses the secondary axis when asked and supplied', () => {
    expect(resolveTrendAxis({ axis: 'secondary' }, dual)).toEqual({ axis: 'secondary', yLabel: 'mmHg', yMin: 40, yMax: 200 });
  });

  it('falls back to primary when secondary is asked but not supplied', () => {
    expect(resolveTrendAxis({ axis: 'secondary' }, primary).axis).toBe('primary');
  });
});
