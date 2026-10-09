import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrVasComponent, type EmrVasAnchor } from '../primitives/emr-vas.component';

/**
 * Story-local host that closes the controlled loop, standing in for the controller a real
 * consumer would own. It holds the value and supplies the spoken text and tone — the
 * primitive itself does neither.
 */
@Component({
  selector: 'story-vas-host',
  standalone: true,
  imports: [EmrVasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="emr-stack">
      <emr-vas
        controlId="vas-interactive"
        label="Your health today"
        hint="Drag, tap, or use the arrow keys."
        orientation="vertical"
        [min]="0"
        [max]="100"
        [step]="1"
        [majorInterval]="10"
        [minorInterval]="5"
        [value]="value()"
        [tone]="tone()"
        [valueText]="valueText()"
        [anchors]="anchors"
        (valueChange)="value.set($event)"
      />
      <p class="emr-field__hint" data-testid="vas-readout">Recorded: {{ value() === null ? 'nothing yet' : value() }}</p>
    </div>
  `,
})
export class StoryVasHostComponent {
  readonly anchors: readonly EmrVasAnchor[] = [
    { value: 0, label: 'The worst health you can imagine' },
    { value: 100, label: 'The best health you can imagine' },
  ];
  readonly value = signal<number | null>(50);
  // The controller decides what a number means; the scale never infers it.
  readonly tone = () => (this.value() ?? 0) >= 70 ? 'success' as const : (this.value() ?? 0) >= 40 ? 'warning' as const : 'danger' as const;
  readonly valueText = () => this.value() === null ? undefined : `${this.value()} out of 100`;
}

const healthAnchors: readonly EmrVasAnchor[] = [
  { value: 0, label: 'The worst health you can imagine' },
  { value: 100, label: 'The best health you can imagine' },
];

const painAnchors: readonly EmrVasAnchor[] = [
  { value: 0, label: 'No pain' },
  { value: 10, label: 'Worst pain imaginable' },
];

const meta: Meta = {
  title: 'Foundations / VAS scale',
  decorators: [moduleMetadata({ imports: [EmrVasComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled visual analogue scale: a ruler with major and minor markers that the respondent marks anywhere along its length, by finger, mouse or keyboard. Horizontal for 0–10 scales, vertical for the EQ-5D-5L style health thermometer. The primitive derives no clinical meaning — anchors, tone and spoken value come from the controller.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const PainVas: Story = {
  name: 'Horizontal 0–10 pain VAS',
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-pain"
        label="Pain right now"
        hint="Mark anywhere along the line."
        [min]="0"
        [max]="10"
        [value]="6.5"
        [step]="0.5"
        [majorInterval]="1"
        [minorInterval]="0.5"
        tone="danger"
        valueText="6.5 out of 10"
        [anchors]="anchors"
      />
    `,
    props: { anchors: painAnchors },
  }),
};

export const HealthThermometer: Story = {
  name: 'Vertical 0–100 health thermometer (EQ-5D-5L style)',
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-health"
        label="Your health today"
        orientation="vertical"
        [min]="0"
        [max]="100"
        [value]="72"
        [step]="1"
        [majorInterval]="10"
        [minorInterval]="5"
        tone="success"
        valueText="72 out of 100"
        [anchors]="anchors"
      />
    `,
    props: { anchors: healthAnchors },
  }),
};

export const Unmarked: Story = {
  name: 'Nothing recorded yet',
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-empty"
        label="Your health today"
        hint="Not yet marked"
        [min]="0"
        [max]="100"
        [value]="null"
        [majorInterval]="10"
        [minorInterval]="5"
        [required]="true"
        [anchors]="anchors"
      />
    `,
    props: { anchors: healthAnchors },
  }),
};

export const ReadOnlyVas: Story = {
  name: 'Read-only recorded value',
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-readonly"
        label="Pain at admission (recorded)"
        [min]="0"
        [max]="10"
        [value]="8"
        [majorInterval]="1"
        [minorInterval]="0.5"
        tone="danger"
        valueText="8 out of 10"
        [readOnly]="true"
        [anchors]="anchors"
      />
    `,
    props: { anchors: painAnchors },
  }),
};

export const WithError: Story = {
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-error"
        label="Your health today"
        error="Mark a point on the scale to continue."
        [min]="0"
        [max]="100"
        [value]="null"
        [majorInterval]="10"
        [minorInterval]="5"
        [required]="true"
        [anchors]="anchors"
      />
    `,
    props: { anchors: healthAnchors },
  }),
};

export const Interactive: Story = {
  name: 'Interactive (controlled by a host)',
  decorators: [moduleMetadata({ imports: [StoryVasHostComponent] })],
  render: () => ({ template: `<story-vas-host />` }),
};

export const DisabledVas: Story = {
  name: 'Disabled',
  render: () => ({
    template: `
      <emr-vas
        controlId="vas-disabled"
        label="Your health today"
        [min]="0"
        [max]="100"
        [value]="40"
        [majorInterval]="10"
        [minorInterval]="5"
        [disabled]="true"
      />
    `,
  }),
};
