import type {
  ClinicalAssessmentStatus,
  ClinicalColumnGroup,
  ClinicalFieldValue,
  ClinicalTranscriptIntent,
  ClinicalTranscriptViewModel,
  EmrTone,
  EvidenceSpan,
  EvidenceSuggestionListIntent,
  EvidenceSuggestionListViewModel,
  FieldSuggestion,
  FlowsheetCell,
  FlowsheetCellMap,
  FlowsheetColumn,
  FlowsheetIntent,
  FlowsheetRow,
  FlowsheetViewModel,
  NoteCaptureIntent,
  NoteCaptureViewModel,
  ObservationFlowsheetIntent,
  ObservationFlowsheetViewModel,
  ObservationTrendIntent,
  ObservationTrendViewModel,
  SuggestionStatus,
  TranscriptSegment,
  TrendAxis,
  TrendBand,
  TrendBandExtent,
  TrendPoint,
  TrendScale,
} from '@drguptavivek/emr-controller';

export type {
  ClinicalTranscriptIntent,
  ClinicalTranscriptViewModel,
  EvidenceSuggestionListIntent,
  EvidenceSuggestionListViewModel,
  ObservationFlowsheetIntent,
  ObservationFlowsheetViewModel,
};

// ---------------------------------------------------------------------------
// 1. Observation Flowsheet pure helpers
// ---------------------------------------------------------------------------

/** Default wording for the six no-value states when `valueLabel` is null. */
export const FLOWSHEET_STATUS_WORDS: Readonly<Record<ClinicalAssessmentStatus, string>> = {
  recorded: 'Not supplied',
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown',
};

/** One header cell over a run of adjacent columns; `label` is null for ungrouped columns. */
export interface FlowsheetHeadGroup {
  readonly key: string;
  readonly label: string | null;
  readonly span: number;
  readonly columnIds: readonly string[];
}

export type FlowsheetBodyItem =
  | { readonly kind: 'group'; readonly key: string; readonly label: string }
  | { readonly kind: 'row'; readonly key: string; readonly row: FlowsheetRow };

/** Interleaves group header rows before the first row of each contiguous group run. */
export function buildFlowsheetItems(
  rows: readonly FlowsheetRow[],
  groups?: readonly { readonly id: string; readonly label: string }[],
): readonly FlowsheetBodyItem[] {
  const groupMap = new Map((groups ?? []).map(g => [g.id, g.label] as const));
  return rows.flatMap((row, i): FlowsheetBodyItem[] => {
    const g = row.groupId;
    const label = g ? groupMap.get(g) : undefined;
    const head: FlowsheetBodyItem[] =
      g && label !== undefined && g !== rows[i - 1]?.groupId
        ? [{ kind: 'group', key: `g:${g}:${i}`, label }]
        : [];
    return [...head, { kind: 'row', key: row.id, row }];
  });
}

/** True when any body or footer row supplies a reference range label. */
export function hasFlowsheetReferenceRange(
  rows: readonly FlowsheetRow[],
  footerRows?: readonly FlowsheetRow[],
): boolean {
  return [...rows, ...(footerRows ?? [])].some(r => !!r.referenceLabel);
}

/**
 * Header cells for `columnGroups`, one per run of adjacent columns in the same group, walked in
 * column order so the header never drifts from the cells. Empty when no groups are supplied.
 */
export function groupFlowsheetColumns(
  columns: readonly FlowsheetColumn[],
  columnGroups?: readonly ClinicalColumnGroup[],
): readonly FlowsheetHeadGroup[] {
  const groups = columnGroups ?? [];
  if (!groups.length || !columns.length) return [];
  const groupOf = new Map(groups.flatMap(g => g.columnIds.map(id => [id, g] as const)));
  const runs: FlowsheetHeadGroup[] = [];
  columns.forEach((col, i) => {
    const g = groupOf.get(col.id);
    const last = runs[runs.length - 1];
    if (last && i > 0 && groupOf.get(columns[i - 1]!.id) === g) {
      runs[runs.length - 1] = {
        ...last,
        span: last.span + 1,
        columnIds: [...last.columnIds, col.id],
      };
    } else {
      runs.push({
        key: `${g?.id ?? '-'}:${i}`,
        label: g?.label ?? null,
        span: 1,
        columnIds: [col.id],
      });
    }
  });
  return runs;
}

