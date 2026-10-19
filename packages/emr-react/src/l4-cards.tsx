'use client';

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type {
  EmrLinkCardRow,
  EmrLinkCardsIntent,
  EmrLinkCardsModel,
  LinkCardView,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard } from './l1-display';
import { EmrBarcodeScanField, EmrPatientIdentityCard } from './l4-identity';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  addCard: 'Add card',
  checking: 'Checking this card…',
  sameConfirm: 'Same person',
  notSame: 'Not the same person',
  remove: 'Remove',
  primary: 'Primary',
  primaryGroup: 'Primary card',
  cards: 'Cards',
  submit: 'Link cards',
  cancel: 'Cancel',
} as const;
export type EmrLinkCardsLabels = typeof DEFAULTS;
export type { EmrLinkCardRow, EmrLinkCardsIntent, EmrLinkCardsModel };

/** L4. Link several cards to one patient. State, badges, messages and canSubmit are the app's; nothing is validated here. */
export function EmrLinkCards({ model: m, labels, onIntent }: {
  model: EmrLinkCardsModel;
  labels?: Partial<EmrLinkCardsLabels>;
  onIntent: (intent: EmrLinkCardsIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const noop = () => undefined;

  const card = (c: LinkCardView) => (
    <EmrCard key={c.id}>
      <View role="listitem" aria-label={c.display} style={styles.stack}>
        <View style={styles.wrap}>
          <Text selectable style={[text, styles.shrink, { fontWeight: fontWeight(t.weightBold) }]}>{c.display}</Text>
          <EmrBadgeView badge={c.statusBadge} />
        </View>
        {c.state === 'checking' ? (
          <View style={styles.wrap} aria-live="polite">
            <ActivityIndicator color={t.primary} />
            <Text style={[text, { color: t.textMuted }]}>{c.message ?? l.checking}</Text>
          </View>
        ) : c.message ? <Text style={text}>{c.message}</Text> : null}
        {c.warnings?.map(w => <EmrAlert key={w} tone="warning">{w}</EmrAlert>)}
        {c.state === 'on_other_patient' && c.candidate ? (
          <>
            <EmrPatientIdentityCard mode="compact" model={c.candidate} onIntent={noop} />
            <View style={styles.wrap}>
              <EmrButton variant="outline" label={l.sameConfirm} accessibilityLabel={`${l.sameConfirm}: ${c.display}`} onPress={() => onIntent({ type: 'sameConfirmed', id: c.id })} />
              <EmrButton variant="outline" label={l.notSame} accessibilityLabel={`${l.notSame}: ${c.display}`} onPress={() => onIntent({ type: 'notSameConfirmed', id: c.id })} />
            </View>
          </>
        ) : null}
        <View style={styles.wrap}>
          <EmrOptionChip label={l.primary} selected={m.primaryCardId === c.id} onPress={() => onIntent({ type: 'primarySelected', id: c.id })} />
          <EmrButton small variant="ghost" label={l.remove} accessibilityLabel={`${l.remove}: ${c.display}`} onPress={() => onIntent({ type: 'cardRemoved', id: c.id })} />
        </View>
      </View>
    </EmrCard>
  );

  return (
    <View style={styles.root}>
      <EmrPatientIdentityCard mode="compact" model={m.patient} onIntent={noop} />
      <EmrBarcodeScanField {...m.entry} labels={labels} onValueChange={raw => onIntent({ type: 'entryChanged', raw })} onSubmit={() => onIntent({ type: 'cardEntered' })} onIntent={onIntent} />
      <EmrButton variant="outline" label={l.addCard} onPress={() => onIntent({ type: 'cardEntered' })} />
      {m.cards.length ? (
        <View role="radiogroup" aria-label={l.primaryGroup}>
          <View role="list" aria-label={l.cards} style={styles.stack}>{m.cards.map(card)}</View>
        </View>
      ) : null}
      {!m.canSubmit && m.submitError ? <EmrAlert tone="warning">{m.submitError}</EmrAlert> : null}
      <EmrRow>
        {m.canSubmit ? <EmrButton label={l.submit} onPress={() => onIntent({ type: 'submitRequested' })} /> : null}
        <EmrButton variant="ghost" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
      </EmrRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  stack: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  shrink: { flexShrink: 1, minWidth: 0 },
});
