'use client';

import { Text, View } from 'react-native';
import type { EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard, EmrChip, EmrColumns, EmrFieldValueRow, EmrSeparator, EmrStateMessage, EmrStatusCell } from '../../src/l1-display';
import type { GallerySection } from './types';

const tones: EmrTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const badge = (tone: EmrTone, label: string): EmrBadge => ({ tone, label });
const box = (text: string) => <View style={{ padding: 8, borderWidth: 1, borderColor: '#c7d3da' }}><Text>{text}</Text></View>;
const stack = { gap: 12 } as const;

export const gallery: GallerySection[] = [
  { id: 'chip', title: 'EmrChip', render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{tones.map(t => <EmrChip key={t} tone={t}>{`Tone ${t}`}</EmrChip>)}</View>
  ) },
  { id: 'alert', title: 'EmrAlert', render: () => (
    <View style={stack}>
      {tones.map(t => <EmrAlert key={t} tone={t} title={`Alert ${t}`}>Synthetic body text for this alert.</EmrAlert>)}
      <EmrAlert title="Title only" />
    </View>
  ) },
  { id: 'state-message', title: 'EmrStateMessage', render: () => (
    <View style={stack}>
      <EmrStateMessage kind="empty" message="No encounters recorded." />
      <EmrStateMessage kind="loading" />
      <EmrStateMessage kind="error" title="Could not load" message="Try again later." />
    </View>
  ) },
  { id: 'separator', title: 'EmrSeparator', render: () => (
    <View>
      <Text>Above</Text>
      <EmrSeparator />
      <EmrSeparator label="Section label" />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text>Left</Text><EmrSeparator orientation="vertical" /><Text>Right</Text></View>
    </View>
  ) },
  { id: 'card', title: 'EmrCard', render: () => (
    <View style={stack}>
      <EmrCard label="Padded card"><Text>Body content</Text></EmrCard>
      <EmrCard label="Flush card" padded={false}><Text>Edge-to-edge body</Text></EmrCard>
      <EmrCard><Text>No title</Text></EmrCard>
    </View>
  ) },
  { id: 'columns', title: 'EmrColumns', render: () => (
    <View style={stack}>
      <EmrColumns count={3}>{box('A')}{box('B')}{box('C')}</EmrColumns>
      <EmrColumns widths={['2fr', '1fr']}>{box('Wide')}{box('Narrow')}</EmrColumns>
      <EmrColumns collapseBelow={2000}>{box('Always stacked 1')}{box('Always stacked 2')}</EmrColumns>
    </View>
  ) },
  { id: 'field-value-row', title: 'EmrFieldValueRow', render: () => (
    <View>
      <EmrFieldValueRow heading field="Field" value="Value" remarks="Remarks" notes="Notes" />
      <EmrFieldValueRow field="Pulse" value="72 /min" remarks="Regular" notes="Seated" />
      <EmrFieldValueRow field="Temperature" />
    </View>
  ) },
  { id: 'status-cell', title: 'EmrStatusCell', render: () => (
    <View style={stack}>
      <EmrStatusCell status={badge('success', 'Recorded')} valueLabel="120/80" attribution={{ nameLabel: 'A. Example', roleLabel: 'Nurse', timeLabel: '09:30' }}
        action={{ label: 'Edit', icon: '✎' }} secondaryNote="Synthetic note" onIntent={() => {}} />
      <EmrStatusCell status={badge('warning', 'Not assessed')} selectable onIntent={() => {}} />
      <EmrStatusCell status={badge('danger', 'Refused')} valueLabel="Hidden when compact" compact />
      <EmrStatusCell status={badge('neutral', 'Read only')} valueLabel="42" action={{ label: 'Edit' }} readOnly />
    </View>
  ) },
];
