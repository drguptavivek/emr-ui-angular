import { describe, expect, it } from 'vitest';
import type {
  EvidenceSpan,
  FieldSuggestion,
  FlowsheetColumn,
  FlowsheetRow,
  ObservationTrendViewModel,
  TranscriptSegment,
} from '@drguptavivek/emr-controller';
import {
  buildFlowsheetItems,
  buildSuggestionListView,
  buildTranscriptSegmentViews,
  clipTrendBand,
  computeTrendLineSegment,
  flowsheetCellName,
  flowsheetCellOf,
  flowsheetStatusWord,
  groupFlowsheetColumns,
  hasFlowsheetReferenceRange,
  initialSuggestionDraft,
  isFlowsheetCellSelected,
  isSuggestionDraftValid,
  layoutTrendChart,
  nextTrendMarker,
  parseSuggestionDraft,
  resolveTrendAxis,
  splitTranscriptSegment,
  suggestionEditKind,
  trendShapeGlyph,
} from './l4-observations-notes.logic';

const scale = { yMin: 2, yMax: 7 };

describe('clipTrendBand', () => {
  it('keeps a closed band inside the scale, with both bound lines', () => {
    expect(clipTrendBand({ yFrom: 3.5, yTo: 5 }, scale)).toEqual({ lo: 3.5, hi: 5, edges: [3.5, 5], labelAt: 5 });
  });

  it('accepts bounds in either order', () => {
    expect(clipTrendBand({ yFrom: 5, yTo: 3.5 }, scale)).toEqual({ lo: 3.5, hi: 5, edges: [3.5, 5], labelAt: 5 });
  });

  it('runs an open-top band to yMax and labels its lower bound', () => {
    expect(clipTrendBand({ yFrom: 6 }, scale)).toEqual({ lo: 6, hi: 7, edges: [6], labelAt: 6 });
  });

  it('runs an open-bottom band to yMin and labels its upper bound', () => {
    expect(clipTrendBand({ yTo: 3 }, scale)).toEqual({ lo: 2, hi: 3, edges: [3], labelAt: 3 });
  });

  it('fills the whole plot when both bounds are absent, with no bound line', () => {
    expect(clipTrendBand({}, scale)).toEqual({ lo: 2, hi: 7, edges: [], labelAt: undefined });
  });

  it('clips a band that overhangs the scale and drops the off-scale bound line', () => {
    expect(clipTrendBand({ yFrom: 1, yTo: 4 }, scale)).toEqual({ lo: 2, hi: 4, edges: [4], labelAt: 4 });
    expect(clipTrendBand({ yFrom: 6, yTo: 9 }, scale)).toEqual({ lo: 6, hi: 7, edges: [6], labelAt: undefined });
  });

  it('returns null for a band entirely off the scale or of zero height', () => {
    expect(clipTrendBand({ yFrom: 8 }, scale)).toBeNull();
    expect(clipTrendBand({ yTo: 1 }, scale)).toBeNull();
    expect(clipTrendBand({ yFrom: 4, yTo: 4 }, scale)).toBeNull();
  });
});

describe('resolveTrendAxis', () => {
  const primary = { yLabel: 'beats/min', yMin: 40, yMax: 160 };
  const dual = { ...primary, secondaryAxis: { yLabel: 'mmHg', yMin: 40, yMax: 200, yTicks: [] } };

  it('defaults to the primary axis', () => {
    expect(resolveTrendAxis({}, dual)).toEqual({ axis: 'primary', yLabel: 'beats/min', yMin: 40, yMax: 160 });
  });

  it('uses the secondary axis when asked and supplied', () => {
    expect(resolveTrendAxis({ axis: 'secondary' }, dual)).toEqual({ axis: 'secondary', yLabel: 'mmHg', yMin: 40, yMax: 200 });
  });

  it('falls back to primary when secondary is asked but not supplied', () => {
    expect(resolveTrendAxis({ axis: 'secondary' }, primary).axis).toBe('primary');
  });
});

