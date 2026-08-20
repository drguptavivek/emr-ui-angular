import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrClinicalMatrixComponent } from '../clinical/emr-clinical-matrix.component';
import { EmrTimelineComponent } from '../timeline/emr-timeline.component';
import { neurologySchema, neurologyValues, ophthalmologySchema, ophthalmologyValues, timelineEvents, timelineKinds } from './fixtures';

const meta: Meta = {
  title: 'EMR / Clinical assessment',
  decorators: [moduleMetadata({ imports: [EmrClinicalMatrixComponent, EmrTimelineComponent] })],
  parameters: { docs: { description: { component: 'Schema-driven clinical presentation. Specialty schemas and controller-produced values are interchangeable.' } } }
};
export default meta;
type Story = StoryObj;

export const OphthalmologyODOS: Story = { render: () => ({ template: `<emr-clinical-matrix [schema]="schema" [values]="values" />`, props: { schema: ophthalmologySchema, values: ophthalmologyValues } }) };
export const OphthalmologyEmpty: Story = { render: () => ({ template: `<emr-clinical-matrix [schema]="schema" />`, props: { schema: ophthalmologySchema } }) };
export const OphthalmologyReadOnly: Story = { render: () => ({ template: `<emr-clinical-matrix [schema]="schema" [values]="values" [readOnly]="true" />`, props: { schema: ophthalmologySchema, values: ophthalmologyValues } }) };
export const NeurologyFourLimb: Story = { render: () => ({ template: `<emr-clinical-matrix [schema]="schema" [values]="values" />`, props: { schema: neurologySchema, values: neurologyValues } }) };

export const EncounterTimelineVertical: Story = { render: () => ({ template: `<emr-timeline orientation="vertical" [events]="events" [kinds]="kinds" selectedId="t1" />`, props: { events: timelineEvents, kinds: timelineKinds } }) };
export const EncounterTimelineHorizontal: Story = { render: () => ({ template: `<emr-timeline orientation="horizontal" [events]="events" [kinds]="kinds" selectedId="t2" />`, props: { events: timelineEvents, kinds: timelineKinds } }) };
export const EncounterTimelineEmpty: Story = { render: () => ({ template: `<emr-timeline orientation="vertical" [events]="[]" [kinds]="kinds" />`, props: { kinds: timelineKinds } }) };
