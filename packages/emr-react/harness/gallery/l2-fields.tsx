'use client';

import { useState } from 'react';
import { View } from 'react-native';
import type {
  ClinicalAssessmentStatusOption,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  EmrCodedValue,
  EmrFieldDefinition,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
  TerminologyBinding,
} from '@drguptavivek/emr-controller';
import { EmrCodedInput, EmrScheduleSlotPicker } from '../../src/l2-fields';
import type { GallerySection } from './types';

const SNOMED = 'http://snomed.info/sct';
const ICD10 = 'http://hl7.org/fhir/sid/icd-10';
const LOINC = 'http://loinc.org';
const systemLabels = { [SNOMED]: 'SNOMED CT', [ICD10]: 'ICD-10', [LOINC]: 'LOINC' };

const concept = (system: string, code: string, display: string): EmrCodedValue => ({ system, code, display });
const poag = concept(SNOMED, '77075001', 'Primary open-angle glaucoma');
const t2dm = concept(SNOMED, '44054006', 'Type 2 diabetes mellitus');
const cataract = concept(SNOMED, '193570009', 'Cataract');
const senileCataract = concept(SNOMED, '53889007', 'Senile cataract');
const dr = concept(SNOMED, '4855003', 'Diabetic retinopathy');
const h4011 = concept(ICD10, 'H40.11', 'Primary open-angle glaucoma');
const e119 = concept(ICD10, 'E11.9', 'Type 2 diabetes mellitus without complications');
const iop = concept(LOINC, '56844-4', 'Intraocular pressure of Eye');
const hba1c = concept(LOINC, '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood');

const catalog: readonly EmrCodedValue[] = [poag, t2dm, cataract, senileCataract, dr, h4011, e119, iop, hba1c];

