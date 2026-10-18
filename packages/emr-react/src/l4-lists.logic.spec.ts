import { describe, expect, it } from 'vitest';
import type { QueueCard, QueueStation } from '@drguptavivek/emr-controller';
import { activeStationId, ariaSortOf, filterCards, nextSort, pagerState, timelineTarget } from './l4-lists.logic';

const card = (id: string, name: string, mrn = 'M1', token = 'Token 1'): QueueCard =>
  ({ id, patientId: id, tokenLabel: token, displayName: name, primaryIdentifier: mrn, waitLabel: '1 min' });
const station = (id: string, cards: QueueCard[]): QueueStation => ({ id, label: id, countLabel: '', cards, canCallNext: false });

describe('l4 lists logic', () => {
  it('sort flips on the active column and restarts elsewhere', () => {
    expect(nextSort(undefined, 'a')).toEqual({ field: 'a', direction: 'asc' });
    expect(nextSort({ field: 'a', direction: 'asc' }, 'a')).toEqual({ field: 'a', direction: 'desc' });
    expect(nextSort({ field: 'a', direction: 'desc' }, 'a')).toEqual({ field: 'a', direction: 'asc' });
    expect(nextSort({ field: 'a', direction: 'desc' }, 'b')).toEqual({ field: 'b', direction: 'asc' });
    expect(ariaSortOf({ field: 'a', direction: 'desc' }, 'a')).toBe('descending');
    expect(ariaSortOf({ field: 'a', direction: 'desc' }, 'b')).toBe('none');
    expect(ariaSortOf(undefined, 'a')).toBe('none');
  });

  it('pager bounds', () => {
    expect(pagerState(1, 10, 0)).toEqual({ canPrev: false, canNext: false });
    expect(pagerState(1, 10, 10)).toEqual({ canPrev: false, canNext: false });
    expect(pagerState(1, 10, 11)).toEqual({ canPrev: false, canNext: true });
    expect(pagerState(2, 10, 11)).toEqual({ canPrev: true, canNext: false });
    expect(pagerState(2, 0, 11).canNext).toBe(false);
  });

  it('filters by identifier, name and token; blank keeps all', () => {
    const cards = [card('1', 'Asha Rao', 'MR-7', 'Token 4'), card('2', 'Ben Lee', 'MR-8', 'Token 5')];
    expect(filterCards(cards, '  ')).toBe(cards);
    expect(filterCards(cards, 'asha').map(c => c.id)).toEqual(['1']);
    expect(filterCards(cards, 'mr-8').map(c => c.id)).toEqual(['2']);
    expect(filterCards(cards, 'token 4').map(c => c.id)).toEqual(['1']);
    expect(filterCards(cards, 'zzz')).toEqual([]);
  });

  it('active station: pick, then selected card, then first, then empty', () => {
    const s = [station('a', [card('1', 'x')]), station('b', [card('2', 'y')])];
    expect(activeStationId(s, 'b', '1')).toBe('b');
    expect(activeStationId(s, 'gone', '2')).toBe('b');
    expect(activeStationId(s, undefined, undefined)).toBe('a');
    expect(activeStationId([], 'a', undefined)).toBe('');
  });

  it('timeline keys follow orientation and clamp', () => {
    expect(timelineTarget('ArrowDown', 0, 3, false)).toBe(1);
    expect(timelineTarget('ArrowRight', 0, 3, false)).toBeNull();
    expect(timelineTarget('ArrowRight', 2, 3, true)).toBe(2);
    expect(timelineTarget('ArrowLeft', 0, 3, true)).toBe(0);
    expect(timelineTarget('End', 0, 3, true)).toBe(2);
    expect(timelineTarget('Home', 2, 3, false)).toBe(0);
    expect(timelineTarget('ArrowDown', 0, 0, false)).toBeNull();
  });
});