export function flowsheetCellOf(
  map: FlowsheetCellMap | undefined,
  rowId: string,
  columnId: string,
): FlowsheetCell | undefined {
  return map?.[rowId]?.[columnId];
}

export function isFlowsheetCellSelected(
  selectedCell: FlowsheetViewModel['selectedCell'],
  rowId: string,
  columnId: string,
): boolean {
  return !!selectedCell && selectedCell.rowId === rowId && selectedCell.columnId === columnId;
}

export function flowsheetStatusWord(
  status: ClinicalAssessmentStatus | undefined,
  words: Readonly<Record<ClinicalAssessmentStatus, string>> = FLOWSHEET_STATUS_WORDS,
  notSupplied = 'Not supplied',
): string {
  return status ? words[status] : notSupplied;
}

/** Accessible name for a cell: row, column, value or status word, flag, and note. */
export function flowsheetCellName(
  row: FlowsheetRow,
  columnLabel: string,
  cell: FlowsheetCell | undefined,
  words: Readonly<Record<ClinicalAssessmentStatus, string>> = FLOWSHEET_STATUS_WORDS,
  notSupplied = 'Not supplied',
): string {
  if (!cell) return `${row.label}, ${columnLabel}: ${notSupplied}`;
  const parts = [
    cell.valueLabel ?? flowsheetStatusWord(cell.status, words, notSupplied),
    cell.flag ? [cell.flag.label, cell.flag.assistiveText].filter(Boolean).join(' ') : '',
    cell.note ?? '',
  ].filter(Boolean);
  return `${row.label}, ${columnLabel}: ${parts.join(', ')}`;
}

// ---------------------------------------------------------------------------
// 2. Observation Trend pure helpers
// ---------------------------------------------------------------------------

/**
 * Resolves which y axis an item (series or band) uses. `secondary` is honoured only when the model
 * supplies `secondaryAxis`; otherwise the item falls back to the primary axis rather than vanishing.
 */
export function resolveTrendAxis(
  item: { readonly axis?: TrendAxis },
  model: Pick<ObservationTrendViewModel, 'yLabel' | 'yMin' | 'yMax' | 'secondaryAxis'>,
): TrendScale {
  const s = item.axis === 'secondary' ? model.secondaryAxis : undefined;
  return s
    ? { axis: 'secondary', yLabel: s.yLabel, yMin: s.yMin, yMax: s.yMax }
    : { axis: 'primary', yLabel: model.yLabel, yMin: model.yMin, yMax: model.yMax };
}

/**
 * Clips a band (open-ended or closed, bounds in either order) to the scale's y domain.
 * Returns null when nothing of the band is visible. Pure geometry; it judges no value.
 */
export function clipTrendBand(
  band: Pick<TrendBand, 'yFrom' | 'yTo'>,
  scale: Pick<TrendScale, 'yMin' | 'yMax'>,
): TrendBandExtent | null {
  const min = Math.min(scale.yMin, scale.yMax);
  const max = Math.max(scale.yMin, scale.yMax);
  const a = band.yFrom ?? -Infinity;
  const b = band.yTo ?? Infinity;
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  const lo = Math.max(lower, min);
  const hi = Math.min(upper, max);
  if (!(hi > lo)) return null;
  const inside = (y: number): boolean => Number.isFinite(y) && y >= min && y <= max;
  const at = Number.isFinite(upper) ? upper : lower;
  return { lo, hi, edges: [lower, upper].filter(inside), labelAt: inside(at) ? at : undefined };
}

/** Marker glyph by series order, so series differ by shape and not only by colour. */
export function trendShapeGlyph(seriesIdx: number, filled: boolean): string {
  switch (seriesIdx % 4) {
    case 0:
      return filled ? '●' : '○';
    case 1:
      return filled ? '■' : '□';
    case 2:
      return filled ? '◆' : '◇';
    default:
      return filled ? '▲' : '△';
  }
}

/** Center-rotated bar geometry connecting `(x1, y1)` and `(x2, y2)`. */
export interface TrendLineSegmentGeometry {
  readonly key: string;
  readonly left: number;
  readonly top: number;
  readonly length: number;
  readonly thickness: number;
  readonly angleDeg: number;
}

