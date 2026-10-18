'use client';

import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import type { PatientListIntent, PatientListRow, PatientListViewModel, QueueCard, QueueStation, TimelineEvent, TimelineKindDefinition, WorkQueueIntent, WorkQueueViewModel } from '@drguptavivek/emr-controller';
import { EmrPatientList, EmrTabs, EmrTimeline, EmrWorkQueue } from '../../src';
import type { GallerySection } from './types';

type Variant = 'data' | 'loading' | 'empty' | 'error';
const VARIANTS = (['data', 'loading', 'empty', 'error'] as const).map(v => ({ value: v, label: v }));

function VariantSwitch({ value, onChange }: { value: Variant; onChange: (v: Variant) => void }) {
  return <EmrTabs ariaLabel="Demo state" tabs={VARIANTS} active={value} onTabChange={v => onChange(v as Variant)} />;
}

const NAMES = ['Asha Rao', 'Ben Lee', 'Chen Wei', 'Dara Khan', 'Eli Moss', 'Fay Ito', 'Gus Park', 'Hana Roy', 'Ian Cole', 'Jo Das', 'Kai Sen', 'Lia Ng'];
const ROWS: PatientListRow[] = NAMES.map((displayName, i) => ({
  patientId: `p${i}`,
  displayName,
  primaryIdentifier: `MR-${1000 + i}`,
  nationalHealthIds: i % 3 === 0 ? [{ label: 'National ID', value: `00-${i}${i}-demo` }] : undefined,
  ageLabel: `${20 + i * 3} y`,
  sexLabel: i % 2 ? 'F' : 'M',
  careSettingLabel: i % 2 ? 'Outpatient' : 'Inpatient',
  locationLabel: `Room ${100 + i}`,
  queueLabel: i % 4 === 0 ? undefined : `Queue ${(i % 3) + 1}`,
  status: i % 5 === 0 ? { label: 'Urgent', tone: 'danger', assistiveText: 'Urgent priority' } : i % 2 ? { label: 'Waiting', tone: 'warning' } : { label: 'Seen', tone: 'success' },
}));
const PAGE_SIZE = 5;
const SORT_KEY: Record<string, (r: PatientListRow) => string> = {
  identifier: r => r.primaryIdentifier, age: r => r.ageLabel.padStart(5, '0'), careArea: r => r.careSettingLabel, queue: r => r.queueLabel ?? '', status: r => r.status?.label ?? '',
};

/** Stands in for the controller: applies query, sort and paging, then hands the component ready rows. */
function PatientListDemo() {
  const [variant, setVariant] = useState<Variant>('data');
  const [state, setState] = useState<Pick<PatientListViewModel, 'query' | 'page' | 'sort' | 'selectedPatientId'>>({ query: '', page: 1 });
  const [applied, setApplied] = useState('');
  const model = useMemo<PatientListViewModel>(() => {
    let rows = variant === 'empty' ? [] : ROWS.filter(r => `${r.displayName} ${r.primaryIdentifier}`.toLowerCase().includes(applied.toLowerCase()));
    const key = state.sort ? SORT_KEY[state.sort.field] : undefined;
    if (key && state.sort) rows = [...rows].sort((a, b) => key(a).localeCompare(key(b)) * (state.sort!.direction === 'asc' ? 1 : -1));
    return {
      ...state, rows: variant === 'loading' || variant === 'error' ? [] : rows.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE),
      loading: variant === 'loading', error: variant === 'error' ? 'The patient service did not respond.' : undefined, pageSize: PAGE_SIZE, total: rows.length,
    };
  }, [variant, state, applied]);
  const onIntent = (i: PatientListIntent) => {
    if (i.type === 'queryChanged') setState(s => ({ ...s, query: i.query }));
    else if (i.type === 'searchRequested') { setApplied(state.query); setState(s => ({ ...s, page: 1 })); }
    else if (i.type === 'patientSelected') setState(s => ({ ...s, selectedPatientId: i.patientId }));
    else if (i.type === 'pageChanged') setState(s => ({ ...s, page: i.page }));
    else if (i.type === 'sortChanged') setState(s => ({ ...s, sort: { field: i.field, direction: i.direction } }));
    else setVariant('data');
  };
  return (
    <>
      <VariantSwitch value={variant} onChange={setVariant} />
      <EmrPatientList model={model} onIntent={onIntent} />
    </>
  );
}

