'use client';

import { StyleSheet, Text, View } from 'react-native';
import type { DraftRecordListIntent, DraftRecordListViewModel } from '@drguptavivek/emr-controller';
import { EmrCard } from './l1-display';
import { ConfirmSheet, ListStateView, PRIVACY_DEFAULTS } from './l4-privacy-shared';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  open: 'Open',
  move: 'Move to another patient',
  discard: 'Discard',
  list: 'Draft records',
  updated: 'Updated',
  loading: PRIVACY_DEFAULTS.loading,
  empty: PRIVACY_DEFAULTS.empty,
  retry: PRIVACY_DEFAULTS.retry,
} as const;
export type EmrDraftRecordLabels = typeof DEFAULTS;
export type EmrDraftRecordListModel = DraftRecordListViewModel;
export type EmrDraftRecordListIntent = DraftRecordListIntent;

/** L4. Offline drafts and sent records. Which actions a row offers is the app's (canOpen/canMove/canDiscard). */
export function EmrDraftRecordList({ model: m, labels, onIntent }: {
  model: EmrDraftRecordListModel;
  labels?: Partial<EmrDraftRecordLabels>;
  onIntent: (intent: EmrDraftRecordListIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const pending = m.pendingDiscard;
  return (
    <View style={styles.root}>
      <ListStateView state={m.state} message={m.message} labels={{ ...PRIVACY_DEFAULTS, loading: l.loading, empty: l.empty, retry: l.retry }}
        onRetry={() => onIntent({ type: 'retryRequested' })} />
      {m.state === 'ready' ? (
        <View role="list" aria-label={l.list} style={styles.root}>
          {m.rows.map(r => (
            <EmrCard key={r.id}>
              <View role="listitem" aria-label={r.title} style={styles.stack}>
                <View style={styles.wrap}>
                  <Text style={[text, styles.shrink, { fontWeight: fontWeight(t.weightBold) }]}>{r.title}</Text>
                  <EmrBadgeView badge={r.stateBadge} />
                </View>
                {r.subtitle ? <Text style={muted}>{r.subtitle}</Text> : null}
                {r.patientLabel ? <Text style={text}>{r.patientLabel}</Text> : null}
                <Text style={muted}>{l.updated}: {r.updatedAtLabel}</Text>
                <View style={styles.wrap}>
                  {r.canOpen ? <EmrButton small label={l.open} accessibilityLabel={`${l.open}: ${r.title}`} onPress={() => onIntent({ type: 'rowOpened', id: r.id })} /> : null}
                  {r.canMove ? <EmrButton small variant="outline" label={l.move} accessibilityLabel={`${l.move}: ${r.title}`} onPress={() => onIntent({ type: 'moveToPatientRequested', id: r.id })} /> : null}
                  {r.canDiscard ? <EmrButton small variant="ghost" label={l.discard} accessibilityLabel={`${l.discard}: ${r.title}`} onPress={() => onIntent({ type: 'discardRequested', id: r.id })} /> : null}
                </View>
              </View>
            </EmrCard>
          ))}
        </View>
      ) : null}
      {pending ? <ConfirmSheet pending={pending} onConfirm={() => onIntent({ type: 'discardConfirmed', id: pending.id })} onDismiss={() => onIntent({ type: 'discardDismissed' })} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  stack: { gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  shrink: { flexShrink: 1, minWidth: 0 },
});
