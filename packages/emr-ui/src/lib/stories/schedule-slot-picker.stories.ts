import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { DoseScheduleViewModel, DoseSlot } from '@drguptavivek/emr-controller';
import type { ScheduleSlotDefinition, ScheduleSlotPreset } from '@drguptavivek/emr-controller';
import { EmrScheduleSlotPickerComponent } from '../fields/emr-schedule-slot-picker.component';
import { EmrDoseScheduleComponent } from '../domain/emr-dose-schedule.component';

const meta: Meta<EmrScheduleSlotPickerComponent> = {
  title: 'EMR / Medications / Slot picker',
  component: EmrScheduleSlotPickerComponent,
  decorators: [moduleMetadata({ imports: [EmrScheduleSlotPickerComponent, EmrDoseScheduleComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Input half of the dose schedule. Each controller-supplied slot is a checkbox; a ticked slot shows an amount (a number, or free text such as "thin layer"). Presets tick a fixed set of slot ids and replace the selection. Emits a new `DoseSlot[]` in slot order through `valueChange`; it never derives frequency text. The stories act as the controller and write the emitted value back.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrScheduleSlotPickerComponent>;

const four: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon', timeHint: '2 pm' },
  { id: 'e', label: 'Evening', timeHint: '6 pm' },
  { id: 'n', label: 'Night', timeHint: '10 pm' }
];
const hourly: ScheduleSlotDefinition[] = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((t) => ({ id: t, label: t }));
const prn: ScheduleSlotDefinition[] = [{ id: 'prn', label: 'When needed', timeHint: 'PRN' }];
const presets: ScheduleSlotPreset[] = [
  { id: 'od', label: 'Once daily (OD)', slotIds: ['m'] },
  { id: 'bd', label: 'Twice daily (BD)', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'Three times daily (TDS)', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'Four times daily (QID)', slotIds: ['m', 'a', 'e', 'n'] }
];
const bd: DoseSlot[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am', amount: 1 },
  { id: 'n', label: 'Night', timeHint: '10 pm', amount: 1 }
];

const picker = (attrs = '') =>
  `<emr-schedule-slot-picker controlId="slots" [label]="label" [slots]="slots" [value]="value" [presets]="presets" [unitLabel]="unitLabel" ${attrs} (valueChange)="value = $event" />`;
const render = (props: Record<string, unknown>, attrs = '', width = '640px') => ({
  props: { label: 'When to take', slots: four, value: null, presets: [], unitLabel: 'tablets', ...props },
  template: `<div style="max-width: ${width}">${picker(attrs)}</div>`
});

export const FourSlotsEmpty: Story = { render: () => render({}, 'hint="Tick each time of day the dose is taken."') };
export const BdSelected: Story = { render: () => render({ value: bd }) };
export const WithPresets: Story = { render: () => render({ value: bd, presets }) };
export const HourlySlots: Story = {
  render: () => render({ label: 'Hourly doses', slots: hourly, value: [{ id: '06:00', label: '06:00', amount: 2 }, { id: '14:00', label: '14:00', amount: 2 }, { id: '22:00', label: '22:00', amount: 2 }], unitLabel: 'drops' })
};
export const PrnOnly: Story = { render: () => render({ label: 'As needed', slots: prn }, 'hint="Maximum dose is set separately by the prescriber."') };
export const LabelAmounts: Story = {
  render: () => render(
    { label: 'Apply', slots: four.filter((s) => s.id !== 'a'), value: [{ id: 'n', label: 'Night', timeHint: '10 pm', amount: null, amountLabel: '1 cm ribbon' }], unitLabel: undefined },
    'amountMode="label" defaultAmountLabel="thin layer"'
  )
};

// Stands in for the controller: maps the slot count to a frequency label. The picker never does this.
const frequencyWords = ['Not set', 'Once daily', 'Twice daily', 'Three times daily', 'Four times daily'];
const preview = (slots: readonly DoseSlot[]): DoseScheduleViewModel => ({
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: { one: 'tablet', other: 'tablets' },
  frequency: { label: frequencyWords[slots.length] ?? `${slots.length} times daily` },
  slots,
  route: 'By mouth',
  duration: '5 days'
});
export const WithLivePreview: Story = {
  render: () => ({
    props: { label: 'When to take', slots: four, presets, value: bd, model: preview(bd), preview },
    template: `<div style="max-width: 640px; display: grid; gap: 16px">
      <emr-schedule-slot-picker controlId="slots-live" [label]="label" [slots]="slots" [value]="value" [presets]="presets" unitLabel="tablets"
        (valueChange)="value = $event; model = preview($event)" />
      <emr-dose-schedule [model]="model" />
    </div>`
  })
};

export const ReadOnly: Story = { render: () => render({ value: bd }, '[readOnly]="true"') };
export const WithError: Story = { render: () => render({ presets }, '[required]="true" error="Select at least one time of day."') };
export const Mobile: Story = { render: () => render({ value: bd, presets }, '', '360px') };
