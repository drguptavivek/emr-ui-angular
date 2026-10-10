import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { DoseScheduleViewModel, DoseSlot } from '@drguptavivek/emr-controller';
import { EmrDoseScheduleComponent } from '../domain/emr-dose-schedule.component';

const meta: Meta<EmrDoseScheduleComponent> = {
  title: 'EMR / Medications / Dose schedule',
  component: EmrDoseScheduleComponent,
  decorators: [moduleMetadata({ imports: [EmrDoseScheduleComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled, display-first card that states how a medicine is taken. The controller supplies every label and amount; the component only formats them (fractions as ¼ ½ ¾, a "1 - 0 - 1" pattern row, icons) and never maps codes, totals, durations or tapers. Site and frequency abbreviations are always shown after the words (for example "Right eye (OD)"), because the same letters mean different things for tablets and eye or ear drops.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrDoseScheduleComponent>;

const slot = (id: string, label: string, amount: number | null, extra: Partial<DoseSlot> = {}): DoseSlot => ({ id, label, amount, ...extra });
const mna = (m: number | null, a: number | null, n: number | null): DoseSlot[] => [
  slot('m', 'Morning', m, { timeHint: '8 am' }),
  slot('a', 'Afternoon', a, { timeHint: '2 pm' }),
  slot('n', 'Night', n, { timeHint: '9 pm' })
];
const four = (m: number | null, a: number | null, e: number | null, n: number | null): DoseSlot[] => [
  slot('m', 'Morning', m),
  slot('a', 'Afternoon', a),
  slot('e', 'Evening', e),
  slot('n', 'Night', n)
];
const tab = { one: 'tablet', other: 'tablets' };
const drop = { one: 'drop', other: 'drops' };

const paracetamol = (extra: Partial<DoseScheduleViewModel> = {}): DoseScheduleViewModel => ({
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: tab,
  frequency: { code: 'BD', label: 'Twice daily' },
  slots: mna(1, null, 1),
  route: 'By mouth',
  foodRelation: 'After food',
  duration: '5 days',
  startLabel: 'Starts today',
  ...extra
});

const timolol: DoseScheduleViewModel = {
  medication: { label: 'Timolol', strength: '0.5%', formLabel: 'Eye drops', form: 'drop' },
  unit: drop,
  frequency: { code: 'QID', label: 'Four times daily' },
  slots: four(1, 1, 1, 1),
  site: { code: 'OU', label: 'Both eyes' },
  route: 'Into the eye',
  duration: '4 weeks',
  separationNote: 'Wait 5 minutes between different eye drops.'
};

const render = (model: DoseScheduleViewModel) => ({
  props: { model },
  template: `<div style="max-width: 640px"><emr-dose-schedule [model]="model" /></div>`
});

export const TabletTwiceDaily: Story = { render: () => render(paracetamol({ canEdit: true, canShowInstructions: true })) };

export const HalfTabletMorning: Story = {
  render: () => render(paracetamol({
    medication: { label: 'Amlodipine', strength: '5 mg', formLabel: 'Tablet', form: 'tablet' },
    frequency: { code: 'OD', label: 'Once daily' },
    slots: mna(0.5, null, null),
    duration: 'Ongoing'
  }))
};

export const MixedAmounts: Story = {
  render: () => render(paracetamol({
    medication: { label: 'Metformin', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
    frequency: { label: 'Three times daily' },
    slots: mna(1, 0.5, 2),
    duration: '30 days'
  }))
};

export const FourTimesDaily: Story = {
  render: () => render(paracetamol({
    frequency: { code: 'QID', label: 'Four times daily' },
    slots: four(1, 1, 1, 1),
    duration: '3 days'
  }))
};

export const AsNeeded: Story = {
  render: () => render(paracetamol({
    frequency: { code: 'SOS', label: 'Only when needed' },
    slots: [slot('dose', 'Each dose', 1)],
    prn: { label: 'Take only if you have pain or fever', maxLabel: 'No more than 4 tablets in 24 hours' },
    foodRelation: undefined,
    duration: undefined,
    startLabel: undefined
  }))
};

export const EyeDropsBothEyes: Story = { render: () => render(timolol) };

export const EyeDropRightEyeOnce: Story = {
  render: () => render({
    medication: { label: 'Latanoprost', strength: '0.005%', formLabel: 'Eye drops', form: 'drop' },
    unit: drop,
    frequency: { code: 'OD', label: 'Once daily' },
    slots: [slot('n', 'Night', 1, { timeHint: '9 pm' })],
    site: { code: 'OD', label: 'Right eye' },
    route: 'Into the eye',
    duration: 'Ongoing'
  })
};

export const EyeDropTaper: Story = {
  render: () => render({
    medication: { label: 'Prednisolone acetate', strength: '1%', formLabel: 'Eye drops', form: 'drop' },
    unit: drop,
    frequency: { label: 'Reducing over 5 weeks' },
    slots: [],
    site: { code: 'OD', label: 'Right eye' },
    taper: [
      { id: 'w1', periodLabel: 'Week 1', frequencyLabel: '6 times daily' },
      { id: 'w2', periodLabel: 'Week 2', frequencyLabel: '4 times daily' },
      { id: 'w3', periodLabel: 'Week 3', frequencyLabel: '3 times daily' },
      { id: 'w4', periodLabel: 'Week 4', frequencyLabel: '2 times daily' },
      { id: 'w5', periodLabel: 'Week 5', frequencyLabel: 'Once daily, then stop' }
    ],
    separationNote: 'Shake the bottle well. Wait 5 minutes between different eye drops.',
    instructions: ['One drop each time.']
  })
};

export const EarDropsLeftEar: Story = {
  render: () => render({
    medication: { label: 'Ciprofloxacin', strength: '0.3%', formLabel: 'Ear drops', form: 'drop' },
    unit: drop,
    frequency: { label: 'Twice daily' },
    slots: [slot('m', 'Morning', 4), slot('n', 'Night', 4)],
    site: { code: 'AS', label: 'Left ear' },
    duration: '7 days',
    instructions: ['Lie on your side for 5 minutes after the drops.']
  })
};

export const EyeOintmentNight: Story = {
  render: () => render({
    medication: { label: 'Chloramphenicol', strength: '1%', formLabel: 'Eye ointment', form: 'ointment' },
    frequency: { label: 'Once daily at night' },
    slots: [slot('n', 'Night', null, { amountLabel: '1 cm ribbon' })],
    site: { label: 'Lower eyelid, left eye' },
    duration: '5 days'
  })
};

export const SkinCreamTwiceDaily: Story = {
  render: () => render({
    medication: { label: 'Hydrocortisone', strength: '1%', formLabel: 'Cream', form: 'cream' },
    frequency: { label: 'Twice daily' },
    slots: [slot('m', 'Morning', null, { amountLabel: '1 fingertip unit' }), slot('n', 'Night', null, { amountLabel: '1 fingertip unit' })],
    site: { label: 'Affected area' },
    duration: '7 days',
    instructions: ['Apply a thin layer and rub in gently.']
  })
};

export const SyrupTeaspoon: Story = {
  render: () => render({
    medication: { label: 'Paracetamol', strength: '125 mg per 5 mL', formLabel: 'Syrup', form: 'liquid' },
    unit: { one: 'mL', other: 'mL' },
    frequency: { label: 'Three times daily' },
    slots: mna(5, 5, 5).map((s) => ({ ...s, householdLabel: '1 teaspoon' })),
    route: 'By mouth',
    duration: '3 days',
    instructions: ['Use the measuring spoon or syringe supplied.']
  })
};

export const NasalSprayBothNostrils: Story = {
  render: () => render({
    medication: { label: 'Fluticasone', strength: '50 micrograms per spray', formLabel: 'Nasal spray', form: 'spray' },
    unit: { one: 'spray', other: 'sprays' },
    frequency: { label: 'Twice daily' },
    slots: [slot('m', 'Morning', 2), slot('n', 'Night', 2)],
    site: { label: 'Both nostrils' },
    duration: '14 days',
    instructions: ['Two sprays into each nostril.']
  })
};

export const InhalerPuffs: Story = {
  render: () => render({
    medication: { label: 'Salbutamol', strength: '100 micrograms per puff', formLabel: 'Inhaler', form: 'inhaler' },
    unit: { one: 'puff', other: 'puffs' },
    frequency: { label: 'Only when needed' },
    slots: [slot('dose', 'Each dose', 2)],
    prn: { label: 'Use if wheezy or breathless', maxLabel: 'No more than 8 puffs in 24 hours' },
    instructions: ['Shake well. Wait 1 minute between puffs.']
  })
};

export const InsulinUnits: Story = {
  render: () => render({
    medication: { label: 'Insulin (synthetic example)', strength: '100 units per mL', formLabel: 'Injection', form: 'injection' },
    unit: { one: 'unit', other: 'units' },
    frequency: { label: 'Twice daily' },
    slots: [slot('m', 'Before breakfast', 10), slot('n', 'Before dinner', 14)],
    route: 'Under the skin',
    site: { label: 'Abdomen or thigh' },
    duration: 'Ongoing'
  })
};

export const PrescriptionSheet: Story = {
  render: () => ({
    props: {
      models: [
        paracetamol(),
        timolol,
        { ...timolol, medication: { label: 'Prednisolone acetate', strength: '1%', formLabel: 'Eye drops', form: 'drop' }, frequency: { label: 'Reducing over 3 weeks' }, slots: [], site: { code: 'OS', label: 'Left eye' }, taper: [
          { id: 'w1', periodLabel: 'Week 1', frequencyLabel: '4 times daily' },
          { id: 'w2', periodLabel: 'Week 2', frequencyLabel: '2 times daily' },
          { id: 'w3', periodLabel: 'Week 3', frequencyLabel: 'Once daily, then stop' }
        ], separationNote: undefined } satisfies DoseScheduleViewModel,
        {
          medication: { label: 'Hydrocortisone', strength: '1%', formLabel: 'Cream', form: 'cream' },
          frequency: { label: 'Twice daily' },
          slots: [slot('m', 'Morning', null, { amountLabel: '1 fingertip unit' }), slot('n', 'Night', null, { amountLabel: '1 fingertip unit' })],
          site: { label: 'Affected area' },
          duration: '7 days'
        } satisfies DoseScheduleViewModel,
        {
          medication: { label: 'Paracetamol', strength: '125 mg per 5 mL', formLabel: 'Syrup', form: 'liquid' },
          unit: { one: 'mL', other: 'mL' },
          frequency: { label: 'Three times daily' },
          slots: mna(5, 5, 5).map((s) => ({ ...s, householdLabel: '1 teaspoon' })),
          duration: '3 days'
        } satisfies DoseScheduleViewModel
      ]
    },
    template: `<div class="emr-print" style="display: grid; gap: 12px; max-width: 720px">@for (m of models; track $index) { <emr-dose-schedule [model]="m" /> }</div>`
  })
};

export const ReadOnly: Story = { render: () => render(paracetamol({ readOnly: true, canEdit: true, canShowInstructions: true, status: { label: 'Completed', tone: 'neutral' } })) };

export const LongNames: Story = {
  render: () => render(paracetamol({
    medication: { label: 'Synthetic combination preparation of paracetamol with a very long descriptive generic name', strength: '500 mg / 8 mg / 30 mg', formLabel: 'Film-coated modified-release tablet', form: 'tablet' },
    slots: mna(1.5, 0.25, 2),
    instructions: [
      'Swallow whole with a full glass of water and do not crush, chew or break the tablet unless a clinician has specifically told you that this particular strength may be split along the score line.',
      'If a dose is missed, take it as soon as you remember unless it is nearly time for the next dose.'
    ],
    separationNote: 'Keep at least four hours between doses and do not take any other medicine containing the same ingredient.'
  }))
};

export const Mobile: Story = {
  render: () => ({
    props: { model: paracetamol({ frequency: { code: 'QID', label: 'Four times daily' }, slots: four(1, 0.5, 1, 2), canEdit: true }) },
    template: `<div style="width: 360px; max-width: 100%"><emr-dose-schedule [model]="model" /></div>`
  })
};
