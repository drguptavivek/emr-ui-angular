'use client';

import { useId } from 'react';
import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrRightsRequestsIntent,
  EmrRightsRequestsModel,
  RightsRequestDraft,
  RightsRequestView,
  RightsRequestsIntent,
  RightsRequestsViewModel,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard } from './l1-display';
import { ThemedInput } from './inputs-core';
import { ConfirmSheet, ListStateView, PRIVACY_DEFAULTS, Stack, privacyStyles as s, usePrivacyText, type EmrPrivacyLabels } from './l4-privacy-shared';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing } from './theme';
import { EmrFieldFrame } from './typed-field';

export type { EmrRightsRequestsIntent, EmrRightsRequestsModel };
type PressState = PressableStateCallbackType & { focused?: boolean };

/** L4. Data-principal rights requests: list, withdraw, and a new-request draft. The app owns every rule; emits intents only. */
export function EmrRightsRequests({ model: m, labels, onIntent }: {
  model: RightsRequestsViewModel;
  labels?: Partial<EmrPrivacyLabels>;
  onIntent: (intent: RightsRequestsIntent) => void;
}) {
  const l = { ...PRIVACY_DEFAULTS, ...labels };
  return (
    <Stack>
      {m.notice ? <EmrAlert tone={m.notice.tone}>{m.notice.text}</EmrAlert> : null}
      {m.draft ? (
        <Draft draft={m.draft} l={l} onIntent={onIntent} />
      ) : (
        <>
          <EmrButton label={l.newRequest} onPress={() => onIntent({ type: 'newRequestStarted' })} />
          <ListStateView state={m.state === 'ready' && m.requests.length === 0 ? 'empty' : m.state} message={m.message} labels={l} onRetry={() => onIntent({ type: 'retryRequested' })} />
          {m.state === 'ready' && m.requests.length ? (
            <View role="list" style={s.gap}>
              {m.requests.map(r => <Request key={r.id} request={r} l={l} onIntent={onIntent} />)}
            </View>
          ) : null}
        </>
      )}
      {m.pendingWithdrawal ? (
        <ConfirmSheet pending={m.pendingWithdrawal}
          onConfirm={() => onIntent({ type: 'withdrawConfirmed', requestId: m.pendingWithdrawal!.requestId })}
          onDismiss={() => onIntent({ type: 'withdrawDismissed' })} />
      ) : null}
    </Stack>
  );
}

function Request({ request: r, l, onIntent }: { request: RightsRequestView; l: EmrPrivacyLabels; onIntent: (intent: RightsRequestsIntent) => void }) {
  const { t, bold, body, small } = usePrivacyText();
  return (
    <View role="listitem">
      <EmrCard>
        <View style={s.gap}>
          <Pressable role="button" aria-label={`${r.kindLabel}, ${l.submitted} ${r.submittedAtLabel}`} onPress={() => onIntent({ type: 'requestSelected', id: r.id })}
            style={({ pressed, focused }: PressState) => [s.gap, { minHeight: t.controlHeight }, pressed ? { backgroundColor: t.surfaceRaised } : null, focusRing(t, focused)]}>
            <View style={s.wrap}>
              <Text style={[bold, s.shrink]}>{r.kindLabel}</Text>
              <EmrBadgeView badge={r.statusBadge} />
            </View>
            <Text style={small}>{l.submitted} {r.submittedAtLabel}</Text>
            {r.dueLabel ? <Text style={small}>{r.dueLabel}</Text> : null}
          </Pressable>
          {r.summary ? <Text style={body}>{r.summary}</Text> : null}
          {r.responseText ? (
            <View role="group" aria-label={l.response} style={s.tight}>
              <Text style={bold}>{l.response}</Text>
              <Text style={body}>{r.responseText}</Text>
            </View>
          ) : null}
          {r.canWithdraw ? (
            <EmrButton variant="outline" label={l.withdraw} accessibilityLabel={`${l.withdraw}: ${r.kindLabel}`}
              onPress={() => onIntent({ type: 'withdrawRequested', requestId: r.id })} />
          ) : null}
        </View>
      </EmrCard>
    </View>
  );
}

function Draft({ draft: d, l, onIntent }: { draft: RightsRequestDraft; l: EmrPrivacyLabels; onIntent: (intent: RightsRequestsIntent) => void }) {
  const { t, bold, body, small } = usePrivacyText();
  const id = useId();
  const n = d.nominee;
  const field = (key: 'name' | 'relationship' | 'contact', label: string, extra?: object) => {
    const error = n?.[`${key}Error` as const];
    const cid = `${id}-${key}`;
    return (
      <EmrFieldFrame key={key} label={label} controlId={cid} error={error}>
        <ThemedInput id={cid} aria-label={label} aria-labelledby={`${cid}-label`} aria-describedby={error ? `${cid}-message` : undefined}
          invalid={!!error} value={n?.[key] ?? ''} onChangeText={value => onIntent({ type: 'nomineeChanged', [key]: value })} {...extra} />
      </EmrFieldFrame>
    );
  };
  return (
    <View role="form" aria-label={l.newRequest} style={s.gap}>
      <View role="radiogroup" aria-label={l.requestType} style={s.gap}>
        {d.kindOptions.map(o => {
          const selected = o.id === d.kind;
          return (
            <Pressable key={o.id} role="radio" aria-checked={selected} onPress={() => onIntent({ type: 'kindSelected', kind: o.id })}
              style={({ focused }: PressState) => [s.gap, focusRing(t, focused), {
                minHeight: t.controlHeight, padding: 12, borderRadius: 12, borderWidth: selected ? 2 : 1, borderColor: selected ? t.primary : t.border, backgroundColor: t.surface,
              }]}>
              <Text style={bold}>{selected ? '✓ ' : ''}{o.label}</Text>
              {o.description ? <Text style={small}>{o.description}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      {d.guidance ? <EmrAlert tone="info">{d.guidance}</EmrAlert> : null}
      <EmrFieldFrame label={d.descriptionLabel} controlId={`${id}-desc`} error={d.descriptionError}>
        <ThemedInput id={`${id}-desc`} aria-label={d.descriptionLabel} aria-labelledby={`${id}-desc-label`}
          aria-describedby={d.descriptionError ? `${id}-desc-message` : undefined} invalid={!!d.descriptionError}
          multiline numberOfLines={4} value={d.description ?? ''} onChangeText={value => onIntent({ type: 'descriptionChanged', value })} />
      </EmrFieldFrame>
      {n ? (
        <View role="group" aria-label={l.details} style={s.gap}>
          {field('name', l.nomineeName)}
          {field('relationship', l.nomineeRelationship)}
          {field('contact', l.nomineeContact, { keyboardType: 'phone-pad', inputMode: 'tel', autoComplete: 'tel' })}
        </View>
      ) : null}
      {d.canAttach || d.attachmentsLabel ? (
        <View style={s.gap}>
          {d.canAttach ? <EmrButton variant="outline" label={l.attachDocument} onPress={() => onIntent({ type: 'attachRequested' })} /> : null}
          {d.attachmentsLabel ? <Text style={body}>{d.attachmentsLabel}</Text> : null}
        </View>
      ) : null}
      {d.canSubmit ? null : d.submitError ? <EmrAlert tone="danger">{d.submitError}</EmrAlert> : null}
      <View style={s.wrap}>
        {d.canSubmit ? <EmrButton label={l.submit} onPress={() => onIntent({ type: 'draftSubmitted' })} /> : null}
        <EmrButton variant="outline" label={l.cancel} onPress={() => onIntent({ type: 'draftCancelled' })} />
      </View>
    </View>
  );
}
