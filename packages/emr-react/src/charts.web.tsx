'use client';

import { useId, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { useEmrTheme } from './theme';
import { bandLayout, barLength, funnelBars, niceScale, truncateLabel } from './charts.logic';
import type { EmrChartLabels, EmrBarChartProps, EmrChartIntent, EmrFunnelChartProps } from './charts.types';

export type * from './charts.types';

const DEFAULTS: EmrChartLabels = {
  showTable: 'Show as table',
  hideTable: 'Hide table',
  noData: 'No data',
  categoryColumn: 'Category',
  stepColumn: 'Step',
  valueColumn: 'Value',
  conversionColumn: 'Conversion',
  legend: 'Legend',
  nativeUnavailable: 'This chart is available on the web app.',
};

const W = 640;
const hidden: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
const PATTERNS = ['solid', 'hatch', 'dots'] as const;

/** Frame shared by both charts: svg with text alternative, always-present table (visible on toggle). */
function ChartFrame({ title, description, interactive, labels, svg, legend, headers, rows, height }: {
  title: string; description?: string; interactive: boolean; labels: EmrChartLabels;
  svg: ReactNode; legend?: ReactNode; headers: string[]; rows: string[][]; height: number;
}) {
  const t = useEmrTheme();
  const [table, setTable] = useState(false);
  const [focused, setFocused] = useState(false);
  const font = { fontFamily: t.fontFamily, fontSize: t.textSm, color: t.text };
  const cell: CSSProperties = { padding: '6px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'left' };
  return (
    <figure style={{ margin: 0, ...font }}>
      <figcaption style={{ fontWeight: t.weightMedium, fontSize: t.textMd }}>{title}</figcaption>
      {description ? <p style={{ margin: '2px 0 8px', color: t.textMuted }}>{description}</p> : null}
      {/* Focusable bars are buttons, which role="img" would flatten; the group keeps the same name/description. */}
      <svg
        viewBox={`0 0 ${W} ${height}`} width="100%" role={interactive ? 'group' : 'img'}
        aria-label={title}
        style={{ display: 'block', maxWidth: '100%', fontFamily: t.fontFamily }}
      >
        <title>{title}</title>
        {description ? <desc>{description}</desc> : null}
        {svg}
      </svg>
      {legend}
      <button
        type="button" aria-pressed={table} onClick={() => setTable(v => !v)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          ...font, marginTop: 8, minHeight: t.controlHeight, padding: '0 12px', borderRadius: 6, cursor: 'pointer',
          border: `1px solid ${t.border}`, background: table ? t.primarySoft : t.surface,
          ...(focused ? { outline: `3px solid ${t.focus}`, outlineOffset: 2 } : null),
        }}
      >{table ? labels.hideTable : labels.showTable}</button>
      <div style={table ? { overflowX: 'auto', marginTop: 8 } : hidden}>
        <table style={{ borderCollapse: 'collapse', width: '100%', ...font }}>
          <caption style={hidden}>{title}</caption>
          <thead><tr>{headers.map((h, i) => <th key={i} scope="col" style={{ ...cell, fontWeight: t.weightMedium, background: t.surfaceRaised }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => (j === 0
              ? <th key={j} scope="row" style={{ ...cell, fontWeight: t.weightRegular }}>{c}</th>
              : <td key={j} style={cell}>{c}</td>))}</tr>
          ))}</tbody>
        </table>
      </div>
    </figure>
  );
}

/** A bar that becomes a focusable button when an intent handler exists. */
function useBarProps(onIntent: ((i: EmrChartIntent) => void) | undefined) {
  const t = useEmrTheme();
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const props = (key: string, label: string, intent: EmrChartIntent) => {
    if (!onIntent) return {};
    return {
      tabIndex: 0, role: 'button', 'aria-label': label, style: { cursor: 'pointer', outline: 'none' } as CSSProperties,
      onClick: () => onIntent(intent),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onIntent(intent); }
      },
      onFocus: () => setFocusKey(key),
      onBlur: () => setFocusKey(k => (k === key ? null : k)),
    };
  };
  const ring = (key: string, x: number, y: number, w: number, h: number) =>
    focusKey === key ? <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="none" stroke={t.focus} strokeWidth={3} rx={2} /> : null;
  return { props, ring };
}

