import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalFormComponent } from '../structures/emr-clinical-form.component';

const history: ClinicalFormViewModel = {
  schema: { id: 'history', label: 'Clinical history', description: 'Structured narrative fields remain controlled by the encounter controller.', sections: [{ id: 'presenting', label: 'Presenting concern', blocks: [
    { id: 'chief-complaints', label: 'Chief complaints', type: 'multiline', span: 12, rows: 3, required: true, placeholder: 'Record the patient’s own words where possible.' },
    { id: 'hpi', label: 'History of present illness', type: 'multiline', span: 12, rows: 5, assessmentStatusOptions: [
      { value: 'not-assessed', label: 'Not assessed', tone: 'neutral' },
      { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
      { value: 'declined', label: 'Patient declined', tone: 'warning' },
      { value: 'unknown', label: 'Unknown', tone: 'neutral' }
    ] },
  ] }, { id: 'past', label: 'Past medical history', description: 'Add conditions as separate entries to preserve a clear chronology.', collapsible: true, blocks: [{ kind: 'repeatable', id: 'conditions', label: 'Conditions and procedures', addLabel: 'Add condition', fields: [{ id: 'condition', label: 'Condition or procedure', type: 'text', span: 6, required: true }, { id: 'onset', label: 'Onset or date', type: 'date', span: 3 }, { id: 'status', label: 'Status', type: 'select', span: 3, options: [{ value: 'active', label: 'Active' }, { value: 'resolved', label: 'Resolved' }, { value: 'unknown', label: 'Unknown' }] }] }] }] },
  fields: { 'chief-complaints': { value: 'Blurred vision for three months' }, hpi: { value: 'Gradual, painless reduction in distance vision. No redness or trauma reported.' } },
  repeatableGroups: { conditions: [{ id: 'conditions-1', fields: { condition: { value: 'Type 2 diabetes mellitus' }, onset: { value: '2018-01-01' }, status: { value: 'active' } } }] },
};

const meta: Meta = { title: 'EMR / Clinical forms / History', decorators: [moduleMetadata({ imports: [EmrClinicalFormComponent] })], parameters: { docs: { description: { component: 'Controlled, schema-driven history form for chief complaints, HPI and past medical history.' } } } };
export default meta;
type Story = StoryObj;

export const History: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: history } }) };
export const EmptyHistory: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: { ...history, fields: { 'chief-complaints': { value: null }, hpi: { value: null } }, repeatableGroups: { conditions: [] } } } }) };
export const ReadOnlyHistory: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: { ...history, readOnly: true } } }) };
export const ExplicitAssessmentStatus: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: { ...history, fields: { ...history.fields, hpi: { value: null, assessmentStatus: 'declined' } } } } }) };

/** A collapsed section is hidden on screen but must still print — collapsed data on paper is missing data. */
export const CollapsedSection: Story = { render: () => ({ template: `<emr-clinical-form [model]="model" />`, props: { model: { ...history, collapsedSectionIds: ['past'] } } }) };
export const CollapsedSectionPrintPreview: Story = { render: () => ({ template: `<div class="emr-print"><emr-clinical-form [model]="model" /></div>`, props: { model: { ...history, collapsedSectionIds: ['past'] } } }) };
