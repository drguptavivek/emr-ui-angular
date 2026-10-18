import { describe, expect, it } from 'vitest';
import { nextRowIndex, nextSortDirection, selectAllState, toggleId, toggleSelectAll } from './data-table.logic';

describe('data-table logic', () => {
  it('select-all is tri-state', () => {
    expect(selectAllState(['a', 'b'], [])).toBe('none');
    expect(selectAllState(['a', 'b'], ['a', 'z'])).toBe('some');
    expect(selectAllState(['a', 'b'], ['b', 'a'])).toBe('all');
    expect(selectAllState([], ['a'])).toBe('none');
  });
  it('toggleSelectAll keeps off-page picks', () => {
    expect(toggleSelectAll(['a', 'b'], ['z'])).toEqual(['z', 'a', 'b']);
    expect(toggleSelectAll(['a', 'b'], ['a', 'z'])).toEqual(['z', 'a', 'b']);
    expect(toggleSelectAll(['a', 'b'], ['a', 'b', 'z'])).toEqual(['z']);
  });
  it('toggleId', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('roving index clamps', () => {
    expect(nextRowIndex(0, 3, 'ArrowUp')).toBe(0);
    expect(nextRowIndex(2, 3, 'ArrowDown')).toBe(2);
    expect(nextRowIndex(1, 3, 'ArrowDown')).toBe(2);
    expect(nextRowIndex(1, 3, 'End')).toBe(2);
    expect(nextRowIndex(1, 3, 'Home')).toBe(0);
    expect(nextRowIndex(5, 3, 'x')).toBe(2);
    expect(nextRowIndex(0, 0, 'ArrowDown')).toBe(0);
  });
  it('sort direction', () => {
    expect(nextSortDirection(undefined, 'a')).toBe('asc');
    expect(nextSortDirection({ columnId: 'a', direction: 'asc' }, 'a')).toBe('desc');
    expect(nextSortDirection({ columnId: 'a', direction: 'desc' }, 'a')).toBe('asc');
    expect(nextSortDirection({ columnId: 'b', direction: 'asc' }, 'a')).toBe('asc');
  });
});
