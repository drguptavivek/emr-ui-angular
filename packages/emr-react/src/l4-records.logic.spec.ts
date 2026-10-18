import { describe, expect, it } from 'vitest';
import { pathBreadcrumb } from './l4-records.logic';

describe('pathBreadcrumb', () => {
  it('shows repeat indices 1-based', () => {
    expect(pathBreadcrumb(['medications', 2, 'dose'])).toBe('medications › 3 › dose');
  });
  it('handles empty and single-segment paths', () => {
    expect(pathBreadcrumb([])).toBe('');
    expect(pathBreadcrumb(['vitals'])).toBe('vitals');
  });
});
