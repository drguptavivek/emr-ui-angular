'use client';

import { useState } from 'react';
import { View } from 'react-native';
import type {
  EmrBadge,
  EvidenceSpan,
  FieldSuggestion,
  FlowsheetCell,
  FlowsheetColumn,
  FlowsheetIntent,
  FlowsheetRow,
  FlowsheetViewModel,
  NoteCaptureIntent,
  NoteCaptureViewModel,
  ObservationTrendIntent,
  ObservationTrendViewModel,
  TranscriptSegment,
  TrendPoint,
} from '@drguptavivek/emr-controller';
import { EmrColumns } from '../../src/l1-display';
import {
  EmrClinicalTranscript,
  EmrEvidenceSuggestionList,
  EmrObservationFlowsheet,
  EmrObservationTrend,
} from '../../src/l4-observations-notes';
import type { GallerySection } from './types';

// ---------------------------------------------------------------------------
// 1. Flowsheet synthetic fixtures
// ---------------------------------------------------------------------------

const col = (id: string, label: string, sublabel?: string, current?: boolean): FlowsheetColumn => ({
  id,
  label,
  sublabel,
  current,
});
const row = (id: string, label: string, extra: Partial<FlowsheetRow> = {}): FlowsheetRow => ({
  id,
  label,
  ...extra,
});
const cell = (valueLabel: string | null, extra: Partial<FlowsheetCell> = {}): FlowsheetCell => ({
  valueLabel,
  ...extra,
});
const highBadge: EmrBadge = {
  label: 'High',
  tone: 'danger',
  assistiveText: 'above the reference range',
};
const lowBadge: EmrBadge = {
  label: 'Low',
  tone: 'warning',
  assistiveText: 'below the reference range',
};

const grid = (
  rows: readonly string[],
  cols: readonly string[],
  f: (rId: string, cId: string, i: number) => FlowsheetCell,
): FlowsheetViewModel['cells'] =>
  Object.fromEntries(
    rows.map(rId => [rId, Object.fromEntries(cols.map((cId, i) => [cId, f(rId, cId, i)]))]),
  );

const vitalCols = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(
  (t, i, a) => col(`t${i}`, t, 'Day 2', i === a.length - 1),
);
const vitalRows = [
  row('temp', 'Temperature', { unitLabel: '°C' }),
  row('hr', 'Heart rate', { unitLabel: 'beats/min' }),
  row('rr', 'Respiratory rate', { unitLabel: '/min' }),
  row('bp', 'Blood pressure', { unitLabel: 'mmHg' }),
  row('spo2', 'SpO₂', { unitLabel: '%' }),
  row('pain', 'Pain score', { unitLabel: '0 to 10' }),
];
const vitalData: Record<string, (string | null)[]> = {
  temp: ['37.1', '37.4', '38.2', '38.6', '37.9', '37.5', '37.2', '37.0'],
  hr: ['78', '82', '96', '104', '92', '86', '80', '76'],
  rr: ['16', '16', '18', '20', '18', '16', '16', '14'],
  bp: ['124/78', '126/80', '132/84', '138/88', '130/82', '126/80', '122/76', '120/74'],
  spo2: ['98', '98', '97', '96', '97', '98', '98', '99'],
  pain: ['2', '2', '4', '5', '3', null, '1', '1'],
};
const vitalFlags: Record<string, Record<number, FlowsheetCell['flag']>> = {
  temp: { 2: highBadge, 3: highBadge },
  hr: { 3: highBadge },
  bp: { 3: highBadge },
};
const initialVitals: FlowsheetViewModel = {
  id: 'vitals',
  title: 'Vital signs, 12 hourly view',
  rows: vitalRows,
  columns: vitalCols,
  emptyMessage: 'No vital signs recorded.',
  cells: grid(
    vitalRows.map(x => x.id),
    vitalCols.map(x => x.id),
    (rId, _cId, i) => {
      const value = vitalData[rId]?.[i] ?? null;
      if (value === null) return cell(null, { status: 'unable-to-assess', editable: true });
      return cell(value, { flag: vitalFlags[rId]?.[i], editable: true });
    },
  ),
  selectedCell: { rowId: 'hr', columnId: 't3' },
};

