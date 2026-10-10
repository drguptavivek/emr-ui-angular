import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalAssessmentStatusOption, CodedInputViewModel, EmrCodedValue, EmrFieldDefinition, TerminologyBinding } from '@drguptavivek/emr-controller';
import { EmrCodedInputComponent } from '../fields/emr-coded-input.component';

const meta: Meta<EmrCodedInputComponent> = {
  title: 'EMR / Fields / Coded input',
  component: EmrCodedInputComponent,
  decorators: [moduleMetadata({ imports: [EmrCodedInputComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Capture-side coded entry. Chosen concepts show as chips, each with the code system name and code as text; the search box emits a search intent scoped to the contract\'s answer-value-set binding. The controller owns terminology lookup, paging, debouncing, edition and validation. The component never filters the options it is given.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrCodedInputComponent>;

const SNOMED = 'http://snomed.info/sct';
const ICD10 = 'http://hl7.org/fhir/sid/icd-10';
const LOINC = 'http://loinc.org';
const systemLabels = { [SNOMED]: 'SNOMED CT', [ICD10]: 'ICD-10', [LOINC]: 'LOINC' };

const c = (system: string, code: string, display: string): EmrCodedValue => ({ system, code, display });
const poag = c(SNOMED, '77075001', 'Primary open-angle glaucoma');
const t2dm = c(SNOMED, '44054006', 'Type 2 diabetes mellitus');
const cataract = c(SNOMED, '193570009', 'Cataract');
const h4011 = c(ICD10, 'H40.11', 'Primary open-angle glaucoma');
const e119 = c(ICD10, 'E11.9', 'Type 2 diabetes mellitus without complications');
const iop = c(LOINC, '56844-4', 'Intraocular pressure of Eye');
const hba1c = c(LOINC, '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood');

const statusOptions: ClinicalAssessmentStatusOption[] = [
  { value: 'recorded', label: 'Recorded', tone: 'success' },
  { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
  { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'neutral' },
  { value: 'declined', label: 'Declined', tone: 'info' },
  { value: 'unknown', label: 'Unknown', tone: 'neutral' }
];

const binding = (canonical: string): TerminologyBinding => ({ id: 'b1', role: 'answer-value-set', valueSetCanonical: canonical, strength: 'preferred' });

const definition = (label: string, max: number | null, canonical: string, extra: Partial<EmrFieldDefinition['presentation']> = {}): EmrFieldDefinition => ({
  schemaVersion: '1.0',
  contract: { linkId: 'coded', valueType: 'coded', cardinality: { min: 0, max }, terminology: [binding(canonical)], validation: [] },
  presentation: { label, assessmentStatusOptions: statusOptions, ...extra }
});

const base = (over: Partial<CodedInputViewModel> = {}): CodedInputViewModel => ({
  definition: definition('Primary diagnosis', 1, 'http://snomed.info/sct?fhir_vs=isa/404684003', { hint: 'Search the clinical findings value set.' }),
  value: null,
  query: '',
  options: [],
  open: false,
  loading: false,
  messages: [],
  emptyMessage: 'No matching concepts',
  systemLabels,
  ...over
});

const render = (model: CodedInputViewModel, width = '560px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-coded-input [model]="model" /></div></div>`
});

export const Single: Story = { render: () => render(base({ value: poag })) };

export const MultipleChips: Story = {
  render: () => render(base({
    definition: definition('Diagnoses', null, 'http://hl7.org/fhir/ValueSet/icd-10', { hint: 'Add every diagnosis that applies.' }),
    value: [h4011, e119, cataract, t2dm, iop, hba1c]
  }))
};

export const Searching: Story = {
  render: () => render(base({
    definition: definition('Diagnoses', null, 'http://snomed.info/sct?fhir_vs=isa/404684003'),
    value: [t2dm],
    query: 'glauc',
    open: true,
    loading: true
  }))
};

export const WithResults: Story = {
  render: () => render(base({
    definition: definition('Diagnoses', null, 'http://snomed.info/sct?fhir_vs=isa/404684003'),
    value: [t2dm],
    query: 'cata',
    open: true,
    options: [cataract, c(SNOMED, '53889007', 'Senile cataract'), c(SNOMED, '95722004', 'Congenital cataract')]
  }))
};

export const NoMatches: Story = {
  render: () => render(base({ query: 'zzzx', open: true, options: [] }))
};

export const WithValidationError: Story = {
  render: () => render(base({
    definition: { ...definition('Primary diagnosis', 1, 'http://snomed.info/sct?fhir_vs=isa/404684003'), contract: { ...definition('x', 1, 'x').contract, cardinality: { min: 1, max: 1 } } },
    messages: [
      { path: ['coded'], severity: 'error', message: 'A primary diagnosis is required.', source: 'mechanical' },
      { path: ['coded'], severity: 'warning', message: 'Choose the most specific concept available.', source: 'terminology' }
    ]
  }))
};

export const NotAssessedStatus: Story = {
  render: () => render(base({ status: 'not-assessed' }))
};

export const ReadOnly: Story = {
  render: () => render(base({
    definition: definition('Diagnoses', null, 'http://hl7.org/fhir/ValueSet/icd-10'),
    value: [h4011, e119],
    readOnly: true
  }))
};

export const ReadOnlyNotSupplied: Story = {
  render: () => render(base({ readOnly: true }))
};

export const LongDisplayNames: Story = {
  render: () => render(base({
    definition: definition('Observations', null, 'http://loinc.org/vs'),
    value: [
      c(LOINC, '79893-4', 'Intraocular pressure of Right eye by Goldmann applanation tonometry at rest with the patient seated'),
      c(SNOMED, '1186967002', 'Primary open-angle glaucoma of the right eye with severe stage visual field loss and optic nerve cupping'),
      hba1c
    ]
  }))
};

export const Mobile: Story = {
  render: () => render(base({
    definition: definition('Diagnoses', null, 'http://hl7.org/fhir/ValueSet/icd-10'),
    value: [h4011, e119, cataract],
    query: 'dia',
    open: true,
    options: [t2dm, c(SNOMED, '4855003', 'Diabetic retinopathy')]
  }), '360px'),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
