import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { EmrBadge, QueueCard, QueueStation, WorkQueueViewModel } from '@drguptavivek/emr-controller';
import { EmrWorkQueueComponent } from '../domain/emr-work-queue.component';

const meta: Meta<EmrWorkQueueComponent> = {
  title: 'EMR / Scheduling / Work queue',
  component: EmrWorkQueueComponent,
  decorators: [moduleMetadata({ imports: [EmrWorkQueueComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled station board for an ophthalmology OPD (Registration, Vision, Refraction, Dilation, Doctor, Counselling). The MRN leads every card, priority is a text badge, and all wait text, counts and ordering come from the controller. The component emits select, call-next, move and open intents and never computes waits or priority. Narrow screens show one station at a time with a station switcher.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrWorkQueueComponent>;

const urgent: EmrBadge = { label: 'Urgent', tone: 'danger' };
const elderly: EmrBadge = { label: 'Senior citizen', tone: 'info' };
const follow: EmrBadge = { label: 'Follow-up', tone: 'neutral' };
const dilated: EmrBadge = { label: 'Dilated', tone: 'warning' };

let seq = 0;
const card = (name: string, mrn: string, ageSex: string, wait: string, extra: Partial<QueueCard> = {}): QueueCard => {
  seq += 1;
  return { id: `c${seq}`, patientId: `p${seq}`, tokenLabel: `Token ${40 + seq}`, displayName: name, primaryIdentifier: mrn, ageSexLabel: ageSex, waitLabel: wait, ...extra };
};
const station = (id: string, label: string, cards: QueueCard[], canCallNext = cards.length > 0): QueueStation => ({
  id, label, countLabel: `${cards.length} waiting`, cards, canCallNext
});

const stationList = [
  { value: 'registration', label: 'Registration' },
  { value: 'vision', label: 'Vision' },
  { value: 'refraction', label: 'Refraction' },
  { value: 'dilation', label: 'Dilation' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'counselling', label: 'Counselling' }
];

const opd = (extra: Partial<WorkQueueViewModel> = {}): WorkQueueViewModel => {
  seq = 0;
  return {
    id: 'opd',
    title: 'Ophthalmology OPD',
    updatedLabel: 'Updated 10:42',
    emptyMessage: 'No patients waiting.',
    moveTargets: stationList,
    selectedCardId: 'c4',
    stations: [
      station('registration', 'Registration', [
        card('Asha Verma', 'MRN-T-100231', '58 F', '4 min', { nextStepLabel: 'Next: Visual acuity' }),
        card('Ravi Kumar', 'MRN-T-100232', '34 M', '2 min', { nextStepLabel: 'Next: Visual acuity' })
      ]),
      station('vision', 'Vision', [
        card('Meera Iyer', 'MRN-T-100198', '71 F', '12 min', { nextStepLabel: 'Next: Refraction', priority: elderly }),
        card('Sanjay Patil', 'MRN-T-100204', '46 M', '9 min', { nextStepLabel: 'Next: Refraction' }),
        card('Farida Khan', 'MRN-T-100207', '29 F', '5 min', { nextStepLabel: 'Next: Doctor', flags: [follow] })
      ]),
      station('refraction', 'Refraction', [
        card('Lakshmi Nair', 'MRN-T-100176', '63 F', '15 min', { nextStepLabel: 'Next: Dilation' })
      ]),
      station('dilation', 'Dilation', [
        card('Gopal Das', 'MRN-T-100161', '67 M', '20 min', { nextStepLabel: 'Next: Doctor', flags: [dilated] }),
        card('Nisha Rao', 'MRN-T-100165', '52 F', '8 min', { nextStepLabel: 'Next: Doctor', flags: [dilated] })
      ]),
      station('doctor', 'Doctor', [
        card('Imran Sheikh', 'MRN-T-100142', '41 M', '25 min', { nextStepLabel: 'Next: Counselling', priority: urgent }),
        card('Kavita Menon', 'MRN-T-100150', '55 F', '18 min', { nextStepLabel: 'Next: Counselling' }),
        card('Harish Bhat', 'MRN-T-100153', '60 M', '10 min', { nextStepLabel: 'Next: Counselling' })
      ]),
      station('counselling', 'Counselling', [
        card('Pooja Singh', 'MRN-T-100118', '38 F', '6 min', { nextStepLabel: 'Next: Billing' })
      ])
    ],
    ...extra
  };
};

const render = (model: WorkQueueViewModel, width?: string) => ({
  props: { model, last: '' },
  template: `<div class="emr-story-surface" ${width ? `style="width: ${width}; max-width: 100%"` : ''}>
    <emr-work-queue [model]="model" (intent)="last = (last ? last + ' | ' : '') + $any($event).type" />
    <p style="margin: 8px 0 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted)">Intents: {{ last || 'none yet' }}</p>
  </div>`
});

export const OphthalmologyOpd: Story = { render: () => render(opd()) };

export const SingleStation: Story = {
  render: () => {
    const m = opd();
    const doctor = m.stations.find((s) => s.id === 'doctor')!;
    return render({ ...m, title: 'My list: Dr Example', stations: [doctor], selectedCardId: undefined });
  }
};

export const WithPriorities: Story = {
  render: () => {
    const m = opd();
    const priorities: EmrBadge[] = [urgent, { label: 'Emergency', tone: 'danger' }, elderly, { label: 'Pre-op', tone: 'warning' }, { label: 'Routine', tone: 'success' }];
    const tag = (c: QueueCard, i: number): QueueCard => ({
      ...c,
      priority: priorities[i % 5],
      flags: i % 2 ? [follow, dilated] : undefined
    });
    return render({ ...m, stations: m.stations.map((s) => ({ ...s, cards: s.cards.map(tag) })) });
  }
};

export const Empty: Story = {
  render: () => render(opd({ selectedCardId: undefined, stations: opd().stations.map((s) => ({ ...s, countLabel: '0 waiting', cards: [], canCallNext: false })) }))
};

export const Loading: Story = { render: () => render(opd({ loading: true })) };

export const Error: Story = { render: () => render(opd({ error: 'The queue could not be loaded. Check the connection and try again.' })) };

export const ReadOnly: Story = { render: () => render(opd({ readOnly: true })) };

export const HundredCards: Story = {
  render: () => {
    seq = 0;
    const many = (n: number): QueueCard[] => Array.from({ length: n }, (_, i) => card(`Synthetic Patient ${i + 1}`, `MRN-T-${200000 + i}`, `${20 + (i % 60)} ${i % 2 ? 'F' : 'M'}`, `${1 + (i % 45)} min`, { nextStepLabel: 'Next: Doctor', priority: i % 7 === 0 ? urgent : undefined }));
    const sizes = [10, 25, 30, 15, 15, 5];
    return render(opd({ selectedCardId: undefined, stations: opd().stations.map((s, i) => station(s.id, s.label, many(sizes[i]))) }));
  }
};

export const Mobile: Story = { render: () => render(opd(), '360px') };
