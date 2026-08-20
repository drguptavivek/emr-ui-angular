import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrLikertComponent } from '../primitives/emr-likert.component';

const meta: Meta<EmrLikertComponent> = {
  title: 'Foundations / Likert scale',
  component: EmrLikertComponent,
  decorators: [moduleMetadata({ imports: [EmrLikertComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled numeric rating scale. The controller supplies the range, anchor labels, and the current value; the component emits `valueChange` and never mutates its inputs. Works for pain scores, symptom severity, satisfaction ratings, and any other ordinal scale the controller defines.'
      }
    }
  }
};
export default meta;

type Story = StoryObj<EmrLikertComponent>;

const painAnchors = [
  { value: 0, label: 'No pain', assistiveLabel: 'No pain at all' },
  { value: 10, label: 'Worst pain', assistiveLabel: 'Worst pain imaginable' }
];

export const PainScore: Story = {
  render: () => ({
    template: `
      <div class="emr-stack">
        <emr-likert
          name="pain-score"
          label="Pain score"
          hint="0 = no pain, 10 = worst pain imaginable"
          [min]="0"
          [max]="10"
          [value]="7"
          [anchors]="anchors"
        />
      </div>
    `,
    props: { anchors: painAnchors }
  })
};

export const Unselected: Story = {
  render: () => ({
    template: `
      <emr-likert
        name="pain-unselected"
        label="Pain score"
        hint="Select a value"
        [min]="0"
        [max]="10"
        [value]="null"
        [anchors]="anchors"
        [required]="true"
      />
    `,
    props: { anchors: painAnchors }
  })
};

export const AllZones: Story = {
  name: 'All severity zones',
  render: () => ({
    template: `
      <div class="emr-stack">
        <emr-likert name="z0"  label="No pain (0)"      [min]="0" [max]="10" [value]="0"  [anchors]="anchors" />
        <emr-likert name="z2"  label="None (2)"          [min]="0" [max]="10" [value]="2"  [anchors]="anchors" />
        <emr-likert name="z4"  label="Mild (4)"          [min]="0" [max]="10" [value]="4"  [anchors]="anchors" />
        <emr-likert name="z5"  label="Moderate (5)"      [min]="0" [max]="10" [value]="5"  [anchors]="anchors" />
        <emr-likert name="z7"  label="Severe (7)"        [min]="0" [max]="10" [value]="7"  [anchors]="anchors" />
        <emr-likert name="z10" label="Worst pain (10)"   [min]="0" [max]="10" [value]="10" [anchors]="anchors" />
      </div>
    `,
    props: { anchors: painAnchors }
  })
};

export const CustomRange: Story = {
  name: '1–5 satisfaction scale',
  render: () => ({
    template: `
      <emr-likert
        name="satisfaction"
        label="Patient satisfaction"
        hint="1 = very dissatisfied, 5 = very satisfied"
        [min]="1"
        [max]="5"
        [value]="4"
        [anchors]="anchors"
      />
    `,
    props: {
      anchors: [
        { value: 1, label: 'Very dissatisfied' },
        { value: 5, label: 'Very satisfied' }
      ]
    }
  })
};

export const WithError: Story = {
  render: () => ({
    template: `
      <emr-likert
        name="pain-error"
        label="Pain score"
        hint="Required before discharge"
        error="Pain score must be recorded"
        [min]="0"
        [max]="10"
        [value]="null"
        [anchors]="anchors"
        [required]="true"
      />
    `,
    props: { anchors: painAnchors }
  })
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <emr-likert
        name="pain-readonly"
        label="Pain score (recorded)"
        [min]="0"
        [max]="10"
        [value]="6"
        [anchors]="anchors"
        [readOnly]="true"
      />
    `,
    props: { anchors: painAnchors }
  })
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <emr-likert
        name="pain-disabled"
        label="Pain score"
        [min]="0"
        [max]="10"
        [value]="null"
        [disabled]="true"
      />
    `
  })
};
