import { describe, expect, it } from 'vitest';
import { locateHighlight, moveHighlight } from './l4-web-shell-search.logic';

describe('search overlay highlight', () => {
  it('enters from none and wraps both ways', () => {
    expect(moveHighlight(-1, 'ArrowDown', 3)).toBe(0);
    expect(moveHighlight(-1, 'ArrowUp', 3)).toBe(2);
    expect(moveHighlight(2, 'ArrowDown', 3)).toBe(0);
    expect(moveHighlight(0, 'ArrowUp', 3)).toBe(2);
    expect(moveHighlight(1, 'ArrowDown', 3)).toBe(2);
  });
  it('ignores other keys and empty lists', () => {
    expect(moveHighlight(1, 'a', 3)).toBe(1);
    expect(moveHighlight(0, 'ArrowDown', 0)).toBe(-1);
  });
  it('maps a flat index across groups', () => {
    expect(locateHighlight([2, 0, 3], 1)).toEqual({ group: 0, result: 1 });
    expect(locateHighlight([2, 0, 3], 2)).toEqual({ group: 2, result: 0 });
    expect(locateHighlight([2, 0, 3], 5)).toBeNull();
    expect(locateHighlight([2], -1)).toBeNull();
  });
});
