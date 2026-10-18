/** Pure helpers for the interactive L1 primitives (no React, no DOM). */

/** Next index for wrapping roving focus (tablists) over `enabled` flags; null for a non-navigation key or nothing enabled. */
export function rovingTarget(key: string, current: number, enabled: readonly boolean[]): number | null {
  const ok = enabled.map((e, i) => (e ? i : -1)).filter(i => i >= 0);
  if (!ok.length) return null;
  const pos = Math.max(0, ok.indexOf(current));
  if (key === 'Home') return ok[0];
  if (key === 'End') return ok[ok.length - 1];
  if (key === 'ArrowRight') return ok[(pos + 1) % ok.length];
  if (key === 'ArrowLeft') return ok[(pos - 1 + ok.length) % ok.length];
  return null;
}

/** Same as rovingTarget but clamps at the ends (lists, not wrapping tablists). */
export function clampedTarget(key: string, current: number, count: number): number | null {
  if (count <= 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown' || key === 'ArrowRight') return Math.min(count - 1, current + 1);
  if (key === 'ArrowUp' || key === 'ArrowLeft') return Math.max(0, current - 1);
  return null;
}

/** Clamp to [min,max] then snap to `step` from min; step <= 0 keeps the continuous position. */
export function vasSnap(raw: number, min: number, max: number, step: number): number {
  const bounded = Math.min(Math.max(raw, Math.min(min, max)), Math.max(min, max));
  if (!(step > 0)) return Number(bounded.toFixed(4));
  return Number((min + Math.round((bounded - min) / step) * step).toFixed(4));
}

/** Pointer offset along the track (0..length px) to a value. Vertical scales read bottom-up (offset measured from the top). */
export function vasValueFromOffset(offset: number, length: number, min: number, max: number, step: number, vertical: boolean): number {
  if (!(length > 0)) return vasSnap(min, min, max, step);
  const ratio = vertical ? (length - offset) / length : offset / length;
  return vasSnap(min + ratio * (max - min), min, max, step);
}

export function vasPercent(value: number, min: number, max: number): number {
  const span = max - min;
  return span > 0 ? Math.min(100, Math.max(0, ((value - min) / span) * 100)) : 0;
}

/** Keyboard / accessibility-action value change; null when the key is not handled. */
export function vasKeyValue(key: string, current: number | null, min: number, max: number, step: number, major: number): number | null {
  const s = step > 0 ? step : 1;
  const page = major > 0 ? major : s;
  const c = current ?? min;
  let raw: number;
  switch (key) {
    case 'ArrowRight': case 'ArrowUp': case 'increment': raw = c + s; break;
    case 'ArrowLeft': case 'ArrowDown': case 'decrement': raw = c - s; break;
    case 'PageUp': raw = c + page; break;
    case 'PageDown': raw = c - page; break;
    case 'Home': raw = min; break;
    case 'End': raw = max; break;
    default: return null;
  }
  return vasSnap(raw, min, max, step);
}

export interface VasTick { value: number; percent: number; major: boolean; label: string | null }

/** Pathological intervals must not generate unbounded nodes. */
const MAX_TICKS = 400;

export function vasTicks(min: number, max: number, majorInterval: number, minorInterval: number): VasTick[] {
  const span = max - min;
  if (!(span > 0)) return [];
  const major = majorInterval > 0 ? majorInterval : span;
  const minor = minorInterval > 0 ? minorInterval : major;
  const smallest = Math.min(major, minor);
  const stride = span / smallest > MAX_TICKS ? span / MAX_TICKS : smallest;
  const isMultiple = (offset: number) => {
    const r = Math.abs(offset % major);
    return r < major / 1000 || Math.abs(r - major) < major / 1000;
  };
  const ticks: VasTick[] = [];
  for (let v = min; v <= max + stride / 1000; v += stride) {
    const value = Number(v.toFixed(6));
    const isMajor = isMultiple(value - min);
    ticks.push({ value, percent: vasPercent(value, min, max), major: isMajor, label: isMajor ? String(Number(value.toFixed(2))) : null });
  }
  return ticks;
}

/** Likert points min..max inclusive; empty for an inverted or absurd range. */
export function likertPoints(min: number, max: number): number[] {
  if (!(max >= min) || max - min > 100) return [];
  return Array.from({ length: Math.floor(max) - Math.ceil(min) + 1 }, (_, i) => Math.ceil(min) + i);
}

/** The single tab stop of a tick list: last focused, else selected, else current, else first. */
export function tabStopTick(ticks: readonly { id: string; current?: boolean }[], focusedId: string | null, selectedId?: string): string | undefined {
  const has = (id: string | null | undefined) => !!id && ticks.some(t => t.id === id);
  if (has(focusedId)) return focusedId!;
  if (has(selectedId)) return selectedId;
  return ticks.find(t => t.current)?.id ?? ticks[0]?.id;
}