const labCols = ['d0', 'd1', 'd2', 'd3', 'd4'].map((id, i) =>
  col(id, ['03 Mar', '04 Mar', '05 Mar', '06 Mar', '07 Mar'][i]!, i === 0 ? 'Admission' : undefined, i === 4),
);
const labRows = [
  row('na', 'Sodium', { unitLabel: 'mmol/L', referenceLabel: '135 to 145', groupId: 'elec' }),
  row('k', 'Potassium', { unitLabel: 'mmol/L', referenceLabel: '3.5 to 5.1', groupId: 'elec' }),
  row('creat', 'Creatinine', { unitLabel: 'µmol/L', referenceLabel: '60 to 110', groupId: 'renal' }),
  row('egfr', 'eGFR', { unitLabel: 'mL/min/1.73 m²', groupId: 'renal' }),
  row('hb', 'Haemoglobin', { unitLabel: 'g/dL', referenceLabel: '13.0 to 17.0', groupId: 'haem' }),
  row('wbc', 'White cell count', { unitLabel: '×10⁹/L', referenceLabel: '4.0 to 11.0', groupId: 'haem' }),
];
const labData: Record<string, (string | null)[]> = {
  na: ['138', '136', '134', '137', '139'],
  k: ['4.1', '4.8', '5.4', '5.0', '4.6'],
  creat: ['98', '112', '131', '118', '104'],
  egfr: ['78', '68', '56', '64', '74'],
  hb: ['12.4', '11.9', '11.2', '11.4', '11.8'],
  wbc: ['13.2', '12.1', '10.4', '8.8', '7.9'],
};
const labFlags: Record<string, Record<number, FlowsheetCell['flag']>> = {
  na: { 2: lowBadge },
  k: { 2: highBadge },
  creat: { 1: highBadge, 2: highBadge, 3: highBadge },
  hb: { 0: lowBadge, 1: lowBadge, 2: lowBadge, 3: lowBadge, 4: lowBadge },
  wbc: { 0: highBadge, 1: highBadge },
};
const initialLabs: FlowsheetViewModel = {
  id: 'labs',
  title: 'Cumulative laboratory results',
  rows: labRows,
  columns: labCols,
  emptyMessage: 'No results available.',
  groups: [
    { id: 'elec', label: 'Electrolytes' },
    { id: 'renal', label: 'Renal' },
    { id: 'haem', label: 'Haematology' },
  ],
  cells: grid(
    labRows.map(x => x.id),
    labCols.map(x => x.id),
    (rId, _cId, i) => {
      const value = labData[rId]?.[i] ?? null;
      return value === null ? cell(null, { status: 'not-assessed' }) : cell(value, { flag: labFlags[rId]?.[i] });
    },
  ),
};

const ioCols = ['06', '08', '10', '12', '14', '16'].map((t, i, a) =>
  col(`h${i}`, `${t}:00`, 'Hourly', i === a.length - 1),
);
const ioRows = [
  row('oral', 'Oral', { unitLabel: 'mL', groupId: 'in' }),
  row('iv', 'IV fluid', { unitLabel: 'mL', groupId: 'in' }),
  row('urine', 'Urine', { unitLabel: 'mL', groupId: 'out' }),
  row('drain', 'Drain', { unitLabel: 'mL', groupId: 'out' }),
];
const ioData: Record<string, (string | null)[]> = {
  oral: ['200', '150', '0', '250', '100', '200'],
  iv: ['100', '100', '100', '100', '100', '100'],
  urine: ['120', '90', '110', null, '80', '95'],
  drain: ['20', '10', '15', '10', '5', '5'],
};
const initialFluid: FlowsheetViewModel = {
  id: 'io',
  title: 'Intake and output',
  rows: ioRows,
  columns: ioCols,
  emptyMessage: 'No intake or output recorded.',
  groups: [
    { id: 'in', label: 'Intake' },
    { id: 'out', label: 'Output' },
  ],
  cells: grid(
    ioRows.map(x => x.id),
    ioCols.map(x => x.id),
    (rId, _cId, i) => {
      const value = ioData[rId]?.[i] ?? null;
      return value === null ? cell(null, { status: 'not-assessed', editable: true }) : cell(value, { editable: true });
    },
  ),
  footerRows: [
    row('tin', 'Total intake', { unitLabel: 'mL' }),
    row('tout', 'Total output', { unitLabel: 'mL' }),
    row('bal', 'Balance', { unitLabel: 'mL' }),
  ],
  footerCells: {
    tin: Object.fromEntries(ioCols.map((c, i) => [c.id, cell(['300', '250', '100', '350', '200', '300'][i]!)])),
    tout: Object.fromEntries(ioCols.map((c, i) => [c.id, cell(['140', '100', '125', '10', '85', '100'][i]!)])),
    bal: Object.fromEntries(ioCols.map((c, i) => [c.id, cell(['+160', '+150', '-25', '+340', '+115', '+200'][i]!)])),
  },
};

