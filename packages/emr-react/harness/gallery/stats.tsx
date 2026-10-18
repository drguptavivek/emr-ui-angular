'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { EmrColumns, EmrStatTile, EmrTabs, useEmrTheme, type EmrStatTileModel } from '../../src';
import type { GallerySection } from './types';

// Synthetic counts; scope and every string come from the "controller" (this demo).
const STATS: Record<string, EmrStatTileModel[]> = {
  device: [
    { key: 'seen', label: 'Patients seen', value: '18', sub: 'since 09:00' },
    { key: 'referred', label: 'Referred', value: '4', status: { label: '2 not synced', tone: 'warning' } },
    { key: 'spectacles', label: 'Spectacles booked', value: '6' },
    { key: 'drafts', label: 'Drafts', value: '1', status: { label: 'Needs review', tone: 'info' } },
  ],
  centre: [
    { key: 'seen', label: 'Patients seen', value: '41', sub: '3 devices' },
    { key: 'referred', label: 'Referred', value: '9' },
    { key: 'spectacles', label: 'Spectacles booked', value: '14' },
    { key: 'drafts', label: 'Drafts', value: '2' },
  ],
};

function StatsDemo() {
  const t = useEmrTheme();
  const [scope, setScope] = useState('device');
  const [opened, setOpened] = useState('none');
  return (
    <View style={{ gap: 12 }}>
      <EmrTabs tabs={[{ value: 'device', label: 'This device' }, { value: 'centre', label: 'This centre' }]} active={scope} onTabChange={setScope} />
      <EmrColumns count={4} collapseBelow={560}>
        {STATS[scope]!.map(stat => <EmrStatTile key={stat.key} model={stat} onIntent={intent => setOpened(`${scope}/${intent.key}`)} />)}
      </EmrColumns>
      <Text style={{ color: t.textMuted, fontSize: t.textSm }}>Opened list: {opened}</Text>
      <EmrStatTile model={{ key: 'static', label: 'Not tappable (no onIntent)', value: '—' }} />
    </View>
  );
}

export const gallery: GallerySection[] = [{ id: 'stat-tile', title: 'EmrStatTile', render: StatsDemo }];