export function computeTrendLineSegment(
  key: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 2,
): TrendLineSegmentGeometry {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    key,
    left: mx - length / 2,
    top: my - thickness / 2,
    length,
    thickness,
    angleDeg,
  };
}

export interface TrendBandGeometry {
  readonly id: string;
  readonly tone: EmrTone;
  readonly pattern: 'solid' | 'hatched';
  readonly y: number;
  readonly height: number;
  readonly edges: readonly number[];
  readonly edgeLabel?: string;
  readonly labelY?: number;
}

export interface TrendCurveGeometry {
  readonly id: string;
  readonly label: string;
  readonly segments: readonly TrendLineSegmentGeometry[];
  readonly lx: number;
  readonly ly: number;
}

export interface TrendSeriesLineGeometry {
  readonly id: string;
  readonly tone: EmrTone;
  readonly dashed: boolean;
  readonly segments: readonly TrendLineSegmentGeometry[];
}

export interface TrendMarkerGeometry {
  readonly domId: string;
  readonly seriesId: string;
  readonly seriesIdx: number;
  readonly idx: number;
  readonly point: TrendPoint;
  readonly seriesLabel: string;
  readonly tone: EmrTone;
  readonly px: number;
  readonly py: number;
  readonly radius: number;
  readonly name: string;
  readonly unitAxis: string;
}

export interface TrendLayout {
  readonly w: number;
  readonly h: number;
  readonly ml: number;
  readonly mr: number;
  readonly mt: number;
  readonly plotW: number;
  readonly plotH: number;
  readonly bands: readonly TrendBandGeometry[];
  readonly curves: readonly TrendCurveGeometry[];
  readonly lines: readonly TrendSeriesLineGeometry[];
  readonly markers: readonly TrendMarkerGeometry[];
  readonly xt: readonly { readonly x: number; readonly label: string; readonly align: 'left' | 'center' | 'right' }[];
  readonly yt: readonly { readonly y: number; readonly label: string }[];
  readonly yt2: readonly { readonly y: number; readonly label: string }[];
  readonly minor: readonly number[];
}