function FlowsheetDemo({ initial }: { initial: FlowsheetViewModel }) {
  const [model, setModel] = useState(initial);
  const onIntent = (e: FlowsheetIntent) => {
    if (e.type === 'cellSelected') {
      setModel(m => ({ ...m, selectedCell: { rowId: e.rowId, columnId: e.columnId } }));
    } else if (e.type === 'columnAddRequested') {
      setModel(m => {
        const nextId = `added-${m.columns.length}`;
        return {
          ...m,
          columns: [
            ...m.columns.map(c => ({ ...c, current: false })),
            col(nextId, '22:00', 'New', true),
          ],
        };
      });
    }
  };
  return <EmrObservationFlowsheet model={model} onIntent={onIntent} />;
}

// ---------------------------------------------------------------------------
// 2. Observation Trend synthetic fixtures
// ---------------------------------------------------------------------------

const pt = (
  id: string,
  x: number,
  y: number,
  xLabel: string,
  unit: string,
  flag?: TrendPoint['flag'],
): TrendPoint => ({ id, x, y, xLabel, valueLabel: `${y} ${unit}`, flag });

const days = ['03 Mar', '04 Mar', '05 Mar', '06 Mar', '07 Mar', '08 Mar', '09 Mar', '10 Mar', '11 Mar', '12 Mar'];
const sys = [128, 134, 142, 156, 148, 138, 132, 126, 124, 128];
const dia = [80, 84, 88, 96, 92, 86, 84, 80, 78, 80];

const initialBpTrend: ObservationTrendViewModel = {
  id: 'bp',
  title: 'Blood pressure, 10 days',
  yLabel: 'mmHg',
  yMin: 40,
  yMax: 180,
  xMin: 0,
  xMax: 9,
  xTicks: days.map((label, x) => ({ x, label })).filter((_, i) => i % 3 === 0 || i === 9),
  yTicks: [40, 60, 80, 100, 120, 140, 160, 180].map(y => ({ y, label: String(y) })),
  series: [
    {
      id: 'sys',
      label: 'Systolic',
      tone: 'danger',
      points: sys.map((y, i) => pt(`s${i}`, i, y, days[i]!, 'mmHg', y >= 140 ? highBadge : undefined)),
    },
    {
      id: 'dia',
      label: 'Diastolic',
      tone: 'info',
      dashed: true,
      points: dia.map((y, i) => pt(`d${i}`, i, y, days[i]!, 'mmHg', y >= 90 ? highBadge : undefined)),
    },
  ],
  bands: [
    { id: 'tsys', label: 'Systolic target 100 to 130', yFrom: 100, yTo: 130, tone: 'success' },
    { id: 'tdia', label: 'Diastolic target 60 to 80', yFrom: 60, yTo: 80, tone: 'info' },
  ],
  selectedPointId: 's3',
  summaryText:
    'Systolic pressure rose from 128 to a peak of 156 mmHg on 06 March and returned to 128 mmHg by 12 March.',
  emptyMessage: 'No blood pressure readings recorded.',
};

const visits = ['Baseline', '1 mo', '3 mo', '6 mo', '9 mo', '12 mo', '18 mo'];
const vx = [0, 1, 3, 6, 9, 12, 18];
const od = [24, 22, 19, 18, 17, 18, 16];
const os = [22, 20, 18, 17, 16, 16, 15];

const initialIopTrend: ObservationTrendViewModel = {
  id: 'iop',
  title: 'Intraocular pressure, right and left eye',
  yLabel: 'mmHg',
  yMin: 8,
  yMax: 30,
  xMin: 0,
  xMax: 18,
  xGranularityLabel: 'Visit interval',
  granularityOptions: [
    { id: '6m', label: '6 months' },
    { id: '18m', label: '18 months', selected: true },
  ],
  xTicks: vx.map((x, i) => ({ x, label: visits[i]! })).filter((_, i) => [0, 3, 5, 6].includes(i)),
  yTicks: [10, 15, 20, 25, 30].map(y => ({ y, label: String(y) })),
  series: [
    {
      id: 'od',
      label: 'Right eye (OD)',
      tone: 'info',
      points: od.map((y, i) => pt(`od${i}`, vx[i]!, y, visits[i]!, 'mmHg', y > 21 ? highBadge : undefined)),
    },
    {
      id: 'os',
      label: 'Left eye (OS)',
      tone: 'neutral',
      dashed: true,
      points: os.map((y, i) => pt(`os${i}`, vx[i]!, y, visits[i]!, 'mmHg', y > 21 ? highBadge : undefined)),
    },
  ],
  bands: [{ id: 'range', label: 'Reference range 10 to 21', yFrom: 10, yTo: 21, tone: 'success' }],
  summaryText:
    'Right eye pressure fell from 24 to 16 mmHg and left eye pressure from 22 to 15 mmHg over 18 months of treatment.',
  emptyMessage: 'No pressure readings recorded.',
};

