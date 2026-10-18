import { describe, expect, it } from 'vitest';
import { isFieldShown, isSectionShown, numberTextOf, parseNumberDraft, sanitizeNumberText, toggled } from './typed-field.logic';

describe('typed field logic', () => {
  it('sanitizes number text as typed', () => {
    expect(sanitizeNumberText('12a3', true)).toBe('123');
    expect(sanitizeNumberText('1.2.3', true)).toBe('123');
    expect(sanitizeNumberText('1.2.3', false)).toBe('1.23');
    expect(sanitizeNumberText('-4-5', false)).toBe('-45');
    expect(sanitizeNumberText('5-', false)).toBe('5');
  });

  it('holds incomplete drafts back and clears to null', () => {
    expect(parseNumberDraft('')).toEqual({ complete: true, value: null });
    expect(parseNumberDraft('-')).toEqual({ complete: false });
    expect(parseNumberDraft('7.')).toEqual({ complete: false });
    expect(parseNumberDraft('-7.25')).toEqual({ complete: true, value: -7.25 });
    expect(parseNumberDraft('0')).toEqual({ complete: true, value: 0 });
  });

  it('reads numbers and quantities back to text', () => {
    expect(numberTextOf(0)).toBe('0');
    expect(numberTextOf({ value: 72, unit: 'bpm' })).toBe('72');
    expect(numberTextOf({ value: null, unit: 'bpm' })).toBe('');
    expect(numberTextOf('x')).toBe('');
  });

  it('toggles multiselect values', () => {
    expect(toggled(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggled(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggled(null, 'a')).toEqual(['a']);
  });

  it('hides an empty hidden field but never one holding a value', () => {
    expect(isFieldShown(undefined)).toBe(true);
    expect(isFieldShown({ hidden: true, value: null })).toBe(false);
    expect(isFieldShown({ hidden: true, value: [] })).toBe(false);
    expect(isFieldShown({ hidden: true, value: 0 })).toBe(true);
    expect(isFieldShown({ hidden: true, value: false })).toBe(true);
  });

  it('skips a section only when every field and matrix cell in it is hidden and empty', () => {
    const section = { blocks: [{ id: 'a' }, { kind: 'matrix', id: 'm', rows: [{ cells: { OD: { id: 'b' } } }] }] };
    expect(isSectionShown(section, { a: { hidden: true, value: null }, b: { hidden: true, value: null } })).toBe(false);
    expect(isSectionShown(section, { a: { hidden: true, value: null }, b: { hidden: true, value: 14 } })).toBe(true);
    expect(isSectionShown(section, { a: { value: null } })).toBe(true);
    expect(isSectionShown({ blocks: [{ kind: 'repeatable', id: 'r' }] }, {})).toBe(true);
  });
});