const statusOptions: ClinicalAssessmentStatusOption[] = [
  { value: 'recorded', label: 'Recorded', tone: 'success' },
  { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
  { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
  { value: 'declined', label: 'Declined', tone: 'info' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' },
];

const binding = (canonical: string): TerminologyBinding => ({
  id: 'b1',
  role: 'answer-value-set',
  valueSetCanonical: canonical,
  strength: 'preferred',
});

const codedDefinition = (
  label: string,
  max: number | null,
  canonical: string,
  extra: Partial<EmrFieldDefinition['presentation']> = {},
  min = 0,
): EmrFieldDefinition => ({
  schemaVersion: '1.0',
  contract: {
    linkId: 'coded',
    valueType: 'coded',
    cardinality: { min, max },
    terminology: [binding(canonical)],
    validation: [],
  },
  presentation: { label, assessmentStatusOptions: statusOptions, ...extra },
});

const baseCodedModel = (over: Partial<CodedInputViewModel> = {}): CodedInputViewModel => ({
  definition: codedDefinition('Primary diagnosis', 1, 'http://snomed.info/sct?fhir_vs=isa/404684003', {
    hint: 'Search the clinical findings value set.',
  }),
  value: null,
  query: '',
  options: [],
  open: false,
  loading: false,
  messages: [],
  emptyMessage: 'No matching concepts',
  systemLabels,
  ...over,
});

function reduceCodedIntent(model: CodedInputViewModel, intent: CodedInputIntent): CodedInputViewModel {
  const max = model.definition.contract.cardinality.max;
  switch (intent.type) {
    case 'queryChangeRequested': {
      const q = intent.query.trim().toLowerCase();
      const options = q
        ? catalog.filter(c => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : catalog.slice(0, 5);
      return { ...model, query: intent.query, options, open: true };
    }
    case 'searchRequested': {
      const q = intent.query.trim().toLowerCase();
      const options = q
        ? catalog.filter(c => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : catalog.slice(0, 5);
      return { ...model, options, open: true, loading: false };
    }
    case 'openRequested':
      return { ...model, open: true, options: model.options.length ? model.options : catalog.slice(0, 5) };
    case 'closeRequested':
      return { ...model, open: false };
    case 'conceptSelected': {
      if (max === 1) {
        return { ...model, value: intent.concept, open: false, query: '' };
      }
      const list = model.value === null ? [] : Array.isArray(model.value) ? [...model.value] : [model.value as EmrCodedValue];
      const exists = list.some(c => c.system === intent.concept.system && c.code === intent.concept.code);
      const next = exists
        ? list.filter(c => !(c.system === intent.concept.system && c.code === intent.concept.code))
        : [...list, intent.concept];
      return { ...model, value: next };
    }
    case 'conceptRemoveRequested': {
      if (max === 1) {
        return { ...model, value: null };
      }
      const list = model.value === null ? [] : Array.isArray(model.value) ? [...model.value] : [model.value as EmrCodedValue];
      return {
        ...model,
        value: list.filter(c => !(c.system === intent.system && c.code === intent.code)),
      };
    }
    case 'statusChangeRequested':
      return { ...model, status: intent.status };
  }
}

function CodedInputDemo() {
  const [single, setSingle] = useState<CodedInputViewModel>(() => baseCodedModel({ value: poag }));
  const [multi, setMulti] = useState<CodedInputViewModel>(() =>
    baseCodedModel({
      definition: codedDefinition('Diagnoses', null, 'http://hl7.org/fhir/ValueSet/icd-10', {
        hint: 'Add every diagnosis that applies.',
      }),
      value: [h4011, e119, cataract, t2dm],
    }),
  );
  const [withError, setWithError] = useState<CodedInputViewModel>(() =>
    baseCodedModel({
      definition: codedDefinition('Primary diagnosis', 1, 'http://snomed.info/sct?fhir_vs=isa/404684003', {}, 1),
      messages: [
        { path: ['coded'], severity: 'error', message: 'A primary diagnosis is required.', source: 'mechanical' },
        { path: ['coded'], severity: 'warning', message: 'Choose the most specific concept available.', source: 'terminology' },
      ],
    }),
  );

  return (
    <View style={{ gap: 16 }}>
      <EmrCodedInput model={single} onIntent={intent => setSingle(m => reduceCodedIntent(m, intent))} />
      <EmrCodedInput model={multi} onIntent={intent => setMulti(m => reduceCodedIntent(m, intent))} />
      <EmrCodedInput model={withError} onIntent={intent => setWithError(m => reduceCodedIntent(m, intent))} />
      <EmrCodedInput
        model={baseCodedModel({
          definition: codedDefinition('Diagnoses (read-only)', null, 'http://hl7.org/fhir/ValueSet/icd-10'),
          value: [h4011, e119],
          readOnly: true,
        })}
        onIntent={() => {}}
      />
    </View>
  );
}

const fourSlots: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon', timeHint: '2 pm' },
  { id: 'e', label: 'Evening', timeHint: '6 pm' },
  { id: 'n', label: 'Night', timeHint: '10 pm' },
];

const slotPresets: ScheduleSlotPreset[] = [
  { id: 'od', label: 'Once daily (OD)', slotIds: ['m'] },
  { id: 'bd', label: 'Twice daily (BD)', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'Three times daily (TDS)', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'Four times daily (QID)', slotIds: ['m', 'a', 'e', 'n'] },
];

const initialBd: DoseSlot[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am', amount: 1 },
  { id: 'n', label: 'Night', timeHint: '10 pm', amount: 1 },
];

function ScheduleSlotPickerDemo() {
  const [bdValue, setBdValue] = useState<readonly DoseSlot[] | null>(initialBd);
  const [labelValue, setLabelValue] = useState<readonly DoseSlot[] | null>([
    { id: 'n', label: 'Night', timeHint: '10 pm', amount: null, amountLabel: '1 cm ribbon' },
  ]);
  const [errValue, setErrValue] = useState<readonly DoseSlot[] | null>(null);

  return (
    <View style={{ gap: 16 }}>
      <EmrScheduleSlotPicker
        controlId="slots-presets"
        label="When to take"
        hint="Tick each time of day the dose is taken."
        slots={fourSlots}
        presets={slotPresets}
        unitLabel="tablets"
        value={bdValue}
        onValueChange={setBdValue}
      />
      <EmrScheduleSlotPicker
        controlId="slots-labels"
        label="Apply ointment"
        slots={fourSlots.filter(s => s.id !== 'a')}
        amountMode="label"
        defaultAmountLabel="thin layer"
        value={labelValue}
        onValueChange={setLabelValue}
      />
      <EmrScheduleSlotPicker
        controlId="slots-readonly"
        label="When to take (read-only)"
        readOnly
        slots={fourSlots}
        unitLabel="tablets"
        value={initialBd}
        onValueChange={() => {}}
      />
      <EmrScheduleSlotPicker
        controlId="slots-error"
        label="When to take (required)"
        required
        error={errValue?.length ? undefined : 'Select at least one time of day.'}
        slots={fourSlots}
        presets={slotPresets}
        unitLabel="tablets"
        value={errValue}
        onValueChange={setErrValue}
      />
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'coded-input', title: 'EmrCodedInput', render: CodedInputDemo },
  { id: 'schedule-slot-picker', title: 'EmrScheduleSlotPicker', render: ScheduleSlotPickerDemo },
];