function TrendDemo({ initial }: { initial: ObservationTrendViewModel }) {
  const [model, setModel] = useState(initial);
  const onIntent = (e: ObservationTrendIntent) => {
    if (e.type === 'pointSelected') {
      setModel(m => ({ ...m, selectedPointId: e.pointId }));
    } else if (e.type === 'granularityChangeRequested') {
      setModel(m => ({
        ...m,
        granularityOptions: m.granularityOptions?.map(g => ({
          ...g,
          selected: g.id === e.granularityId,
        })),
      }));
    }
  };
  return <EmrObservationTrend model={model} onIntent={onIntent} />;
}

// ---------------------------------------------------------------------------
// 3. Clinical Transcript & Evidence Suggestion List synthetic fixtures
// ---------------------------------------------------------------------------

const opdSegments: readonly TranscriptSegment[] = [
  {
    id: 'g1',
    timeLabel: '00:04',
    speakerLabel: 'Doctor',
    text: 'What brings you in today?',
    startMs: null,
    endMs: null,
    source: 'spoken',
  },
  {
    id: 'g2',
    timeLabel: '00:09',
    speakerLabel: 'Patient',
    text: 'My right eye has been red and painful for three days, and the vision is blurry.',
    startMs: null,
    endMs: null,
    source: 'spoken',
    editable: true,
  },
  {
    id: 'g3',
    timeLabel: '00:21',
    speakerLabel: 'Doctor',
    text: 'Let me check your vision. With glasses, right eye six by twelve, left eye six by six.',
    startMs: null,
    endMs: null,
    source: 'spoken',
  },
  {
    id: 'g4',
    timeLabel: '00:38',
    speakerLabel: 'Doctor',
    text: 'Eye pressure is 24 in the right eye and 15 in the left.',
    startMs: null,
    endMs: null,
    source: 'spoken',
  },
  {
    id: 'g5',
    timeLabel: '00:52',
    speakerLabel: 'Doctor',
    text: 'The right cornea shows an epithelial defect with stromal infiltrate. This looks like bacterial keratitis of the right eye.',
    startMs: null,
    endMs: null,
    source: 'spoken',
  },
];

function spanOf(
  segments: readonly TranscriptSegment[],
  id: string,
  segmentId: string,
  phrase: string,
  suggestionIds: readonly string[],
): EvidenceSpan {
  const text = segments.find(s => s.id === segmentId)?.text ?? '';
  const start = text.indexOf(phrase);
  return { id, segmentId, start: Math.max(0, start), end: Math.max(0, start) + phrase.length, suggestionIds };
}

const opdSpans: readonly EvidenceSpan[] = [
  spanOf(opdSegments, 'p1', 'g2', 'right eye has been red and painful', ['f1', 'f3']),
  spanOf(opdSegments, 'p2', 'g2', 'for three days', ['f2']),
  spanOf(opdSegments, 'p3', 'g2', 'the vision is blurry', ['f1']),
  spanOf(opdSegments, 'p4', 'g3', 'right eye six by twelve', ['f4']),
  spanOf(opdSegments, 'p5', 'g3', 'left eye six by six', ['f5']),
  spanOf(opdSegments, 'p6', 'g4', '24 in the right eye', ['f6']),
  spanOf(opdSegments, 'p7', 'g4', '15 in the left', ['f7']),
  spanOf(opdSegments, 'p8', 'g5', 'bacterial keratitis of the right eye', ['f8']),
];

const highConf: EmrBadge = { label: 'High confidence', tone: 'success' };
const checkConf: EmrBadge = { label: 'Check wording', tone: 'warning' };