/** Pure geometry: maps supplied x/y to pixels for the measured width. */
export function layoutTrendChart(
  model: ObservationTrendViewModel,
  width: number,
  uid = 'emr-trend',
  axisLabels: { leftAxis: string; rightAxis: string } = { leftAxis: 'left axis', rightAxis: 'right axis' },
): TrendLayout {
  const w = Math.max(width, 200);
  const h = w < 520 ? 250 : 320;
  const ml = w < 520 ? 46 : 56;
  const mr = model.secondaryAxis ? ml : 16;
  const mt = 12;
  const plotW = Math.max(w - ml - mr, 10);
  const plotH = h - mt - 36;
  const dx = model.xMax - model.xMin || 1;
  const px = (x: number): number => ml + ((x - model.xMin) / dx) * plotW;
  const yOf = (sc: Pick<TrendScale, 'yMin' | 'yMax'>) => {
    const dy = sc.yMax - sc.yMin || 1;
    return (y: number): number => mt + plotH - ((y - sc.yMin) / dy) * plotH;
  };
  const py = yOf(model);
  const dual = !!model.secondaryAxis;
  const py2 = model.secondaryAxis ? yOf(model.secondaryAxis) : py;
  const dense = model.series.some(s => s.points.length > 60);
  const radius = dense ? 3 : 6;

  const markers = model.series.flatMap((s, seriesIdx) => {
    const sc = resolveTrendAxis(s, model);
    const sy = yOf(sc);
    const axisSuffix = dual ? `, ${sc.axis === 'secondary' ? axisLabels.rightAxis : axisLabels.leftAxis}` : '';
    const unitAxis = (s.unitLabel ?? sc.yLabel) + axisSuffix;
    return s.points.map((p, idx): TrendMarkerGeometry => {
      const x = px(p.x);
      const y = sy(p.y);
      const flag = p.flag ? `, ${p.flag.label}${p.flag.assistiveText ? ' ' + p.flag.assistiveText : ''}` : '';
      return {
        domId: `${uid}-p-${seriesIdx}-${idx}`,
        seriesId: s.id,
        seriesIdx,
        idx,
        point: p,
        seriesLabel: s.label,
        tone: s.tone,
        px: x,
        py: y,
        radius,
        name: `${s.label}, ${p.xLabel}: ${p.valueLabel}${flag}`,
        unitAxis,
      };
    });
  });

  const xt = model.xTicks.map(t => {
    const x = px(t.x);
    const align: 'left' | 'center' | 'right' = x < ml + 14 ? 'left' : x > ml + plotW - 14 ? 'right' : 'center';
    return { x, label: t.label, align };
  });

  const bands = (model.bands ?? []).flatMap((b): TrendBandGeometry[] => {
    const sc = resolveTrendAxis(b, model);
    const by = yOf(sc);
    const ext = clipTrendBand(b, sc);
    if (!ext) return [];
    const top = by(ext.hi);
    return [
      {
        id: b.id,
        tone: b.tone,
        pattern: b.pattern === 'hatched' ? 'hatched' : 'solid',
        y: top,
        height: Math.max(by(ext.lo) - top, 0),
        edges: ext.edges.map(by),
        edgeLabel: b.edgeLabel,
        labelY: ext.labelAt === undefined ? undefined : by(ext.labelAt),
      },
    ];
  });

  const curves = (model.referenceCurves ?? []).map((c): TrendCurveGeometry => {
    const segments: TrendLineSegmentGeometry[] = [];
    for (let i = 1; i < c.points.length; i++) {
      const prev = c.points[i - 1]!;
      const curr = c.points[i]!;
      segments.push(computeTrendLineSegment(`${c.id}-${i}`, px(prev.x), py(prev.y), px(curr.x), py(curr.y), 1.25));
    }
    const last = c.points[c.points.length - 1];
    return {
      id: c.id,
      label: c.label,
      segments,
      lx: last ? px(last.x) - 4 : 0,
      ly: last ? py(last.y) - 14 : 0,
    };
  });

  const lines = model.series
    .filter(s => s.points.length > 1)
    .map((s): TrendSeriesLineGeometry => {
      const sy = yOf(resolveTrendAxis(s, model));
      const segments: TrendLineSegmentGeometry[] = [];
      for (let i = 1; i < s.points.length; i++) {
        const prev = s.points[i - 1]!;
        const curr = s.points[i]!;
        segments.push(computeTrendLineSegment(`${s.id}-${i}`, px(prev.x), sy(prev.y), px(curr.x), sy(curr.y), 2));
      }
      return { id: s.id, tone: s.tone, dashed: !!s.dashed, segments };
    });

  return {
    w,
    h,
    ml,
    mr,
    mt,
    plotW,
    plotH,
    bands,
    curves,
    lines,
    markers,
    xt,
    yt: model.yTicks.map(t => ({ y: py(t.y), label: t.label })),
    yt2: (model.secondaryAxis?.yTicks ?? []).map(t => ({ y: py2(t.y), label: t.label })),
    minor: (model.xMinorTicks ?? []).map(t => px(t.x)),
  };
}

