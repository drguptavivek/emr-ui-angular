'use client';

import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ClinicalMatrixController } from '@drguptavivek/emr-controller';
import type { ClinicalCellState, ClinicalListIntent, ClinicalListItem, ClinicalMatrixSchema, ClinicalMatrixValues } from '@drguptavivek/emr-controller';
import {
  EmrAllergyList, EmrChronicDiseaseList, EmrClinicalList, EmrClinicalMatrix, EmrMedicationList, EmrPersonalHistoryList,
  type EmrMatrixCellRendererProps,
} from '../../src/l3-structures';
import { EmrButton } from '../../src/primitives';
import { useControllerState } from '../../src/use-controller';
import type { GallerySection } from './types';

const stack = { gap: 16 } as const;

const seed: ClinicalListItem[] = [
  { id: 'm1', title: 'Metformin 500 mg', subtitle: 'Twice daily', detail: 'Since 2021', badges: [{ label: 'Active', tone: 'success' }] },
  { id: 'm2', title: 'Amlodipine 5 mg', subtitle: 'Once daily', badges: [{ label: 'Review due', tone: 'warning' }] },
  { id: 'm3', title: 'Aspirin 75 mg', subtitle: 'Recorded elsewhere', readOnly: true, badges: [{ label: 'Read-only', tone: 'neutral' }] },
];

/** A list kept in local state; the "controller" here only reacts to intents. */
function ListDemo({ Component, empty }: { Component: typeof EmrClinicalList; empty?: boolean }) {
  const [items, setItems] = useState<ClinicalListItem[]>(empty ? [] : seed);
  const [last, setLast] = useState('none');
  const onIntent = (intent: ClinicalListIntent) => {
    setLast(JSON.stringify(intent));
    if (intent.type === 'removeRequested') setItems(list => list.filter(item => item.id !== intent.id));
    if (intent.type === 'addRequested') setItems(list => [...list, { id: `n${list.length}`, title: `New entry ${list.length + 1}` }]);
  };
  return (
    <View style={{ gap: 8 }}>
      <Component model={{ items, emptyMessage: 'Nothing recorded (not yet asked).' }} onIntent={onIntent} />
      <Text>{`Last intent: ${last}`}</Text>
    </View>
  );
}

const statusOptions = [
  { value: 'recorded' as const, label: 'Recorded', tone: 'success' as const },
  { value: 'not-assessed' as const, label: 'Not assessed', tone: 'neutral' as const },
  { value: 'unable-to-assess' as const, label: 'Unable to assess', tone: 'warning' as const },
  { value: 'declined' as const, label: 'Declined', tone: 'info' as const },
];

const schema: ClinicalMatrixSchema = {
  id: 'demo-matrix',
  label: 'Eye examination (synthetic)',
  columnGroups: [{ id: 'g', label: 'Eye', columnIds: ['od', 'os'] }],
  columns: [{ id: 'od', label: 'Right' }, { id: 'os', label: 'Left' }],
  rows: [
    { id: 'va', label: 'Visual acuity', type: 'select', options: [{ value: '6/6', label: '6/6' }, { value: '6/12', label: '6/12' }, { value: '6/60', label: '6/60' }], assessmentStatusOptions: statusOptions },
    { id: 'iop', label: 'IOP', type: 'quantity', unit: 'mmHg' },
    { id: 'age', label: 'Age at onset', type: 'integer', unit: 'years', applicableColumnIds: ['od'] },
    { id: 'cdr', label: 'Cup disc ratio', type: 'decimal', helpText: 'Vertical' },
    { id: 'seen', label: 'Seen before', type: 'boolean' },
    { id: 'date', label: 'Last review', type: 'date' },
    { id: 'note', label: 'Free text', type: 'text' },
    { id: 'mark', label: 'Marker', type: 'custom', customRendererKey: 'marker' },
    { id: 'gone', label: 'Unregistered', type: 'custom', customRendererKey: 'missing' },
  ],
};

