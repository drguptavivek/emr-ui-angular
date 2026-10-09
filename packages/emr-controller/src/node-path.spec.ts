import { describe, expect, it } from 'vitest';
import {
  childPath,
  type EmrNodePath,
  EmrNodePathError,
  isPrefixOf,
  parsePath,
  pathsEqual,
  serializePath,
} from './node-path.js';
import { hasErrorAt, messagesAt, type EmrValidationMessage } from './validation.models.js';

describe('serializePath / parsePath round-trip', () => {
  const table: ReadonlyArray<{ readonly name: string; readonly path: EmrNodePath; readonly key: string }> = [
    { name: 'empty path', path: [], key: '' },
    { name: 'single field', path: ['weight'], key: 'weight' },
    { name: 'field inside a section', path: ['vitals', 'weight'], key: 'vitals.weight' },
    { name: 'repeat item field', path: ['medications', 2, 'dose'], key: 'medications[2].dose' },
    { name: 'matrix cell', path: ['acuity', 'iop', 'od'], key: 'acuity.iop.od' },
    { name: 'leading numeric segment', path: [0], key: '[0]' },
    { name: 'leading numeric then field', path: [0, 'dose'], key: '[0].dose' },
    { name: 'multiple consecutive indices', path: ['a', 0, 1, 'b'], key: 'a[0][1].b' },
    { name: 'segment with a dot', path: ['med.name'], key: 'med\\.name' },
    { name: 'segment with brackets', path: ['weird[id]'], key: 'weird\\[id\\]' },
    { name: 'segment with a backslash', path: ['back\\slash'], key: 'back\\\\slash' },
    { name: 'segment with dot inside nested path', path: ['vitals', 'blood.pressure', 0], key: 'vitals.blood\\.pressure[0]' },
    { name: 'large repeat index', path: ['medications', 41, 'dose'], key: 'medications[41].dose' },
  ];

  it.each(table)('round-trips $name', ({ path, key }) => {
    expect(serializePath(path)).toBe(key);
    expect(parsePath(key)).toEqual(path);
    // exact inverse both ways
    expect(parsePath(serializePath(path))).toEqual(path);
    expect(serializePath(parsePath(key))).toBe(key);
  });

  it('has at least 12 entries in the round-trip table', () => {
    expect(table.length).toBeGreaterThanOrEqual(12);
  });
});