const opdSuggestions: readonly FieldSuggestion[] = [
  {
    id: 'f1',
    path: ['history', 'f1'],
    fieldLabel: 'Chief complaint',
    sectionLabel: 'History',
    value: 'Red, painful right eye with blurred vision',
    valueLabel: 'Red, painful right eye with blurred vision',
    spanIds: ['p1', 'p3'],
    status: 'pending',
    valueType: 'multiline',
    confidence: highConf,
  },
  {
    id: 'f2',
    path: ['history', 'f2'],
    fieldLabel: 'Duration',
    sectionLabel: 'History',
    value: '3 days',
    valueLabel: '3 days',
    spanIds: ['p2'],
    status: 'pending',
    valueType: 'text',
    confidence: highConf,
  },
  {
    id: 'f3',
    path: ['history', 'f3'],
    fieldLabel: 'Affected eye',
    sectionLabel: 'History',
    value: 'od',
    valueLabel: 'Right eye',
    spanIds: ['p1'],
    status: 'pending',
    valueType: 'select',
    options: [
      { value: 'od', label: 'Right eye' },
      { value: 'os', label: 'Left eye' },
      { value: 'ou', label: 'Both eyes' },
    ],
    confidence: highConf,
  },
  {
    id: 'f4',
    path: ['examination', 'f4'],
    fieldLabel: 'Visual acuity, right, with glasses',
    sectionLabel: 'Examination',
    value: '6/12',
    valueLabel: '6/12',
    spanIds: ['p4'],
    status: 'accepted',
    valueType: 'text',
    confidence: highConf,
  },
  {
    id: 'f5',
    path: ['examination', 'f5'],
    fieldLabel: 'Visual acuity, left, with glasses',
    sectionLabel: 'Examination',
    value: '6/6',
    valueLabel: '6/6',
    spanIds: ['p5'],
    status: 'accepted',
    valueType: 'text',
    confidence: highConf,
  },
  {
    id: 'f6',
    path: ['examination', 'f6'],
    fieldLabel: 'Intraocular pressure, right',
    sectionLabel: 'Examination',
    value: 24,
    valueLabel: '24 mmHg',
    spanIds: ['p6'],
    status: 'pending',
    valueType: 'integer',
    confidence: highConf,
    messages: [
      {
        path: ['examination', 'f6'],
        severity: 'warning',
        message: 'Above the usual reference range. Confirm the reading.',
        source: 'clinical',
      },
    ],
  },
  {
    id: 'f7',
    path: ['examination', 'f7'],
    fieldLabel: 'Intraocular pressure, left',
    sectionLabel: 'Examination',
    value: 15,
    valueLabel: '15 mmHg',
    spanIds: ['p7'],
    status: 'pending',
    valueType: 'integer',
    confidence: highConf,
  },
  {
    id: 'f8',
    path: ['assessment', 'f8'],
    fieldLabel: 'Diagnosis',
    sectionLabel: 'Assessment and plan',
    value: 'bk',
    valueLabel: 'Bacterial keratitis, right eye',
    spanIds: ['p8'],
    status: 'pending',
    valueType: 'select',
    options: [
      { value: 'bk', label: 'Bacterial keratitis, right eye' },
      { value: 'fk', label: 'Fungal keratitis, right eye' },
      { value: 'vk', label: 'Viral keratitis, right eye' },
    ],
    confidence: checkConf,
  },
];

const initialNoteModel: NoteCaptureViewModel = {
  id: 'opd-note',
  title: 'Ophthalmology OPD note',
  dictation: { status: 'idle', label: 'Dictation off', canStart: true, canStop: false },
  segments: opdSegments,
  spans: opdSpans,
  suggestions: opdSuggestions,
  highlightedSpanIds: ['p1'],
  highlightedSuggestionIds: ['f1', 'f3'],
  canSummarise: true,
};

