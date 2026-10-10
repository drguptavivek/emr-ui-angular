import { Meta, StoryObj } from '@storybook/angular';
import { EmrStageStepperComponent } from '../primitives/emr-stage-stepper.component';

const meta: Meta<EmrStageStepperComponent> = {
  title: 'EMR / Primitives / Stage stepper',
  component: EmrStageStepperComponent,
  args: { ariaLabel: 'Stages', orientation: 'horizontal', readOnly: false }
};
export default meta;
type Story = StoryObj<EmrStageStepperComponent>;

const threeStages = [
  { id: 'one', label: 'First stage' },
  { id: 'two', label: 'Second stage' },
  { id: 'three', label: 'Third stage' }
];

const journey = [
  { id: 'admission', label: 'Admission', status: { label: 'Complete', tone: 'success' as const } },
  { id: 'ward', label: 'Ward', status: { label: 'Complete', tone: 'success' as const } },
  { id: 'theatre', label: 'Theatre', status: { label: 'In progress', tone: 'info' as const } },
  { id: 'icu', label: 'ICU', status: { label: 'Not started', tone: 'neutral' as const } },
  { id: 'discharge', label: 'Discharge', status: { label: 'Blocked', tone: 'danger' as const, assistiveText: 'awaiting sign-off' } }
];

export const ThreeStages: Story = { args: { stages: threeStages, activeId: 'two' } };

export const WithStatuses: Story = {
  args: {
    stages: [
      { id: 'one', label: 'First stage', status: { label: 'Done', tone: 'success' } },
      { id: 'two', label: 'Second stage', status: { label: 'Needs attention', tone: 'warning' } },
      { id: 'three', label: 'Third stage', status: { label: 'Not started', tone: 'neutral' } }
    ],
    activeId: 'two'
  }
};

export const AdmissionJourney: Story = { args: { stages: journey, activeId: 'theatre', ariaLabel: 'Admission to discharge journey' } };

export const Vertical: Story = { args: { stages: journey, activeId: 'theatre', orientation: 'vertical' } };

export const ReadOnly: Story = { args: { stages: journey, activeId: 'theatre', readOnly: true } };

export const LongLabels: Story = {
  args: {
    stages: [
      { id: 'a', label: 'Pre-operative assessment and anaesthetic review', description: 'Synthetic long description to check wrapping at narrow widths', status: { label: 'In progress', tone: 'info' } },
      { id: 'b', label: 'Intra-operative monitoring and documentation', status: { label: 'Not started', tone: 'neutral' } },
      { id: 'c', label: 'Post-anaesthesia recovery and handover', status: { label: 'Not started', tone: 'neutral' } }
    ],
    activeId: 'a'
  }
};

export const Mobile: Story = {
  args: { stages: journey, activeId: 'ward' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: args => ({
    props: args,
    template: '<div style="max-width: 360px"><emr-stage-stepper [stages]="stages" [activeId]="activeId" [ariaLabel]="ariaLabel" [orientation]="orientation" [readOnly]="readOnly" /></div>'
  })
};
