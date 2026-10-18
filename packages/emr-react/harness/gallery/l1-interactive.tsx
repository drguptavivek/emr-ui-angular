'use client';

import { useState } from 'react';
import type { EmrOption, TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { EmrLikert, EmrSearchSelect, EmrStageStepper, EmrTabs, EmrTimeAxis, EmrVas } from '../../src';
import type { GallerySection } from './types';

const TABS: EmrOption[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'vitals', label: 'Vitals' },
  { value: 'locked', label: 'Locked', disabled: true },
  { value: 'notes', label: 'Notes' },
];

function TabsDemo() {
  const [active, setActive] = useState('summary');
  return <EmrTabs tabs={TABS} active={active} onTabChange={setActive} ariaLabel="Demo sections" />;
}

const CATALOG: EmrOption[] = [
  { value: 'a', label: 'Sample item A', description: 'Synthetic description' },
  { value: 'b', label: 'Sample item B' },
  { value: 'c', label: 'Sample item C (unavailable)', disabled: true },
  { value: 'd', label: 'Sample item D' },
];

function SearchDemo() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const options = CATALOG.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const toggle = (v: string) => setPicked(p => (p.includes(v) ? p.filter(x => x !== v) : [...p, v]));
  return (
    <EmrSearchSelect label="Find items" multiple query={query} options={options} open={open}
      selected={CATALOG.filter(o => picked.includes(o.value))}
      onQueryChange={setQuery} onSearchRequested={() => setOpen(true)} onOpenRequested={() => setOpen(true)} onCloseRequested={() => setOpen(false)}
      onOptionSelect={toggle} onRemoveRequested={toggle} />
  );
}

function LikertDemo() {
  const [value, setValue] = useState<number | null>(7);
  return (
    <EmrLikert label="Sample score" min={0} max={10} value={value} onValueChange={setValue} tone={value !== null && value >= 7 ? 'danger' : 'info'}
      anchors={[{ value: 0, label: 'None' }, { value: 10, label: 'Worst' }]} hint="Choose one point on the scale" />
  );
}

function VasDemo() {
  const [h, setH] = useState<number | null>(4);
  const [v, setV] = useState<number | null>(null);
  return (
    <>
      <EmrVas label="Horizontal 0-10" min={0} max={10} majorInterval={1} minorInterval={1} value={h} onValueChange={setH}
        valueText={h === null ? undefined : `${h} out of 10`} anchors={[{ value: 0, label: 'None' }, { value: 10, label: 'Worst' }]} />
      <EmrVas label="Vertical 0-100" orientation="vertical" value={v} onValueChange={setV} valueText={v === null ? undefined : `${v} out of 100`}
        anchors={[{ value: 0, label: 'Worst' }, { value: 100, label: 'Best' }]} />
    </>
  );
}

const STAGES = [
  { id: 'referred', label: 'Referred', status: { label: 'Done', tone: 'success' as const } },
  { id: 'accepted', label: 'Accepted', description: 'Awaiting slot', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'seen', label: 'Seen' },
];

function StepperDemo() {
  const [active, setActive] = useState('accepted');
  return (
    <>
      <EmrStageStepper stages={STAGES} activeId={active} onStageSelect={setActive} />
      <EmrStageStepper stages={STAGES} activeId={active} readOnly orientation="vertical" ariaLabel="Referral progress" />
    </>
  );
}

const TICKS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

function TimeAxisDemo() {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | undefined>('t1');
  const [step, setStep] = useState('60');
  const model: TimeAxisViewModel = {
    id: 'demo-axis', title: 'Chart window',
    ticks: TICKS.slice(offset, offset + 5).map((label, i) => ({ id: `t${offset + i}`, label, sublabel: 'Day 1', current: offset + i === 3 })),
    selectedTickId: selected, selectedStepId: step,
    steps: [{ id: '60', label: 'Hourly' }, { id: '30', label: '30 min' }],
    canShiftEarlier: offset > 0, canShiftLater: offset + 5 < TICKS.length,
  };
  return (
    <EmrTimeAxis model={model} onIntent={i => {
      if (i.type === 'tickSelected') setSelected(i.tickId);
      else if (i.type === 'shiftEarlierRequested') setOffset(o => Math.max(0, o - 1));
      else if (i.type === 'shiftLaterRequested') setOffset(o => o + 1);
      else setStep(i.stepId);
    }} />
  );
}

export const gallery: GallerySection[] = [
  { id: 'tabs', title: 'EmrTabs', render: () => <TabsDemo /> },
  { id: 'search-select', title: 'EmrSearchSelect', render: () => <SearchDemo /> },
  { id: 'likert', title: 'EmrLikert', render: () => <LikertDemo /> },
  { id: 'vas', title: 'EmrVas', render: () => <VasDemo /> },
  { id: 'stage-stepper', title: 'EmrStageStepper', render: () => <StepperDemo /> },
  { id: 'time-axis', title: 'EmrTimeAxis', render: () => <TimeAxisDemo /> },
];
