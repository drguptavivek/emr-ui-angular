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

const render = (model: ObservationTrendViewModel, dark = false) => ({
  props: {
    model,
    onIntent(e: ObservationTrendIntent) {
      const host = this as { model: ObservationTrendViewModel };
      if (e.type === 'pointSelected') host.model = { ...host.model, selectedPointId: e.pointId };
      // Story stand-in for the controller: it only moves the selection; a real controller would refetch and re-tick the x axis.
      if (e.type === 'granularityChangeRequested') {
        host.model = { ...host.model, granularityOptions: host.model.granularityOptions?.map((g) => ({ ...g, selected: g.id === e.granularityId })) };
      }
    }
  },
  template: dark
    ? `<div class="emr-theme-dark" style="padding:16px;background:var(--emr-surface)"><div style="max-width: 760px"><emr-observation-trend [model]="model" (intent)="onIntent($event)" /></div></div>`
    : `<div class="emr-story-surface"><div style="max-width: 760px"><emr-observation-trend [model]="model" (intent)="onIntent($event)" /></div></div>`
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

// ---- Inpatient: open-ended and danger bands -----------------------------
const low = { label: 'Low', tone: 'danger' as const, assistiveText: 'below the safe range' };
const hours = (n: number, step: number) => Array.from({ length: n }, (_, i) => `${String((6 + i * step) % 24).padStart(2, '0')}:00`);
const kLabels = ['Day 1 06:00', 'Day 1 18:00', 'Day 2 06:00', 'Day 2 18:00', 'Day 3 06:00', 'Day 3 18:00', 'Day 4 06:00'];
const kVals = [2.8, 3.1, 3.6, 4.2, 5.4, 6.3, 4.8];
const potassium: ObservationTrendViewModel = {
  id: 'k', title: 'Serum potassium, 4 days', yLabel: 'mmol/L', yMin: 2, yMax: 7.5, xMin: 0, xMax: 6,
  xTicks: kLabels.map((label, x) => ({ x, label: label.replace(' 06:00', '') })).filter((_, i) => i % 2 === 0),
  yTicks: [2, 3, 4, 5, 6, 7].map((y) => ({ y, label: String(y) })),
  series: [{
    id: 'k', label: 'Potassium', tone: 'info', unitLabel: 'mmol/L',
    points: kVals.map((y, i) => pt(`k${i}`, i, y, kLabels[i], 'mmol/L', y < 3.0 ? low : y > 6.0 ? high : undefined))
  }],
  bands: [
    { id: 'klo', label: 'Danger, below 3.0', yTo: 3.0, tone: 'danger', pattern: 'hatched', edgeLabel: '3.0 mmol/L' },
    { id: 'ksafe', label: 'Safe range 3.5 to 5.0', yFrom: 3.5, yTo: 5.0, tone: 'success', edgeLabel: '5.0 mmol/L' },
    { id: 'khi', label: 'Danger, above 6.0', yFrom: 6.0, tone: 'danger', pattern: 'hatched', edgeLabel: '6.0 mmol/L' }
  ],
  summaryText: 'Potassium was low at 2.8 mmol/L on admission, reached the safe range by day 2, rose to 6.3 mmol/L on the evening of day 3 and was back to 4.8 mmol/L on day 4.',
  emptyMessage: 'No potassium results.'
};
export const SerumPotassiumWithRanges: Story = { render: () => render(potassium) };

const spoT = hours(12, 2);
const spo = [97, 96, 95, 93, 91, 92, 94, 95, 96, 96, 97, 97];
export const Spo2LowerBoundOnly: Story = {
  render: () => render({
    id: 'spo2', title: 'Oxygen saturation, 24 hours', yLabel: 'SpO2 %', yMin: 85, yMax: 100, xMin: 0, xMax: 11,
    xTicks: spoT.map((label, x) => ({ x, label })).filter((_, i) => i % 3 === 0), yTicks: [85, 90, 95, 100].map((y) => ({ y, label: String(y) })),
    series: [{ id: 'spo2', label: 'SpO2', tone: 'info', points: spo.map((y, i) => pt(`o${i}`, i, y, spoT[i], '%', y < 94 ? { label: 'Low', tone: 'warning', assistiveText: 'below the target' } : undefined)) }],
    bands: [{ id: 'tgt', label: 'Target 94 % and above', yFrom: 94, tone: 'success', edgeLabel: '94 %' }],
    summaryText: 'Saturation dipped below the 94 percent target between 12:00 and 16:00, lowest 91 percent, and recovered to 97 percent by the next morning.',
    emptyMessage: 'No saturation readings.'
  })
};

const crDays = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
const cr = [88, 96, 124, 141, 118, 97];
export const CreatinineUpperBoundOnly: Story = {
  render: () => render({
    id: 'cr', title: 'Serum creatinine, 6 days', yLabel: 'µmol/L', yMin: 40, yMax: 180, xMin: 0, xMax: 5,
    xTicks: crDays.map((label, x) => ({ x, label })), yTicks: [40, 80, 120, 160].map((y) => ({ y, label: String(y) })),
    series: [{ id: 'cr', label: 'Creatinine', tone: 'warning', points: cr.map((y, i) => pt(`c${i}`, i, y, crDays[i], 'µmol/L', y > 110 ? high : undefined)) }],
    bands: [{ id: 'ref', label: 'Reference, up to 110', yTo: 110, tone: 'success', edgeLabel: '110 µmol/L' }],
    summaryText: 'Creatinine rose from 88 to a peak of 141 micromol per litre on day 4 and fell back to 97 by day 6.',
    emptyMessage: 'No creatinine results.'
  })
};

// ---- Dual axis ------------------------------------------------------------
const vT = hours(9, 3);
const hr = [78, 82, 96, 112, 118, 104, 92, 86, 80];
const sbp = [124, 120, 108, 96, 88, 98, 110, 118, 122];
export const DualAxisHeartRateAndBloodPressure: Story = {
  render: () => render({
    id: 'hrbp', title: 'Heart rate and systolic pressure, 24 hours', yLabel: 'beats/min', yMin: 40, yMax: 140, xMin: 0, xMax: 8,
    xTicks: vT.map((label, x) => ({ x, label })).filter((_, i) => i % 2 === 0), yTicks: [40, 60, 80, 100, 120, 140].map((y) => ({ y, label: String(y) })),
    secondaryAxis: { yLabel: 'mmHg', yMin: 60, yMax: 180, yTicks: [60, 90, 120, 150, 180].map((y) => ({ y, label: String(y) })) },
    series: [
      { id: 'hr', label: 'Heart rate', tone: 'danger', unitLabel: 'beats/min', points: hr.map((y, i) => pt(`hr${i}`, i, y, vT[i], 'beats/min', y > 110 ? high : undefined)) },
      { id: 'sbp', label: 'Systolic pressure', tone: 'info', dashed: true, axis: 'secondary', unitLabel: 'mmHg', points: sbp.map((y, i) => pt(`bp${i}`, i, y, vT[i], 'mmHg', y < 90 ? low : undefined)) }
    ],
    bands: [{ id: 'sbplo', label: 'Systolic below 90', yTo: 90, axis: 'secondary', tone: 'danger', pattern: 'hatched', edgeLabel: '90 mmHg' }],
    summaryText: 'Heart rate rose to 118 beats per minute at 18:00 while systolic pressure fell to 88 mmHg; both returned toward baseline by the next morning.',
    emptyMessage: 'No vital signs recorded.'
  })
};

const gT = hours(8, 3);
const glucose = [14.2, 12.8, 10.9, 9.4, 8.1, 7.6, 7.9, 8.4];
const insulin = [6, 5, 4, 3, 2, 2, 2, 2];
export const DualAxisGlucoseAndInsulin: Story = {
  render: () => render({
    id: 'gi', title: 'Capillary glucose and insulin infusion rate', yLabel: 'mmol/L', yMin: 0, yMax: 20, xMin: 0, xMax: 7,
    xTicks: gT.map((label, x) => ({ x, label })).filter((_, i) => i % 2 === 0), yTicks: [0, 5, 10, 15, 20].map((y) => ({ y, label: String(y) })),
    secondaryAxis: { yLabel: 'units/hour', yMin: 0, yMax: 10, yTicks: [0, 2, 4, 6, 8, 10].map((y) => ({ y, label: String(y) })) },
    series: [
      { id: 'glu', label: 'Glucose', tone: 'warning', unitLabel: 'mmol/L', points: glucose.map((y, i) => pt(`g${i}`, i, y, gT[i], 'mmol/L', y > 10 ? high : undefined)) },
      { id: 'ins', label: 'Insulin rate', tone: 'info', dashed: true, axis: 'secondary', unitLabel: 'units/hour', points: insulin.map((y, i) => pt(`i${i}`, i, y, gT[i], 'units/hour')) }
    ],
    bands: [{ id: 'gtgt', label: 'Glucose target 6 to 10', yFrom: 6, yTo: 10, tone: 'success' }],
    summaryText: 'Glucose fell from 14.2 to 7.6 mmol/L over 15 hours as the insulin rate was stepped down from 6 to 2 units per hour.',
    emptyMessage: 'No glucose readings.'
  })
};

// ---- Granularity ----------------------------------------------------------
const hT = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const hourlyHr = hT.map((_, i) => 74 + Math.round(10 * Math.sin(i / 4)));
export const HourlyGranularity: Story = {
  render: () => render({
    id: 'hourly', title: 'Heart rate, today', yLabel: 'beats/min', yMin: 50, yMax: 100, xMin: 0, xMax: 23, xGranularityLabel: 'Hourly',
    xTicks: [0, 6, 12, 18, 23].map((x) => ({ x, label: hT[x] })), xMinorTicks: hT.map((_, x) => ({ x })).filter((t) => t.x % 6 !== 0 && t.x !== 23),
    yTicks: [50, 60, 70, 80, 90, 100].map((y) => ({ y, label: String(y) })),
    series: [{ id: 'hr', label: 'Heart rate', tone: 'danger', points: hourlyHr.map((y, i) => pt(`hh${i}`, i, y, hT[i], 'beats/min')) }],
    summaryText: 'Hourly heart rate stayed between 64 and 84 beats per minute today.',
    emptyMessage: 'No readings today.'
  })
};

const weeks = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`);
const weight = [82.4, 82.1, 81.6, 81.8, 81.0, 80.6, 80.2, 80.4, 79.8, 79.5, 79.1, 78.8];
export const WeeklyGranularityWithSelector: Story = {
  render: () => render({
    id: 'weekly', title: 'Body weight, 12 weeks', yLabel: 'kg', yMin: 76, yMax: 84, xMin: 0, xMax: 11, xGranularityLabel: 'Weekly',
    granularityOptions: [{ id: 'day', label: 'Daily' }, { id: 'week', label: 'Weekly', selected: true }, { id: 'month', label: 'Monthly' }],
    xTicks: [0, 3, 7, 11].map((x) => ({ x, label: weeks[x] })), xMinorTicks: weeks.map((_, x) => ({ x })).filter((t) => ![0, 3, 7, 11].includes(t.x)),
    yTicks: [76, 78, 80, 82, 84].map((y) => ({ y, label: String(y) })),
    series: [{ id: 'wt', label: 'Weight', tone: 'info', points: weight.map((y, i) => pt(`wk${i}`, i, y, weeks[i], 'kg')) }],
    summaryText: 'Weight fell steadily from 82.4 to 78.8 kg over 12 weeks.',
    emptyMessage: 'No weights recorded.'
  })
};

// ---- Theming and legend stress --------------------------------------------
export const HatchedBandsDark: Story = { render: () => render(potassium, true) };

export const LongLegend: Story = {
  render: () => render({
    ...potassium,
    id: 'long', title: 'Electrolytes with long legend labels',
    series: [
      potassium.series[0],
      { id: 'k2', label: 'Potassium, point-of-care venous blood gas analyser (ward 7 critical care)', tone: 'neutral', dashed: true, unitLabel: 'mmol/L',
        points: kVals.map((y, i) => pt(`kv${i}`, i, +(y + 0.2).toFixed(1), kLabels[i], 'mmol/L')) },
      { id: 'k3', label: 'Potassium, repeat laboratory sample after haemolysis flag on the first draw', tone: 'warning', unitLabel: 'mmol/L',
        points: [3.0, 3.3, 3.7, 4.1, 5.1, 5.9, 4.6].map((y, i) => pt(`kr${i}`, i, y, kLabels[i], 'mmol/L')) }
    ],
    bands: [
      ...(potassium.bands ?? []),
      { id: 'note', label: 'Hold supplementation and repeat in 2 hours when the result lies in this band (local protocol, synthetic)', yFrom: 5.0, yTo: 6.0, tone: 'warning', pattern: 'hatched' }
    ]
  })
};
