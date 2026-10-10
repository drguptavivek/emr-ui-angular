import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { ObservationTrendIntent, ObservationTrendViewModel, TrendPoint, TrendSeries } from '@drguptavivek/emr-controller';
import { EmrObservationTrendComponent } from '../domain/emr-observation-trend.component';

const meta: Meta<EmrObservationTrendComponent> = {
  title: 'EMR / Observations / Trend',
  component: EmrObservationTrendComponent,
  decorators: [moduleMetadata({ imports: [EmrObservationTrendComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Inline SVG line and point chart for one or two series over time (blood pressure, intraocular pressure OD and OS, HbA1c, weight-for-age). No chart library. The controller supplies the axes, ticks, reference bands, flags, growth reference curves and the plain-language summary; the component only maps them to pixels. Series differ by marker shape and dash as well as tone, points are reachable by arrow keys, and a hidden table repeats every value for screen readers.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrObservationTrendComponent>;

const high = { label: 'High', tone: 'danger' as const, assistiveText: 'above the target range' };
const pt = (id: string, x: number, y: number, xLabel: string, unit: string, flag?: TrendPoint['flag']): TrendPoint =>
  ({ id, x, y, xLabel, valueLabel: `${y} ${unit}`, flag });

const render = (model: ObservationTrendViewModel) => ({
  props: {
    model,
    onIntent(e: ObservationTrendIntent) {
      const host = this as { model: ObservationTrendViewModel };
      if (e.type === 'pointSelected') host.model = { ...host.model, selectedPointId: e.pointId };
    }
  },
  template: `<div class="emr-story-surface"><div style="max-width: 760px"><emr-observation-trend [model]="model" (intent)="onIntent($event)" /></div></div>`
});

// ---- Blood pressure -----------------------------------------------------
const days = ['03 Mar', '04 Mar', '05 Mar', '06 Mar', '07 Mar', '08 Mar', '09 Mar', '10 Mar', '11 Mar', '12 Mar'];
const sys = [128, 134, 142, 156, 148, 138, 132, 126, 124, 128];
const dia = [80, 84, 88, 96, 92, 86, 84, 80, 78, 80];
const bp: ObservationTrendViewModel = {
  id: 'bp', title: 'Blood pressure, 10 days', yLabel: 'mmHg', yMin: 40, yMax: 180, xMin: 0, xMax: 9,
  xTicks: days.map((label, x) => ({ x, label })).filter((_, i) => i % 3 === 0 || i === 9),
  yTicks: [40, 60, 80, 100, 120, 140, 160, 180].map((y) => ({ y, label: String(y) })),
  series: [
    { id: 'sys', label: 'Systolic', tone: 'danger', points: sys.map((y, i) => pt(`s${i}`, i, y, days[i], 'mmHg', y >= 140 ? high : undefined)) },
    { id: 'dia', label: 'Diastolic', tone: 'info', dashed: true, points: dia.map((y, i) => pt(`d${i}`, i, y, days[i], 'mmHg', y >= 90 ? high : undefined)) }
  ],
  bands: [{ id: 'tsys', label: 'Systolic target 100 to 130', yFrom: 100, yTo: 130, tone: 'success' }, { id: 'tdia', label: 'Diastolic target 60 to 80', yFrom: 60, yTo: 80, tone: 'info' }],
  summaryText: 'Systolic pressure rose from 128 to a peak of 156 mmHg on 06 March and returned to 128 mmHg by 12 March. Diastolic pressure followed the same pattern, peaking at 96 mmHg.',
  emptyMessage: 'No blood pressure readings recorded.'
};
export const BloodPressure: Story = { render: () => render({ ...bp, selectedPointId: 's3' }) };

// ---- Intraocular pressure ----------------------------------------------
const visits = ['Baseline', '1 mo', '3 mo', '6 mo', '9 mo', '12 mo', '18 mo'];
const vx = [0, 1, 3, 6, 9, 12, 18];
const od = [24, 22, 19, 18, 17, 18, 16];
const os = [22, 20, 18, 17, 16, 16, 15];
const iop: ObservationTrendViewModel = {
  id: 'iop', title: 'Intraocular pressure, right and left eye', yLabel: 'mmHg', yMin: 8, yMax: 30, xMin: 0, xMax: 18,
  xTicks: vx.map((x, i) => ({ x, label: visits[i] })).filter((_, i) => [0, 3, 5, 6].includes(i)),
  yTicks: [10, 15, 20, 25, 30].map((y) => ({ y, label: String(y) })),
  series: [
    { id: 'od', label: 'Right eye (OD)', tone: 'info', points: od.map((y, i) => pt(`od${i}`, vx[i], y, visits[i], 'mmHg', y > 21 ? high : undefined)) },
    { id: 'os', label: 'Left eye (OS)', tone: 'neutral', dashed: true, points: os.map((y, i) => pt(`os${i}`, vx[i], y, visits[i], 'mmHg', y > 21 ? high : undefined)) }
  ],
  bands: [{ id: 'range', label: 'Reference range 10 to 21', yFrom: 10, yTo: 21, tone: 'success' }],
  summaryText: 'Right eye pressure fell from 24 to 16 mmHg and left eye pressure from 22 to 15 mmHg over 18 months of treatment. Both eyes have been within the reference range since the 3 month visit.',
  emptyMessage: 'No pressure readings recorded.'
};
export const IntraocularPressureOdOs: Story = { render: () => render(iop) };

// ---- Growth: weight for age --------------------------------------------
const ages = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const curve = (id: string, label: string, ys: number[]) => ({ id, label, points: ages.map((x, i) => ({ x, y: ys[i] })) });
const childAges = [0, 2, 4, 6, 9, 12, 15, 18, 24];
const childKg = [3.3, 5.4, 7.0, 7.9, 8.9, 9.6, 10.2, 10.8, 12.0];
const growth: ObservationTrendViewModel = {
  id: 'growth', title: 'Weight for age, 0 to 24 months', yLabel: 'Weight (kg)', yMin: 2, yMax: 15, xMin: 0, xMax: 24,
  xTicks: [0, 6, 12, 18, 24].map((x) => ({ x, label: `${x} mo` })),
  yTicks: [2, 5, 8, 11, 14].map((y) => ({ y, label: String(y) })),
  series: [{ id: 'w', label: 'Child weight', tone: 'info', points: childKg.map((y, i) => pt(`w${i}`, childAges[i], y, `${childAges[i]} months`, 'kg')) }],
  referenceCurves: [
    curve('p3', '3rd', [2.5, 4.4, 5.7, 6.5, 7.0, 7.5, 7.8, 8.2, 8.6]),
    curve('p15', '15th', [2.9, 5.0, 6.4, 7.2, 7.8, 8.3, 8.7, 9.1, 9.6]),
    curve('p50', '50th', [3.3, 5.8, 7.3, 8.2, 8.9, 9.5, 10.1, 10.6, 11.2]),
    curve('p85', '85th', [3.8, 6.6, 8.2, 9.2, 10.1, 10.8, 11.5, 12.1, 12.8]),
    curve('p97', '97th', [4.2, 7.3, 9.0, 10.1, 11.0, 11.8, 12.6, 13.3, 14.0])
  ],
  summaryText: 'Weight rose from 3.3 kg at birth to 12.0 kg at 24 months, following the supplied 50th reference curve closely throughout (synthetic reference curves).',
  emptyMessage: 'No weights recorded.'
};
export const GrowthWeightForAge: Story = { render: () => render(growth) };

// ---- Single point, empty, read-only, dense ------------------------------
export const SinglePoint: Story = {
  render: () => render({
    id: 'hba1c', title: 'HbA1c', yLabel: '%', yMin: 4, yMax: 12, xMin: 0, xMax: 12,
    xTicks: [0, 6, 12].map((x) => ({ x, label: x === 0 ? 'Today' : `+${x} mo` })), yTicks: [4, 6, 8, 10, 12].map((y) => ({ y, label: String(y) })),
    series: [{ id: 'a1c', label: 'HbA1c', tone: 'warning', points: [pt('a1', 0, 7.4, 'Today', '%', { label: 'Above target', tone: 'warning', assistiveText: 'above the individual target' })] }],
    bands: [{ id: 'tgt', label: 'Target below 7.0', yFrom: 4, yTo: 7, tone: 'success' }],
    summaryText: 'One result so far: HbA1c 7.4 percent today, above the 7.0 percent target.',
    emptyMessage: 'No results.'
  })
};

export const Empty: Story = { render: () => render({ ...bp, series: [], bands: [], selectedPointId: undefined, emptyMessage: 'No blood pressure readings recorded.' }) };
export const ReadOnly: Story = { render: () => render({ ...iop, readOnly: true }) };

const denseSeries: TrendSeries = {
  id: 'hr', label: 'Heart rate', tone: 'danger',
  points: Array.from({ length: 200 }, (_, i) => pt(`h${i}`, i, 72 + Math.round(8 * Math.sin(i / 9) + 4 * Math.cos(i / 3)), `Minute ${i}`, 'beats/min'))
};
export const DenseSeries: Story = {
  render: () => render({
    id: 'dense', title: 'Heart rate, 200 samples', yLabel: 'beats/min', yMin: 55, yMax: 95, xMin: 0, xMax: 199,
    xTicks: [0, 50, 100, 150, 199].map((x) => ({ x, label: `${x} min` })), yTicks: [60, 70, 80, 90].map((y) => ({ y, label: String(y) })),
    series: [denseSeries],
    summaryText: 'Heart rate varied between 60 and 84 beats per minute across 200 one-minute samples with a slow rhythmic swing and no sustained rise.',
    emptyMessage: 'No samples.'
  })
};

export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } }, render: () => render(bp) };
