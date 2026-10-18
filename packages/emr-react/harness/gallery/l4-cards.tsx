'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type { LinkCardView, LinkCardsIntent } from '@drguptavivek/emr-controller';
import { EmrLinkCards } from '../../src/l4-cards';
import type { GallerySection } from './types';

const patient = { name: 'Test Patient A', ageLabel: '54 y', sexLabel: 'F', identifiers: [{ system: 'uhid', label: 'UHID', display: '900000001' }] };
const other = { id: 'p2', name: 'Test Patient B', ageLabel: '52 y', sexLabel: 'F', identifiers: [{ system: 'uhid', label: 'UHID', display: '900000002' }] };

const INITIAL: LinkCardView[] = [
  { id: 'c1', display: 'PEC-0001', state: 'unused', statusBadge: { label: 'Unused', tone: 'success' } },
  { id: 'c2', display: 'PEC-0002', state: 'on_other_patient', statusBadge: { label: 'On another patient', tone: 'warning' }, message: 'This card is linked to another record.', candidate: other },
  { id: 'c3', display: 'PEC-00X', state: 'invalid', statusBadge: { label: 'Invalid', tone: 'danger' }, message: 'Not a valid card number.', warnings: ['Check the printed number.'] },
  { id: 'c4', display: 'PEC-0004', state: 'checking', statusBadge: { label: 'Checking', tone: 'neutral' } },
];

// Demo plays controller: validation, duplicate checks and canSubmit are the app's call.
function Demo() {
  const [cards, setCards] = useState(INITIAL);
  const [raw, setRaw] = useState('');
  const [primary, setPrimary] = useState<string>('c1');
  const [last, setLast] = useState('');
  const canSubmit = cards.length > 0 && cards.every(c => c.state === 'unused');
  const onIntent = (i: LinkCardsIntent) => {
    setLast(i.type);
    if (i.type === 'entryChanged') setRaw(i.raw);
    else if (i.type === 'cardEntered' && raw) {
      setCards(c => [...c, { id: `n${c.length}`, display: raw, state: 'unused', statusBadge: { label: 'Unused', tone: 'success' } }]);
      setRaw('');
    } else if (i.type === 'cardRemoved') setCards(c => c.filter(x => x.id !== i.id));
    else if (i.type === 'primarySelected') setPrimary(i.id);
    else if (i.type === 'sameConfirmed' || i.type === 'notSameConfirmed') {
      setCards(c => c.map(x => x.id === i.id ? { ...x, state: 'invalid', statusBadge: { label: 'Needs review', tone: 'warning' }, candidate: undefined, message: 'Sent for review.' } : x));
    }
  };
  return (
    <View style={{ gap: 8, maxWidth: 360 }}>
      <EmrLinkCards onIntent={onIntent} model={{
        patient, entry: { label: 'Card number', value: raw }, cards, primaryCardId: primary, canSubmit,
        submitError: 'Resolve or remove cards that are not usable.',
      }} />
      <Text>Last intent: {last}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [{ id: 'l4-cards', title: 'EmrLinkCards', render: Demo }];
