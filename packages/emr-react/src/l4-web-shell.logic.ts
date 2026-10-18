/** Pure tree helpers for EmrLeftNav (no React, no DOM). */
import type { NavItem } from '@drguptavivek/emr-controller';

export interface NavRow {
  item: NavItem;
  level: number;
  parentIndex: number;
  hasChildren: boolean;
  expanded: boolean;
}

/** Depth-first list of the rows a user can currently see: children appear only under expanded parents. */
export function visibleRows(items: readonly NavItem[], expandedIds: readonly string[]): NavRow[] {
  const rows: NavRow[] = [];
  const walk = (list: readonly NavItem[], level: number, parentIndex: number) => {
    for (const item of list) {
      const hasChildren = !!item.children?.length;
      const expanded = hasChildren && expandedIds.includes(item.id);
      const index = rows.push({ item, level, parentIndex, hasChildren, expanded }) - 1;
      if (expanded) walk(item.children!, level + 1, index);
    }
  };
  walk(items, 0, -1);
  return rows;
}

export type NavKeyAction =
  | { type: 'focus'; index: number }
  | { type: 'expansion'; id: string; expanded: boolean };

/** Next enabled row from `from` in `step` direction; stays put at the ends. */
function stepEnabled(rows: readonly NavRow[], from: number, step: 1 | -1): number {
  for (let i = from + step; i >= 0 && i < rows.length; i += step) if (!rows[i].item.disabled) return i;
  return from;
}

/** WAI-ARIA tree keyboard: Up/Down/Home/End move, Right opens or enters, Left closes or goes to the parent. null = not ours. */
export function navKeyAction(key: string, rows: readonly NavRow[], current: number): NavKeyAction | null {
  const row = rows[current];
  if (!row) return null;
  switch (key) {
    case 'ArrowDown': return { type: 'focus', index: stepEnabled(rows, current, 1) };
    case 'ArrowUp': return { type: 'focus', index: stepEnabled(rows, current, -1) };
    case 'Home': return { type: 'focus', index: rows[0].item.disabled ? stepEnabled(rows, 0, 1) : 0 };
    case 'End': return { type: 'focus', index: rows[rows.length - 1].item.disabled ? stepEnabled(rows, rows.length - 1, -1) : rows.length - 1 };
    case 'ArrowRight':
      if (!row.hasChildren) return null;
      return row.expanded ? { type: 'focus', index: stepEnabled(rows, current, 1) } : { type: 'expansion', id: row.item.id, expanded: true };
    case 'ArrowLeft':
      if (row.expanded) return { type: 'expansion', id: row.item.id, expanded: false };
      return row.parentIndex >= 0 ? { type: 'focus', index: row.parentIndex } : null;
    default: return null;
  }
}

/** The one tab stop: the focused row, else the active row, else the first enabled row (index into `rows`). */
export function tabStopIndex(rows: readonly NavRow[], focusedId: string | null, activeId: string): number {
  const byId = (id: string | null) => (id === null ? -1 : rows.findIndex(r => r.item.id === id && !r.item.disabled));
  const found = [byId(focusedId), byId(activeId)].find(i => i >= 0);
  return found ?? rows.findIndex(r => !r.item.disabled);
}
