'use client';

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ListState, PendingConfirmation } from '@drguptavivek/emr-controller';
import { EmrStateMessage } from './l1-display';
import { EmrSheet } from './l4-shell-sheet';
import { EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
export const PRIVACY_DEFAULTS = {
  revoke: 'Revoke',
  noExpiry: 'No expiry',
  reportConcern: 'Report a concern',
  loadMore: 'Load more',
  newRequest: 'New request',
  withdraw: 'Withdraw',
  attachDocument: 'Attach document',
  submit: 'Submit',
  cancel: 'Cancel',
  retry: 'Retry',
  granted: 'Granted',
  grantedBy: 'by',
  validUntil: 'Valid until',
  validFrom: 'Valid from',
  purpose: 'Purpose',
  dataShared: 'Data shared',
  recordsPeriod: 'Records',
  submitted: 'Submitted',
  response: 'Response',
  details: 'Details',
  nomineeName: 'Nominee name',
  nomineeRelationship: 'Relationship to you',
  nomineeContact: 'Nominee contact',
  requestType: 'Request type',
  loading: 'Loading…',
  empty: 'Nothing to show',
  filters: 'Filters',
  period: 'Period',
  sections: 'Sections',
  contact: 'Need help?',
} as const;
export type EmrPrivacyLabels = typeof PRIVACY_DEFAULTS;

export function usePrivacyText() {
  const t = useEmrTheme();
  const base = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd, lineHeight: t.textMd * t.leadingNormal };
  return {
    t,
    body: base,
    bold: { ...base, fontWeight: fontWeight(t.weightBold) },
    small: { ...base, fontSize: t.textSm, lineHeight: t.textSm * t.leadingNormal, color: t.textMuted },
  };
}

/** Single-choice chips (filters, periods). Selection is the app's; pressing emits the id. */
export function ChipGroup({ label, options, selected, onSelect }: {
  label: string;
  options: { id: string; label: string }[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View role="radiogroup" aria-label={label}>
      <EmrRow>
        {options.map(o => <EmrOptionChip key={o.id} label={o.label} selected={o.id === selected} onPress={() => onSelect(o.id)} />)}
      </EmrRow>
    </View>
  );
}

/** Loading / empty / error placeholder for a list; returns null when there is something to show. */
export function ListStateView({ state, message, labels, onRetry }: {
  state: ListState;
  message?: string;
  labels: EmrPrivacyLabels;
  onRetry: () => void;
}) {
  if (state === 'ready') return null;
  if (state === 'loading') return <EmrStateMessage kind="loading" title={message ?? labels.loading} />;
  if (state === 'error') {
    return (
      <EmrStateMessage kind="error" message={message}>
        <EmrButton variant="outline" label={labels.retry} onPress={onRetry} />
      </EmrStateMessage>
    );
  }
  return <EmrStateMessage kind="empty" title={message ?? labels.empty} />;
}

/** Controlled confirm sheet; wording comes from the model, dismiss and cancel are one intent. */
export function ConfirmSheet({ pending, onConfirm, onDismiss }: {
  pending: PendingConfirmation;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { body } = usePrivacyText();
  return (
    <EmrSheet open title={pending.title} onIntent={onDismiss}
      footer={(
        <View style={styles.gap}>
          <EmrButton label={pending.confirmLabel} onPress={onConfirm} />
          <EmrButton variant="outline" label={pending.cancelLabel} onPress={onDismiss} />
        </View>
      )}>
      <Text style={body}>{pending.body}</Text>
    </EmrSheet>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <View style={styles.root}>{children}</View>;
}

export const privacyStyles = StyleSheet.create({
  gap: { gap: 8 },
  tight: { gap: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
  shrink: { flexShrink: 1, minWidth: 0 },
});
const styles = StyleSheet.create({ root: { gap: 16 }, gap: { gap: 8 } });
