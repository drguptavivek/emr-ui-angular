'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import { EmrContactAttemptForm, EmrContactAttemptSummary, useEmrTheme, type EmrContactAttemptIntent } from '../../src';
import type { GallerySection } from './types';

// Synthetic numbers and wording; the demo plays controller (canSubmit is its call).
function FormDemo() {
  const t = useEmrTheme();
  const [s, set] = useState<{ number?: string; channel?: string; reached: boolean; outcome?: string; next?: string; note: string }>({ reached: false, note: '' });
  const [last, setLast] = useState('none yet');
  const canSubmit = !!s.number && !!s.channel && !!s.outcome && (s.reached || !!s.next);
  const onIntent = (i: EmrContactAttemptIntent) => {
    setLast(i.type);
    switch (i.type) {
      case 'numberSelected': set(x => ({ ...x, number: i.id })); break;
      case 'channelSelected': set(x => ({ ...x, channel: i.id })); break;
      case 'reachedChanged': set(x => ({ ...x, reached: i.reached })); break;
      case 'outcomeSelected': set(x => ({ ...x, outcome: i.id })); break;
      case 'nextActionDateChanged': set(x => ({ ...x, next: i.date ?? undefined })); break;
      case 'noteChanged': set(x => ({ ...x, note: i.note })); break;
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrContactAttemptForm onIntent={onIntent} model={{
        reasonLabel: 'Referred, not arrived (12 days)',
        numberOptions: [{ id: 'p', label: 'Preferred · 90000 00001' }, { id: 'o', label: 'Other · 90000 00002' }],
        selectedNumber: s.number,
        channelOptions: [{ id: 'call', label: 'Phone call' }, { id: 'sms', label: 'SMS' }],
        selectedChannel: s.channel,
        reached: s.reached,
        outcomeOptions: [{ id: 'coming', label: 'Will come' }, { id: 'later', label: 'Call later' }, { id: 'nr', label: 'Not reachable' }, { id: 'wrong', label: 'Wrong number' }],
        selectedOutcome: s.outcome,
        consequence: s.outcome === 'wrong' ? 'Reminders to this number will stop.' : undefined,
        nextActionDate: s.next,
        note: s.note,
        canSubmit,
        submitError: canSubmit ? undefined : 'Choose a number, channel and outcome; set a next date if not reached.',
      }} />
      <Text style={{ color: t.textMuted, fontSize: t.textSm }}>Last intent: {last}</Text>
    </View>
  );
}

function SummaryDemo() {
  const [n, setN] = useState(0);
  return (
    <View style={{ gap: 12 }}>
      <EmrContactAttemptSummary model={{ text: `Last call 12-10-2026 · not reachable · ${3 + n} attempts · next 15-10-2026`, statusBadge: { label: 'Not reachable', tone: 'warning' } }}
        onIntent={() => setN(x => x + 1)} />
      <EmrContactAttemptSummary model={{ text: 'Last call 16-10-2026 · will come on 20-10-2026', statusBadge: { label: 'Reached', tone: 'success' } }} />
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'contact-attempt-form', title: 'EmrContactAttemptForm', render: FormDemo },
  { id: 'contact-attempt-summary', title: 'EmrContactAttemptSummary', render: SummaryDemo },
];
