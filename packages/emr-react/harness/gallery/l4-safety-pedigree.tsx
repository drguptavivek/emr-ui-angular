'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  ClinicalFormViewModel,
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  PacChecklistIntent,
  PacChecklistViewModel,
  StagedChecklistIntent,
  StagedChecklistViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrFamilyPedigree,
  EmrPacChecklist,
  EmrStagedChecklist,
  reduceFamilyPedigreeIntent,
  reduceStagedChecklistIntent,
} from '../../src/l4-safety-pedigree';
import type { GallerySection } from './types';

// ---- Synthetic fixtures ported from Storybook stories ------------------------------------------

const syntheticChecklist: StagedChecklistViewModel = {
  instanceId: 'illustrative-checklist-001',
  schema: {
    id: 'illustrative-surgical-safety',
    label: 'Illustrative surgical safety checklist',
    description: 'Synthetic demo based on the WHO Surgical Safety Checklist. Adapt locally with the responsible clinical team.',
    phases: [
      {
        id: 'sign-in',
        label: 'Sign In',
        description: 'Before induction of anaesthesia',
        items: [
          { id: 'patient-identity', label: 'Patient identity, site and procedure confirmed', type: 'checkbox', required: true },
          { id: 'allergy-status', label: 'Allergy status reviewed', type: 'yes-no-na', required: true },
          { id: 'equipment', label: 'Anaesthesia and pulse oximeter checks complete', type: 'checkbox', required: true },
          {
            id: 'procedure-type',
            label: 'Procedure category',
            type: 'select',
            options: [
              { value: 'planned', label: 'Planned procedure' },
              { value: 'restricted', label: 'Restricted by controller', disabled: true },
            ],
          },
        ],
      },
      {
        id: 'time-out',
        label: 'Time Out',
        description: 'Before skin incision',
        items: [
          { id: 'team-introduced', label: 'Team members introduced themselves by name and role', type: 'checkbox', required: true },
          { id: 'anticipated-events', label: 'Anticipated critical events discussed', type: 'yes-no', required: true, requiresNoteWhen: ['yes'] },
          { id: 'prophylaxis', label: 'Antibiotic prophylaxis confirmed where indicated', type: 'yes-no-na', required: true },
        ],
      },
      {
        id: 'sign-out',
        label: 'Sign Out',
        description: 'Before the team leaves the operating room',
        items: [
          { id: 'procedure-recorded', label: 'Procedure name recorded', type: 'checkbox', required: true },
          { id: 'counts', label: 'Instrument, sponge and needle counts complete', type: 'yes-no-na', required: true },
          { id: 'recovery-plan', label: 'Recovery and postoperative management plan reviewed', type: 'text', required: true },
        ],
      },
    ],
  },
  items: {
    'patient-identity': { value: true },
    'allergy-status': { value: 'yes' },
    equipment: { value: true },
    'procedure-type': { value: null },
    'team-introduced': { value: false },
    'anticipated-events': { value: null },
    prophylaxis: { value: null },
    'procedure-recorded': { value: null },
    counts: { value: null },
    'recovery-plan': { value: null },
  },
  activePhaseId: 'sign-in',
  signoffs: {
    'sign-in': { displayName: 'Synthetic Reviewer', roleLabel: 'Reviewer', signedAtLabel: '19 Aug 2026, 09:30' },
  },
};

const pacForm: ClinicalFormViewModel = {
  schema: {
    id: 'pac-form',
    label: 'Pre-operative assessment',
    description: 'Capture the supplied assessment information for review.',
    sections: [
      {
        id: 'context',
        label: 'Context',
        blocks: [
          { id: 'procedure', label: 'Planned procedure', type: 'text', span: 6, required: true },
          {
            id: 'anaesthesia-plan',
            label: 'Planned anaesthesia',
            type: 'select',
            span: 6,
            options: [
              { value: 'general', label: 'General' },
              { value: 'regional', label: 'Regional' },
              { value: 'local', label: 'Local' },
            ],
          },
        ],
      },
      {
        id: 'history',
        label: 'History, medications and allergies',
        blocks: [
          { id: 'medical-history', label: 'Relevant medical history', type: 'multiline', span: 12, rows: 3 },
          { id: 'medications', label: 'Current medications', type: 'multiline', span: 6, rows: 3 },
          { id: 'allergies', label: 'Allergies and reactions', type: 'multiline', span: 6, rows: 3 },
          { id: 'prior-anaesthesia', label: 'Prior anaesthesia experience', type: 'multiline', span: 12, rows: 3 },
        ],
      },
      {
        id: 'examination',
        label: 'Examination and airway',
        blocks: [
          { id: 'airway', label: 'Airway observations', type: 'multiline', span: 6, rows: 3 },
          { id: 'examination', label: 'Examination findings', type: 'multiline', span: 6, rows: 3 },
          { id: 'vitals', label: 'Vital signs / other observations', type: 'multiline', span: 12, rows: 3 },
        ],
      },
      {
        id: 'investigations',
        label: 'Investigations',
        blocks: [{ id: 'investigations', label: 'Available investigations and reports', type: 'multiline', span: 12, rows: 4 }],
      },
      {
        id: 'plan',
        label: 'Plan, instructions and review',
        blocks: [
          { id: 'plan', label: 'Plan and instructions', type: 'multiline', span: 12, rows: 4 },
          { id: 'review', label: 'Review / follow-up notes', type: 'multiline', span: 12, rows: 3 },
        ],
      },
    ],
  },
  fields: {
    procedure: { value: 'Cataract extraction' },
    'anaesthesia-plan': { value: 'local' },
    'medical-history': { value: 'History supplied by patient.' },
    medications: { value: null },
    allergies: { value: 'No allergy information supplied in this example.' },
    'prior-anaesthesia': { value: null },
    airway: { value: null },
    examination: { value: null },
    vitals: { value: null },
    investigations: { value: null },
    plan: { value: null },
    review: { value: null },
  },
  repeatableGroups: {},
};

