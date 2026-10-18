'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { EmrMergeCompare, type EmrMergeIntent, type EmrMergeRow, type EmrMergeSide } from '../../src/l4-merge';
import type { GallerySection } from './types';

const identity = (id: string, name: string, ageLabel: string, sexLabel: string, phone: string) => ({
  id, name, ageLabel, sexLabel, phone,
  identifiers: [{ system: 'mrn', label: 'MRN', display: id === 'a' ? 'TEST-000001' : 'TEST-000002' }],
});

const ROWS: Omit<EmrMergeRow, 'chosen'>[] = [
  { id: 'name', label: 'Name', leftValue: 'Test Patient A', rightValue: 'Test Patient A.', differs: true },
  { id: 'age', label: 'Age', leftValue: '54 y', rightValue: '45 y', differs: true },
  { id: 'sex', label: 'Sex', leftValue: 'Female', rightValue: 'Male', differs: true },
  { id: 'phone', label: 'Phone', leftValue: '555-0100', rightValue: '555-0199', differs: true },
  { id: 'centre', label: 'Centre', leftValue: 'Test Centre', rightValue: 'Test Centre', differs: false },
];

function Demo({ narrow }: { narrow?: boolean }) {
  const [survivor, setSurvivor] = useState<EmrMergeSide>();
  const [chosen, setChosen] = useState<Record<string, EmrMergeSide>>({});
  const [last, setLast] = useState('');
  const rows = ROWS.map(r => ({ ...r, chosen: chosen[r.id] }));
  // Demo plays controller: the real domain decides differs and canConfirm.
  const canConfirm = !!survivor && rows.every(r => !r.differs || r.chosen);
  const onIntent = (i: EmrMergeIntent) => {
    if (i.type === 'fieldChosen') setChosen(c => ({ ...c, [i.rowId]: i.side }));
    else if (i.type === 'survivorChosen') setSurvivor(i.side);
    else setLast(i.type);
  };
  return (
    <>
      <View style={{ maxWidth: narrow ? 360 : undefined }}>
        <EmrMergeCompare onIntent={onIntent} model={{
          left: identity('a', 'Test Patient A', '54 y', 'F', '555-0100'),
          right: identity('b', 'Test Patient A.', '45 y', 'M', '555-0199'),
          rows, survivorSide: survivor, canConfirm,
        }} />
      </View>
      {last ? <Text>Last intent: {last}</Text> : null}
    </>
  );
}

export const gallery: GallerySection[] = [
  { id: 'l4-merge', title: 'L4 merge compare (wide)', render: () => <Demo /> },
  { id: 'l4-merge-narrow', title: 'L4 merge compare (360px)', render: () => <Demo narrow /> },
];
