import type { ClinicalFieldValue, ClinicalQuantityValue } from '@drguptavivek/emr-controller';

/**
 * Number drafts: the user types "-" or "1." on the way to a number. Those are kept as local
 * text and not emitted; anything else maps to a number, or null when cleared. Characters a
 * number can't contain are stripped as typed, so nothing the user enters is silently dropped
 * from the model while still showing on screen.
 */
export function sanitizeNumberText(text: string, integer: boolean): string {
  const cleaned = text.replace(integer ? /[^\d-]/g : /[^\d.-]/g, '');
  const sign = cleaned.startsWith('-') ? '-' : '';
  const body = cleaned.replace(/-/g, '');
  if (integer) return sign + body;
  const [whole, ...rest] = body.split('.');
  return sign + whole + (rest.length ? '.' + rest.join('') : '');
}

export function parseNumberDraft(text: string): { complete: true; value: number | null } | { complete: false } {
  if (text === '') return { complete: true, value: null };
  if (text === '-' || text.endsWith('.')) return { complete: false };
  return { complete: true, value: Number(text) };
}

export function textOf(value: ClinicalFieldValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

export function numberTextOf(value: ClinicalFieldValue | undefined): string {
  if (typeof value === 'number') return String(value);
  if (isQuantity(value)) return value.value === null ? '' : String(value.value);
  return '';
}

export function isQuantity(value: ClinicalFieldValue | undefined): value is ClinicalQuantityValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'value' in value && 'unit' in value;
}

export function toggled(values: ClinicalFieldValue | undefined, value: string): string[] {
  const current = Array.isArray(values) ? values as readonly string[] : [];
  return current.includes(value) ? current.filter(v => v !== value) : [...current, value];
}

/** A hidden field is skipped only while empty: a hidden field that still holds a value is clinical data and stays visible. */
export function isFieldShown(state: { hidden?: boolean; value: ClinicalFieldValue } | undefined): boolean {
  if (!state?.hidden) return true;
  const v = state.value;
  return !(v === null || v === '' || (Array.isArray(v) && v.length === 0));
}