describe('flowsheet helpers', () => {
  const rows: FlowsheetRow[] = [
    { id: 'na', label: 'Sodium', unitLabel: 'mmol/L', referenceLabel: '135 to 145', groupId: 'elec' },
    { id: 'k', label: 'Potassium', unitLabel: 'mmol/L', referenceLabel: '3.5 to 5.1', groupId: 'elec' },
    { id: 'cr', label: 'Creatinine', unitLabel: 'µmol/L', groupId: 'renal' },
  ];
  const groups = [
    { id: 'elec', label: 'Electrolytes' },
    { id: 'renal', label: 'Renal' },
  ];

  it('interleaves group headers before contiguous runs of rows', () => {
    const items = buildFlowsheetItems(rows, groups);
    expect(items.map(i => (i.kind === 'group' ? `G:${i.label}` : `R:${i.row.id}`))).toEqual([
      'G:Electrolytes',
      'R:na',
      'R:k',
      'G:Renal',
      'R:cr',
    ]);
  });

  it('detects whether any row or footer row has a reference range', () => {
    expect(hasFlowsheetReferenceRange(rows)).toBe(true);
    expect(hasFlowsheetReferenceRange([{ id: 'hr', label: 'Heart rate' }])).toBe(false);
    expect(
      hasFlowsheetReferenceRange(
        [{ id: 'hr', label: 'Heart rate' }],
        [{ id: 'tot', label: 'Total', referenceLabel: '0 to 100' }],
      ),
    ).toBe(true);
  });

  it('groups adjacent columns by columnGroups in column order', () => {
    const cols: FlowsheetColumn[] = [
      { id: 'c0', label: '06:00' },
      { id: 'c1', label: '07:00' },
      { id: 'c2', label: '08:00' },
    ];
    const colGroups = [{ id: 'vent', label: 'Ventilator', columnIds: ['c0', 'c1'] }];
    expect(groupFlowsheetColumns(cols, colGroups)).toEqual([
      { key: 'vent:0', label: 'Ventilator', span: 2, columnIds: ['c0', 'c1'] },
      { key: '-:2', label: null, span: 1, columnIds: ['c2'] },
    ]);
  });

  it('formats cell accessible names and status words for all six no-value states', () => {
    expect(flowsheetStatusWord('unable-to-assess')).toBe('Unable to assess');
    expect(flowsheetStatusWord('not-assessed')).toBe('Not assessed');
    expect(flowsheetStatusWord('not-applicable')).toBe('Not applicable');
    expect(flowsheetStatusWord('declined')).toBe('Declined');
    expect(flowsheetStatusWord('unknown')).toBe('Unknown');
    expect(flowsheetStatusWord('recorded')).toBe('Not supplied');
    expect(flowsheetStatusWord(undefined)).toBe('Not supplied');

    const cells = {
      na: {
        c0: {
          valueLabel: '148',
          flag: { label: 'High', tone: 'danger' as const, assistiveText: 'above range' },
          note: 'Repeat sent',
        },
      },
    };
    const cell = flowsheetCellOf(cells, 'na', 'c0');
    expect(flowsheetCellName(rows[0]!, '06:00', cell)).toBe('Sodium, 06:00: 148, High above range, Repeat sent');
    expect(isFlowsheetCellSelected({ rowId: 'na', columnId: 'c0' }, 'na', 'c0')).toBe(true);
    expect(isFlowsheetCellSelected({ rowId: 'na', columnId: 'c0' }, 'k', 'c0')).toBe(false);
  });
});

describe('trend geometry and roving focus', () => {
  const model: ObservationTrendViewModel = {
    id: 'bp',
    title: 'Blood pressure',
    yLabel: 'mmHg',
    yMin: 40,
    yMax: 180,
    xMin: 0,
    xMax: 2,
    xTicks: [
      { x: 0, label: 'Day 1' },
      { x: 1, label: 'Day 2' },
      { x: 2, label: 'Day 3' },
    ],
    yTicks: [
      { y: 60, label: '60' },
      { y: 120, label: '120' },
    ],
    series: [
      {
        id: 'sys',
        label: 'Systolic',
        tone: 'danger',
        points: [
          { id: 's0', x: 0, y: 120, xLabel: 'Day 1', valueLabel: '120 mmHg' },
          { id: 's1', x: 1, y: 150, xLabel: 'Day 2', valueLabel: '150 mmHg', flag: { label: 'High', tone: 'danger' } },
          { id: 's2', x: 2, y: 130, xLabel: 'Day 3', valueLabel: '130 mmHg' },
        ],
      },
      {
        id: 'dia',
        label: 'Diastolic',
        tone: 'info',
        dashed: true,
        points: [
          { id: 'd0', x: 0, y: 80, xLabel: 'Day 1', valueLabel: '80 mmHg' },
          { id: 'd1', x: 1, y: 95, xLabel: 'Day 2', valueLabel: '95 mmHg' },
          { id: 'd2', x: 2, y: 82, xLabel: 'Day 3', valueLabel: '82 mmHg' },
        ],
      },
    ],
    bands: [{ id: 'target', label: 'Target', yFrom: 100, yTo: 130, tone: 'success' }],
    summaryText: 'Summary',
    emptyMessage: 'Empty',
  };

  it('computes line segments centered on the midpoint between points', () => {
    const seg = computeTrendLineSegment('k', 10, 20, 110, 20, 2);
    expect(seg.length).toBeCloseTo(100);
    expect(seg.left).toBeCloseTo(10);
    expect(seg.top).toBeCloseTo(19);
    expect(seg.angleDeg).toBeCloseTo(0);
  });

  it('lays out bands, series lines, and markers and navigates markers by keyboard', () => {
    const layout = layoutTrendChart(model, 640, 'tr');
    expect(layout.bands).toHaveLength(1);
    expect(layout.lines).toHaveLength(2);
    expect(layout.markers).toHaveLength(6);
    expect(trendShapeGlyph(0, true)).toBe('●');
    expect(trendShapeGlyph(1, false)).toBe('□');

    const first = layout.markers[0]!;
    expect(nextTrendMarker(layout.markers, first.domId, 'ArrowRight')?.point.id).toBe('s1');
    expect(nextTrendMarker(layout.markers, first.domId, 'End')?.point.id).toBe('s2');
    expect(nextTrendMarker(layout.markers, first.domId, 'ArrowDown')?.point.id).toBe('d0');
  });
});

