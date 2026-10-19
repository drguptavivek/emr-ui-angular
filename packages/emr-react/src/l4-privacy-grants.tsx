'use client';

import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrSharingGrantsIntent,
  EmrSharingGrantsModel,
  SharingGrantView,
  SharingGrantsIntent,
  SharingGrantsViewModel,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard, EmrChip } from './l1-display';
import { EmrBadgeView, EmrButton } from './primitives';
import { ChipGroup, ConfirmSheet, ListStateView, PRIVACY_DEFAULTS, Stack, privacyStyles as s, usePrivacyText, type EmrPrivacyLabels } from './l4-privacy-shared';
import { focusRing } from './theme';

export type { EmrSharingGrantsIntent, EmrSharingGrantsModel };
type PressState = PressableStateCallbackType & { focused?: boolean };

/** L4. Who can see the patient's data, and for how long. Renders what the app resolved; emits intents only. */
export function EmrSharingGrants({ model: m, labels, onIntent }: {
  model: SharingGrantsViewModel;
  labels?: Partial<EmrPrivacyLabels>;
  onIntent: (intent: SharingGrantsIntent) => void;
}) {
  const l = { ...PRIVACY_DEFAULTS, ...labels };
  return (
    <Stack>
      {m.notice ? <EmrAlert tone={m.notice.tone}>{m.notice.text}</EmrAlert> : null}
      {m.filters?.length ? <ChipGroup label={l.filters} options={m.filters} selected={m.selectedFilter} onSelect={id => onIntent({ type: 'filterSelected', id })} /> : null}
      {/* 'ready' with no grants reads as empty, like the access log and rights list. */}
      <ListStateView state={m.state === 'ready' && m.grants.length === 0 ? 'empty' : m.state} message={m.message} labels={l} onRetry={() => onIntent({ type: 'retryRequested' })} />
      {m.state === 'ready' ? (
        <View role="list" style={s.gap}>
          {m.grants.map(g => <GrantCard key={g.id} grant={g} l={l} onIntent={onIntent} />)}
        </View>
      ) : null}
      {m.pendingRevoke ? (
        <ConfirmSheet pending={m.pendingRevoke}
          onConfirm={() => onIntent({ type: 'revokeConfirmed', grantId: m.pendingRevoke!.grantId })}
          onDismiss={() => onIntent({ type: 'revokeDismissed' })} />
      ) : null}
    </Stack>
  );
}

function GrantCard({ grant: g, l, onIntent }: { grant: SharingGrantView; l: EmrPrivacyLabels; onIntent: (intent: SharingGrantsIntent) => void }) {
  const { t, bold, small } = usePrivacyText();
  const validity = `${l.validFrom} ${g.validFromLabel} · ${g.validToLabel ? `${l.validUntil} ${g.validToLabel}` : l.noExpiry}`;
  const granted = [g.grantedAtLabel && `${l.granted} ${g.grantedAtLabel}`, g.grantedByLabel && `${l.grantedBy} ${g.grantedByLabel}`].filter(Boolean).join(' ');
  return (
    <View role="listitem">
      <EmrCard>
        <View style={s.gap}>
          <Pressable role="button" aria-label={g.recipientLabel} onPress={() => onIntent({ type: 'grantSelected', id: g.id })}
            style={({ pressed, focused }: PressState) => [s.gap, { minHeight: t.controlHeight }, pressed ? { backgroundColor: t.surfaceRaised } : null, focusRing(t, focused)]}>
            <View style={s.wrap}>
              <Text style={[bold, s.shrink]}>{g.recipientLabel}</Text>
              <EmrBadgeView badge={g.statusBadge} />
            </View>
            {g.recipientTypeLabel ? <Text style={small}>{g.recipientTypeLabel}</Text> : null}
            <Text style={small}>{l.purpose}: {g.purposeLabel}</Text>
          </Pressable>
          <View role="group" aria-label={l.dataShared} style={s.wrap}>
            {g.dataScope.map(d => <EmrChip key={d}>{d}</EmrChip>)}
          </View>
          {g.recordsPeriodLabel ? <Text style={small}>{l.recordsPeriod}: {g.recordsPeriodLabel}</Text> : null}
          <Text style={small}>{validity}</Text>
          {granted ? <Text style={small}>{granted}</Text> : null}
          {g.canRevoke ? (
            <EmrButton variant="outline" label={l.revoke} accessibilityLabel={`${l.revoke}: ${g.recipientLabel}`}
              onPress={() => onIntent({ type: 'revokeRequested', grantId: g.id })} />
          ) : null}
        </View>
      </EmrCard>
    </View>
  );
}
