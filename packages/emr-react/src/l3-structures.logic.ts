import type { ClinicalCellState, ClinicalQuantityValue, ClinicalRow } from '@drguptavivek/emr-controller';

/** Below this container width (px) the matrix drops its table for one card per row. */
export const MATRIX_TABLE_MIN_WIDTH = 720;

/** Unmeasured (0) renders as a table, like EmrColumns, so first paint does not flash cards. */
export function isMatrixStacked(width: number): boolean {
  return width > 0 && width < MATRIX_TABLE_MIN_WIDTH;
}

/** A row with no `applicableColumnIds` applies to every column. */
export function isApplicable(row: ClinicalRow, columnId: string): boolean {
  return !row.applicableColumnIds || row.applicableColumnIds.includes(columnId);
}

export function isQuantity(value: ClinicalCellState['value'] | undefined): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && 'unit' in value;
}

/** Plain-text echo of a cell for read-only display. Missing is shown, never blanked. */
export function formatCellValue(value: ClinicalCellState['value'] | undefined, text: { yes: string; no: string; notRecorded: string }): string {
  if (isQuantity(value)) return `${value.value ?? text.notRecorded} ${value.unit}`.trim();
  if (typeof value === 'boolean') return value ? text.yes : text.no;
  return value === null || value === undefined || value === '' ? text.notRecorded : String(value);
}

/** Select/boolean/text editors address the cell value as a string; boolean maps to 'true'/'false'. */
export function cellSelectValue(value: ClinicalCellState['value'] | undefined): string | null {
  if (typeof value === 'boolean') return String(value);
  return typeof value === 'string' && value !== '' ? value : null;
}

export function cellNumberValue(value: ClinicalCellState['value'] | undefined): number | null {
  if (isQuantity(value)) return value.value;
  return typeof value === 'number' ? value : null;
}

/** The unit a quantity cell shows: the value's own unit once set, else the row's. */
export function quantityUnit(row: ClinicalRow, value: ClinicalCellState['value'] | undefined): string {
  return isQuantity(value) ? value.unit : row.unit ?? '';
}
