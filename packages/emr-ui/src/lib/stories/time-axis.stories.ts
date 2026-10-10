import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { TimeAxisIntent, TimeAxisTick, TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { EmrTimeAxisComponent } from '../structures/emr-time-axis.component';

const meta: Meta<EmrTimeAxisComponent> = {
  title: 'EMR / Observations / Time axis',
  component: EmrTimeAxisComponent,
  decorators: [moduleMetadata({ imports: [EmrTimeAxisComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal time scale for inpatient charts (MAR, ICU hourly chart, anaesthesia record, fluid balance). Ticks, labels and the current tick are controller-supplied; the component never computes a time. Columns are a fixed width (`--emr-time-axis-col`, default the flowsheet column) so a flowsheet or trend stacked below lines up. Arrow keys, Home and End move between ticks; Enter or Space selects.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrTimeAxisComponent>;

const steps = [{ id: '60', label: 'Hourly' }, { id: '15', label: '15 min' }];

/** Synthetic hour labels for the story controller. A real controller formats its own clock. */
const hours = (start: number, count: number, now?: number): TimeAxisTick[] =>
  Array.from({ length: count }, (_, i) => {
    const h = (start + i + 24) % 24;
    return { id: `h${start + i}`, label: `${String(h).padStart(2, '0')}:00`, sublabel: start + i < 24 ? 'Day 3' : 'Day 4', current: start + i === now };
  });
const quarters = (startHour: number, count: number, nowIndex?: number): TimeAxisTick[] =>
  Array.from({ length: count }, (_, i) => {
    const h = startHour + Math.floor(i / 4);
    return { id: `q${i}`, label: `${String(h).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`, current: i === nowIndex };
  });

/** Stand-in controller: keeps selection, moves a 12-hour window, swaps step. */
const render = (initial: TimeAxisViewModel, start = 6) => ({
  props: {
    model: initial,
    start,
    onIntent(this: { model: TimeAxisViewModel; start: number }, e: TimeAxisIntent) {
      const m = this.model;
      if (e.type === 'tickSelected') this.model = { ...m, selectedTickId: e.tickId };
      if (e.type === 'shiftEarlierRequested' || e.type === 'shiftLaterRequested') {
        this.start = Math.max(0, Math.min(12, this.start + (e.type === 'shiftLaterRequested' ? 6 : -6)));
        this.model = { ...m, ticks: hours(this.start, 12, 14), canShiftEarlier: this.start > 0, canShiftLater: this.start < 12 };
      }
      if (e.type === 'stepChangeRequested') {
        const step = steps.find((s) => s.id === e.stepId);
        this.model = { ...m, selectedStepId: e.stepId, stepLabel: step?.label, ticks: e.stepId === '15' ? quarters(12, 16, 9) : hours(this.start, 12, 14) };
      }
    }
  },
  template: `<div class="emr-story-surface"><emr-time-axis [model]="model" (intent)="onIntent($event)" /></div>`
});

const hourly: TimeAxisViewModel = {
  id: 'icu-hourly', title: 'ICU chart, hourly', ticks: hours(6, 12, 14), stepLabel: 'Hourly', steps, selectedStepId: '60',
  canShiftEarlier: true, canShiftLater: true
};
export const Hourly: Story = { render: () => render(hourly) };

export const QuarterHourly: Story = {
  render: () => render({ ...hourly, id: 'anaes', title: 'Anaesthesia record, 15 minute', ticks: quarters(12, 16, 9), stepLabel: '15 min', selectedStepId: '15' })
};

export const WithSelection: Story = { render: () => render({ ...hourly, selectedTickId: 'h10' }) };

export const ReadOnly: Story = {
  render: () => render({ id: 'mar-print', title: 'Medication round times', ticks: hours(6, 12, 14), stepLabel: 'Hourly', selectedTickId: 'h8', readOnly: true })
};

export const LongLabels: Story = {
  render: () => render({
    id: 'shifts', title: 'Nursing shifts', stepLabel: 'By shift', canShiftEarlier: false, canShiftLater: true,
    ticks: [
      { id: 's1', label: 'Night shift', sublabel: '20:00 to 08:00, Day 2' },
      { id: 's2', label: 'Day shift', sublabel: '08:00 to 20:00, Day 3', current: true },
      { id: 's3', label: 'Extended night shift with handover', sublabel: '20:00 Day 3 to 08:00 Day 4' },
      { id: 's4', label: 'Day shift', sublabel: '08:00 to 20:00, Day 4' }
    ]
  })
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => render(hourly)
};
