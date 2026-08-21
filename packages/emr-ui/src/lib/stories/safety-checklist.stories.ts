import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrStagedChecklistComponent } from '../domain/emr-staged-checklist.component';
import type { StagedChecklistViewModel } from '@drguptavivek/emr-controller';

const syntheticChecklist: StagedChecklistViewModel = {
  instanceId: 'illustrative-checklist-001',
  schema: {
    id: 'illustrative-surgical-safety',
    label: 'Illustrative surgical safety checklist',
    description: 'Synthetic Storybook content based on the WHO Surgical Safety Checklist. Adapt locally with the responsible clinical team.',
    phases: [
      { id: 'sign-in', label: 'Sign In', description: 'Before induction of anaesthesia', items: [
        { id: 'patient-identity', label: 'Patient identity, site and procedure confirmed', type: 'checkbox', required: true },
        { id: 'allergy-status', label: 'Allergy status reviewed', type: 'yes-no-na', required: true },
        { id: 'equipment', label: 'Anaesthesia and pulse oximeter checks complete', type: 'checkbox', required: true },
        { id: 'procedure-type', label: 'Procedure category', type: 'select', options: [{ value: 'planned', label: 'Planned procedure' }, { value: 'restricted', label: 'Restricted by controller', disabled: true }] }
      ] },
      { id: 'time-out', label: 'Time Out', description: 'Before skin incision', items: [
        { id: 'team-introduced', label: 'Team members introduced themselves by name and role', type: 'checkbox', required: true },
        { id: 'anticipated-events', label: 'Anticipated critical events discussed', type: 'yes-no', required: true, requiresNoteWhen: ['yes'] },
        { id: 'prophylaxis', label: 'Antibiotic prophylaxis confirmed where indicated', type: 'yes-no-na', required: true }
      ] },
      { id: 'sign-out', label: 'Sign Out', description: 'Before the team leaves the operating room', items: [
        { id: 'procedure-recorded', label: 'Procedure name recorded', type: 'checkbox', required: true },
        { id: 'counts', label: 'Instrument, sponge and needle counts complete', type: 'yes-no-na', required: true },
        { id: 'recovery-plan', label: 'Recovery and postoperative management plan reviewed', type: 'text', required: true }
      ] }
    ]
  },
  items: {
    'patient-identity': { value: true }, 'allergy-status': { value: 'yes' }, 'equipment': { value: true }, 'procedure-type': { value: null },
    'team-introduced': { value: false }, 'anticipated-events': { value: null }, 'prophylaxis': { value: null },
    'procedure-recorded': { value: null }, 'counts': { value: null }, 'recovery-plan': { value: null }
  },
  activePhaseId: 'sign-in'
};

const meta: Meta = {
  title: 'EMR / Safety / Staged checklist',
  decorators: [moduleMetadata({ imports: [EmrStagedChecklistComponent] })],
  parameters: { docs: { description: { component: 'Controlled, illustrative checklist presentation. It does not claim compliance, infer completion, or carry a WHO logo.' } } }
};
export default meta;
type Story = StoryObj;

export const Incomplete: Story = { render: () => ({ template: `<emr-staged-checklist [model]="view" />`, props: { view: syntheticChecklist } }) };
export const Complete: Story = { render: () => ({ template: `<emr-staged-checklist [model]="view" />`, props: { view: { ...syntheticChecklist, phaseStatuses: { 'sign-in': { label: 'Complete', tone: 'success' }, 'time-out': { label: 'Complete', tone: 'success' }, 'sign-out': { label: 'Complete', tone: 'success' } }, activePhaseId: 'time-out' } } }) };
export const Blocked: Story = { render: () => ({ template: `<emr-staged-checklist [model]="view" />`, props: { view: { ...syntheticChecklist, error: 'Required items need review before this phase can be completed.', phaseStatuses: { 'sign-in': { label: 'Blocked', tone: 'danger', assistiveText: 'Required items are incomplete.' } } } } }) };
export const ReadOnly: Story = { render: () => ({ template: `<emr-staged-checklist [model]="view" />`, props: { view: { ...syntheticChecklist, readOnly: true, phaseStatuses: { 'sign-in': { label: 'Signed off', tone: 'success' } }, signoffs: { 'sign-in': { displayName: 'Synthetic reviewer', roleLabel: 'Reviewer', signedAtLabel: '19 Aug 2026, 09:30' } } } } }) };
export const TwoInstances: Story = { render: () => ({ template: `<div class="emr-story-grid emr-story-grid--two"><emr-staged-checklist [model]="first" /><emr-staged-checklist [model]="second" /></div>`, props: { first: { ...syntheticChecklist, instanceId: 'checklist-a' }, second: { ...syntheticChecklist, instanceId: 'checklist-b' } } }) };
