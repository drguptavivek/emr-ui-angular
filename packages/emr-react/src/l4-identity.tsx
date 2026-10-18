'use client';

import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EmrTone, PatientIdentityIntent, PatientIdentityViewModel } from '@drguptavivek/emr-controller';
import { EmrChip, EmrAlert, EmrCard } from './l1-display';
import { EmrCheckbox } from './l1-inputs';
import { ThemedInput } from './inputs-core';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { EmrFieldFrame } from './typed-field';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  scan: 'Scan',
  confirmPatient: 'Confirm patient',
  notThisPatient: 'Not this patient',
  addIdentifier: 'Add identifier',
  more: (count: number) => `+${count}`,
  primaryIdentifier: 'Primary identifier',
  confirmIdentifier: 'Confirm identifier',
  cancel: 'Cancel',
  acknowledge: 'I have reviewed this',
  mergeRequest: 'Same person → request merge',
  reenter: 'Wrong ID → re-enter',
  addAsAdditional: 'Add as additional',
  replaceExisting: 'Replace existing',
  blockedTitle: 'Identifier cannot be used',
  warningsTitle: 'Review before continuing',
  okTitle: 'Identifier can be used',
  candidate: 'Existing patient',
} as const;
export type EmrIdentityLabels = typeof DEFAULTS;

// ---- Models and intents (pre-resolved strings; the controller owns every rule) ----

export interface EmrBarcodeScanFieldProps {
  value: string;
  onValueChange: (raw: string) => void;
  normalisedValue?: string;
  error?: string;
  warning?: string;
  label: string;
  hint?: string;
  readOnly?: boolean;
  typeOptions?: { id: string; label: string }[];
  selectedType?: string;
  labels?: Partial<EmrIdentityLabels>;
  onIntent: (intent: EmrBarcodeScanIntent) => void;
}
export type EmrBarcodeScanIntent = { type: 'scanRequested' } | { type: 'typeSelected'; id: string };

export type EmrPatientIdentity = PatientIdentityViewModel;
export type EmrPatientIdentityIntent = PatientIdentityIntent;

export type EmrIdentifierFindingKind = 'on_other_patient' | 'demographic_mismatch' | 'same_type_exists' | 'possible_duplicate';
export interface EmrIdentifierFinding {
  id: string;
  kind: EmrIdentifierFindingKind;
  message: string;
  evidence: { label: string; value: string }[];
  candidate?: EmrPatientIdentity & { id: string };
  acknowledged?: boolean;
}
export interface EmrIdentifierCheckModel {
  identifier: { label: string; display: string };
  outcome: 'blocked' | 'warnings' | 'ok';
  findings: EmrIdentifierFinding[];
  canConfirm: boolean;
  /** Controller-decided: offered when the patient already holds this identifier type. */
  canAddAsAdditional?: boolean;
  canReplaceExisting?: boolean;
}
export type EmrIdentifierCheckIntent =
  | { type: 'findingAcknowledged'; findingId: string }
  | { type: 'confirmRequested' }
  | { type: 'mergeRequested'; candidateId: string }
  | { type: 'reenterRequested' }
  | { type: 'addAsAdditional' }
  | { type: 'replaceExisting' }
  | { type: 'cancelled' };

function useText() {
  const t = useEmrTheme();
  const base = { fontSize: t.textMd, fontFamily: fontFamily(t) };
  return { t, body: { ...base, color: t.text }, muted: { ...base, color: t.textMuted, fontSize: t.textSm }, bold: { ...base, color: t.text, fontWeight: fontWeight(t.weightBold) } };
}

