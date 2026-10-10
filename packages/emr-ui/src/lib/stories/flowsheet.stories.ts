import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { FlowsheetCell, FlowsheetColumn, FlowsheetIntent, FlowsheetRow, FlowsheetViewModel } from '@drguptavivek/emr-controller';
import { EmrObservationFlowsheetComponent } from '../domain/emr-observation-flowsheet.component';

const meta: Meta<EmrObservationFlowsheetComponent> = {
  title: 'EMR / Observations / Flowsheet',
  component: EmrObservationFlowsheetComponent,
  decorators: [moduleMetadata({ imports: [EmrObservationFlowsheetComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Read-focused grid of rows by time columns: vitals, cumulative labs with a reference-range column, intake and output with controller-supplied totals, and a medication administration view. A real table with sticky row and column headers and sideways scrolling inside the component. Values, flags (High, Low, Given, Held) and totals are supplied by the controller; the component never calculates, flags or converts anything.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrObservationFlowsheetComponent>;

const c = (id: string, label: string, sublabel?: string, current?: boolean): FlowsheetColumn => ({ id, label, sublabel, current });
const r = (id: string, label: string, extra: Partial<FlowsheetRow> = {}): FlowsheetRow => ({ id, label, ...extra });
const v = (valueLabel: string | null, extra: Partial<FlowsheetCell> = {}): FlowsheetCell => ({ valueLabel, ...extra });
const high = { label: 'High', tone: 'danger' as const, assistiveText: 'above the reference range' };
const low = { label: 'Low', tone: 'warning' as const, assistiveText: 'below the reference range' };

/** rows x columns of plain values -> cell map. */
const grid = (rows: readonly string[], cols: readonly string[], f: (row: string, col: string, i: number) => FlowsheetCell): FlowsheetViewModel['cells'] =>
  Object.fromEntries(rows.map((row) => [row, Object.fromEntries(cols.map((col, i) => [col, f(row, col, i)]))]));

const render = (model: FlowsheetViewModel) => ({
  props: {
    model,
    onIntent(e: FlowsheetIntent) {
      if (e.type === 'cellSelected') (this as { model: FlowsheetViewModel }).model = { ...(this as { model: FlowsheetViewModel }).model, selectedCell: { rowId: e.rowId, columnId: e.columnId } };
    }
  },
  template: `<div class="emr-story-surface"><emr-observation-flowsheet [model]="model" (intent)="onIntent($event)" /></div>`
});

// ---- Vital signs --------------------------------------------------------
const vitalCols = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t, i, a) => c(`t${i}`, t, 'Day 2', i === a.length - 1));
const vitalRows = [
  r('temp', 'Temperature', { unitLabel: '°C' }), r('hr', 'Heart rate', { unitLabel: 'beats/min' }), r('rr', 'Respiratory rate', { unitLabel: '/min' }),
  r('bp', 'Blood pressure', { unitLabel: 'mmHg' }), r('spo2', 'SpO₂', { unitLabel: '%' }), r('pain', 'Pain score', { unitLabel: '0 to 10' })
];
const vitalData: Record<string, (string | null)[]> = {
  temp: ['37.1', '37.4', '38.2', '38.6', '37.9', '37.5', '37.2', '37.0'],
  hr: ['78', '82', '96', '104', '92', '86', '80', '76'],
  rr: ['16', '16', '18', '20', '18', '16', '16', '14'],
  bp: ['124/78', '126/80', '132/84', '138/88', '130/82', '126/80', '122/76', '120/74'],
  spo2: ['98', '98', '97', '96', '97', '98', '98', '99'],
  pain: ['2', '2', '4', '5', '3', null, '1', '1']
};
const vitalFlags: Record<string, Record<number, FlowsheetCell['flag']>> = {
  temp: { 2: high, 3: high }, hr: { 3: high }, bp: { 3: high }
};
const vitals: FlowsheetViewModel = {
  id: 'vitals', title: 'Vital signs, 12 hourly view', rows: vitalRows, columns: vitalCols,
  emptyMessage: 'No vital signs recorded.',
  cells: grid(vitalRows.map((x) => x.id), vitalCols.map((x) => x.id), (row, _col, i) => {
    const value = vitalData[row][i];
    if (value === null) return v(null, { status: 'unable-to-assess', editable: true });
    return v(value, { flag: vitalFlags[row]?.[i], editable: true });
  }),
  selectedCell: { rowId: 'hr', columnId: 't3' }
};
export const VitalSigns: Story = { render: () => render(vitals) };

// ---- Cumulative labs ----------------------------------------------------
const labCols = ['d0', 'd1', 'd2', 'd3', 'd4'].map((id, i) => c(id, ['03 Mar', '04 Mar', '05 Mar', '06 Mar', '07 Mar'][i], i === 0 ? 'Admission' : undefined, i === 4));
const labRows = [
  r('na', 'Sodium', { unitLabel: 'mmol/L', referenceLabel: '135 to 145', groupId: 'elec' }),
  r('k', 'Potassium', { unitLabel: 'mmol/L', referenceLabel: '3.5 to 5.1', groupId: 'elec' }),
  r('creat', 'Creatinine', { unitLabel: 'µmol/L', referenceLabel: '60 to 110', groupId: 'renal' }),
  r('egfr', 'eGFR', { unitLabel: 'mL/min/1.73 m²', groupId: 'renal' }),
  r('hb', 'Haemoglobin', { unitLabel: 'g/dL', referenceLabel: '13.0 to 17.0', groupId: 'haem' }),
  r('wbc', 'White cell count', { unitLabel: '×10⁹/L', referenceLabel: '4.0 to 11.0', groupId: 'haem' }),
  r('hba1c', 'HbA1c', { unitLabel: '%', referenceLabel: 'Below 6.5', groupId: 'haem' })
];
const labData: Record<string, (string | null)[]> = {
  na: ['138', '136', '134', '137', '139'], k: ['4.1', '4.8', '5.4', '5.0', '4.6'], creat: ['98', '112', '131', '118', '104'],
  egfr: ['78', '68', '56', '64', '74'], hb: ['12.4', '11.9', '11.2', '11.4', '11.8'], wbc: ['13.2', '12.1', '10.4', '8.8', '7.9'],
  hba1c: ['7.4', null, null, null, null]
};
const labFlags: Record<string, Record<number, FlowsheetCell['flag']>> = {
  na: { 2: low }, k: { 2: high }, creat: { 1: high, 2: high, 3: high }, hb: { 0: low, 1: low, 2: low, 3: low, 4: low }, wbc: { 0: high, 1: high }, hba1c: { 0: high }
};
const labs: FlowsheetViewModel = {
  id: 'labs', title: 'Cumulative laboratory results', rows: labRows, columns: labCols, emptyMessage: 'No results available.',
  groups: [{ id: 'elec', label: 'Electrolytes' }, { id: 'renal', label: 'Renal' }, { id: 'haem', label: 'Haematology and diabetes' }],
  cells: grid(labRows.map((x) => x.id), labCols.map((x) => x.id), (row, _col, i) => {
    const value = labData[row][i];
    return value === null ? v(null, { status: 'not-assessed' }) : v(value, { flag: labFlags[row]?.[i] });
  })
};
export const CumulativeLabs: Story = { render: () => render(labs) };

// ---- Fluid balance ------------------------------------------------------
const ioCols = ['06', '08', '10', '12', '14', '16'].map((t, i, a) => c(`h${i}`, `${t}:00`, 'Hourly', i === a.length - 1));
const ioRows = [
  r('oral', 'Oral', { unitLabel: 'mL', groupId: 'in' }), r('iv', 'IV fluid', { unitLabel: 'mL', groupId: 'in' }),
  r('urine', 'Urine', { unitLabel: 'mL', groupId: 'out' }), r('drain', 'Drain', { unitLabel: 'mL', groupId: 'out' })
];
const ioData: Record<string, (string | null)[]> = {
  oral: ['200', '150', '0', '250', '100', '200'], iv: ['100', '100', '100', '100', '100', '100'],
  urine: ['120', '90', '110', null, '80', '95'], drain: ['20', '10', '15', '10', '5', '5']
};
const fluid: FlowsheetViewModel = {
  id: 'io', title: 'Intake and output', rows: ioRows, columns: ioCols, emptyMessage: 'No intake or output recorded.',
  groups: [{ id: 'in', label: 'Intake' }, { id: 'out', label: 'Output' }],
  cells: grid(ioRows.map((x) => x.id), ioCols.map((x) => x.id), (row, _col, i) => {
    const value = ioData[row][i];
    return value === null ? v(null, { status: 'not-assessed', editable: true }) : v(value, { editable: true });
  }),
  footerRows: [r('tin', 'Total intake', { unitLabel: 'mL' }), r('tout', 'Total output', { unitLabel: 'mL' }), r('bal', 'Balance', { unitLabel: 'mL' })],
  footerCells: {
    tin: Object.fromEntries(ioCols.map((col, i) => [col.id, v(['300', '250', '100', '350', '200', '300'][i])])),
    tout: Object.fromEntries(ioCols.map((col, i) => [col.id, v(['140', '100', '125', '10', '85', '100'][i])])),
    bal: Object.fromEntries(ioCols.map((col, i) => [col.id, v(['+160', '+150', '-25', '+340', '+115', '+200'][i])]))
  }
};
export const FluidBalance: Story = { render: () => render(fluid) };

// ---- Medication administration -----------------------------------------
const marCols = ['08:00', '12:00', '16:00', '20:00', '22:00'].map((t, i, a) => c(`m${i}`, t, 'Today', i === 2 && a.length > 0));
const marRows = [
  r('amox', 'Amoxicillin 500 mg', { unitLabel: 'By mouth, three times daily' }),
  r('para', 'Paracetamol 1 g', { unitLabel: 'By mouth, as needed' }),
  r('ins', 'Insulin glargine 14 units', { unitLabel: 'Subcutaneous, night' }),
  r('tim', 'Timolol 0.5% eye drops OD', { unitLabel: 'Right eye, twice daily' })
];
const given = { label: 'Given', tone: 'success' as const };
const held = { label: 'Held', tone: 'warning' as const, assistiveText: 'dose withheld' };
const due = { label: 'Due', tone: 'info' as const };
const refused = { label: 'Refused', tone: 'danger' as const };
const marData: Record<string, (FlowsheetCell | null)[]> = {
  amox: [v('500 mg', { flag: given }), null, v('500 mg', { flag: due, editable: true }), null, null],
  para: [null, v('1 g', { flag: given, note: 'For headache' }), null, null, null],
  ins: [null, null, null, null, v('14 units', { flag: due, editable: true })],
  tim: [v('1 drop', { flag: given }), null, null, v(null, { status: 'declined', flag: refused, note: 'Patient preference' }), null]
};
const mar: FlowsheetViewModel = {
  id: 'mar', title: 'Medication administration record', rows: marRows, columns: marCols, emptyMessage: 'No medicines charted.',
  cells: Object.fromEntries(marRows.map((row) => [row.id, Object.fromEntries(marCols.map((col, i) => [col.id, marData[row.id][i] ?? v(null, { status: 'not-applicable' })]))])),
  selectedCell: { rowId: 'amox', columnId: 'm2' }
};
export const MedicationAdministration: Story = { render: () => render(mar) };

// ---- States -------------------------------------------------------------
export const Empty: Story = { render: () => render({ ...vitals, rows: [], cells: {}, selectedCell: undefined }) };
export const Loading: Story = { render: () => render({ ...vitals, loading: true }) };
export const ErrorState: Story = { name: 'Error', render: () => render({ ...vitals, error: 'The observation service did not respond.' }) };
export const ReadOnly: Story = { render: () => render({ ...labs, readOnly: true }) };

const many = Array.from({ length: 40 }, (_, i) => c(`p${i}`, `${String(Math.floor(i / 2) + 6).padStart(2, '0')}:${i % 2 ? '30' : '00'}`, i < 20 ? 'Day 1' : 'Day 2', i === 39));
const manyRows = [r('hr', 'Heart rate', { unitLabel: 'beats/min' }), r('spo2', 'SpO₂', { unitLabel: '%' }), r('rr', 'Respiratory rate', { unitLabel: '/min' })];
export const ManyColumns: Story = {
  render: () => render({
    id: 'many', title: 'Continuous monitoring, 40 time points', rows: manyRows, columns: many, emptyMessage: 'Nothing recorded.',
    cells: grid(manyRows.map((x) => x.id), many.map((x) => x.id), (row, _col, i) =>
      v(row === 'hr' ? String(72 + ((i * 7) % 19)) : row === 'spo2' ? String(96 + (i % 4)) : String(14 + ((i * 3) % 7)), { editable: i % 5 === 0 }))
  })
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => render(vitals)
};
