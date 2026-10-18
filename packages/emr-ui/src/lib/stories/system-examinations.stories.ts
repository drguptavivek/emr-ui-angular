import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalFieldDefinition, ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalFormComponent } from '../structures/emr-clinical-form.component';

const examinations: ClinicalFormViewModel = {
  schema: { id: 'system-exams', label: 'General physical examination', description: 'A reusable system examination recipe. Interpretation, validation and persistence stay in the controller.', sections: [
    { id: 'general', label: 'General examination', blocks: [{ id: 'appearance', label: 'General appearance', type: 'select', span: 4, options: [{ value: 'well', label: 'Well appearing' }, { value: 'unwell', label: 'Unwell appearing' }] }, { id: 'pulse', label: 'Pulse', type: 'quantity', span: 4, unit: 'beats/min' }, { id: 'temperature', label: 'Temperature', type: 'decimal', span: 4, unit: '°C', precision: 1 }, { id: 'general-notes', label: 'Notes', type: 'multiline', span: 12, rows: 3 }] },
    { id: 'systems', label: 'System examination', collapsible: true, blocks: [{ id: 'cardiovascular', label: 'Cardiovascular', type: 'multiline', span: 6, rows: 4, placeholder: 'Heart sounds, murmurs, peripheral pulses…' }, { id: 'respiratory', label: 'Respiratory', type: 'multiline', span: 6, rows: 4, placeholder: 'Work of breathing, air entry, added sounds…' }, { id: 'abdomen', label: 'Abdominal', type: 'multiline', span: 6, rows: 4, placeholder: 'Inspection, palpation, organomegaly…' }, { id: 'neurology', label: 'Neurology', type: 'multiline', span: 6, rows: 4, placeholder: 'Mental status, cranial nerves, motor and sensory findings…' }, { id: 'skin', label: 'Dermatology', type: 'multiline', span: 6, rows: 4 }, { id: 'gu', label: 'Genitourinary', type: 'multiline', span: 6, rows: 4 }] },
  ] },
  fields: { appearance: { value: 'well' }, pulse: { value: { value: 78, unit: 'beats/min' } }, temperature: { value: 36.8 }, 'general-notes': { value: 'Alert, comfortable at rest.' }, cardiovascular: { value: 'Normal S1/S2. No murmur appreciated.' }, respiratory: { value: 'Equal air entry bilaterally. No added sounds.' }, abdomen: { value: null }, neurology: { value: null }, skin: { value: null }, gu: { value: null } },
  repeatableGroups: {},
};

const meta: Meta = { title: 'EMR / Clinical forms / System examinations', decorators: [moduleMetadata({ imports: [EmrClinicalFormComponent] })], parameters: { docs: { description: { component: 'Lightweight, responsive examination recipe covering general, cardiovascular, respiratory, abdominal, neurological, dermatological and genitourinary findings.' } } } };
export default meta;
type Story = StoryObj;
const systemField = (id: string): ClinicalFieldDefinition => {
  const section = examinations.schema.sections.find(candidate => candidate.id === 'systems');
  const field = section?.blocks.find(candidate => candidate.kind !== 'repeatable' && candidate.kind !== 'matrix' && candidate.id === id);
  if (!field || field.kind === 'repeatable' || field.kind === 'matrix') throw new Error(`Missing system examination field: ${id}`);
  return field;
};
const focusedSystem = (id: string, label: string): ClinicalFormViewModel => ({
  schema: {
    id: `${id}-assessment`,
    label: `${label} assessment`,
    description: 'A controller-defined clinical examination recipe using the shared aligned form pattern.',
    sections: [{ id, label, blocks: [{ ...systemField(id), span: 12 }] }]
  },
  fields: { [id]: examinations.fields[id] ?? { value: null } },
  repeatableGroups: {}
});
export const GeneralAndSystems: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: examinations } }) };
export const EmptyExamination: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: { ...examinations, fields: Object.fromEntries(Object.keys(examinations.fields).map(id => [id, { value: null }])) } } }) };
export const Cardiovascular: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('cardiovascular', 'Cardiovascular') } }) };
export const Respiratory: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('respiratory', 'Respiratory') } }) };
export const Abdominal: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('abdomen', 'Abdominal') } }) };
export const Neurology: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('neurology', 'Neurology') } }) };
export const Dermatology: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('skin', 'Dermatology') } }) };
export const Genitourinary: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: focusedSystem('gu', 'Genitourinary') } }) };