describe('transcript and suggestion helpers', () => {
  const segments: TranscriptSegment[] = [
    {
      id: 'g1',
      text: 'Right eye red and painful for 3 days.',
      startMs: null,
      endMs: null,
      source: 'spoken',
      speakerLabel: 'Patient',
      timeLabel: '00:09',
    },
  ];
  const spans: EvidenceSpan[] = [
    { id: 'p1', segmentId: 'g1', start: 0, end: 25, suggestionIds: ['f1'] },
    { id: 'p2', segmentId: 'g1', start: 26, end: 36, suggestionIds: ['f2'] },
  ];
  const suggestions: FieldSuggestion[] = [
    {
      id: 'f1',
      path: ['history', 'f1'],
      fieldLabel: 'Chief complaint',
      sectionLabel: 'History',
      value: 'Right eye pain',
      valueLabel: 'Right eye pain',
      spanIds: ['p1'],
      status: 'pending',
      valueType: 'multiline',
    },
    {
      id: 'f2',
      path: ['history', 'f2'],
      fieldLabel: 'Duration',
      sectionLabel: 'History',
      value: 3,
      valueLabel: '3 days',
      spanIds: ['p2'],
      status: 'accepted',
      valueType: 'integer',
    },
  ];

  it('splits transcript text into plain and evidence span pieces while skipping invalid spans', () => {
    const pieces = splitTranscriptSegment('Hello world', [{ id: 's1', segmentId: 'g', start: 6, end: 11, suggestionIds: [] }], s => ({
      id: s.id,
      on: true,
      marks: [1],
      describedBy: 'd0',
      descriptionText: 'Feeds 1 field',
    }));
    expect(pieces.map(p => [p.text, !!p.span])).toEqual([
      ['Hello ', false],
      ['world', true],
    ]);
  });

  it('builds transcript views with field numbers and active feeds', () => {
    const { views } = buildTranscriptSegmentViews({
      segments,
      spans,
      suggestions,
      highlightedSpanIds: ['p1'],
    });
    expect(views).toHaveLength(1);
    expect(views[0]!.feeds).toEqual([{ n: 1, label: 'Chief complaint' }]);
  });

  it('groups suggestions by section, extracts quotes, and validates drafts', () => {
    const view = buildSuggestionListView({
      suggestions,
      spans,
      segments,
      highlightedSuggestionIds: ['f1'],
      highlightedSpanIds: ['p1'],
    });
    expect(view.pending).toBe(1);
    expect(view.highlighted).toBe(true);
    expect(view.linkedText).toBe('1 Chief complaint');
    expect(view.groups[0]!.rows[0]!.snippets).toEqual([{ text: 'Right eye red and painful', time: '00:09' }]);

    expect(suggestionEditKind(suggestions[0]!)).toBe('multiline');
    expect(suggestionEditKind(suggestions[1]!)).toBe('number');
    expect(initialSuggestionDraft(suggestions[1]!)).toBe('3');
    expect(isSuggestionDraftValid(suggestions[1]!, '14')).toBe(true);
    expect(isSuggestionDraftValid(suggestions[1]!, 'abc')).toBe(false);
    expect(parseSuggestionDraft(suggestions[1]!, ' 14 ')).toBe(14);
  });
});
