import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ClinicalFieldDefinition, ClinicalFieldState } from '@drguptavivek/emr-controller';
import { EmrDateTimeInputComponent, EmrTimeInputComponent } from '../primitives/emr-inputs.component';
import { EmrTypedFieldComponent } from '../fields/emr-typed-field.component';

const meta: Meta<EmrTimeInputComponent> = {
  title: 'EMR / Fields / Time and datetime',
  component: EmrTimeInputComponent,
  decorators: [moduleMetadata({ imports: [EmrTimeInputComponent, EmrDateTimeInputComponent, EmrTypedFieldComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Native time-of-day (`HH:mm`) and local date-and-time (`YYYY-MM-DDTHH:mm`) controls. Values are the browser wire strings or null; the controller owns timezone, ordering and range rules. The same kinds render inside `emr-typed-field` as `time` and `datetime`.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrTimeInputComponent>;

const surface = (body: string, width = '420px') => `<div class="emr-story-surface"><div style="max-width: ${width}; display: grid; gap: 16px">${body}</div></div>`;

export const TimeBlank: Story = {
  render: () => ({
    template: surface(`<emr-time-input controlId="drop-instilled" label="Dilating drops instilled at" hint="24-hour clock." />`)
  })
};

export const TimePopulated: Story = {
  render: () => ({
    props: { value: '09:40' },
    template: surface(`<emr-time-input controlId="iop-time" label="IOP measured at" [step]="300" min="08:00" max="18:00" [required]="true" [(value)]="value" />`)
  })
};

export const DateTimePopulated: Story = {
  render: () => ({
    props: { value: '2026-03-14T10:25' },
    template: surface(`<emr-datetime-input controlId="seen-at" label="Seen by clinician" hint="Local clinic time." [(value)]="value" />`)
  })
};

const timeField: ClinicalFieldDefinition = { id: 'onset-time', label: 'Symptom onset time', type: 'time', hint: 'Best estimate is acceptable.' };
const dateTimeField: ClinicalFieldDefinition = { id: 'last-meal', label: 'Last oral intake', type: 'datetime', required: true };

export const WithinTypedField: Story = {
  render: () => ({
    props: {
      timeField, dateTimeField,
      timeModel: { value: '07:15' } satisfies ClinicalFieldState,
      dateTimeModel: { value: '2026-03-14T06:30' } satisfies ClinicalFieldState
    },
    template: surface(`
      <emr-typed-field controlId="typed-onset-time" [definition]="timeField" [model]="timeModel" (valueChange)="timeModel = { value: $event }" />
      <emr-typed-field controlId="typed-last-meal" [definition]="dateTimeField" [model]="dateTimeModel" (valueChange)="dateTimeModel = { value: $event }" />`)
  })
};

export const ReadOnly: Story = {
  render: () => ({
    template: surface(`
      <emr-time-input controlId="ro-time" label="IOP measured at" value="14:05" [readOnly]="true" />
      <emr-datetime-input controlId="ro-datetime" label="Seen by clinician" value="2026-03-14T10:25" [readOnly]="true" />`)
  })
};

export const WithError: Story = {
  render: () => ({
    template: surface(`
      <emr-time-input controlId="err-time" label="Dilating drops instilled at" [required]="true" error="Enter the time the drops were instilled." />
      <emr-datetime-input controlId="err-datetime" label="Procedure start" value="2026-03-14T23:50" max="2026-03-14T18:00" hint="Must fall within clinic hours." error="Start is after the clinic closed." />`)
  })
};

export const Mobile: Story = {
  render: () => ({
    props: { time: '11:20', when: '2026-03-14T11:20' },
    template: surface(`
      <emr-time-input controlId="m-time" label="IOP measured at" [(value)]="time" />
      <emr-datetime-input controlId="m-datetime" label="Seen by clinician" [(value)]="when" />`, '360px')
  }),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