const card = (id: string, name: string, extra: Partial<QueueCard> = {}): QueueCard => ({
  id, patientId: `p-${id}`, displayName: name, primaryIdentifier: `MR-${id}`, tokenLabel: `Token ${id}`, waitLabel: `${Number(id) * 3} min`, ...extra,
});
const STATIONS: QueueStation[] = [
  { id: 'reg', label: 'Registration', countLabel: '2 waiting', canCallNext: true, cards: [
    card('11', 'Asha Rao', { ageSexLabel: '34 F', priority: { label: 'Urgent', tone: 'danger', assistiveText: 'Urgent priority' }, nextStepLabel: 'Triage' }),
    card('12', 'Ben Lee', { ageSexLabel: '61 M', flags: [{ label: 'Interpreter', tone: 'info' }] })] },
  { id: 'exam', label: 'Examination', countLabel: '1 waiting', canCallNext: true, cards: [card('21', 'Chen Wei', { ageSexLabel: '8 M', nextStepLabel: 'Review results' })] },
  { id: 'rx', label: 'Pharmacy', countLabel: '0 waiting', canCallNext: false, cards: [] },
];

function WorkQueueDemo() {
  const [variant, setVariant] = useState<Variant>('data');
  const [selected, setSelected] = useState<string | undefined>();
  const [stations, setStations] = useState(STATIONS);
  const [log, setLog] = useState('No intent yet.');
  const model: WorkQueueViewModel = {
    id: 'demo', title: 'Station board', updatedLabel: 'Updated just now', emptyMessage: 'Nobody is waiting.', selectedCardId: selected,
    moveTargets: STATIONS.map(s => ({ value: s.id, label: s.label })), readOnly: false,
    stations: variant === 'empty' ? [] : stations, loading: variant === 'loading', error: variant === 'error' ? 'The queue service did not respond.' : undefined,
  };
  const onIntent = (i: WorkQueueIntent) => {
    setLog(JSON.stringify(i));
    if (i.type === 'cardSelected') setSelected(i.cardId);
    else if (i.type === 'retryRequested') setVariant('data');
    else if (i.type === 'moveRequested') {
      const moving = stations.flatMap(s => s.cards).find(c => c.id === i.cardId);
      if (moving) setStations(ss => ss.map(s => {
        const cards = [...s.cards.filter(c => c.id !== i.cardId), ...(s.id === i.stationId ? [moving] : [])];
        return { ...s, cards, countLabel: `${cards.length} waiting` };
      }));
    }
  };
  return (
    <>
      <VariantSwitch value={variant} onChange={setVariant} />
      <EmrWorkQueue model={model} onIntent={onIntent} />
      <Text>{log}</Text>
    </>
  );
}

const KINDS: TimelineKindDefinition[] = [
  { id: 'visit', label: 'Visit', tone: 'info' }, { id: 'admission', label: 'Admission', tone: 'warning' },
  { id: 'discharge', label: 'Discharge', tone: 'success' }, { id: 'alert', label: 'Alert', tone: 'danger' }, { id: 'note', label: 'Note', tone: 'neutral' },
];
const EVENTS: TimelineEvent[] = [
  { id: 'e1', occurredAt: '2026-01-04', dateLabel: '4 Jan 2026', title: 'Routine visit', summary: 'Synthetic summary of a routine review.', kindId: 'visit' },
  { id: 'e2', occurredAt: '2026-02-11', dateLabel: '11 Feb 2026', title: 'Admitted for observation', kindId: 'admission' },
  { id: 'e3', occurredAt: '2026-02-14', dateLabel: '14 Feb 2026', title: 'Discharged home', summary: 'Follow-up in two weeks.', kindId: 'discharge' },
  { id: 'e4', occurredAt: '2026-03-01', dateLabel: '1 Mar 2026', title: 'Missed follow-up', kindId: 'alert' },
  { id: 'e5', occurredAt: '2026-03-09', dateLabel: '9 Mar 2026', title: 'Phone note', kindId: 'note' },
];

function TimelineDemo({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  const [variant, setVariant] = useState<Variant>('data');
  const [selected, setSelected] = useState<string | undefined>('e2');
  return (
    <>
      <VariantSwitch value={variant} onChange={setVariant} />
      <EmrTimeline events={variant === 'data' ? EVENTS : []} kinds={KINDS} selectedId={selected} orientation={orientation}
        onIntent={i => setSelected(i.eventId)} />
    </>
  );
}

export const gallery: GallerySection[] = [
  { id: 'l4-patient-list', title: 'EmrPatientList (search, sort, page; narrow container shows cards)', render: () => <PatientListDemo /> },
  { id: 'l4-work-queue', title: 'EmrWorkQueue (columns when wide, tabs when narrow)', render: () => <WorkQueueDemo /> },
  { id: 'l4-timeline-vertical', title: 'EmrTimeline (vertical; empty variant shows no events)', render: () => <TimelineDemo orientation="vertical" /> },
  { id: 'l4-timeline-horizontal', title: 'EmrTimeline (horizontal, falls back to vertical when narrow)', render: () => <TimelineDemo orientation="horizontal" /> },
];
