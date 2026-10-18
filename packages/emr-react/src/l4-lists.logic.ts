/** Pure helpers for the L4 list components (no React, no DOM). Nothing here orders or fetches rows. */
import type { QueueCard, QueueStation } from '@drguptavivek/emr-controller';
import { clampedTarget } from './l1-interactive.logic';

export interface SortState { field: string; direction: 'asc' | 'desc' }

/** The sort a header press requests: flip the active column, otherwise start ascending. */
export function nextSort(current: SortState | undefined, field: string): SortState {
  return { field, direction: current?.field === field && current.direction === 'asc' ? 'desc' : 'asc' };
}

export function ariaSortOf(current: SortState | undefined, field: string): 'ascending' | 'descending' | 'none' {
  if (current?.field !== field) return 'none';
  return current.direction === 'asc' ? 'ascending' : 'descending';
}

/** Whether Previous / Next apply. Page is 1-based; a missing total or page size never enables Next. */
export function pagerState(page: number, pageSize: number, total: number): { canPrev: boolean; canNext: boolean } {
  return { canPrev: page > 1, canNext: pageSize > 0 && page * pageSize < total };
}

/** Case-insensitive match on the card's identifier, name and token. Empty query keeps every card. */
export function filterCards(cards: readonly QueueCard[], query: string): readonly QueueCard[] {
  const q = query.trim().toLowerCase();
  return q ? cards.filter(c => [c.primaryIdentifier, c.displayName, c.tokenLabel].some(s => s.toLowerCase().includes(q))) : cards;
}

/** The station shown on narrow screens: the user's pick if it still exists, else the one holding the selected card, else the first. */
export function activeStationId(stations: readonly QueueStation[], pick: string | undefined, selectedCardId: string | undefined): string {
  if (pick && stations.some(s => s.id === pick)) return pick;
  return (stations.find(s => s.cards.some(c => c.id === selectedCardId)) ?? stations[0])?.id ?? '';
}

/** Index to focus for a timeline key; only the orientation's two arrows plus Home/End navigate. Clamps, never wraps. */
export function timelineTarget(key: string, current: number, count: number, horizontal: boolean): number | null {
  const arrows = horizontal ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
  return key === 'Home' || key === 'End' || arrows.includes(key) ? clampedTarget(key, current, count) : null;
}
