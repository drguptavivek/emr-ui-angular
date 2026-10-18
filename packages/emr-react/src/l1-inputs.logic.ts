/** Pure parse/format for the typed date and time inputs. Wire values are ISO; display order is a prop. */

export type DateDisplayFormat = 'dd-mm-yyyy' | 'yyyy-mm-dd';

/**
 * 'empty' = cleared (emit null). 'valid' = a real calendar date / clock time (emit value).
 * 'draft' = incomplete or impossible (31-02-2026): stays on screen, never emitted.
 */
export type TextParse = { status: 'empty' } | { status: 'valid'; value: string } | { status: 'draft' };

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function daysIn(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Strips anything a date can't contain, as typed. */
export function sanitizeDateText(text: string): string {
  return text.replace(/[^\d\-/. ]/g, '').slice(0, 10);
}

export function parseDateText(text: string, format: DateDisplayFormat): TextParse {
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };
  // Numeric keypads have no separator: 8 bare digits read in display order (05032026 → 05-03-2026).
  const digits = /^\d{8}$/.test(trimmed)
    ? (format === 'dd-mm-yyyy' ? [trimmed.slice(0, 2), trimmed.slice(2, 4), trimmed.slice(4)] : [trimmed.slice(0, 4), trimmed.slice(4, 6), trimmed.slice(6)])
    : null;
  const parts = digits ?? trimmed.split(/[-/. ]+/);
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) return { status: 'draft' };
  const [a, b, c] = parts as [string, string, string];
  const [d, m, y] = format === 'dd-mm-yyyy' ? [a, b, c] : [c, b, a];
  if (y.length !== 4 || d.length > 2 || m.length > 2) return { status: 'draft' };
  const year = Number(y), month = Number(m), day = Number(d);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return { status: 'draft' };
  return { status: 'valid', value: `${pad(year, 4)}-${pad(month)}-${pad(day)}` };
}

/** ISO `YYYY-MM-DD` to display text; anything else (null, malformed) shows empty. */
export function formatDate(iso: string | null | undefined, format: DateDisplayFormat): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return '';
  const [, y, m, d] = match;
  return format === 'dd-mm-yyyy' ? `${d}-${m}-${y}` : `${y}-${m}-${d}`;
}

export function sanitizeTimeText(text: string): string {
  return text.replace(/[^\d:. ]/g, '').slice(0, 5);
}

/** `H:mm` / `HH:mm`, separators `:` `.` or space. Emits `HH:mm`. */
export function parseTimeText(text: string): TextParse {
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };
  const match = /^(\d{1,2})[:. ](\d{2})$/.exec(trimmed);
  if (!match) return { status: 'draft' };
  const hour = Number(match[1]), minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { status: 'draft' };
  return { status: 'valid', value: `${pad(hour)}:${pad(minute)}` };
}

/** `HH:mm` (a `:ss` tail is dropped from display) or empty. */
export function formatTime(value: string | null | undefined): string {
  return /^\d{2}:\d{2}/.exec(value ?? '')?.[0] ?? '';
}

/** `YYYY-MM-DDTHH:mm` needs both halves; one half alone is not a value. */
export function joinDateTime(date: string | null, time: string | null): string | null {
  return date && time ? `${date}T${time}` : null;
}

export function splitDateTime(value: string | null | undefined): { date: string | null; time: string | null } {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value ?? '');
  return { date: match?.[1] ?? null, time: match?.[2] ?? null };
}