/** Keyboard roving focus navigation across trend markers. */
export function nextTrendMarker(
  markers: readonly TrendMarkerGeometry[],
  activeDomId: string | null,
  key: string,
): TrendMarkerGeometry | undefined {
  const cur = markers.find(m => m.domId === activeDomId);
  if (!cur) return undefined;
  const same = markers.filter(m => m.seriesIdx === cur.seriesIdx);
  switch (key) {
    case 'ArrowRight':
      return same[cur.idx + 1] ?? cur;
    case 'ArrowLeft':
      return same[cur.idx - 1] ?? cur;
    case 'Home':
      return same[0];
    case 'End':
      return same[same.length - 1];
    case 'ArrowDown':
    case 'ArrowUp': {
      const targetSeries = cur.seriesIdx + (key === 'ArrowDown' ? 1 : -1);
      const others = markers.filter(m => m.seriesIdx === targetSeries);
      return (
        others.reduce<TrendMarkerGeometry | undefined>(
          (best, m) => (!best || Math.abs(m.px - cur.px) < Math.abs(best.px - cur.px) ? m : best),
          undefined,
        ) ?? cur
      );
    }
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// 3. Clinical Transcript pure helpers
// ---------------------------------------------------------------------------

/** One highlighted passage inside a segment, with the numbers of the fields it feeds. */
export interface TranscriptSpanView {
  readonly id: string;
  readonly on: boolean;
  readonly marks: readonly number[];
  readonly describedBy: string;
  readonly descriptionText: string;
}

export interface TranscriptPiece {
  readonly text: string;
  readonly span?: TranscriptSpanView;
}

export interface TranscriptFeedView {
  readonly n: number;
  readonly label: string;
}

export interface TranscriptSegmentView {
  readonly segment: TranscriptSegment;
  readonly pieces: readonly TranscriptPiece[];
  readonly feeds: readonly TranscriptFeedView[];
}

export interface TranscriptDescriptionView {
  readonly id: string;
  readonly text: string;
}

/**
 * Cuts one segment's text at its supplied span offsets.
 * Offsets that fall outside the text, or overlap an earlier span, are skipped.
 */
export function splitTranscriptSegment(
  text: string,
  spans: readonly EvidenceSpan[],
  view: (span: EvidenceSpan) => TranscriptSpanView,
): readonly TranscriptPiece[] {
  const pieces: TranscriptPiece[] = [];
  let cursor = 0;
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    const start = Math.max(span.start, cursor);
    const end = Math.min(span.end, text.length);
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || end <= start) continue;
    if (start > cursor) pieces.push({ text: text.slice(cursor, start) });
    pieces.push({ text: text.slice(start, end), span: view(span) });
    cursor = end;
  }
  if (cursor < text.length) pieces.push({ text: text.slice(cursor) });
  return pieces;
}

export function buildTranscriptSegmentViews(
  model: Pick<NoteCaptureViewModel, 'segments' | 'spans' | 'suggestions' | 'highlightedSpanIds'>,
  uid = 'emr-transcript',
  describeFeeds: (labels: readonly string[]) => string = labels =>
    labels.length
      ? `Feeds ${labels.length} ${labels.length === 1 ? 'field' : 'fields'}: ${labels.join(', ')}.`
      : 'Feeds no fields.',
): {
  readonly views: readonly TranscriptSegmentView[];
  readonly descriptions: readonly TranscriptDescriptionView[];
} {
  const { segments, spans, suggestions, highlightedSpanIds } = model;
  const numberById = new Map(suggestions.map((s, i) => [s.id, i + 1] as const));
  const labelById = new Map(suggestions.map(s => [s.id, s.fieldLabel] as const));
  const on = new Set(highlightedSpanIds);
  const descriptions: TranscriptDescriptionView[] = [];

  const views = segments.map((segment): TranscriptSegmentView => {
    const mine = spans.filter(s => s.segmentId === segment.id);
    const pieces = splitTranscriptSegment(segment.text, mine, (span): TranscriptSpanView => {
      const known = span.suggestionIds.filter(id => numberById.has(id));
      const describedBy = `${uid}-d${descriptions.length}`;
      const descriptionText = describeFeeds(known.map(id => labelById.get(id) ?? ''));
      descriptions.push({ id: describedBy, text: descriptionText });
      return {
        id: span.id,
        on: on.has(span.id),
        marks: known.map(id => numberById.get(id) ?? 0),
        describedBy,
        descriptionText,
      };
    });
    const fed = new Set(
      pieces.flatMap(p => (p.span?.on ? mine.find(s => s.id === p.span?.id)?.suggestionIds ?? [] : [])),
    );
    const feeds = suggestions
      .filter(s => fed.has(s.id))
      .map(s => ({ n: numberById.get(s.id) ?? 0, label: s.fieldLabel }));
    return { segment, pieces, feeds };
  });

  return { views, descriptions };
}

// ---------------------------------------------------------------------------
// 4. Evidence Suggestion List pure helpers
// ---------------------------------------------------------------------------

export interface SuggestionSnippet {
  readonly text: string;
  readonly time: string;
}

export interface SuggestionRowView {
  readonly s: FieldSuggestion;
  readonly n: number;
  readonly on: boolean;
  readonly snippets: readonly SuggestionSnippet[];
}

