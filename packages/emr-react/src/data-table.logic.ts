/** Pure helpers for the web data table (no React, no DOM). Nothing here orders or fetches rows. */
import type { EmrDataTableSortDirection } from './data-table.types';

export type SelectAllState = 'none' | 'some' | 'all';

/** Tri-state of the select-all-on-page box. An empty page is 'none'. */
export function selectAllState(pageIds: readonly string[], selected: readonly string[]): SelectAllState {
  const set = new Set(selected);
  const n = pageIds.filter(id => set.has(id)).length;
  return n === 0 ? 'none' : n === pageIds.length ? 'all' : 'some';
}

/** Selection after toggling select-all: 'all' clears the page's rows, otherwise selects them. Off-page picks survive. */
export function toggleSelectAll(pageIds: readonly string[], selected: readonly string[]): string[] {
  const page = new Set(pageIds);
  const rest = selected.filter(id => !page.has(id));
  return selectAllState(pageIds, selected) === 'all' ? rest : [...rest, ...pageIds];
}

export function toggleId(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
}

/** Roving row index after a key; clamped, never wraps. Unknown keys keep the index. */
export function nextRowIndex(current: number, count: number, key: string): number {
  if (count <= 0) return 0;
  const last = count - 1;
  switch (key) {
    case 'ArrowDown': return Math.min(current + 1, last);
    case 'ArrowUp': return Math.max(current - 1, 0);
    case 'Home': return 0;
    case 'End': return last;
    default: return Math.min(Math.max(current, 0), last);
  }
}

/** Header press: flip the active column, otherwise start ascending. */
export function nextSortDirection(
  current: { columnId: string; direction: EmrDataTableSortDirection } | undefined,
  columnId: string,
): EmrDataTableSortDirection {
  return current?.columnId === columnId && current.direction === 'asc' ? 'desc' : 'asc';
}