describe('parsePath malformed input', () => {
  it('throws EmrNodePathError on unclosed bracket', () => {
    expect(() => parsePath('medications[2')).toThrow(EmrNodePathError);
    // Non-canonical forms after a bracket must not silently alias a canonical path.
    expect(() => parsePath('a[2].')).toThrow(EmrNodePathError);
    expect(() => parsePath('a.[2]')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on non-numeric bracket contents', () => {
    expect(() => parsePath('medications[abc]')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on a negative-looking index', () => {
    expect(() => parsePath('medications[-1]')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on an unexpected closing bracket', () => {
    expect(() => parsePath('medications]2[')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on a trailing escape character', () => {
    expect(() => parsePath('medications\\')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on a trailing dot', () => {
    expect(() => parsePath('medications.')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on an empty segment (leading dot)', () => {
    expect(() => parsePath('.medications')).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on consecutive dots', () => {
    expect(() => parsePath('medications..dose')).toThrow(EmrNodePathError);
  });
});

describe('serializePath malformed input', () => {
  it('throws EmrNodePathError on a non-integer numeric segment', () => {
    expect(() => serializePath([1.5])).toThrow(EmrNodePathError);
  });

  it('throws EmrNodePathError on a negative numeric segment', () => {
    expect(() => serializePath([-1])).toThrow(EmrNodePathError);
  });
});

describe('pathsEqual', () => {
  it('is true for two empty paths', () => {
    expect(pathsEqual([], [])).toBe(true);
  });

  it('is true for structurally identical paths', () => {
    expect(pathsEqual(['medications', 2, 'dose'], ['medications', 2, 'dose'])).toBe(true);
  });

  it('is false when lengths differ', () => {
    expect(pathsEqual(['a'], ['a', 'b'])).toBe(false);
  });

  it('is false when a segment differs', () => {
    expect(pathsEqual(['medications', 2, 'dose'], ['medications', 3, 'dose'])).toBe(false);
  });

  it('is false for a number vs. its string form', () => {
    expect(pathsEqual(['medications', 2], ['medications', '2' as unknown as number])).toBe(false);
  });
});

describe('isPrefixOf', () => {
  it('the empty path is a prefix of every path', () => {
    expect(isPrefixOf([], [])).toBe(true);
    expect(isPrefixOf([], ['a', 'b'])).toBe(true);
  });

  it('a path is a prefix of itself', () => {
    expect(isPrefixOf(['medications', 2], ['medications', 2])).toBe(true);
  });

  it('is true for a genuine prefix', () => {
    expect(isPrefixOf(['medications'], ['medications', 2, 'dose'])).toBe(true);
    expect(isPrefixOf(['medications', 2], ['medications', 2, 'dose'])).toBe(true);
  });

  it('is false when longer than the path', () => {
    expect(isPrefixOf(['medications', 2, 'dose'], ['medications', 2])).toBe(false);
  });

  it('is false on divergent segments', () => {
    expect(isPrefixOf(['vitals'], ['medications', 2, 'dose'])).toBe(false);
  });
});

describe('childPath', () => {
  it('appends a string segment', () => {
    expect(childPath(['vitals'], 'weight')).toEqual(['vitals', 'weight']);
  });

  it('appends a numeric segment', () => {
    expect(childPath(['medications'], 2)).toEqual(['medications', 2]);
  });

  it('works from the empty path', () => {
    expect(childPath([], 'weight')).toEqual(['weight']);
  });

  it('does not mutate the parent path', () => {
    const parent: EmrNodePath = ['vitals'];
    const child = childPath(parent, 'weight');
    expect(parent).toEqual(['vitals']);
    expect(child).toEqual(['vitals', 'weight']);
  });
});

describe('messagesAt / hasErrorAt', () => {
  const messages: readonly EmrValidationMessage[] = [
    { path: ['weight'], severity: 'error', message: 'Weight is required.' },
    { path: ['vitals', 'weight'], severity: 'warning', message: 'Unusually low.' },
    { path: ['medications', 0, 'dose'], severity: 'error', message: 'Dose is required.' },
    { path: ['medications', 1, 'dose'], severity: 'info', message: 'Consider rounding.' },
    { path: ['medications'], severity: 'error', message: 'At least one medication is required.' },
  ];

  it('messagesAt filters by exact path, not by prefix', () => {
    expect(messagesAt(messages, ['medications'])).toEqual([
      { path: ['medications'], severity: 'error', message: 'At least one medication is required.' },
    ]);
    // a container-level message must not leak into a descendant lookup, and vice versa
    expect(messagesAt(messages, ['medications', 0, 'dose'])).toEqual([
      { path: ['medications', 0, 'dose'], severity: 'error', message: 'Dose is required.' },
    ]);
  });

  it('messagesAt returns an empty array when nothing matches', () => {
    expect(messagesAt(messages, ['unrelated'])).toEqual([]);
  });

  it('hasErrorAt is true only when an error-severity message matches the exact path', () => {
    expect(hasErrorAt(messages, ['weight'])).toBe(true);
    expect(hasErrorAt(messages, ['medications', 0, 'dose'])).toBe(true);
  });

  it('hasErrorAt is false for a path with only non-error messages', () => {
    expect(hasErrorAt(messages, ['vitals', 'weight'])).toBe(false);
    expect(hasErrorAt(messages, ['medications', 1, 'dose'])).toBe(false);
  });

  it('hasErrorAt does not match by prefix', () => {
    // 'medications' has an error, but 'medications', 0 (the item container) does not
    expect(hasErrorAt(messages, ['medications', 0])).toBe(false);
  });

  it('hasErrorAt is false when the path is absent entirely', () => {
    expect(hasErrorAt(messages, ['unrelated'])).toBe(false);
  });
});
