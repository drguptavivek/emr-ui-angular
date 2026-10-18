'use client';

import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';
import { focusRing, useEmrTheme } from './theme';
import type { AccessLogEntryView, AccessLogIntent, AccessLogViewModel } from '@drguptavivek/emr-controller';
import { EmrCard } from './l1-display';
import { EmrBadgeView, EmrButton } from './primitives';
import { ChipGroup, ListStateView, PRIVACY_DEFAULTS, Stack, privacyStyles as s, usePrivacyText, type EmrPrivacyLabels } from './l4-privacy-shared';

export type EmrAccessLogModel = AccessLogViewModel;
export type EmrAccessLogIntent = AccessLogIntent;

/** L4. Who looked at the patient's data and why. Entries stay visible while more load; emits intents only. */
export function EmrAccessLog({ model: m, labels, onIntent }: {
  model: AccessLogViewModel;
  labels?: Partial<EmrPrivacyLabels>;
  onIntent: (intent: AccessLogIntent) => void;
}) {
  const l = { ...PRIVACY_DEFAULTS, ...labels };
  // Entries already loaded stay on screen while more load; a placeholder shows only when there is nothing to keep or it failed.
  const placeholder = m.entries.length === 0 || m.state === 'error';
  return (
    <Stack>
      {m.periodOptions?.length ? <ChipGroup label={l.period} options={m.periodOptions} selected={m.selectedPeriod} onSelect={id => onIntent({ type: 'periodSelected', id })} /> : null}
      <ListStateView state={placeholder ? (m.state === 'ready' ? 'empty' : m.state) : 'ready'} message={m.message} labels={l} onRetry={() => onIntent({ type: 'retryRequested' })} />
      {m.entries.length > 0 ? (
        <View role="list" style={s.gap}>
          {m.entries.map(e => <Entry key={e.id} entry={e} l={l} onIntent={onIntent} />)}
        </View>
      ) : null}
      {m.canLoadMore ? <EmrButton variant="outline" label={l.loadMore} onPress={() => onIntent({ type: 'loadMoreRequested' })} /> : null}
    </Stack>
  );
}

function Entry({ entry: e, l, onIntent }: { entry: AccessLogEntryView; l: EmrPrivacyLabels; onIntent: (intent: AccessLogIntent) => void }) {
  const { bold, body, small } = usePrivacyText();
  const t = useEmrTheme();
  const actor = [e.actorLabel, e.actorRoleLabel, e.organisationLabel].filter(Boolean).join(' · ');
  return (
    <View role="listitem">
      <EmrCard>
        <View style={s.tight}>
          <Text style={small}>{e.atLabel}</Text>
          <Text style={bold}>{actor}</Text>
          <View style={s.wrap}>
            {/* The data line opens the entry (entrySelected), matching the Angular twin. */}
            <Pressable role="button" aria-label={`${e.actionLabel}: ${e.dataLabel}`} onPress={() => onIntent({ type: 'entrySelected', id: e.id })}
              style={({ focused }: PressableStateCallbackType & { focused?: boolean }) => [{ flexGrow: 1, flexBasis: 200, minWidth: 0, minHeight: t.controlHeight, justifyContent: 'center' }, focusRing(t, focused)]}>
              <Text style={[body, { textDecorationLine: 'underline' }]}>{e.actionLabel}: {e.dataLabel}</Text>
            </Pressable>
            {e.badge ? <EmrBadgeView badge={e.badge} /> : null}
          </View>
          {e.purposeLabel ? <Text style={small}>{l.purpose}: {e.purposeLabel}</Text> : null}
          {e.canReportConcern ? (
            <EmrButton variant="ghost" label={l.reportConcern} accessibilityLabel={`${l.reportConcern}: ${e.atLabel}, ${e.actorLabel}`}
              onPress={() => onIntent({ type: 'concernRequested', entryId: e.id })} />
          ) : null}
        </View>
      </EmrCard>
    </View>
  );
}
