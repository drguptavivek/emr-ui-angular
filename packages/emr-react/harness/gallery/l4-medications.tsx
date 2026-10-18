'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  DoseScheduleViewModel,
  DoseSlot,
  EmrBadge,
  EmrOption,
  MedicationReconciliationViewModel,
  ReconMedication,
  ReconRow,
  ScoreResultCardViewModel,
} from '@drguptavivek/emr-controller';
import { EmrDoseSchedule, EmrMedicationReconciliation, EmrScoreResultCard } from '../../src/l4-medications';
import { fontFamily, useEmrTheme } from '../../src/theme';
import type { GallerySection } from './types';

// ---------------------------------------------------------------------------
// Synthetic Score Result Card data
// ---------------------------------------------------------------------------

const news2Model: ScoreResultCardViewModel = {
  id: 'news2',
  instrumentLabel: 'NEWS2 early warning score',
  result: {
    total: 7,
    bandLabel: 'High clinical risk',
    bandTone: 'danger',
    interpretation: 'Emergency assessment by a critical-care competent team. Consider transfer to a higher level of care.',
    computedAt: '2026-03-14T09:42:00Z',
    components: [
      { id: 'resp', label: 'Respiration rate', value: 2 },
      { id: 'spo2', label: 'SpO2 (scale 1)', value: 1 },
      { id: 'air', label: 'Air or oxygen', value: 2 },
      { id: 'sbp', label: 'Systolic blood pressure', value: 1 },
      { id: 'pulse', label: 'Pulse', value: 0 },
      { id: 'cons', label: 'Consciousness', value: 0 },
      { id: 'temp', label: 'Temperature', value: 1 },
    ],
  },
  canRecompute: true,
  canViewDetail: true,
};

const phq9Items = [
  'Little interest or pleasure',
  'Feeling down or hopeless',
  'Sleep problems',
  'Tired or little energy',
  'Appetite changes',
  'Feeling bad about yourself',
  'Trouble concentrating',
  'Slowed or restless',
  'Thoughts of self-harm',
];

const phq9Model: ScoreResultCardViewModel = {
  id: 'phq9',
  instrumentLabel: 'PHQ-9 depression screen',
  result: {
    total: 12,
    bandLabel: 'Moderate depression',
    bandTone: 'warning',
    interpretation: 'Review the patient for treatment planning. Item 9 is scored 1, so ask about safety before the visit ends.',
    computedAt: '2026-03-14T10:05:00Z',
    components: phq9Items.map((label, i) => ({
      id: `q${i + 1}`,
      label: `${i + 1}. ${label}`,
      value: [1, 2, 1, 2, 1, 2, 1, 1, 1][i]!,
    })),
  },
  canRecompute: true,
  canViewDetail: true,
};

function ScoreCardDemo({ initial }: { initial: ScoreResultCardViewModel }) {
  const t = useEmrTheme();
  const [model, setModel] = useState(initial);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <EmrScoreResultCard
        model={model}
        onIntent={(intent) => {
          setLastIntent(JSON.stringify(intent));
          if (intent.type === 'recomputeRequested') {
            setModel((curr) => ({ ...curr, stale: false, staleLabel: undefined }));
          }
        }}
      />
      {lastIntent ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
          Intent: {lastIntent}
        </Text>
      ) : null}
    </View>
  );
}

