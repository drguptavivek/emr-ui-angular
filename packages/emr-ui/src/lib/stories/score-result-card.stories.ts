import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ScoreResultCardViewModel } from '@drguptavivek/emr-controller';
import { EmrScoreResultCardComponent } from '../domain/emr-score-result-card.component';

const meta: Meta<EmrScoreResultCardComponent> = {
  title: 'EMR / Scores / Result card',
  component: EmrScoreResultCardComponent,
  decorators: [moduleMetadata({ imports: [EmrScoreResultCardComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled card that shows a controller-computed score: total, band badge, component breakdown, interpretation and computed-at time. The card never sums components, thresholds a total or picks a band label or tone; all of those come from the controller. Stories use synthetic NEWS2 and PHQ-9 results.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrScoreResultCardComponent>;

const news2: ScoreResultCardViewModel = {
  id: 'news2',
  instrumentLabel: 'NEWS2 early warning score',
  result: {
    total: 7,
    bandLabel: 'High clinical risk',
    bandTone: 'danger',
    interpretation: 'Emergency assessment by a critical-care competent team. Consider transfer to a higher level of care.',
    computedAt: '2026-03-14T09:42:00Z',
    components: [
      { id: 'resp', label: 'Respiration rate', value: 2 },
      { id: 'spo2', label: 'SpO2 (scale 1)', value: 1 },
      { id: 'air', label: 'Air or oxygen', value: 2 },
      { id: 'sbp', label: 'Systolic blood pressure', value: 1 },
      { id: 'pulse', label: 'Pulse', value: 0 },
      { id: 'cons', label: 'Consciousness', value: 0 },
      { id: 'temp', label: 'Temperature', value: 1 }
    ]
  },
  canRecompute: true,
  canViewDetail: true
};

const phq9Items = ['Little interest or pleasure', 'Feeling down or hopeless', 'Sleep problems', 'Tired or little energy', 'Appetite changes', 'Feeling bad about yourself', 'Trouble concentrating', 'Slowed or restless', 'Thoughts of self-harm'];
const phq9: ScoreResultCardViewModel = {
  id: 'phq9',
  instrumentLabel: 'PHQ-9 depression screen',
  result: {
    total: 12,
    bandLabel: 'Moderate depression',
    bandTone: 'warning',
    interpretation: 'Review the patient for treatment planning. Item 9 is scored 1, so ask about safety before the visit ends.',
    computedAt: '2026-03-14T10:05:00Z',
    components: phq9Items.map((label, i) => ({ id: `q${i + 1}`, label: `${i + 1}. ${label}`, value: [1, 2, 1, 2, 1, 2, 1, 1, 1][i] }))
  },
  canRecompute: true,
  canViewDetail: true
};

const render = (model: ScoreResultCardViewModel, width = 560) => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}px"><emr-score-result-card [model]="model" /></div></div>`
});

export const EarlyWarningScore: Story = { render: () => render(news2) };
export const Phq9WithComponents: Story = { render: () => render(phq9) };
export const Compact: Story = {
  render: () => ({
    props: { a: { ...news2, compact: true }, b: { ...phq9, compact: true }, c: { ...news2, instrumentLabel: 'NEWS2 (previous set of observations)', compact: true, stale: true, staleLabel: 'Inputs changed', canViewDetail: false } },
    template: `<div class="emr-story-surface"><div style="display: grid; gap: 8px; max-width: 720px">
      <emr-score-result-card [model]="a" /><emr-score-result-card [model]="b" /><emr-score-result-card [model]="c" /></div></div>`
  })
};
export const NotAssessed: Story = { render: () => render({ ...phq9, result: null, status: 'not-assessed' }) };
export const UnableToAssess: Story = { render: () => render({ ...news2, result: null, status: 'unable-to-assess', canViewDetail: false }) };
export const Stale: Story = { render: () => render({ ...phq9, stale: true, staleLabel: 'Answers changed since this score was calculated' }) };
export const Loading: Story = { render: () => render({ ...news2, loading: true }) };
export const Error: Story = { render: () => render({ ...news2, result: null, error: 'The scoring service did not respond.' }) };
export const LongInterpretation: Story = {
  render: () => render({
    ...phq9,
    result: {
      ...phq9.result!,
      bandLabel: 'Moderately severe depression, with a positive response to the self-harm item',
      interpretation:
        'Active treatment with pharmacotherapy and psychotherapy is suggested. Because item 9 is non-zero, document a suicide-risk assessment, confirm the safety plan and agree a follow-up contact within one week. Repeat this screen at every visit to follow the response to treatment.'
    }
  })
};
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({
    props: { a: phq9, b: { ...news2, compact: true } },
    template: `<div class="emr-story-surface"><div style="display: grid; gap: 8px; max-width: 360px">
      <emr-score-result-card [model]="a" /><emr-score-result-card [model]="b" /></div></div>`
  })
};
