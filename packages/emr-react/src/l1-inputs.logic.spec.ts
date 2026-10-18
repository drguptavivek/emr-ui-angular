import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, joinDateTime, parseDateText, parseTimeText, sanitizeDateText, splitDateTime, sameInstant } from './l1-inputs.logic';

describe('parseDateText', () => {
  it('parses day-first with any separator and pads', () => {
    for (const text of ['05-03-2026', '5/3/2026', '5.3.2026', '5 3 2026']) {
      expect(parseDateText(text, 'dd-mm-yyyy')).toEqual({ status: 'valid', value: '2026-03-05' });
    }
  });
  it('parses year-first', () => {
    expect(parseDateText('2026/03/05', 'yyyy-mm-dd')).toEqual({ status: 'valid', value: '2026-03-05' });
  });
  it('empty clears', () => {
    expect(parseDateText('  ', 'dd-mm-yyyy')).toEqual({ status: 'empty' });
  });
  it('keeps incomplete drafts without emitting', () => {
    for (const text of ['05', '05-03', '05-03-20', '05-03-202', '05--2026', 'ab']) {
      expect(parseDateText(text, 'dd-mm-yyyy')).toEqual({ status: 'draft' });
    }
  });
  it('rejects impossible calendar dates', () => {
    for (const text of ['31-02-2026', '29-02-2025', '00-01-2026', '01-13-2026', '32-01-2026']) {
      expect(parseDateText(text, 'dd-mm-yyyy')).toEqual({ status: 'draft' });
    }
  });
  it('accepts leap days', () => {
    expect(parseDateText('29-02-2028', 'dd-mm-yyyy')).toEqual({ status: 'valid', value: '2028-02-29' });
    expect(parseDateText('29-02-1900', 'dd-mm-yyyy').status).toBe('draft');
    expect(parseDateText('29-02-2000', 'dd-mm-yyyy').status).toBe('valid');
  });
  it('does not read day-first text as year-first', () => {
    expect(parseDateText('05-03-2026', 'yyyy-mm-dd')).toEqual({ status: 'draft' });
  });
});

describe('formatDate / sanitizeDateText', () => {
  it('round-trips both orders', () => {
    expect(formatDate('2026-03-05', 'dd-mm-yyyy')).toBe('05-03-2026');
    expect(formatDate('2026-03-05', 'yyyy-mm-dd')).toBe('2026-03-05');
  });
  it('shows empty for null or malformed', () => {
    expect(formatDate(null, 'dd-mm-yyyy')).toBe('');
    expect(formatDate('garbage', 'dd-mm-yyyy')).toBe('');
  });
  it('strips letters and caps length', () => {
    expect(sanitizeDateText('05a-03-2026999')).toBe('05-03-2026');
  });
});

describe('time', () => {
  it('parses and pads', () => {
    expect(parseTimeText('9:05')).toEqual({ status: 'valid', value: '09:05' });
    expect(parseTimeText('23.59')).toEqual({ status: 'valid', value: '23:59' });
    expect(parseTimeText('00:00')).toEqual({ status: 'valid', value: '00:00' });
  });
  it('drafts on incomplete or out of range', () => {
    for (const text of ['9', '09:', '09:5', '24:00', '12:60']) expect(parseTimeText(text)).toEqual({ status: 'draft' });
    expect(parseTimeText('')).toEqual({ status: 'empty' });
  });
  it('formats, dropping seconds', () => {
    expect(formatTime('08:30:15')).toBe('08:30');
    expect(formatTime(null)).toBe('');
  });
});

describe('datetime', () => {
  it('joins only when both halves exist', () => {
    expect(Date.parse(joinDateTime('2026-03-05', '08:30')!)).toBe(new Date(2026, 2, 5, 8, 30).getTime()); // UTC instant of local 08:30
    expect(joinDateTime('2026-03-05', null)).toBeNull();
    expect(joinDateTime(null, '08:30')).toBeNull();
  });
  it('splits and tolerates null', () => {
    expect(splitDateTime('2026-03-05T08:30')).toEqual({ date: '2026-03-05', time: '08:30' });
    expect(splitDateTime(null)).toEqual({ date: null, time: null });
  });

  it('reads 8 bare digits from a numeric keypad in display order', () => {
    expect(parseDateText('05032026', 'dd-mm-yyyy')).toEqual({ status: 'valid', value: '2026-03-05' });
    expect(parseDateText('20260305', 'yyyy-mm-dd')).toEqual({ status: 'valid', value: '2026-03-05' });
    expect(parseDateText('31022026', 'dd-mm-yyyy')).toEqual({ status: 'draft' });
  });

  it('reads month-first locales, including 8 keypad digits', () => {
    expect(parseDateText('03-05-2026', 'mm-dd-yyyy')).toEqual({ status: 'valid', value: '2026-03-05' });
    expect(parseDateText('03052026', 'mm-dd-yyyy')).toEqual({ status: 'valid', value: '2026-03-05' });
    expect(formatDate('2026-03-05', 'mm-dd-yyyy')).toBe('03-05-2026');
  });

  it('stores datetime as a UTC instant and shows local wall-clock time', () => {
    const utc = joinDateTime('2026-03-05', '09:30')!;
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(Date.parse(utc)).toBe(new Date(2026, 2, 5, 9, 30).getTime());
    expect(splitDateTime(utc)).toEqual({ date: '2026-03-05', time: '09:30' });
    expect(splitDateTime('2026-03-05T09:30')).toEqual({ date: '2026-03-05', time: '09:30' }); // legacy zone-less = local
    expect(sameInstant(utc, utc.replace('Z', '.000Z'))).toBe(true);
    expect(joinDateTime('2026-03-05', null)).toBeNull();
  });
});