export function EmrBarChart({ model, onIntent, labels }: EmrBarChartProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { props, ring } = useBarProps(onIntent);
  const horizontal = model.orientation === 'horizontal';
  const { categories, series } = model;
  const colors = [t.primary, t.warning, t.success, t.info, t.danger];
  const kind = (s: number) => PATTERNS[s % PATTERNS.length];
  const color = (s: number) => colors[s % colors.length];
  const fillOf = (s: number) => (kind(s) === 'solid' ? color(s) : `url(#${uid}-p${s})`);

  const dataMax = Math.max(0, model.maxValue ?? 0, ...series.flatMap(s => Object.values(s.values).filter((v): v is number => typeof v === 'number')));
  const scale = niceScale(dataMax);
  const m = horizontal ? { l: 130, r: 72, t: 12, b: model.yAxisLabel ? 44 : 30 } : { l: 56, r: 16, t: 24, b: 44 };
  const rowPx = series.length * 18 + 16;
  const H = horizontal ? Math.max(120, m.t + m.b + categories.length * rowPx) : 320;
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const layout = bandLayout(categories.length, series.length, horizontal ? ph : pw);
  const axisExtent = horizontal ? pw : ph;
  const small = { fontSize: 11, fill: t.textMuted };

  const valueText = (s: number, cid: string) => {
    const v = series[s].values[cid];
    return typeof v !== 'number' ? l.noData : series[s].valueLabels?.[cid] ?? String(v);
  };

  const grid = scale.ticks.map(tick => {
    const p = (tick / scale.max) * axisExtent;
    return horizontal ? (
      <g key={tick}>
        <line x1={m.l + p} x2={m.l + p} y1={m.t} y2={m.t + ph} stroke={t.border} strokeWidth={1} />
        <text x={m.l + p} y={m.t + ph + 14} textAnchor="middle" {...small}>{tick}</text>
      </g>
    ) : (
      <g key={tick}>
        <line x1={m.l} x2={m.l + pw} y1={m.t + ph - p} y2={m.t + ph - p} stroke={t.border} strokeWidth={1} />
        <text x={m.l - 6} y={m.t + ph - p} textAnchor="end" dy="0.35em" {...small}>{tick}</text>
      </g>
    );
  });

  const svg = (
    <>
      <defs>
        {series.map((_, s) => kind(s) === 'solid' ? null : (
          <pattern key={s} id={`${uid}-p${s}`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform={kind(s) === 'hatch' ? 'rotate(45)' : undefined}>
            <rect width={6} height={6} fill={color(s)} />
            {kind(s) === 'hatch' ? <line x1={0} y1={0} x2={0} y2={6} stroke={t.surface} strokeWidth={2.5} /> : <circle cx={3} cy={3} r={1.3} fill={t.surface} />}
          </pattern>
        ))}
      </defs>
      <rect width={W} height={H} fill={t.surface} rx={6} />
      {grid}
      {model.yAxisLabel ? (horizontal
        ? <text x={m.l + pw / 2} y={H - 6} textAnchor="middle" {...small}>{model.yAxisLabel}</text>
        : <text transform={`translate(12 ${m.t + ph / 2}) rotate(-90)`} textAnchor="middle" {...small}>{model.yAxisLabel}</text>) : null}
      {categories.map((c, i) => {
        const mid = layout.start(i, 0) + (layout.bar * series.length) / 2;
        return horizontal
          ? <text key={c.id} x={m.l - 8} y={m.t + mid} textAnchor="end" dy="0.35em" fontSize={12} fill={t.text}>{truncateLabel(c.label, 18)}</text>
          : <text key={c.id} x={m.l + mid} y={m.t + ph + 16} textAnchor="middle" fontSize={12} fill={t.text}>{truncateLabel(c.label, Math.max(3, Math.floor(layout.band / 7)))}</text>;
      })}
      {categories.flatMap((c, i) => series.map((s, si) => {
        const v = s.values[c.id];
        const pos = layout.start(i, si);
        const key = `${c.id}/${s.id}`;
        if (typeof v !== 'number') {
          const x = horizontal ? m.l + 4 : m.l + pos + layout.bar / 2 + 4;
          const y = horizontal ? m.t + pos + layout.bar / 2 : m.t + ph - 4;
          return (
            <text key={key} x={x} y={y} dy={horizontal ? '0.35em' : undefined} fontSize={10} fill={t.textMuted} fontStyle="italic"
              transform={horizontal ? undefined : `rotate(-90 ${x} ${y})`}>{l.noData}</text>
          );
        }
        const len = barLength(v, scale.max, axisExtent);
        const [x, y, w, h] = horizontal
          ? [m.l, m.t + pos, len, layout.bar]
          : [m.l + pos, m.t + ph - len, layout.bar, len];
        const text = valueText(si, c.id);
        return (
          <g key={key} {...props(key, `${c.label}, ${s.label}: ${text}`, { type: 'categorySelected', categoryId: c.id, seriesId: s.id })}>
            <rect x={x} y={y} width={w} height={h} fill={fillOf(si)} stroke={color(si)} strokeWidth={1} />
            {/* Labels sit outside the bar end so contrast never depends on the bar fill. */}
            {horizontal
              ? <text x={x + w + 4} y={y + h / 2} dy="0.35em" fontSize={11} fill={t.text}>{text}</text>
              : <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={11} fill={t.text}>{text}</text>}
            {ring(key, x, y, w, h)}
          </g>
        );
      }))}
    </>
  );

  const legend = (
    <ul aria-label={l.legend} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', listStyle: 'none', margin: '8px 0 0', padding: 0, fontFamily: t.fontFamily, fontSize: t.textSm, color: t.text }}>
      {series.map((s, si) => (
        <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={16} height={16} aria-hidden="true"><rect width={16} height={16} fill={fillOf(si)} stroke={color(si)} /></svg>
          {s.label}
        </li>
      ))}
    </ul>
  );

  return (
    <ChartFrame
      title={model.title} description={model.description} interactive={Boolean(onIntent)} labels={l}
      svg={svg} legend={legend} height={H}
      headers={[l.categoryColumn, ...series.map(s => s.label)]}
      rows={categories.map(c => [c.label, ...series.map((_, si) => valueText(si, c.id))])}
    />
  );
}

export function EmrFunnelChart({ model, onIntent, labels }: EmrFunnelChartProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { props, ring } = useBarProps(onIntent);
  const { steps } = model;
  const rowH = 48;
  const H = Math.max(60, steps.length * rowH + 8);
  const labelW = 130;
  const areaW = 300;
  const textX = labelW + areaW + 12;
  const bars = funnelBars(steps.map(s => s.value), areaW);

  const svg = (
    <>
      <rect width={W} height={H} fill={t.surface} rx={6} />
      {steps.map((s, i) => {
        const { width, offset } = bars[i];
        const x = labelW + offset;
        const y = 4 + i * rowH + 6;
        const h = rowH - 14;
        const key = s.id;
        const spoken = [s.label, s.valueLabel, s.conversionLabel].filter(Boolean).join(', ');
        return (
          <g key={key} {...props(key, spoken, { type: 'stepSelected', stepId: s.id })}>
            <text x={labelW - 8} y={y + h / 2} textAnchor="end" dy="0.35em" fontSize={12} fill={t.text}>{truncateLabel(s.label, 20)}</text>
            <rect x={x} y={y} width={width} height={h} fill={t.primary} />
            <text x={textX} y={y + h / 2 - (s.conversionLabel ? 7 : 0)} dy="0.35em" fontSize={12} fontWeight={t.weightMedium} fill={t.text}>{s.valueLabel}</text>
            {s.conversionLabel ? <text x={textX} y={y + h / 2 + 8} dy="0.35em" fontSize={11} fill={t.textMuted}>{s.conversionLabel}</text> : null}
            {ring(key, x, y, width, h)}
          </g>
        );
      })}
    </>
  );

  return (
    <ChartFrame
      title={model.title} description={model.description} interactive={Boolean(onIntent)} labels={l}
      svg={svg} height={H}
      headers={[l.stepColumn, l.valueColumn, l.conversionColumn]}
      rows={steps.map(s => [s.label, s.valueLabel, s.conversionLabel ?? ''])}
    />
  );
}
