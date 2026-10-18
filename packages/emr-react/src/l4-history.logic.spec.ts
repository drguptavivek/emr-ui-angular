import { describe, expect, it } from 'vitest';
import { hasSummary, present } from './l4-history.logic';

describe('l4-history logic', () => {
  it('hasSummary is false for undefined and empty lists', () => {
    expect(hasSummary(undefined)).toBe(false);
    expect(hasSummary({ openReferrals: [], openBookings: [], openEpisodes: [] })).toBe(false);
  });
  it('hasSummary is true when any block exists', () => {
    expect(hasSummary({ lastDrScreen: {} })).toBe(true);
    expect(hasSummary({ openBookings: [{}] })).toBe(true);
  });
  it('present drops undefined and empty strings', () => {
    expect(present('a', undefined, '', 'b')).toEqual(['a', 'b']);
  });
});