/** L2. Raw text entry plus a Scan request; the app owns the camera and the normaliser. No format rules here. */
export function EmrBarcodeScanField({ value, onValueChange, normalisedValue, error, warning, label, hint, readOnly, typeOptions, selectedType, labels, onIntent }: EmrBarcodeScanFieldProps) {
  const { t, muted } = useText();
  const l = { ...DEFAULTS, ...labels };
  const id = useId();
  const hasMessage = !!(error || warning || hint);
  return (
    <EmrFieldFrame label={label} controlId={id} hint={hint} warning={warning} error={error}>
      {typeOptions ? (
        <View role="radiogroup" aria-label={label}>
          <EmrRow>
            {typeOptions.map(o => (
              <EmrOptionChip key={o.id} label={o.label} selected={o.id === selectedType} readOnly={readOnly}
                onPress={() => onIntent({ type: 'typeSelected', id: o.id })} />
            ))}
          </EmrRow>
        </View>
      ) : null}
      <View style={styles.entry}>
        <View style={styles.grow}>
          <ThemedInput nativeID={id} aria-labelledby={`${id}-label`} aria-describedby={hasMessage ? `${id}-message` : undefined}
            value={value} onChangeText={onValueChange} invalid={!!error} readOnly={readOnly}
            autoCapitalize="characters" autoCorrect={false} spellCheck={false} />
        </View>
        {readOnly ? null : <EmrButton variant="outline" label={l.scan} accessibilityLabel={`${l.scan}: ${label}`} onPress={() => onIntent({ type: 'scanRequested' })} />}
      </View>
      {normalisedValue ? <Text aria-live="polite" style={[muted, { color: t.success }]}>✓ {normalisedValue}</Text> : null}
    </EmrFieldFrame>
  );
}

/** L4. Who this is, by identifier. First identifier is primary. Compact wraps within 360dp. */
export function EmrPatientIdentityCard({ model: m, mode, labels, onIntent }: {
  model: EmrPatientIdentity;
  mode: 'full' | 'compact';
  labels?: Partial<EmrIdentityLabels>;
  onIntent: (intent: EmrPatientIdentityIntent) => void;
}) {
  const { t, body, muted, bold } = useText();
  const l = { ...DEFAULTS, ...labels };
  const [primary, ...others] = m.identifiers;
  const demographics = [m.ageLabel, m.sexLabel].filter(Boolean).join(' · ');

  if (mode === 'compact') {
    return (
      <View role="region" aria-label={m.name} style={[styles.compact, { borderColor: t.border, backgroundColor: t.surface }]}>
        {/* Content wraps; "+N" stays attached to the end so nothing is clipped at 360dp. */}
        <View style={styles.wrap}>
          <Text role="heading" style={[bold, styles.shrink]}>{m.name}</Text>
          <Text style={[muted, styles.shrink]}>{[demographics, primary?.display].filter(Boolean).join(' · ')}</Text>
          {primary?.statusBadge ? <EmrBadgeView badge={primary.statusBadge} /> : null}
          {others.length ? <EmrChip>{l.more(others.length)}</EmrChip> : null}
        </View>
        <IdentityAlerts alerts={m.alerts} onIntent={onIntent} />
      </View>
    );
  }

  const details = [m.phone, m.centreName, m.lastVisitDate].filter((v): v is string => !!v);
  return (
    <EmrCard>
      <View role="region" aria-label={m.name} style={styles.stack}>
        <Text role="heading" style={[bold, { fontSize: t.textLg }]}>{m.name}</Text>
        <Text style={muted}>{demographics}</Text>
        {m.aliases?.length ? <Text style={muted}>{m.aliases.join(', ')}</Text> : null}
        {primary ? (
          <View style={styles.stack} aria-label={l.primaryIdentifier}>
            <Text style={muted}>{primary.label}</Text>
            <View style={styles.wrap}>
              <Text selectable style={[bold, { fontSize: t.textXl }]}>{primary.display}</Text>
              {primary.statusBadge ? <EmrBadgeView badge={primary.statusBadge} /> : null}
            </View>
          </View>
        ) : null}
        {others.map(i => (
          <View key={`${i.system}:${i.display}`} style={styles.wrap}>
            <Text style={muted}>{i.label}</Text>
            <Text selectable style={body}>{i.display}</Text>
            {i.statusBadge ? <EmrBadgeView badge={i.statusBadge} /> : null}
          </View>
        ))}
        {details.length ? <Text style={muted}>{details.join(' · ')}</Text> : null}
        <IdentityAlerts alerts={m.alerts} onIntent={onIntent} />
        <View style={styles.wrap}>
          <EmrButton label={l.confirmPatient} onPress={() => onIntent({ type: 'confirmRequested' })} />
          <EmrButton variant="outline" label={l.notThisPatient} onPress={() => onIntent({ type: 'notThisPatientRequested' })} />
        </View>
        <View style={styles.wrap}>
          {(m.addableSystems ?? []).map(a => (
            <EmrButton key={a.system} small variant="ghost" label={`${l.addIdentifier}: ${a.label}`}
              onPress={() => onIntent({ type: 'addIdentifierRequested', system: a.system })} />
          ))}
        </View>
      </View>
    </EmrCard>
  );
}

