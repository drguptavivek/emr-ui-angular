'use client';

import { useId } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { ContactAttemptIntent, ContactAttemptSummaryIntent, ContactAttemptSummaryView, ContactAttemptViewModel } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrDateInput, EmrRadioGroup, EmrToggle } from './l1-inputs';
import { EmrAlert, EmrCard } from './l1-display';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrFieldFrame } from './typed-field';

const DEFAULTS = {
  number: 'Number',
  call: 'Call',
  channel: 'Channel',
  reached: 'Reached the patient',
  outcome: 'Outcome',
  nextActionDate: 'Next action date',
  note: 'Note',
  submit: 'Save attempt',
  cancel: 'Cancel',
  logAttempt: 'Log attempt',
};
export type EmrContactLabels = typeof DEFAULTS;

const opts = (o: readonly { id: string; label: string }[]) => o.map(x => ({ value: x.id, label: x.label }));

/** One call / message attempt (VCMS D11). Every string, `consequence` and `canSubmit` come from the app; the app dials. */
export type EmrContactAttemptModel = ContactAttemptViewModel;
export type EmrContactAttemptIntent = ContactAttemptIntent;

/** L4. Log a contact attempt: number (with a Call action), channel, reached, outcome, next action date, note. */
export function EmrContactAttemptForm({ model: m, labels, onIntent }: {
  model: EmrContactAttemptModel;
  labels?: Partial<EmrContactLabels>;
  onIntent: (intent: EmrContactAttemptIntent) => void;
}) {
  const l = { ...DEFAULTS, ...labels };
  const noteId = useId();
  return (
    <EmrCard label={m.reasonLabel}>
      <View style={styles.stack}>
        <EmrRadioGroup label={l.number} options={opts(m.numberOptions)} value={m.selectedNumber ?? null}
          onValueChange={id => onIntent({ type: 'numberSelected', id })} />
        {m.selectedNumber ? (
          <EmrButton variant="outline" label={`${l.call}: ${m.numberOptions.find(n => n.id === m.selectedNumber)?.label ?? ''}`}
            onPress={() => onIntent({ type: 'callRequested', numberId: m.selectedNumber! })} />
        ) : null}
        <EmrRadioGroup label={l.channel} options={opts(m.channelOptions)} value={m.selectedChannel ?? null}
          onValueChange={id => onIntent({ type: 'channelSelected', id })} />
        <EmrToggle label={l.reached} value={m.reached ?? false} onValueChange={reached => onIntent({ type: 'reachedChanged', reached })} />
        <EmrRadioGroup label={l.outcome} options={opts(m.outcomeOptions)} value={m.selectedOutcome ?? null}
          onValueChange={id => onIntent({ type: 'outcomeSelected', id })} />
        {m.consequence ? <EmrAlert tone="info">{m.consequence}</EmrAlert> : null}
        <EmrDateInput label={l.nextActionDate} value={m.nextActionDate ?? null} error={m.nextActionDateError}
          onValueChange={date => onIntent({ type: 'nextActionDateChanged', date })} />
        <EmrFieldFrame label={l.note} controlId={noteId}>
          <ThemedInput id={noteId} aria-label={l.note} multiline numberOfLines={3} value={m.note ?? ''}
            onChangeText={note => onIntent({ type: 'noteChanged', note })} />
        </EmrFieldFrame>
        {!m.canSubmit && m.submitError ? <EmrAlert tone="warning">{m.submitError}</EmrAlert> : null}
        <View style={styles.row}>
          {m.canSubmit ? <EmrButton label={l.submit} onPress={() => onIntent({ type: 'submitRequested' })} /> : null}
          <EmrButton variant="ghost" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
        </View>
      </View>
    </EmrCard>
  );
}

/** Compact last-attempt row for worklists and the patient hub; `text` is fully pre-resolved by the app. */
export type EmrContactAttemptSummaryModel = ContactAttemptSummaryView;

type PressState = PressableStateCallbackType & { focused?: boolean };

/** L4. One-line contact history with an optional "Log attempt" action (logAttemptRequested). */
export function EmrContactAttemptSummary({ model, labels, onIntent }: {
  model: EmrContactAttemptSummaryModel;
  labels?: Partial<EmrContactLabels>;
  onIntent?: (intent: ContactAttemptSummaryIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  return (
    <View style={styles.summary}>
      {model.statusBadge ? <EmrBadgeView badge={model.statusBadge} /> : null}
      <Text style={[styles.shrink, { color: t.text, fontSize: t.textSm, fontFamily: fontFamily(t) }]}>{model.text}</Text>
      {onIntent ? (
        <Pressable role="button" aria-label={l.logAttempt} onPress={() => onIntent({ type: 'logAttemptRequested' })}
          style={({ pressed, focused }: PressState) => [styles.action, { minHeight: t.controlHeight, borderColor: t.primaryBorder, backgroundColor: pressed ? t.primaryHover : t.primarySoft }, focusRing(t, focused)]}>
          <Text numberOfLines={1} style={{ color: t.primaryContrast, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>{l.logAttempt}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  shrink: { flexShrink: 1, minWidth: 0 },
  action: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
});
