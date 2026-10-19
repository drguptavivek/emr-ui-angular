'use client';

import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  ConsentReviewPurposeView,
  EmrConsentReviewIntent,
  EmrConsentReviewModel,
  EmrConsentReviewPurpose,
  EmrConsentReviewSection,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard } from './l1-display';
import { EmrCheckbox } from './l1-inputs';
import { ThemedInput } from './inputs-core';
import { EmrPatientIdentityCard } from './l4-identity';
import { EmrSheet } from './l4-shell-sheet';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrFieldFrame } from './typed-field';

export * from './consent-receipt';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  withdraw: 'Withdraw',
  grant: 'Grant',
  requiredForCare: 'Required for care',
  decided: 'Decided',
  method: 'Method',
  givenBy: 'Given by',
  contactChannels: 'Contact channels',
  printReceipt: 'Print / share receipt',
  close: 'Close',
  purposes: 'Purposes',
} as const;
export type EmrConsentReviewLabels = typeof DEFAULTS;

// ---- Models and intents (all strings pre-resolved by the app; every rule is domain-side) ----

export type {
  EmrConsentReviewIntent,
  EmrConsentReviewModel,
  EmrConsentReviewPurpose,
  EmrConsentReviewSection,
};

/** L4. "My consents" for staff at a desk or helpline. Renders what the app resolved and emits intents; decides nothing. */
export function EmrConsentReview({ model: m, labels, onIntent }: {
  model: EmrConsentReviewModel;
  labels?: Partial<EmrConsentReviewLabels>;
  onIntent: (intent: EmrConsentReviewIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const base = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd, lineHeight: t.textMd * t.leadingNormal };
  const bold = { ...base, fontWeight: fontWeight(t.weightBold) };
  const small = { ...base, fontSize: t.textSm, lineHeight: t.textSm * t.leadingNormal, color: t.textMuted };
  const pending = m.pendingWithdrawal;

  return (
    <View style={styles.root}>
      <EmrPatientIdentityCard model={m.patient} mode="compact" onIntent={() => {}} />
      <Text style={small}>{m.noticeVersionLabel}</Text>
      {m.message ? <EmrAlert tone={m.message.tone}>{m.message.text}</EmrAlert> : null}

      <View role="group" aria-label={l.purposes} style={styles.gap}>
        {m.categories.map(c => (
          <EmrCard key={c.id} label={c.label}>
            <View style={styles.gap}>
              {c.description ? <Text style={base}>{c.description}</Text> : null}
              {c.purposes.map(p => (
                <View key={p.id} style={[styles.purpose, { borderTopColor: t.border }]}>
                  <Text style={bold}>{p.label}</Text>
                  {p.description ? <Text style={base}>{p.description}</Text> : null}
                  <View style={styles.badgeRow}>
                    <EmrBadgeView badge={p.statusBadge} />
                    {p.essential ? <Text style={[bold, { color: t.success }]}>✓ {l.requiredForCare}</Text> : null}
                  </View>
                  {p.decidedAtLabel ? <Text style={small}>{l.decided}: {p.decidedAtLabel}</Text> : null}
                  {p.methodLabel ? <Text style={small}>{l.method}: {p.methodLabel}</Text> : null}
                  {p.givenByLabel ? <Text style={small}>{l.givenBy}: {p.givenByLabel}</Text> : null}
                  {p.contact ? <ContactBlock purposeId={p.id} contact={p.contact} heading={l.contactChannels} onIntent={onIntent} /> : null}
                  {/* Essential purposes can never be withdrawn here, whatever the model says. */}
                  {p.canWithdraw && !p.essential ? (
                    <EmrButton variant="outline" label={l.withdraw} accessibilityLabel={`${l.withdraw}: ${p.label}`}
                      onPress={() => onIntent({ type: 'withdrawRequested', purposeId: p.id })} />
                  ) : null}
                  {p.canGrant ? (
                    <EmrButton label={l.grant} accessibilityLabel={`${l.grant}: ${p.label}`}
                      onPress={() => onIntent({ type: 'grantRequested', purposeId: p.id })} />
                  ) : null}
                </View>
              ))}
            </View>
          </EmrCard>
        ))}
      </View>

      <View style={styles.gap}>
        <EmrButton label={l.printReceipt} onPress={() => onIntent({ type: 'receiptRequested' })} />
        <EmrButton variant="outline" label={l.close} onPress={() => onIntent({ type: 'cancelled' })} />
      </View>

      {pending ? (
        <EmrSheet open title={pending.title} onIntent={() => onIntent({ type: 'withdrawDismissed' })}
          footer={(
            <View style={styles.gap}>
              <EmrButton label={pending.confirmLabel} onPress={() => onIntent({ type: 'withdrawConfirmed', purposeId: pending.purposeId })} />
              <EmrButton variant="outline" label={pending.cancelLabel} onPress={() => onIntent({ type: 'withdrawDismissed' })} />
            </View>
          )}>
          <Text style={base}>{pending.body}</Text>
        </EmrSheet>
      ) : null}
    </View>
  );
}

function ContactBlock({ purposeId, contact: c, heading, onIntent }: {
  purposeId: string;
  contact: NonNullable<EmrConsentReviewPurpose['contact']>;
  heading: string;
  onIntent: (intent: EmrConsentReviewIntent) => void;
}) {
  const t = useEmrTheme();
  const id = useId();
  return (
    <View role="group" aria-label={heading} style={styles.gap}>
      <Text style={{ color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>{heading}</Text>
      {c.channels.map(ch => (
        <EmrCheckbox key={ch.id} label={ch.label} value={ch.selected}
          onValueChange={() => onIntent({ type: 'channelToggled', purposeId, channelId: ch.id })} />
      ))}
      {/* EmrTextInput has no keyboardType, so the same themed input is framed directly. */}
      <EmrFieldFrame label={c.preferredNumberLabel} controlId={id} error={c.preferredNumberError}>
        <ThemedInput id={id} aria-label={c.preferredNumberLabel} aria-labelledby={`${id}-label`}
          aria-describedby={c.preferredNumberError ? `${id}-message` : undefined} invalid={!!c.preferredNumberError}
          keyboardType="phone-pad" inputMode="tel" autoComplete="tel" value={c.preferredNumber ?? ''}
          onChangeText={value => onIntent({ type: 'preferredNumberChanged', purposeId, value })} />
      </EmrFieldFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  gap: { gap: 8 },
  purpose: { gap: 4, borderTopWidth: 1, paddingTop: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
});
