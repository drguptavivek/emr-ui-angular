const STEPS = [1, 2, 2.5, 5, 10];

/** Smallest "nice" step (1/2/2.5/5 x 10^k) that is >= raw. */
function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw));
  return (STEPS.find(s => s * pow >= raw - 1e-12) ?? 10) * pow;
}

/** Scale top and tick values (0..top) for data whose largest value is `max`. */
export function niceScale(max: number, targetTicks = 4): { max: number; ticks: number[] } {
  if (!Number.isFinite(max) || max <= 0) return { max: 1, ticks: [0, 1] };
  const step = niceStep(max / targetTicks);
  const count = Math.ceil(max / step - 1e-9);
  const ticks = Array.from({ length: count + 1 }, (_, i) => Number((i * step).toFixed(10)));
  return { max: ticks[count], ticks };
}

/** Bar length along the value axis; negatives clamp to 0, anything non-zero keeps a visible 2px sliver. */
export function barLength(value: number, max: number, extent: number): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.max(2, Math.min(extent, (value / max) * extent));
}

/** Category-axis geometry for grouped bars: offset of series `s` in category `i`, and each bar's thickness. */
export function bandLayout(count: number, seriesCount: number, extent: number, gapRatio = 0.3) {
  const band = count > 0 ? extent / count : 0;
  const inner = band * (1 - gapRatio);
  const bar = seriesCount > 0 ? inner / seriesCount : 0;
  return { band, bar, start: (i: number, s: number) => i * band + (band - inner) / 2 + s * bar };
}

/** Centred funnel bars: width and left offset inside `area`, scaled to the largest step. */
export function funnelBars(values: number[], area: number): { width: number; offset: number }[] {
  const max = Math.max(0, ...values);
  return values.map(v => {
    const width = barLength(v, max, area);
    return { width, offset: (area - width) / 2 };
  });
}

export function truncateLabel(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return maxChars <= 1 ? text.slice(0, Math.max(maxChars, 0)) : `${text.slice(0, maxChars - 1)}…`;
}
