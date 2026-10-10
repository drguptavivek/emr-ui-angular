import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { GazePosition, MotilityCell, MotilityEye, OcularMotilityViewModel } from '@drguptavivek/emr-controller';
import { EmrOcularMotilityChartComponent } from '../domain/emr-ocular-motility-chart.component';

const meta: Meta<EmrOcularMotilityChartComponent> = {
  title: 'EMR / Ophthalmology / Motility chart',
  component: EmrOcularMotilityChartComponent,
  decorators: [moduleMetadata({ imports: [EmrOcularMotilityChartComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled nine-gaze (3x3) motility or duction grid, one per eye or one binocular. Every cell shows the controller-supplied value, status and optional badge, with the supplied position label printed inside the cell so no left or right has to be inferred. The component never grades, mirrors positions, decides which positions apply or judges normality.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrOcularMotilityChartComponent>;

const positionLabels: Record<GazePosition, string> = {
  'up-right': 'Up and right', up: 'Up', 'up-left': 'Up and left',
  right: 'Right', primary: 'Primary', left: 'Left',
  'down-right': 'Down and right', down: 'Down', 'down-left': 'Down and left'
};

const rec = (valueLabel: string, extra: Partial<MotilityCell> = {}): MotilityCell => ({ valueLabel, status: 'recorded', ...extra });
const none = (status: MotilityCell['status']): MotilityCell => ({ valueLabel: null, status });
const full = (): Record<GazePosition, MotilityCell> => ({
  'up-right': rec('Full'), up: rec('Full'), 'up-left': rec('Full'),
  right: rec('Full'), primary: rec('Full'), left: rec('Full'),
  'down-right': rec('Full'), down: rec('Full'), 'down-left': rec('Full')
});

const od = (cells: Partial<Record<GazePosition, MotilityCell>> = full()): MotilityEye => ({ eyeId: 'od', label: 'Right eye', shortLabel: 'OD', cells });
const os = (cells: Partial<Record<GazePosition, MotilityCell>> = full()): MotilityEye => ({ eyeId: 'os', label: 'Left eye', shortLabel: 'OS', cells });

const chart = (eyes: MotilityEye[], extra: Partial<OcularMotilityViewModel> = {}): OcularMotilityViewModel => ({
  id: 'mt-1', title: 'Ocular motility', layout: 'per-eye', eyes, positionLabels,
  summaryText: 'Nine-position motility chart for each eye.',
  ...extra
});

const render = (model: OcularMotilityViewModel) => ({
  props: { model },
  template: `<div style="max-width: 760px"><emr-ocular-motility-chart [model]="model" /></div>`
});

export const PerEyeNormal: Story = { render: () => render(chart([od(), os()])) };

export const Binocular: Story = {
  render: () => render(chart(
    [{ eyeId: 'ou', label: 'Both eyes', shortLabel: 'OU', cells: { ...full(), primary: rec('Orthophoric'), 'up-left': rec('Full'), 'down-right': rec('Full') } }],
    { layout: 'binocular', title: 'Versions', summaryText: 'Nine-position version chart, both eyes together.' }
  ))
};

const under = (label: string, tone: 'warning' | 'danger' | 'info' = 'warning') => ({ label, tone });

export const UnderactionWithBadges: Story = {
  render: () => render(chart([
    od({ ...full(), left: rec('-2', { badge: under('Underaction'), note: 'Abduction deficit' }), 'up-left': rec('-1', { badge: under('Underaction') }), 'down-left': rec('-1', { badge: under('Underaction') }) }),
    os()
  ], { selected: { eyeId: 'od', position: 'left' } }))
};

export const PartiallyAssessed: Story = {
  render: () => render(chart([
    od({
      ...full(),
      'up-right': none('unable-to-assess'), up: none('unable-to-assess'), 'up-left': none('unable-to-assess'),
      'down-right': none('not-assessed'), down: none('not-assessed')
    }),
    os({
      right: rec('Full'), primary: rec('Full'), left: rec('Full'),
      'up-right': none('declined'), 'down-left': none('not-applicable'), down: none('unknown'),
      up: rec('Full', { note: 'Recorded as a recheck' })
    })
  ]))
};

export const ReadOnly: Story = {
  render: () => render(chart([
    od({ ...full(), right: rec('-1', { badge: under('Underaction', 'info') }) }),
    os()
  ], { readOnly: true, selected: { eyeId: 'od', position: 'right' } }))
};

export const LongLabels: Story = {
  render: () => render(chart(
    [od({
      ...full(),
      'up-right': rec('Mild restriction', { note: 'Limited on attempted elevation with pain reported by the patient', badge: under('Possible mechanical restriction') }),
      primary: rec('Full range of movement without nystagmus')
    }), os()],
    { positionLabels: { ...positionLabels, 'up-right': 'Dextroelevation (up and to the patient\'s right)', 'down-left': 'Laevodepression (down and to the patient\'s left)' } }
  ))
};

export const Mobile: Story = {
  render: () => ({
    props: { model: chart([od({ ...full(), left: rec('-2', { badge: under('Underaction') }) }), os()], { selected: { eyeId: 'od', position: 'left' } }) },
    template: `<div style="width: 360px; max-width: 100%"><emr-ocular-motility-chart [model]="model" /></div>`
  })
};