const pacBase: PacChecklistViewModel = {
  instanceId: 'pac-demo-1',
  title: 'Pre-anaesthesia checklist',
  description: 'A reusable, controller-backed PAC assessment surface. It records supplied information without deriving fitness or clearance.',
  context: [
    { id: 'patient', label: 'Patient', value: 'Ananya Rao · MRN-204881' },
    { id: 'procedure-context', label: 'Procedure', value: 'Cataract extraction' },
    { id: 'encounter', label: 'Encounter', value: 'OPD · Ophthalmology' },
    { id: 'assessment-date', label: 'Assessment date', value: '19 Aug 2026' },
  ],
  form: pacForm,
  actions: [
    { id: 'save', label: 'Save draft', tone: 'secondary' },
    { id: 'review', label: 'Request review', tone: 'primary' },
  ],
};

const pacWithErrors: PacChecklistViewModel = {
  ...pacBase,
  instanceId: 'pac-errors-1',
  errors: [
    { id: 'missing-allergy', message: 'Allergy and reaction details require review before submission.', severity: 'error', fieldId: 'allergies' },
    { id: 'investigation-warning', message: 'An investigation report is referenced but not attached.', severity: 'warning', fieldId: 'investigations' },
  ],
};

const familyHistoryFixture: FamilyPedigreeViewModel = {
  label: 'Family history and relationships',
  selectedPersonId: 'patient',
  people: [
    {
      id: 'maternal-grandparent',
      displayName: 'Unknown relative',
      relationshipLabel: 'Maternal grandparent',
      generation: -2,
      order: 0,
      age: '68',
      sex: 'male',
      lifeStatusLabel: 'Deceased',
      lifeStatus: 'deceased',
      phenotype: 'unaffected',
      summary: 'Details not available',
    },
    {
      id: 'father',
      displayName: 'Ravi Rao',
      relationshipLabel: 'Parent · adoptive',
      generation: -1,
      order: 0,
      age: 64,
      sex: 'male',
      lifeStatusLabel: 'Living',
      lifeStatus: 'alive',
      phenotype: 'affected',
      conditions: [{ label: 'Hypertension', tone: 'info' }],
    },
    {
      id: 'mother',
      displayName: 'Meena Rao',
      relationshipLabel: 'Parent',
      generation: -1,
      order: 1,
      age: 60,
      sex: 'female',
      lifeStatusLabel: 'Living',
      lifeStatus: 'alive',
      phenotype: 'unaffected',
    },
    {
      id: 'patient',
      displayName: 'Ananya Rao',
      relationshipLabel: 'Patient',
      generation: 0,
      order: 0,
      age: 58,
      sex: 'female',
      lifeStatusLabel: 'Living',
      lifeStatus: 'alive',
      proband: true,
      summary: 'Relationship details are supplied by the clinical record.',
      phenotype: 'affected',
    },
    {
      id: 'sibling',
      displayName: 'Kiran Rao',
      relationshipLabel: 'Sibling',
      generation: 0,
      order: 1,
      age: 32,
      sex: 'male',
      lifeStatusLabel: 'Living',
      lifeStatus: 'alive',
      phenotype: 'unaffected',
    },
    {
      id: 'child',
      displayName: 'Child · name not recorded',
      relationshipLabel: 'Child',
      generation: 1,
      order: 0,
      age: 'Newborn',
      sexLabel: 'Not recorded',
      sex: 'unknown',
      lifeStatusLabel: 'Not recorded',
      lifeStatus: 'unknown',
      phenotype: 'unknown',
    },
  ],
  relationships: [
    { id: 'r1', fromPersonId: 'father', toPersonId: 'mother', relationshipLabel: 'Partner relationship', kind: 'partner' },
    { id: 'r2', fromPersonId: 'father', toPersonId: 'patient', relationshipLabel: 'Adoptive parent-child', kind: 'parent-child' },
    { id: 'r3', fromPersonId: 'mother', toPersonId: 'patient', relationshipLabel: 'Parent-child', kind: 'parent-child' },
    { id: 'r4', fromPersonId: 'patient', toPersonId: 'sibling', relationshipLabel: 'Sibling', kind: 'sibling' },
    { id: 'r5', fromPersonId: 'patient', toPersonId: 'child', relationshipLabel: 'Parent-child', kind: 'parent-child' },
  ],
};

