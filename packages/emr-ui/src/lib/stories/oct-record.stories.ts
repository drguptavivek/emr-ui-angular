import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { OctEyeRecord, OctFinding, OctFindingRecordViewModel, OctFrameRef } from '@drguptavivek/emr-controller';
import type { DiagnosticMetric, EmrBadge } from '@drguptavivek/emr-controller';
import { EmrOctFindingRecordComponent } from '../domain/emr-oct-finding-record.component';

const meta: Meta<EmrOctFindingRecordComponent> = {
  title: 'EMR / Ophthalmology / OCT record',
  component: EmrOctFindingRecordComponent,
  decorators: [moduleMetadata({ imports: [EmrOctFindingRecordComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled, display-first OCT record: both eyes side by side (stacked on narrow hosts) with scan details, frame thumbnails, supplied measurements, coded findings and an interpretation. The controller supplies every label, badge and verdict; the component never measures, grades, compares to norms or derives laterality. Add, edit, remove and frame choices leave as intents. Thumbnails here are synthetic grey placeholders.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrOctFindingRecordComponent>;

/** Synthetic grey placeholder drawn from an inline SVG, never a real scan. */
const thumb = (seed: number): string => {
  const bands = Array.from({ length: 9 }, (_, i) => `<path d="M0 ${34 + i * 9 + (seed % 3) * 2} Q60 ${28 + i * 9 + seed * 2} 120 ${34 + i * 9}" stroke="#${i % 2 ? '8a8a8a' : 'b0b0b0'}" stroke-width="3" fill="none"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"><rect width="120" height="90" fill="#555"/>${bands}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const frame = (eye: string, n: number, label: string, kind: OctFrameRef['kind'], withThumb = true): OctFrameRef => ({
  frameId: `${eye}-f${n}`, seriesId: `${eye}-s1`, label, kind, altText: `Synthetic placeholder for ${label.toLowerCase()}`, ...(withThumb ? { thumbnailUrl: thumb(n) } : {}), width: 512, height: 496
});

const ok: EmrBadge = { label: 'Within reference range', tone: 'success' };
const high: EmrBadge = { label: 'Above reference range', tone: 'warning' };
const low: EmrBadge = { label: 'Below reference range', tone: 'warning' };

const metric = (id: string, label: string, valueLabel: string, referenceLabel: string, status: EmrBadge = ok): DiagnosticMetric => ({ id, label, valueLabel, referenceLabel, status });
const finding = (eye: string, i: number, label: string, locationLabel: string | undefined, extra: Partial<OctFinding> = {}): OctFinding => ({
  id: `${eye}-fd${i}`, path: ['octRecord', 'eyes', eye, 'findings', i], label, locationLabel, status: 'recorded', ...extra
});
const meta2 = (date: string, quality: string, protocol = 'Macular cube 512 x 128') => [
  { label: 'Device', value: 'Synthetic SD-OCT' }, { label: 'Protocol', value: protocol }, { label: 'Scan date', value: date }, { label: 'Signal quality', value: quality }
];

const od: OctEyeRecord = {
  eyeId: 'od', label: 'Right eye', shortLabel: 'OD', status: 'recorded', metadata: meta2('12 Mar 2026', 'Good (8/10)'),
  frames: [frame('od', 1, 'Horizontal B-scan through fovea', 'b-scan'), frame('od', 2, 'Vertical B-scan through fovea', 'b-scan'), frame('od', 3, 'Retinal thickness map', 'thickness-map')],
  selectedFrameId: 'od-f1',
  metrics: [metric('cst', 'Central subfield thickness (CST)', '268 µm', '220–300 µm')],
  findings: [
    finding('od', 0, 'Drusen', 'Parafoveal', { badge: { label: 'Small, hard', tone: 'neutral' }, frameId: 'od-f2' }),
    finding('od', 1, 'Epiretinal membrane (ERM)', 'Superotemporal arcade', { badge: { label: 'Present', tone: 'info' }, note: 'No traction on the foveal contour noted by the reader.', code: { system: 'SNOMED CT', code: '367510001', display: 'Epiretinal membrane' } })
  ],
  interpretation: 'Normal foveal contour. Small parafoveal drusen. Mild epiretinal membrane along the superotemporal arcade.'
};

const os: OctEyeRecord = {
  eyeId: 'os', label: 'Left eye', shortLabel: 'OS', status: 'recorded', metadata: meta2('12 Mar 2026', 'Fair (6/10)'),
  frames: [frame('os', 1, 'Horizontal B-scan through fovea', 'b-scan'), frame('os', 2, 'Vertical B-scan through fovea', 'b-scan'), frame('os', 3, 'Retinal thickness map', 'thickness-map')],
  selectedFrameId: 'os-f1',
  metrics: [metric('cst', 'Central subfield thickness (CST)', '341 µm', '220–300 µm', high)],
  findings: [
    finding('os', 0, 'Subretinal fluid', 'Subfoveal', { badge: { label: 'Present', tone: 'warning' }, frameId: 'os-f1', note: 'Shallow neurosensory detachment under the fovea.' }),
    finding('os', 1, 'Intraretinal cysts', 'Parafoveal', { badge: { label: 'Present', tone: 'warning' }, frameId: 'os-f1' }),
    finding('os', 2, 'Epiretinal membrane (ERM)', 'Superotemporal arcade', { badge: { label: 'Present', tone: 'info' } }),
    finding('os', 3, 'Drusen', 'Subfoveal', { status: 'unable-to-assess', note: 'Signal too weak under the fluid to comment.' })
  ],
  interpretation: 'Subfoveal subretinal fluid with parafoveal intraretinal cysts. Epiretinal membrane present superotemporally.'
};

const rnfl = (eye: string, sup: [string, EmrBadge], inf: [string, EmrBadge], nas: [string, EmrBadge], tem: [string, EmrBadge]): DiagnosticMetric[] => [
  metric(`${eye}-sup`, 'RNFL superior', sup[0], '100–140 µm', sup[1]),
  metric(`${eye}-inf`, 'RNFL inferior', inf[0], '105–145 µm', inf[1]),
  metric(`${eye}-nas`, 'RNFL nasal', nas[0], '60–90 µm', nas[1]),
  metric(`${eye}-tem`, 'RNFL temporal', tem[0], '60–85 µm', tem[1])
];

const model = (eyes: OctEyeRecord[], extra: Partial<OctFindingRecordViewModel> = {}): OctFindingRecordViewModel => ({ id: 'oct-1', title: 'OCT macula', eyes, messages: [], ...extra });
const render = (m: OctFindingRecordViewModel) => ({ props: { m }, template: `<div class="emr-story-surface"><emr-oct-finding-record [model]="m" /></div>` });

export const MacularBothEyes: Story = { render: () => render(model([od, os])) };

export const RnflWithMetrics: Story = {
  render: () => render(model([
    { ...od, metadata: meta2('12 Mar 2026', 'Good (8/10)', 'Optic disc cube 200 x 200'), frames: [frame('od', 1, 'Peripapillary circle B-scan', 'b-scan'), frame('od', 2, 'RNFL thickness map', 'thickness-map'), frame('od', 3, 'RNFL report', 'report', false)],
      metrics: [metric('cst', 'Central subfield thickness (CST)', '268 µm', '220–300 µm'), ...rnfl('od', ['121 µm', ok], ['128 µm', ok], ['74 µm', ok], ['69 µm', ok])],
      findings: [], interpretation: 'RNFL thickness reported by the device in all four quadrants.' },
    { ...os, metadata: meta2('12 Mar 2026', 'Good (7/10)', 'Optic disc cube 200 x 200'), frames: [frame('os', 1, 'Peripapillary circle B-scan', 'b-scan'), frame('os', 2, 'RNFL thickness map', 'thickness-map'), frame('os', 3, 'RNFL report', 'report', false)],
      metrics: [metric('cst', 'Central subfield thickness (CST)', '341 µm', '220–300 µm', high), ...rnfl('os', ['96 µm', low], ['98 µm', low], ['71 µm', ok], ['66 µm', ok])],
      findings: [], interpretation: undefined }
  ]))
};

export const OneEyeNotAssessed: Story = {
  render: () => render(model([od, { eyeId: 'os', label: 'Left eye', shortLabel: 'OS', status: 'not-assessed', metadata: [], frames: [], metrics: [], findings: [] }]))
};

export const NoFramesSupplied: Story = {
  render: () => render(model([{ ...od, frames: [], selectedFrameId: undefined }, { ...os, frames: [frame('os', 1, 'Horizontal B-scan through fovea', 'b-scan', false)], selectedFrameId: 'os-f1' }]))
};

export const WithValidationMessages: Story = {
  render: () => render(model([od, os], {
    messages: [
      { path: ['octRecord', 'eyes', 'os', 'findings', 3], severity: 'warning', message: 'Left eye drusen finding has status "Unable to assess" and no coded value.' },
      { path: ['octRecord', 'eyes', 'od', 'interpretation'], severity: 'error', message: 'Right eye interpretation must be signed off before the record can be finalised.' },
      { path: ['octRecord'], severity: 'info', message: 'Signal quality is below the department target for the left eye.' }
    ]
  }))
};

export const ReadOnly: Story = { render: () => render(model([od, os], { readOnly: true })) };

export const Loading: Story = { render: () => render(model([], { loading: true })) };

const ErrorStory: Story = { render: () => render(model([], { error: 'The OCT service did not respond. Try again.' })) };
export { ErrorStory as Error };

const many = (eye: string): OctFinding[] => ['Drusen', 'Intraretinal cysts', 'Subretinal fluid', 'Epiretinal membrane (ERM)', 'Pigment epithelial detachment', 'Hyperreflective foci', 'Ellipsoid zone disruption', 'Vitreomacular traction', 'Outer retinal tubulation', 'Choroidal thickening']
  .map((l, i) => finding(eye, i, l, ['Subfoveal', 'Parafoveal', 'Superotemporal arcade', 'Inferonasal', 'Temporal macula'][i % 5], { badge: { label: i % 2 ? 'Present' : 'Mild', tone: i % 2 ? 'warning' : 'info' }, note: i % 3 === 0 ? 'Reader note: see frame for extent.' : undefined, frameId: `${eye}-f${(i % 3) + 1}` }));

export const ManyFindings: Story = { render: () => render(model([{ ...od, findings: many('od') }, { ...os, findings: many('os').slice(0, 7) }])) };

export const Mobile: Story = {
  render: () => ({ props: { m: model([od, os]) }, template: `<div class="emr-story-surface"><div style="width: 360px; max-width: 100%"><emr-oct-finding-record [model]="m" /></div></div>` })
};
