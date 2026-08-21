import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalFormViewModel, PacChecklistViewModel } from '@drguptavivek/emr-controller';
import { EmrPacChecklistComponent } from '../domain/emr-pac-checklist.component';

const form: ClinicalFormViewModel = {
  schema: { id: 'pac-form', label: 'Pre-operative assessment', description: 'Capture the supplied assessment information for review.', sections: [
    { id: 'context', label: 'Context', blocks: [{ id: 'procedure', label: 'Planned procedure', type: 'text', span: 6, required: true }, { id: 'anaesthesia-plan', label: 'Planned anaesthesia', type: 'select', span: 6, options: [{ value: 'general', label: 'General' }, { value: 'regional', label: 'Regional' }, { value: 'local', label: 'Local' }] }] },
    { id: 'history', label: 'History, medications and allergies', blocks: [{ id: 'medical-history', label: 'Relevant medical history', type: 'multiline', span: 12, rows: 3 }, { id: 'medications', label: 'Current medications', type: 'multiline', span: 6, rows: 3 }, { id: 'allergies', label: 'Allergies and reactions', type: 'multiline', span: 6, rows: 3 }, { id: 'prior-anaesthesia', label: 'Prior anaesthesia experience', type: 'multiline', span: 12, rows: 3 }] },
    { id: 'examination', label: 'Examination and airway', blocks: [{ id: 'airway', label: 'Airway observations', type: 'multiline', span: 6, rows: 3 }, { id: 'examination', label: 'Examination findings', type: 'multiline', span: 6, rows: 3 }, { id: 'vitals', label: 'Vital signs / other observations', type: 'multiline', span: 12, rows: 3 }] },
    { id: 'investigations', label: 'Investigations', blocks: [{ id: 'investigations', label: 'Available investigations and reports', type: 'multiline', span: 12, rows: 4 }] },
    { id: 'plan', label: 'Plan, instructions and review', blocks: [{ id: 'plan', label: 'Plan and instructions', type: 'multiline', span: 12, rows: 4 }, { id: 'review', label: 'Review / follow-up notes', type: 'multiline', span: 12, rows: 3 }] }
  ] },
  fields: { procedure: { value: 'Cataract extraction' }, 'anaesthesia-plan': { value: 'local' }, 'medical-history': { value: 'History supplied by patient.' }, medications: { value: null }, allergies: { value: 'No allergy information supplied in this example.' }, 'prior-anaesthesia': { value: null }, airway: { value: null }, examination: { value: null }, vitals: { value: null }, investigations: { value: null }, plan: { value: null }, review: { value: null } },
  repeatableGroups: {}
};

const base: PacChecklistViewModel = { instanceId: 'pac-demo-1', title: 'Pre-anaesthesia checklist', description: 'A reusable, controller-backed PAC assessment surface. It records supplied information without deriving fitness or clearance.', context: [{ id: 'patient', label: 'Patient', value: 'Ananya Rao · MRN-204881' }, { id: 'procedure-context', label: 'Procedure', value: 'Cataract extraction' }, { id: 'encounter', label: 'Encounter', value: 'OPD · Ophthalmology' }, { id: 'assessment-date', label: 'Assessment date', value: '19 Aug 2026' }], form, actions: [{ id: 'save', label: 'Save draft', tone: 'secondary' }, { id: 'review', label: 'Request review', tone: 'primary' }] };
const completed: PacChecklistViewModel = { ...base, instanceId: 'pac-completed-1', overallStatus: { label: 'Documentation completed', tone: 'success' }, form: { ...form, fields: Object.fromEntries(Object.entries(form.fields).map(([id, state]) => [id, { ...state, value: state.value ?? 'Documented in record' }])) }, actions: [{ id: 'view', label: 'View documentation', tone: 'secondary' }] };
const errors: PacChecklistViewModel = { ...base, instanceId: 'pac-errors-1', errors: [{ id: 'missing-allergy', message: 'Allergy and reaction details require review before submission.', severity: 'error', fieldId: 'allergies' }, { id: 'investigation-warning', message: 'An investigation report is referenced but not attached.', severity: 'warning', fieldId: 'investigations' }] };
const readonly: PacChecklistViewModel = { ...base, instanceId: 'pac-readonly-1', readOnly: true, overallStatus: { label: 'Documentation completed', tone: 'success' } };
const meta: Meta = { title: 'EMR / Safety / PAC checklist', decorators: [moduleMetadata({ imports: [EmrPacChecklistComponent] })], parameters: { docs: { description: { component: 'Controlled PAC checklist wrapper. The controller supplies context, form state, errors and actions; the UI does not infer fitness, clearance, ASA class or clinical validation.' } } } };
export default meta;
type Story = StoryObj;
export const Default: Story = { render: () => ({ template: '<emr-pac-checklist [model]="view" />', props: { view: base } }) };
export const DocumentationCompleted: Story = { render: () => ({ template: '<emr-pac-checklist [model]="view" />', props: { view: completed } }) };
export const Errors: Story = { render: () => ({ template: '<emr-pac-checklist [model]="view" />', props: { view: errors } }) };
export const ReadOnly: Story = { render: () => ({ template: '<emr-pac-checklist [model]="view" />', props: { view: readonly } }) };
export const Mobile: Story = { render: () => ({ template: '<div style="max-width: 430px"><emr-pac-checklist [model]="view" /></div>', props: { view: base } }) };