export interface SuggestionGroupView {
  readonly id: string;
  readonly label?: string;
  readonly rows: readonly SuggestionRowView[];
}

export type SuggestionEditKind = 'select' | 'number' | 'date' | 'multiline' | 'text';

export const SUGGESTION_STATUS_META: Readonly<
  Record<SuggestionStatus, { readonly tone: EmrTone; readonly glyph: string; readonly defaultLabel: string }>
> = {
  pending: { tone: 'warning', glyph: '◷', defaultLabel: 'Needs review' },
  accepted: { tone: 'success', glyph: '✓', defaultLabel: 'Accepted' },
  edited: { tone: 'info', glyph: '✎', defaultLabel: 'Edited' },
  rejected: { tone: 'neutral', glyph: '✕', defaultLabel: 'Rejected' },
};

export function suggestionEditKind(s: Pick<FieldSuggestion, 'valueType' | 'options'>): SuggestionEditKind {
  if (s.valueType === 'select' && s.options?.length) return 'select';
  if (s.valueType === 'integer' || s.valueType === 'decimal') return 'number';
  if (s.valueType === 'date') return 'date';
  return s.valueType === 'multiline' ? 'multiline' : 'text';
}

export function initialSuggestionDraft(s: FieldSuggestion): string {
  const current = s.status === 'edited' ? s.editedValue : s.value;
  let draft =
    typeof current === 'string' || typeof current === 'number'
      ? String(current)
      : s.status === 'edited'
        ? (s.editedValueLabel ?? s.valueLabel)
        : s.valueLabel;
  if (suggestionEditKind(s) === 'select' && !s.options?.some(o => o.value === draft)) {
    draft = s.options?.[0]?.value ?? '';
  }
  return draft;
}

export function isSuggestionDraftValid(s: Pick<FieldSuggestion, 'valueType' | 'options'>, draft: string): boolean {
  const text = draft.trim();
  return suggestionEditKind(s) === 'number' ? text !== '' && Number.isFinite(Number(text)) : text !== '';
}

export function parseSuggestionDraft(
  s: Pick<FieldSuggestion, 'valueType' | 'options'>,
  draft: string,
): ClinicalFieldValue {
  const text = draft.trim();
  return suggestionEditKind(s) === 'number' ? Number(text) : text;
}

export function buildSuggestionListView(
  model: Pick<
    NoteCaptureViewModel,
    'suggestions' | 'spans' | 'segments' | 'highlightedSuggestionIds' | 'highlightedSpanIds'
  >,
  uid = 'emr-suggestions',
  noLinkedFieldsText = 'no fields link to this passage',
): {
  readonly groups: readonly SuggestionGroupView[];
  readonly pending: number;
  readonly highlighted: boolean;
  readonly linkedText: string;
} {
  const { suggestions, spans, segments, highlightedSuggestionIds, highlightedSpanIds } = model;
  const on = new Set(highlightedSuggestionIds);
  const spanById = new Map(spans.map(s => [s.id, s] as const));
  const segmentById = new Map(segments.map(s => [s.id, s] as const));

  const rows = suggestions.map((s, i): SuggestionRowView => ({
    s,
    n: i + 1,
    on: on.has(s.id),
    snippets: s.spanIds.flatMap(id => {
      const span = spanById.get(id);
      const segment = span ? segmentById.get(span.segmentId) : undefined;
      const text = span && segment ? segment.text.slice(span.start, span.end).trim() : '';
      return text ? [{ text, time: segment?.timeLabel ?? '' }] : [];
    }),
  }));

  const groups: { id: string; label?: string; rows: SuggestionRowView[] }[] = [];
  for (const row of rows) {
    let group = groups.find(g => g.label === row.s.sectionLabel);
    if (!group) {
      group = { id: `${uid}-g${groups.length}`, label: row.s.sectionLabel, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  const pending = suggestions.filter(s => s.status === 'pending').length;
  const highlighted = highlightedSuggestionIds.length > 0 || highlightedSpanIds.length > 0;
  const shown = rows.filter(r => r.on);
  const linkedText = shown.length ? shown.map(r => `${r.n} ${r.s.fieldLabel}`).join(', ') : noLinkedFieldsText;

  return { groups, pending, highlighted, linkedText };
}
