'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { EmrMergeCompare, type EmrMergeIntent, type EmrMergeRow } from '../../src/l4-merge';
import type { GallerySection } from './types';

const NAMES = ['Test Patient A', 'Test Patient A.', 'Test Patiant A'];
const source = (i: number) => ({
  id: `s${i}`, label: `Record ${'ABC'[i]}`, name: NAMES[i]!, ageLabel: ['54 y', '45 y', '54 y'][i], sexLabel: ['F', 'M', 'F'][i],
  identifiers: [{ system: 'mrn', label: 'MRN', display: `TEST-00000${i + 1}` }],
});
const ROWS = [
  { id: 'name', label: 'Name', values: { s0: NAMES[0]!, s1: NAMES[1]!, s2: NAMES[2]! }, differs: true },
  { id: 'age', label: 'Age', values: { s0: '54 y', s1: '45 y', s2: '54 y' }, differs: true },
  { id: 'phone', label: 'Phone', values: { s0: '555-0100', s1: '555-0199', s2: '555-0100' }, differs: true },
  { id: 'centre', label: 'Centre', values: { s0: 'Test Centre', s1: 'Test Centre', s2: 'Test Centre' }, differs: false },
] satisfies Omit<EmrMergeRow, 'chosenSourceId'>[];

function Demo({ count, narrow }: { count: 2 | 3; narrow?: boolean }) {
  const [survivor, setSurvivor] = useState<string>();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [last, setLast] = useState('');
  const sources = [0, 1, 2].slice(0, count).map(source);
  const rows = ROWS.map(r => ({ ...r, values: Object.fromEntries(sources.map(s => [s.id, (r.values as Record<string, string>)[s.id]!])), chosenSourceId: chosen[r.id] }));
  // Demo plays controller: the real domain decides differs and canConfirm.
  const canConfirm = !!survivor && rows.every(r => !r.differs || r.chosenSourceId);
  const onIntent = (i: EmrMergeIntent) => {
    if (i.type === 'fieldChosen') setChosen(c => ({ ...c, [i.rowId]: i.sourceId }));
    else if (i.type === 'survivorChosen') setSurvivor(i.sourceId);
    else setLast(i.type);
  };
  return (
    <>
      <View style={{ maxWidth: narrow ? 360 : undefined }}>
        <EmrMergeCompare onIntent={onIntent} model={{ sources, rows, survivorSourceId: survivor, canConfirm }} />
      </View>
      {last ? <Text>Last intent: {last}</Text> : null}
    </>
  );
}

export const gallery: GallerySection[] = [
  { id: 'l4-merge', title: 'L4 merge compare (2 sources, wide)', render: () => <Demo count={2} /> },
  { id: 'l4-merge-narrow', title: 'L4 merge compare (2 sources, 360px)', render: () => <Demo count={2} narrow /> },
  { id: 'l4-merge-3', title: 'L4 merge compare (3 sources, wide)', render: () => <Demo count={3} /> },
  { id: 'l4-merge-3-narrow', title: 'L4 merge compare (3 sources, 360px)', render: () => <Demo count={3} narrow /> },
];
