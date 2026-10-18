import { describe, expect, it } from 'vitest';
import { clampedTarget, likertPoints, rovingTarget, tabStopTick, vasKeyValue, vasSnap, vasTicks, vasValueFromOffset } from './l1-interactive.logic';

describe('interactive logic', () => {
  it('roving focus wraps and skips disabled', () => {
    const en = [true, false, true];
    expect(rovingTarget('ArrowRight', 0, en)).toBe(2);
    expect(rovingTarget('ArrowRight', 2, en)).toBe(0);
    expect(rovingTarget('ArrowLeft', 0, en)).toBe(2);
    expect(rovingTarget('End', 0, en)).toBe(2);
    expect(rovingTarget('a', 0, en)).toBeNull();
    expect(rovingTarget('Home', 0, [false])).toBeNull();
  });
  it('clamps list navigation', () => {
    expect(clampedTarget('ArrowDown', 2, 3)).toBe(2);
    expect(clampedTarget('ArrowUp', 0, 3)).toBe(0);
    expect(clampedTarget('Home', 2, 3)).toBe(0);
    expect(clampedTarget('ArrowDown', 0, 0)).toBeNull();
  });
  it('snaps and bounds VAS values', () => {
    expect(vasSnap(7.4, 0, 10, 1)).toBe(7);
    expect(vasSnap(99, 0, 10, 1)).toBe(10);
    expect(vasSnap(-5, 0, 10, 0)).toBe(0);
    expect(vasSnap(3.14159, 0, 10, 0)).toBe(3.1416);
  });
  it('maps pointer offsets, vertical bottom-up', () => {
    expect(vasValueFromOffset(50, 100, 0, 100, 1, false)).toBe(50);
    expect(vasValueFromOffset(0, 100, 0, 100, 1, true)).toBe(100);
    expect(vasValueFromOffset(10, 0, 0, 100, 1, false)).toBe(0);
  });
  it('handles VAS keys', () => {
    expect(vasKeyValue('ArrowRight', null, 0, 10, 1, 5)).toBe(1);
    expect(vasKeyValue('PageUp', 8, 0, 10, 1, 5)).toBe(10);
    expect(vasKeyValue('decrement', 0, 0, 10, 1, 5)).toBe(0);
    expect(vasKeyValue('x', 1, 0, 10, 1, 5)).toBeNull();
  });
  it('builds ticks within bounds', () => {
    const ticks = vasTicks(0, 10, 5, 1);
    expect(ticks).toHaveLength(11);
    expect(ticks.filter(t => t.label !== null).map(t => t.value)).toEqual([0, 5, 10]);
    expect(vasTicks(0, 1e9, 1, 1).length).toBeLessThanOrEqual(402);
    expect(vasTicks(5, 5, 1, 1)).toEqual([]);
  });
  it('likert points', () => {
    expect(likertPoints(0, 3)).toEqual([0, 1, 2, 3]);
    expect(likertPoints(3, 0)).toEqual([]);
  });
  it('tab stop falls back focused > selected > current > first', () => {
    const t = [{ id: 'a' }, { id: 'b', current: true }, { id: 'c' }];
    expect(tabStopTick(t, 'c', 'a')).toBe('c');
    expect(tabStopTick(t, 'zz', 'a')).toBe('a');
    expect(tabStopTick(t, null, undefined)).toBe('b');
    expect(tabStopTick([], null)).toBeUndefined();
  });
});
