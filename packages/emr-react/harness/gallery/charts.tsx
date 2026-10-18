'use client';

import { useState } from 'react';
import { EmrBarChart, EmrFunnelChart, type EmrBarChartModel, type EmrChartIntent } from '../../src/charts';
import type { GallerySection } from './types';

const centres = [
  { id: 'sgr', label: 'Sri Ganganagar' },
  { id: 'bik', label: 'Bikaner' },
  { id: 'jod', label: 'Jodhpur' },
  { id: 'udp', label: 'Udaipur' },
];

const patientsSeen: EmrBarChartModel = {
  title: 'Patients seen per centre',
  description: 'This week against last week; Udaipur did not report last week.',
  categories: centres,
  yAxisLabel: 'Patients',
  series: [
    { id: 'this', label: 'This week', values: { sgr: 142, bik: 98, jod: 175, udp: 64 } },
    { id: 'last', label: 'Last week', values: { sgr: 130, bik: 105, jod: 160, udp: null } },
  ],
};

function Selectable({ model }: { model: EmrBarChartModel }) {
  const [last, setLast] = useState<EmrChartIntent | null>(null);
  return (
    <div>
      <EmrBarChart model={model} onIntent={setLast} />
      <p style={{ fontFamily: 'sans-serif', fontSize: 13 }}>{last ? `Intent: ${JSON.stringify(last)}` : 'Activate a bar to see its intent.'}</p>
    </div>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'charts-funnel',
    title: 'Funnel chart',
    render: () => (
      <EmrFunnelChart
        model={{
          title: 'Referral pathway',
          description: 'Patients referred for cataract surgery, March to May.',
          steps: [
            { id: 'ref', label: 'Referred', value: 480, valueLabel: '480' },
            { id: 'arr', label: 'Arrived', value: 372, valueLabel: '372', conversionLabel: '78% of referred' },
            { id: 'rep', label: 'Reported', value: 340, valueLabel: '340', conversionLabel: '91% of arrived' },
            { id: 'op', label: 'Operated', value: 301, valueLabel: '301', conversionLabel: '89% of reported' },
            { id: 'fu', label: 'Followed up', value: 188, valueLabel: '188', conversionLabel: '62% of operated' },
          ],
        }}
        onIntent={() => undefined}
      />
    ),
  },
  { id: 'charts-bar', title: 'Bar chart (grouped, with a gap)', render: () => <Selectable model={patientsSeen} /> },
  {
    id: 'charts-bar-horizontal',
    title: 'Bar chart (horizontal)',
    render: () => <EmrBarChart model={{ ...patientsSeen, orientation: 'horizontal' }} />,
  },
];
