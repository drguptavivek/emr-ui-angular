import { describe, expect, it } from 'vitest';
import { bandLayout, barLength, funnelBars, niceScale, truncateLabel } from './charts.logic';

describe('charts logic', () => {
  it('niceScale picks a round top and ticks', () => {
    expect(niceScale(87)).toEqual({ max: 100, ticks: [0, 25, 50, 75, 100] });
    expect(niceScale(100).max).toBe(100);
    expect(niceScale(7).ticks).toEqual([0, 2, 4, 6, 8]);
    expect(niceScale(0.3).ticks).toEqual([0, 0.1, 0.2, 0.3]);
  });
  it('niceScale survives empty / invalid data', () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
    expect(niceScale(NaN).max).toBe(1);
  });
  it('barLength is proportional, clamped, and never negative', () => {
    expect(barLength(50, 100, 200)).toBe(100);
    expect(barLength(0, 100, 200)).toBe(0);
    expect(barLength(-5, 100, 200)).toBe(0);
    expect(barLength(0.01, 100, 200)).toBe(2);
    expect(barLength(500, 100, 200)).toBe(200);
  });
  it('bandLayout places grouped bars inside their band', () => {
    const l = bandLayout(2, 2, 200, 0.2);
    expect(l.band).toBe(100);
    expect(l.bar).toBe(40);
    expect(l.start(0, 0)).toBe(10);
    expect(l.start(1, 1)).toBe(150);
    expect(bandLayout(0, 0, 100).bar).toBe(0);
  });
  it('funnelBars centres and scales to the largest', () => {
    expect(funnelBars([100, 50, 0], 200)).toEqual([
      { width: 200, offset: 0 }, { width: 100, offset: 50 }, { width: 0, offset: 100 },
    ]);
    expect(funnelBars([], 100)).toEqual([]);
  });
  it('truncateLabel', () => {
    expect(truncateLabel('Short', 10)).toBe('Short');
    expect(truncateLabel('Long centre name', 8)).toBe('Long ce…');
    expect(truncateLabel('abc', 0)).toBe('');
  });
});