const cell = (value: ClinicalCellState['value'], extra: Partial<ClinicalCellState> = {}): ClinicalCellState => ({ value, ...extra });
const seedValues: ClinicalMatrixValues = {
  va: { remark: 'Without glasses', cells: { od: cell('6/12'), os: cell(null, { assessmentStatus: { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' } }) } },
  iop: { remark: '', cells: { od: cell({ value: 14, unit: 'mmHg' }), os: cell({ value: 31, unit: 'mmHg' }, { error: 'Outside the controller range 10-21.' }) } },
  age: { remark: '', cells: { od: cell(54), os: cell(null) } },
  cdr: { remark: '', cells: { od: cell(0.4, { warning: 'Asymmetric between eyes.' }), os: cell(0.7) } },
  seen: { remark: '', cells: { od: cell(false), os: cell(null) } },
  date: { remark: '', remarkError: 'Remark is required.', cells: { od: cell('2026-03-02'), os: cell('') } },
  note: { remark: 'Locked remark', remarkReadOnly: true, cells: { od: cell('Editable'), os: cell('Cell read-only', { readOnly: true }) } },
  mark: { remark: '', cells: { od: cell(null), os: cell(null) } },
  gone: { remark: '', remarkDisabled: true, cells: { od: cell(null, { disabled: true }), os: cell(null) } },
};

function Marker({ row, column, emit }: EmrMatrixCellRendererProps) {
  return <EmrButton small variant="outline" label={`Mark ${column.label}`} accessibilityLabel={`Mark ${row.label}, ${column.label}`} onPress={() => emit('mark', { column: column.id })} />;
}

function MatrixDemo({ readOnly, narrow }: { readOnly?: boolean; narrow?: boolean }) {
  const controller = useMemo(() => new ClinicalMatrixController(schema, seedValues), []);
  const state = useControllerState(controller);
  return (
    <View style={{ gap: 8, width: narrow ? 360 : undefined, maxWidth: '100%' }}>
      <EmrClinicalMatrix definition={state.schema} model={state.values} readOnly={readOnly} idPrefix={narrow ? 'narrow' : readOnly ? 'ro' : 'live'}
        customRenderers={{ marker: Marker }} onIntent={intent => controller.dispatch(intent)} />
      <Text>{state.lastExternalIntent ? `Last external intent: ${JSON.stringify(state.lastExternalIntent)}` : 'No external intent yet'}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'clinical-list', title: 'EmrClinicalList', render: () => (
    <View style={stack}><ListDemo Component={EmrClinicalList} /><ListDemo Component={EmrClinicalList} empty /></View>
  ) },
  { id: 'medication-list', title: 'EmrMedicationList', render: () => <ListDemo Component={EmrMedicationList} /> },
  { id: 'allergy-list', title: 'EmrAllergyList (empty)', render: () => <ListDemo Component={EmrAllergyList} empty /> },
  { id: 'chronic-disease-list', title: 'EmrChronicDiseaseList', render: () => <ListDemo Component={EmrChronicDiseaseList} /> },
  { id: 'personal-history-list', title: 'EmrPersonalHistoryList', render: () => <ListDemo Component={EmrPersonalHistoryList} /> },
  { id: 'clinical-matrix', title: 'EmrClinicalMatrix (live, error and warning cells)', render: () => <MatrixDemo /> },
  { id: 'clinical-matrix-narrow', title: 'EmrClinicalMatrix (narrow, cards)', render: () => <MatrixDemo narrow /> },
  { id: 'clinical-matrix-readonly', title: 'EmrClinicalMatrix (read-only)', render: () => <MatrixDemo readOnly /> },
  { id: 'clinical-matrix-empty', title: 'EmrClinicalMatrix (no values)', render: () => (
    <EmrClinicalMatrix definition={{ ...schema, id: 'empty-matrix', rows: schema.rows.slice(0, 2) }} onIntent={() => {}} />
  ) },
];
