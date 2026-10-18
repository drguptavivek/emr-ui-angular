/** Pure keyboard-highlight helpers for the top-bar search overlay (no React, no DOM). */

/** Highlight index after ArrowDown/ArrowUp across all groups' results flattened in order. -1 = none. Wraps at both ends. */
export function moveHighlight(current: number, key: string, count: number): number {
  if (count <= 0) return -1;
  if (key === 'ArrowDown') return current < 0 || current >= count - 1 ? 0 : current + 1;
  if (key === 'ArrowUp') return current <= 0 ? count - 1 : current - 1;
  return current;
}

/** Locates the flat highlight index inside a group: which group, which result. Null when out of range. */
export function locateHighlight(sizes: readonly number[], index: number): { group: number; result: number } | null {
  let rest = index;
  for (let group = 0; group < sizes.length; group++) {
    if (rest >= 0 && rest < sizes[group]) return { group, result: rest };
    rest -= sizes[group];
  }
  return null;
}
