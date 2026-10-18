import { describe, expect, it } from 'vitest';
import type { NavItem } from '@drguptavivek/emr-controller';
import { navKeyAction, tabStopIndex, visibleRows } from './l4-web-shell.logic';

const items: NavItem[] = [
  { id: 'a', label: 'A' },
  { id: 'w', label: 'W', children: [{ id: 'w1', label: 'W1' }, { id: 'w2', label: 'W2', disabled: true }] },
  { id: 'z', label: 'Z' },
];

describe('web shell nav logic', () => {
  it('shows children only under expanded parents', () => {
    expect(visibleRows(items, []).map(r => r.item.id)).toEqual(['a', 'w', 'z']);
    const rows = visibleRows(items, ['w']);
    expect(rows.map(r => r.item.id)).toEqual(['a', 'w', 'w1', 'w2', 'z']);
    expect(rows[2]).toMatchObject({ level: 1, parentIndex: 1 });
  });

  it('arrows move, skipping disabled rows and stopping at the ends', () => {
    const rows = visibleRows(items, ['w']);
    expect(navKeyAction('ArrowDown', rows, 2)).toEqual({ type: 'focus', index: 4 });
    expect(navKeyAction('ArrowUp', rows, 0)).toEqual({ type: 'focus', index: 0 });
    expect(navKeyAction('End', rows, 0)).toEqual({ type: 'focus', index: 4 });
    expect(navKeyAction('x', rows, 0)).toBeNull();
    expect(navKeyAction('ArrowDown', [], 0)).toBeNull();
  });

  it('right/left expand, collapse and walk parent/child', () => {
    const closed = visibleRows(items, []);
    expect(navKeyAction('ArrowRight', closed, 1)).toEqual({ type: 'expansion', id: 'w', expanded: true });
    expect(navKeyAction('ArrowRight', closed, 0)).toBeNull();
    const open = visibleRows(items, ['w']);
    expect(navKeyAction('ArrowRight', open, 1)).toEqual({ type: 'focus', index: 2 });
    expect(navKeyAction('ArrowLeft', open, 1)).toEqual({ type: 'expansion', id: 'w', expanded: false });
    expect(navKeyAction('ArrowLeft', open, 2)).toEqual({ type: 'focus', index: 1 });
    expect(navKeyAction('ArrowLeft', open, 0)).toBeNull();
  });

  it('tab stop prefers focused, then active, then first enabled', () => {
    const rows = visibleRows(items, ['w']);
    expect(tabStopIndex(rows, 'z', 'a')).toBe(4);
    expect(tabStopIndex(rows, null, 'w1')).toBe(2);
    expect(tabStopIndex(rows, null, 'gone')).toBe(0);
    expect(tabStopIndex([], null, '')).toBe(-1);
  });
});