function Last({ last }: { last: string }) {
  return <Text accessibilityLabel="Last intent" style={{ marginTop: 8 }}>{`Last intent: ${last}`}</Text>;
}

function StagedChecklistDemo({ initial }: { initial: StagedChecklistViewModel }) {
  const [model, setModel] = useState(initial);
  const [last, setLast] = useState('none');
  const handleIntent = (intent: StagedChecklistIntent) => {
    setLast(JSON.stringify(intent));
    setModel(prev => reduceStagedChecklistIntent(prev, intent));
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrStagedChecklist model={model} onIntent={handleIntent} />
      <Last last={last} />
    </View>
  );
}

function PacChecklistDemo({ initial }: { initial: PacChecklistViewModel }) {
  const [model, setModel] = useState(initial);
  const [last, setLast] = useState('none');
  const handleIntent = (intent: PacChecklistIntent) => {
    setLast(JSON.stringify(intent));
    if (intent.type === 'formIntent' && intent.intent.type === 'fieldEditRequested') {
      const { fieldId, value } = intent.intent;
      setModel(prev => ({
        ...prev,
        form: {
          ...prev.form,
          fields: {
            ...prev.form.fields,
            [fieldId]: { ...(prev.form.fields[fieldId] ?? { value: null }), value },
          },
        },
      }));
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrPacChecklist model={model} onIntent={handleIntent} />
      <Last last={last} />
    </View>
  );
}

function FamilyPedigreeDemo({ initial }: { initial: FamilyPedigreeViewModel }) {
  const [model, setModel] = useState(initial);
  const [last, setLast] = useState('none');
  const handleIntent = (intent: FamilyPedigreeIntent) => {
    setLast(JSON.stringify(intent));
    setModel(prev => reduceFamilyPedigreeIntent(prev, intent));
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrFamilyPedigree model={model} onIntent={handleIntent} />
      <Last last={last} />
    </View>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'staged-checklist-incomplete',
    title: 'Staged checklist · interactive',
    render: () => <StagedChecklistDemo initial={syntheticChecklist} />,
  },
  {
    id: 'staged-checklist-blocked',
    title: 'Staged checklist · blocked',
    render: () => (
      <StagedChecklistDemo
        initial={{
          ...syntheticChecklist,
          instanceId: 'checklist-blocked',
          error: 'Required items need review before this phase can be completed.',
          phaseStatuses: { 'sign-in': { label: 'Blocked', tone: 'danger', assistiveText: 'Required items are incomplete.' } },
        }}
      />
    ),
  },
  {
    id: 'staged-checklist-readonly',
    title: 'Staged checklist · read-only',
    render: () => (
      <StagedChecklistDemo
        initial={{
          ...syntheticChecklist,
          instanceId: 'checklist-readonly',
          readOnly: true,
          phaseStatuses: { 'sign-in': { label: 'Signed off', tone: 'success' } },
        }}
      />
    ),
  },
  {
    id: 'pac-checklist-default',
    title: 'PAC checklist · default',
    render: () => <PacChecklistDemo initial={pacBase} />,
  },
  {
    id: 'pac-checklist-errors',
    title: 'PAC checklist · validation issues',
    render: () => <PacChecklistDemo initial={pacWithErrors} />,
  },
  {
    id: 'family-pedigree-populated',
    title: 'Family pedigree · populated',
    render: () => <FamilyPedigreeDemo initial={familyHistoryFixture} />,
  },
  {
    id: 'family-pedigree-empty',
    title: 'Family pedigree · empty',
    render: () => (
      <FamilyPedigreeDemo
        initial={{
          ...familyHistoryFixture,
          people: [],
          relationships: [],
          emptyMessage: 'Family history has not been recorded.',
        }}
      />
    ),
  },
];
