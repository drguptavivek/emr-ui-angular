import { describe, expect, it } from 'vitest';
import type { ClinicalRow } from '@drguptavivek/emr-controller';
import { cellNumberValue, cellSelectValue, formatCellValue, isApplicable, isMatrixStacked, quantityUnit } from './l3-structures.logic';

const text = { yes: 'Yes', no: 'No', notRecorded: 'Not recorded' };
const row: ClinicalRow = { id: 'r', label: 'R', type: 'quantity', unit: 'mmHg', applicableColumnIds: ['a'] };

describe('l3 matrix logic', () => {
  it('stacks only once measured and narrow', () => {
    expect(isMatrixStacked(0)).toBe(false);
    expect(isMatrixStacked(400)).toBe(true);
    expect(isMatrixStacked(900)).toBe(false);
  });
  it('applicability defaults to all columns', () => {
    expect(isApplicable(row, 'a')).toBe(true);
    expect(isApplicable(row, 'b')).toBe(false);
    expect(isApplicable({ ...row, applicableColumnIds: undefined }, 'b')).toBe(true);
  });
  it('formats every value shape, keeping false distinct from missing', () => {
    expect(formatCellValue(false, text)).toBe('No');
    expect(formatCellValue(null, text)).toBe('Not recorded');
    expect(formatCellValue('', text)).toBe('Not recorded');
    expect(formatCellValue(0, text)).toBe('0');
    expect(formatCellValue({ value: 120, unit: 'mmHg' }, text)).toBe('120 mmHg');
    expect(formatCellValue({ value: null, unit: 'mmHg' }, text)).toBe('Not recorded mmHg');
  });
  it('maps cell values to editor values', () => {
    expect(cellSelectValue(true)).toBe('true');
    expect(cellSelectValue('')).toBeNull();
    expect(cellNumberValue({ value: 3, unit: 'x' })).toBe(3);
    expect(cellNumberValue('3')).toBeNull();
    expect(quantityUnit(row, null)).toBe('mmHg');
    expect(quantityUnit(row, { value: 1, unit: 'kPa' })).toBe('kPa');
  });
});
