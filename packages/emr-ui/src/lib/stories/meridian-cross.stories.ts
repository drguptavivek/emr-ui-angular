import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { CrossMeridian, MeridianCrossEye, MeridianCrossViewModel } from '@drguptavivek/emr-controller';
import { EmrMeridianCrossComponent } from '../domain/emr-meridian-cross.component';

const meta: Meta<EmrMeridianCrossComponent> = {
  title: 'EMR / Ophthalmology / Meridian cross',
  component: EmrMeridianCrossComponent,
  decorators: [moduleMetadata({ imports: [EmrMeridianCrossComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled optical (power) cross and retinoscopy cross, one panel per eye, OD on the viewer\'s left. Two meridians are drawn at the controller-supplied axes using the TABO convention (0 degrees to the viewer\'s right, counter-clockwise, 90 degrees up, as the examiner sees the eye) and each carries its supplied power at the line end. The component never sums, transposes, normalises an axis or adjusts for working distance.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrMeridianCrossComponent>;

const mer = (axisDeg: number, powerLabel: string, power: string): CrossMeridian => ({
  axisDeg,
  powerLabel,
  assistiveLabel: `Axis ${axisDeg} degrees, ${power}`
});

const od = (extra: Partial<MeridianCrossEye> = {}): MeridianCrossEye => ({
  eyeId: 'od', label: 'Right eye', shortLabel: 'OD', status: 'recorded',
  meridians: [mer(180, '-1.00 D', 'minus 1.00 dioptres'), mer(90, '-2.50 D', 'minus 2.50 dioptres')],
  ...extra
});
const os = (extra: Partial<MeridianCrossEye> = {}): MeridianCrossEye => ({
  eyeId: 'os', label: 'Left eye', shortLabel: 'OS', status: 'recorded',
  meridians: [mer(30, '+0.50 D', 'plus 0.50 dioptres'), mer(120, '+1.75 D', 'plus 1.75 dioptres')],
  ...extra
});

const optical = (eyes: MeridianCrossEye[], extra: Partial<MeridianCrossViewModel> = {}): MeridianCrossViewModel => ({
  id: 'mc-1', kind: 'optical', title: 'Spectacle power cross', eyes,
  summaryText: 'Power cross for both eyes, drawn as the examiner sees them.',
  ...extra
});

const retino = (eyes: MeridianCrossEye[]): MeridianCrossViewModel => ({
  id: 'mc-r', kind: 'retinoscopy', title: 'Retinoscopy', eyes,
  summaryText: 'Retinoscopy cross for both eyes with working distance and gross or net readings.'
});

const render = (model: MeridianCrossViewModel) => ({
  props: { model },
  template: `<div style="max-width: 760px"><emr-meridian-cross [model]="model" /></div>`
});

export const OpticalCrossBothEyes: Story = { render: () => render(optical([od(), os()])) };

export const OpticalCrossObliqueAxis: Story = {
  render: () => render(optical([
    od({ meridians: [mer(15, '-0.75 D', 'minus 0.75 dioptres'), mer(105, '-2.00 D', 'minus 2.00 dioptres')] }),
    os({ meridians: [mer(135, '+1.00 D', 'plus 1.00 dioptres'), mer(45, '+2.25 D', 'plus 2.25 dioptres')] })
  ]))
};

export const RetinoscopyCross: Story = {
  render: () => render(retino([
    od({
      meridians: [mer(180, '+1.50 D', 'plus 1.50 dioptres'), mer(90, '+0.25 D', 'plus 0.25 dioptres')],
      captionLines: ['Working distance 66 cm', 'Gross readings'],
      flag: { label: 'Cycloplegic', tone: 'info' }
    }),
    os({
      meridians: [mer(30, '+1.25 D', 'plus 1.25 dioptres'), mer(120, '+0.50 D', 'plus 0.50 dioptres')],
      captionLines: ['Working distance 66 cm', 'Gross readings'],
      flag: { label: 'Cycloplegic', tone: 'info' }
    })
  ]))
};

export const OneEyeNotAssessed: Story = {
  render: () => render(optical([od(), os({ status: 'not-assessed', meridians: undefined })]))
};

export const UnableToAssess: Story = {
  render: () => render(optical([
    od({ status: 'unable-to-assess', meridians: undefined, captionLines: ['Poor fixation'], flag: { label: 'Repeat visit', tone: 'warning' } }),
    os({ status: 'unable-to-assess', meridians: undefined, captionLines: ['Poor fixation'] })
  ]))
};

export const Declined: Story = {
  render: () => render(optical([od({ status: 'declined', meridians: undefined }), os({ status: 'declined', meridians: undefined })]))
};

export const ReadOnly: Story = { render: () => render(optical([od(), os()], { readOnly: true })) };

export const LongCaptions: Story = {
  render: () => render(retino([
    od({
      meridians: [mer(175, '-12.00 D', 'minus 12.00 dioptres'), mer(85, '-14.25 D', 'minus 14.25 dioptres')],
      captionLines: [
        'Working distance 50 cm using a trial frame with the patient fixing a distant target through the lens bar',
        'Net readings after working distance allowance, supplied by the examiner',
        'Reflex dull and slow, difficult to neutralise in the horizontal meridian'
      ]
    }),
    os({ captionLines: ['Working distance 50 cm'] })
  ]))
};

export const Mobile: Story = {
  render: () => ({
    props: { model: optical([od(), os()]) },
    template: `<div style="width: 360px; max-width: 100%"><emr-meridian-cross [model]="model" /></div>`
  })
};