function ScoreCardCompactDemo() {
  return (
    <View style={{ gap: 8 }}>
      <EmrScoreResultCard model={{ ...news2Model, compact: true }} />
      <EmrScoreResultCard model={{ ...phq9Model, compact: true }} />
      <EmrScoreResultCard
        model={{
          ...news2Model,
          instrumentLabel: 'NEWS2 (previous set of observations)',
          compact: true,
          stale: true,
          staleLabel: 'Inputs changed',
          canViewDetail: false,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Synthetic Dose Schedule data
// ---------------------------------------------------------------------------

const slot = (id: string, label: string, amount: number | null, extra: Partial<DoseSlot> = {}): DoseSlot => ({
  id,
  label,
  amount,
  ...extra,
});

const mna = (m: number | null, a: number | null, n: number | null): DoseSlot[] => [
  slot('m', 'Morning', m, { timeHint: '8 am' }),
  slot('a', 'Afternoon', a, { timeHint: '2 pm' }),
  slot('n', 'Night', n, { timeHint: '9 pm' }),
];

const tabletBdModel: DoseScheduleViewModel = {
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: { one: 'tablet', other: 'tablets' },
  frequency: { code: 'BD', label: 'Twice daily' },
  slots: mna(1, null, 1),
  route: 'By mouth',
  foodRelation: 'After food',
  duration: '5 days',
  startLabel: 'Starts today',
  canEdit: true,
  canShowInstructions: true,
};

const eyeDropTaperModel: DoseScheduleViewModel = {
  medication: { label: 'Prednisolone acetate', strength: '1%', formLabel: 'Eye drops', form: 'drop' },
  unit: { one: 'drop', other: 'drops' },
  frequency: { label: 'Reducing over 5 weeks' },
  slots: [],
  site: { code: 'OD', label: 'Right eye' },
  taper: [
    { id: 'w1', periodLabel: 'Week 1', frequencyLabel: '6 times daily' },
    { id: 'w2', periodLabel: 'Week 2', frequencyLabel: '4 times daily' },
    { id: 'w3', periodLabel: 'Week 3', frequencyLabel: '3 times daily' },
    { id: 'w4', periodLabel: 'Week 4', frequencyLabel: '2 times daily' },
    { id: 'w5', periodLabel: 'Week 5', frequencyLabel: 'Once daily, then stop' },
  ],
  separationNote: 'Shake the bottle well. Wait 5 minutes between different eye drops.',
  instructions: ['One drop each time.'],
};

const prnModel: DoseScheduleViewModel = {
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: { one: 'tablet', other: 'tablets' },
  frequency: { code: 'SOS', label: 'Only when needed' },
  slots: [slot('dose', 'Each dose', 1)],
  prn: { label: 'Take only if you have pain or fever', maxLabel: 'No more than 4 tablets in 24 hours' },
  route: 'By mouth',
};

function DoseScheduleDemo({ model }: { model: DoseScheduleViewModel }) {
  const t = useEmrTheme();
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <EmrDoseSchedule model={model} onIntent={(i) => setLastIntent(i.type)} />
      {lastIntent ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
          Intent: {lastIntent}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Synthetic Medication Reconciliation data
// ---------------------------------------------------------------------------

const reconOptions: EmrOption[] = [
  { value: 'continue', label: 'Continue' },
  { value: 'modify', label: 'Modify' },
  { value: 'stop', label: 'Stop' },
  { value: 'new', label: 'New' },
  { value: 'unmatched', label: 'Unmatched' },
];

const patientReported: EmrBadge = { label: 'Patient reported', tone: 'info' };
const pharmacyList: EmrBadge = { label: 'Pharmacy list', tone: 'neutral' };
const wardOrder: EmrBadge = { label: 'Ward order', tone: 'success' };
const admissionOrder: EmrBadge = { label: 'Admission order', tone: 'success' };

const med = (id: string, nameLabel: string, doseSummary: string, extra: Partial<ReconMedication> = {}): ReconMedication => ({
  id,
  nameLabel,
  doseSummary,
  ...extra,
});

const makeRow = (id: string, extra: Partial<ReconRow> = {}): ReconRow => ({
  id,
  path: ['medications', id],
  decisionOptions: reconOptions,
  ...extra,
});

const admissionReconModel: MedicationReconciliationViewModel = {
  id: 'recon-admission',
  title: 'Admission medicine reconciliation',
  leftLabel: 'Home list',
  rightLabel: 'Current orders',
  rows: [
    makeRow('r1', {
      left: med('h1', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', {
        lastTakenLabel: 'today, 8 am',
        badges: [pharmacyList],
      }),
      right: med('o1', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', {
        badges: [admissionOrder],
      }),
      decision: 'continue',
    }),
    makeRow('r2', {
      left: med('h2', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', {
        lastTakenLabel: 'today, 8 am',
        badges: [patientReported],
      }),
      right: med('o2', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', {
        badges: [wardOrder],
      }),
      decision: 'continue',
    }),
    makeRow('r3', {
      left: med('h3', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', {
        lastTakenLabel: 'yesterday, 9 pm',
        badges: [patientReported],
      }),
      right: med('o3', 'Atorvastatin 40 mg tablet', '1 tablet once daily (OD), at night', {
        badges: [admissionOrder],
      }),
      decision: 'modify',
      reasonRequired: true,
      reason: 'Dose increased after acute coronary syndrome protocol.',
    }),
    makeRow('r4', {
      left: med('h4', 'Timolol 0.5% eye drops', '1 drop in both eyes (OU) twice daily (BD)', {
        lastTakenLabel: 'today, 8 am',
        badges: [patientReported],
      }),
    }),
  ],
  selectedRowId: 'r3',
  summary: [
    { label: '2 continue', tone: 'success' },
    { label: '1 modify', tone: 'warning' },
    { label: '1 not decided', tone: 'neutral', assistiveText: 'Still needs a decision' },
  ],
  emptyMessage: 'No medicines on either list.',
  canComplete: false,
};

const reasonRequiredReconModel: MedicationReconciliationViewModel = {
  id: 'recon-reason',
  title: 'Admission medicine reconciliation',
  leftLabel: 'Home list',
  rightLabel: 'Current orders',
  rows: [
    makeRow('e1', {
      left: med('h1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [patientReported] }),
      right: med('o1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [admissionOrder] }),
      decision: 'continue',
    }),
    makeRow('e2', {
      left: med('h2', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', { badges: [pharmacyList] }),
      decision: 'stop',
      reasonRequired: true,
      messages: [{ path: ['medications', 'e2', 'reason'], severity: 'error', message: 'Give a reason for stopping this medicine.' }],
    }),
    makeRow('e3', {
      left: med('h3', 'Losartan 50 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [patientReported] }),
      right: med('o3', 'Losartan 25 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [admissionOrder] }),
      decision: 'modify',
      reasonRequired: true,
      reason: 'Lower dose while kidney function is rechecked.',
      messages: [{ path: ['medications', 'e3'], severity: 'warning', message: 'Dose differs between the two lists.' }],
    }),
  ],
  summary: [
    { label: '1 continue', tone: 'success' },
    { label: '1 stop', tone: 'danger' },
    { label: '1 modify', tone: 'warning' },
    { label: '1 needs a reason', tone: 'danger' },
  ],
  emptyMessage: 'No medicines on either list.',
  canComplete: false,
};

const readOnlyReconModel: MedicationReconciliationViewModel = {
  ...admissionReconModel,
  id: 'recon-readonly',
  readOnly: true,
  rows: admissionReconModel.rows.slice(0, 3),
  summary: [{ label: 'Completed', tone: 'success' }],
  canComplete: true,
};

function ReconDemo({ initial }: { initial: MedicationReconciliationViewModel }) {
  const [model, setModel] = useState(initial);
  return (
    <EmrMedicationReconciliation
      model={model}
      onIntent={(intent) => {
        if (intent.type === 'rowSelected') {
          setModel((curr) => ({ ...curr, selectedRowId: intent.rowId }));
        } else if (intent.type === 'decisionChangeRequested') {
          const rowId = String(intent.path[intent.path.length - 1]);
          setModel((curr) => ({
            ...curr,
            rows: curr.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    decision: intent.decision,
                    reasonRequired: intent.decision === 'stop' || intent.decision === 'modify',
                  }
                : r,
            ),
          }));
        } else if (intent.type === 'reasonChangeRequested') {
          const rowId = String(intent.path[intent.path.length - 1]);
          setModel((curr) => ({
            ...curr,
            rows: curr.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    reason: intent.reason,
                    messages: intent.reason.trim() ? [] : r.messages,
                  }
                : r,
            ),
          }));
        }
      }}
    />
  );
}

export const gallery: GallerySection[] = [
  { id: 'score-card-ews', title: 'EmrScoreResultCard · NEWS2 EWS', render: () => <ScoreCardDemo initial={news2Model} /> },
  { id: 'score-card-phq9', title: 'EmrScoreResultCard · PHQ-9', render: () => <ScoreCardDemo initial={phq9Model} /> },
  { id: 'score-card-compact', title: 'EmrScoreResultCard · Compact', render: () => <ScoreCardCompactDemo /> },
  {
    id: 'score-card-stale',
    title: 'EmrScoreResultCard · Stale',
    render: () => <ScoreCardDemo initial={{ ...phq9Model, stale: true, staleLabel: 'Answers changed since this score was calculated' }} />,
  },
  { id: 'dose-schedule-bd', title: 'EmrDoseSchedule · Tablet twice daily (BD)', render: () => <DoseScheduleDemo model={tabletBdModel} /> },
  { id: 'dose-schedule-taper', title: 'EmrDoseSchedule · Eye-drop taper', render: () => <DoseScheduleDemo model={eyeDropTaperModel} /> },
  { id: 'dose-schedule-prn', title: 'EmrDoseSchedule · As needed (PRN)', render: () => <DoseScheduleDemo model={prnModel} /> },
  { id: 'med-recon-admission', title: 'EmrMedicationReconciliation · Admission', render: () => <ReconDemo initial={admissionReconModel} /> },
  { id: 'med-recon-reason-error', title: 'EmrMedicationReconciliation · Reason required error', render: () => <ReconDemo initial={reasonRequiredReconModel} /> },
  { id: 'med-recon-readonly', title: 'EmrMedicationReconciliation · Read-only', render: () => <ReconDemo initial={readOnlyReconModel} /> },
];