/** Controller-supplied notices under the identity block; the optional action emits alertActionRequested. */
function IdentityAlerts({ alerts, onIntent }: { alerts: EmrPatientIdentity['alerts']; onIntent: (intent: EmrPatientIdentityIntent) => void }) {
  const t = useEmrTheme();
  if (!alerts?.length) return null;
  return (
    <View style={styles.stack}>
      {alerts.map(a => (
        <EmrAlert key={a.id} tone={a.tone}>
          <View style={styles.wrap}>
            <Text style={[styles.shrink, { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) }]}>{a.text}</Text>
            {a.actionLabel ? (
              <EmrButton small variant="outline" label={a.actionLabel} accessibilityLabel={`${a.actionLabel}: ${a.text}`}
                onPress={() => onIntent({ type: 'alertActionRequested', id: a.id })} />
            ) : null}
          </View>
        </EmrAlert>
      ))}
    </View>
  );
}

const OUTCOME: Record<EmrIdentifierCheckModel['outcome'], { tone: EmrTone; title: keyof EmrIdentityLabels }> = {
  blocked: { tone: 'danger', title: 'blockedTitle' },
  warnings: { tone: 'warning', title: 'warningsTitle' },
  ok: { tone: 'success', title: 'okTitle' },
};

/** L4. Outcome and findings for an identifier check. Blocked has no confirm path; warnings need per-finding acknowledgement. */
export function EmrIdentifierCheckPrompt({ model: m, labels, onIntent }: {
  model: EmrIdentifierCheckModel;
  labels?: Partial<EmrIdentityLabels>;
  onIntent: (intent: EmrIdentifierCheckIntent) => void;
}) {
  const { t, body, muted, bold } = useText();
  const l = { ...DEFAULTS, ...labels };
  const o = OUTCOME[m.outcome];
  const blocked = m.outcome === 'blocked';
  const noop = () => undefined;
  return (
    <View role="group" aria-label={`${m.identifier.label}: ${m.identifier.display}`} style={styles.stack}>
      <EmrAlert tone={o.tone} title={String(l[o.title])}>
        {`${m.identifier.label}: ${m.identifier.display}`}
      </EmrAlert>
      {m.findings.map(f => (
        <EmrCard key={f.id}>
          <View style={styles.stack}>
            <Text style={bold}>{f.message}</Text>
            {f.evidence.map(e => (
              <View key={e.label} style={styles.wrap}>
                <Text style={muted}>{e.label}</Text>
                <Text style={[body, styles.shrink]}>{e.value}</Text>
              </View>
            ))}
            {f.candidate ? <EmrPatientIdentityCard mode="compact" model={f.candidate} labels={labels} onIntent={noop} /> : null}
            {m.outcome === 'warnings' ? (
              <EmrCheckbox label={l.acknowledge} value={!!f.acknowledged} onValueChange={() => onIntent({ type: 'findingAcknowledged', findingId: f.id })} />
            ) : null}
            {blocked && f.candidate ? (
              <EmrButton variant="outline" label={l.mergeRequest} onPress={() => onIntent({ type: 'mergeRequested', candidateId: f.candidate!.id })} />
            ) : null}
          </View>
        </EmrCard>
      ))}
      <View style={styles.wrap}>
        {blocked ? (
          <>
            <EmrButton label={l.reenter} onPress={() => onIntent({ type: 'reenterRequested' })} />
            {/* Staff can always back out (patient left, needs someone else to verify); adds nothing. */}
            <EmrButton variant="ghost" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
          </>
        ) : (
          <>
            {m.canConfirm ? <EmrButton label={l.confirmIdentifier} onPress={() => onIntent({ type: 'confirmRequested' })} /> : null}
            {m.canAddAsAdditional ? <EmrButton variant="outline" label={l.addAsAdditional} onPress={() => onIntent({ type: 'addAsAdditional' })} /> : null}
            {m.canReplaceExisting ? <EmrButton variant="outline" label={l.replaceExisting} onPress={() => onIntent({ type: 'replaceExisting' })} /> : null}
            <EmrButton variant="ghost" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  stack: { gap: 8 },
  compact: { borderWidth: 1, borderRadius: 8, padding: 8, gap: 8 },
});
