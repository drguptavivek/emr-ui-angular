import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { EmrBadge, EmrOption, MedicationReconciliationViewModel, ReconMedication, ReconRow } from '@drguptavivek/emr-controller';
import { EmrMedicationReconciliationComponent } from '../domain/emr-medication-reconciliation.component';

const meta: Meta<EmrMedicationReconciliationComponent> = {
  title: 'EMR / Medications / Reconciliation',
  component: EmrMedicationReconciliationComponent,
  decorators: [moduleMetadata({ imports: [EmrMedicationReconciliationComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled two-source medication reconciliation. The controller pairs the home list with current orders, writes every dose summary words-first (for example "1 tablet twice daily (BD), after food"), supplies the decision options, the current decision, the summary counts and whether reconciliation can be completed. The component renders a table on wide containers and cards on narrow ones, and only emits intents: it never matches, counts, checks interactions or judges whether a decision is valid.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrMedicationReconciliationComponent>;

const options: EmrOption[] = [
  { value: 'continue', label: 'Continue' },
  { value: 'modify', label: 'Modify' },
  { value: 'stop', label: 'Stop' },
  { value: 'new', label: 'New' },
  { value: 'unmatched', label: 'Unmatched' }
];
const patientReported: EmrBadge = { label: 'Patient reported', tone: 'info' };
const pharmacyList: EmrBadge = { label: 'Pharmacy list', tone: 'neutral' };
const wardOrder: EmrBadge = { label: 'Ward order', tone: 'success' };
const admissionOrder: EmrBadge = { label: 'Admission order', tone: 'success' };

const med = (id: string, nameLabel: string, doseSummary: string, extra: Partial<ReconMedication> = {}): ReconMedication => ({ id, nameLabel, doseSummary, ...extra });
const row = (id: string, extra: Partial<ReconRow> = {}): ReconRow => ({ id, path: ['medications', id], decisionOptions: options, ...extra });

/** Twenty synthetic generic medicines: [name, dose summary, last taken]. Every dose is words first. */
const CATALOGUE: readonly (readonly [string, string, string])[] = [
  ['Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', 'today, 8 am'],
  ['Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', 'today, 8 am'],
  ['Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', 'yesterday, 9 pm'],
  ['Losartan 50 mg tablet', '1 tablet once daily (OD), in the morning', 'today, 8 am'],
  ['Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', 'yesterday, 1 pm'],
  ['Pantoprazole 40 mg tablet', '1 tablet once daily (OD), before breakfast', 'today, 7 am'],
  ['Levothyroxine 50 microgram tablet', '1 tablet once daily (OD), on an empty stomach', 'today, 6 am'],
  ['Timolol 0.5% eye drops', '1 drop in both eyes (OU) twice daily (BD)', 'today, 8 am'],
  ['Paracetamol 500 mg tablet', '1 tablet up to four times daily, only when needed for pain', 'two days ago'],
  ['Salbutamol 100 microgram inhaler', '2 puffs only when needed for wheeze', 'last week'],
  ['Gliclazide 80 mg tablet', '1 tablet once daily (OD), with breakfast', 'today, 8 am'],
  ['Ramipril 5 mg capsule', '1 capsule once daily (OD), at night', 'yesterday, 9 pm'],
  ['Bisoprolol 2.5 mg tablet', '1 tablet once daily (OD), in the morning', 'today, 8 am'],
  ['Furosemide 20 mg tablet', '1 tablet once daily (OD), in the morning', 'today, 8 am'],
  ['Clopidogrel 75 mg tablet', '1 tablet once daily (OD), after food', 'yesterday, 1 pm'],
  ['Omeprazole 20 mg capsule', '1 capsule once daily (OD), before breakfast', 'today, 7 am'],
  ['Cetirizine 10 mg tablet', '1 tablet once daily (OD), at night', 'last week'],
  ['Vitamin D3 60000 unit sachet', '1 sachet once weekly, after food', 'five days ago'],
  ['Calcium carbonate 500 mg tablet', '1 tablet twice daily (BD), after food', 'yesterday, 8 pm'],
  ['Folic acid 5 mg tablet', '1 tablet once daily (OD), in the morning', 'today, 8 am']
];
const DECISIONS = ['continue', 'continue', 'modify', 'continue', 'stop', 'continue', 'continue', 'continue', 'stop', 'continue'];

const twenty = (decided: boolean): ReconRow[] =>
  CATALOGUE.map(([name, dose, taken], i) => row(`r${i + 1}`, {
    left: med(`h${i + 1}`, name, dose, { lastTakenLabel: taken, badges: [i % 3 === 0 ? pharmacyList : patientReported] }),
    right: med(`o${i + 1}`, name, dose, { badges: [i % 2 === 0 ? admissionOrder : wardOrder] }),
    decision: decided ? DECISIONS[i % DECISIONS.length] : i < 6 ? DECISIONS[i] : undefined
  }));

const base = (extra: Partial<MedicationReconciliationViewModel> = {}): MedicationReconciliationViewModel => ({
  id: 'recon-1',
  title: 'Admission medicine reconciliation',
  leftLabel: 'Home list',
  rightLabel: 'Current orders',
  rows: [],
  emptyMessage: 'No medicines on either list.',
  canComplete: false,
  ...extra
});

const render = (model: MedicationReconciliationViewModel, width = '1100px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-medication-reconciliation [model]="model" /></div></div>`
});

export const AdmissionTwentyRows: Story = {
  render: () => render(base({
    rows: twenty(false),
    selectedRowId: 'r3',
    summary: [{ label: '5 continue', tone: 'success' }, { label: '1 modify', tone: 'warning' }, { label: '14 not decided', tone: 'neutral', assistiveText: 'These still need a decision' }]
  }))
};

export const DischargeWithStops: Story = {
  render: () => render(base({
    title: 'Discharge medicine reconciliation',
    leftLabel: 'Inpatient orders',
    rightLabel: 'Discharge prescription',
    rows: [
      row('d1', { left: med('i1', 'Enoxaparin 40 mg injection', '1 injection once daily (OD), under the skin', { badges: [wardOrder] }), decision: 'stop' }),
      row('d2', { left: med('i2', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [wardOrder] }), right: med('p2', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [{ label: 'Discharge prescription', tone: 'success' }] }), decision: 'continue' }),
      row('d3', { left: med('i3', 'Paracetamol 500 mg tablet', '1 tablet four times daily (QID), after food', { badges: [wardOrder] }), right: med('p3', 'Paracetamol 500 mg tablet', '1 tablet up to three times daily, only when needed for pain', { badges: [{ label: 'Discharge prescription', tone: 'success' }] }), decision: 'modify' }),
      row('d4', { right: med('p4', 'Amoxicillin 500 mg capsule', '1 capsule three times daily (TID), for 5 days', { badges: [{ label: 'Discharge prescription', tone: 'success' }] }), decision: 'new' }),
      row('d5', { left: med('i5', 'Pantoprazole 40 mg tablet', '1 tablet once daily (OD), before breakfast', { badges: [wardOrder] }), decision: 'stop' })
    ],
    selectedRowId: 'd3',
    summary: [{ label: '2 stop', tone: 'danger' }, { label: '1 continue', tone: 'success' }, { label: '1 modify', tone: 'warning' }, { label: '1 new', tone: 'info' }],
    canComplete: true
  }))
};

export const UnmatchedOnBothSides: Story = {
  render: () => render(base({
    rows: [
      row('u1', { left: med('h1', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', { lastTakenLabel: 'today, 8 am', badges: [patientReported] }), right: med('o1', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', { badges: [admissionOrder] }), decision: 'continue' }),
      row('u2', { left: med('h2', 'Herbal sleep tablet', 'Not supplied', { lastTakenLabel: 'unknown', badges: [patientReported] }), decision: 'unmatched' }),
      row('u3', { right: med('o3', 'Ondansetron 4 mg tablet', '1 tablet up to three times daily, only when needed for nausea', { badges: [wardOrder] }), decision: 'unmatched' }),
      row('u4', { left: med('h4', 'Eye drops, name not known', '1 drop in the right eye (OD) once daily (OD)', { badges: [patientReported] }) })
    ],
    summary: [{ label: '1 continue', tone: 'success' }, { label: '2 unmatched', tone: 'warning' }, { label: '1 not decided', tone: 'neutral' }]
  }))
};

export const ReasonRequiredError: Story = {
  render: () => render(base({
    rows: [
      row('e1', {
        left: med('h1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [patientReported] }),
        right: med('o1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [admissionOrder] }),
        decision: 'continue'
      }),
      row('e2', {
        left: med('h2', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', { badges: [pharmacyList] }),
        decision: 'stop', reasonRequired: true,
        messages: [{ path: ['medications', 'e2', 'reason'], severity: 'error', message: 'Give a reason for stopping this medicine.' }]
      }),
      row('e3', {
        left: med('h3', 'Losartan 50 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [patientReported] }),
        right: med('o3', 'Losartan 25 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [admissionOrder] }),
        decision: 'modify', reasonRequired: true, reason: 'Lower dose while kidney function is rechecked.',
        messages: [{ path: ['medications', 'e3'], severity: 'warning', message: 'Dose differs between the two lists.' }]
      })
    ],
    summary: [{ label: '1 continue', tone: 'success' }, { label: '1 stop', tone: 'danger' }, { label: '1 modify', tone: 'warning' }, { label: '1 needs a reason', tone: 'danger' }]
  }))
};

export const AllDecided: Story = {
  render: () => render(base({
    rows: twenty(true).slice(0, 6),
    summary: [{ label: '6 of 6 decided', tone: 'success' }],
    canComplete: true
  }))
};

export const Empty: Story = { render: () => render(base()) };

export const ReadOnly: Story = {
  render: () => render(base({
    readOnly: true,
    rows: twenty(true).slice(0, 4),
    summary: [{ label: 'Completed', tone: 'success' }],
    canComplete: true
  }))
};

export const Loading: Story = { render: () => render(base({ loading: true })) };

export const Error: Story = {
  render: () => render(base({ error: 'The home medicine list could not be retrieved. Check the connection and try again.' }))
};

export const Mobile: Story = {
  render: () => render(base({
    rows: [
      row('m1', {
        left: med('h1', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', { lastTakenLabel: 'today, 8 am', badges: [patientReported] }),
        right: med('o1', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', { badges: [admissionOrder] }),
        decision: 'continue'
      }),
      row('m2', {
        left: med('h2', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', { badges: [pharmacyList] }),
        decision: 'stop', reasonRequired: true,
        messages: [{ path: ['medications', 'm2', 'reason'], severity: 'error', message: 'Give a reason for stopping this medicine.' }]
      }),
      row('m3', { right: med('o3', 'Ondansetron 4 mg tablet', '1 tablet up to three times daily, only when needed for nausea', { badges: [wardOrder] }) })
    ],
    selectedRowId: 'm1',
    summary: [{ label: '1 continue', tone: 'success' }, { label: '2 need a decision', tone: 'warning' }]
  }), '360px')
};