function applyNoteIntent(state: NoteCaptureViewModel, intent: NoteCaptureIntent): NoteCaptureViewModel {
  switch (intent.type) {
    case 'spanSelected': {
      const span = state.spans.find(s => s.id === intent.spanId);
      if (!span) return state;
      const already = state.highlightedSpanIds.length === 1 && state.highlightedSpanIds[0] === intent.spanId;
      return already
        ? { ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] }
        : { ...state, highlightedSpanIds: [intent.spanId], highlightedSuggestionIds: span.suggestionIds };
    }
    case 'suggestionSelected': {
      const sug = state.suggestions.find(s => s.id === intent.suggestionId);
      if (!sug) return state;
      const already =
        state.highlightedSuggestionIds.length === 1 &&
        state.highlightedSuggestionIds[0] === intent.suggestionId;
      return already
        ? { ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] }
        : { ...state, highlightedSuggestionIds: [intent.suggestionId], highlightedSpanIds: sug.spanIds };
    }
    case 'highlightClearRequested':
      return { ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] };
    case 'dictationStartRequested':
      return {
        ...state,
        dictation: { status: 'listening', label: 'Listening', canStart: false, canStop: true },
      };
    case 'dictationStopRequested':
      return {
        ...state,
        dictation: { status: 'idle', label: 'Dictation off', canStart: true, canStop: false },
      };
    case 'textAppendRequested':
      return {
        ...state,
        segments: [
          ...state.segments,
          {
            id: `typed-${state.segments.length + 1}`,
            text: intent.text,
            startMs: null,
            endMs: null,
            source: 'typed',
            timeLabel: '',
            editable: true,
          },
        ],
      };
    case 'segmentEditRequested': {
      const dropped = new Set(
        state.spans.filter(sp => sp.segmentId === intent.segmentId).map(sp => sp.id),
      );
      return {
        ...state,
        segments: state.segments.map(seg =>
          seg.id === intent.segmentId ? { ...seg, text: intent.text } : seg,
        ),
        spans: state.spans.filter(sp => !dropped.has(sp.id)),
        suggestions: state.suggestions.map(s => ({
          ...s,
          spanIds: s.spanIds.filter(id => !dropped.has(id)),
        })),
        highlightedSpanIds: state.highlightedSpanIds.filter(id => !dropped.has(id)),
      };
    }
    case 'suggestionAccepted':
      return {
        ...state,
        suggestions: state.suggestions.map(s =>
          s.id === intent.suggestionId ? { ...s, status: 'accepted' } : s,
        ),
      };
    case 'suggestionRejected':
      return {
        ...state,
        suggestions: state.suggestions.map(s =>
          s.id === intent.suggestionId ? { ...s, status: 'rejected' } : s,
        ),
      };
    case 'suggestionReopened':
      return {
        ...state,
        suggestions: state.suggestions.map(s =>
          s.id === intent.suggestionId
            ? { ...s, status: 'pending', editedValue: undefined, editedValueLabel: undefined }
            : s,
        ),
      };
    case 'suggestionEdited':
      return {
        ...state,
        suggestions: state.suggestions.map(s => {
          if (s.id !== intent.suggestionId) return s;
          const opt = s.options?.find(o => o.value === intent.value);
          const label = opt ? opt.label : String(intent.value);
          return {
            ...s,
            status: 'edited',
            editedValue: intent.value,
            editedValueLabel: label,
          };
        }),
      };
    case 'acceptAllPendingRequested':
      return {
        ...state,
        suggestions: state.suggestions.map(s =>
          s.status === 'pending' ? { ...s, status: 'accepted' } : s,
        ),
      };
    default:
      return state;
  }
}

function NoteCapturePairDemo() {
  const [model, setModel] = useState(initialNoteModel);
  const onIntent = (intent: NoteCaptureIntent) => setModel(m => applyNoteIntent(m, intent));
  return (
    <EmrColumns count={2} collapseBelow={760}>
      <View>
        <EmrClinicalTranscript model={model} onIntent={onIntent} />
      </View>
      <View>
        <EmrEvidenceSuggestionList model={model} onIntent={onIntent} />
      </View>
    </EmrColumns>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'flowsheet-vitals',
    title: 'EmrObservationFlowsheet — vital signs',
    render: () => <FlowsheetDemo initial={initialVitals} />,
  },
  {
    id: 'flowsheet-labs',
    title: 'EmrObservationFlowsheet — cumulative labs with reference range',
    render: () => <FlowsheetDemo initial={initialLabs} />,
  },
  {
    id: 'flowsheet-fluid',
    title: 'EmrObservationFlowsheet — fluid balance with totals',
    render: () => <FlowsheetDemo initial={initialFluid} />,
  },
  {
    id: 'trend-bp',
    title: 'EmrObservationTrend — blood pressure with target bands',
    render: () => <TrendDemo initial={initialBpTrend} />,
  },
  {
    id: 'trend-iop',
    title: 'EmrObservationTrend — intraocular pressure (OD & OS)',
    render: () => <TrendDemo initial={initialIopTrend} />,
  },
  {
    id: 'note-capture-coupled',
    title: 'EmrClinicalTranscript + EmrEvidenceSuggestionList — evidence-linked note capture',
    render: () => <NoteCapturePairDemo />,
  },
];
