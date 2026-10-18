'use client';

import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  ConsentCaptureIntent, ConsentCaptureViewModel, ConsentCategoryView, ConsentDecision, ConsentMethod, ConsentPurposeView, EmrBadge,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard } from './l1-display';
import { EmrCheckbox, EmrRadioGroup, EmrTextInput } from './l1-inputs';
import { EmrAttestation } from './l4-shell';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  agreeToAll: 'Agree to all',
  requiredForCare: 'Required for care',
  givenBy: 'Given by',
  method: 'Method',
  captureSignature: 'Capture signature',
  captureThumbprint: 'Capture thumbprint',
  submit: 'Submit',
  cancel: 'Cancel',
  noticeVersion: (version: string, language: string) => `Notice version ${version} · ${language}`,
  language: 'Language',
  notice: 'Consent notice',
  purposes: 'Purposes',
  guardianName: 'Guardian name',
  guardianRelationship: 'Relationship to patient',
} as const;
export type EmrConsentLabels = typeof DEFAULTS;

// ---- Models and intents (all strings pre-resolved by the app; every rule is domain-side) ----

export type EmrConsentMethod = ConsentMethod;
export type EmrConsentDecision = ConsentDecision;
export type EmrConsentPurpose = ConsentPurposeView;
export type EmrConsentCategory = ConsentCategoryView;
export type EmrConsentCaptureModel = ConsentCaptureViewModel;
export type EmrConsentIntent = ConsentCaptureIntent;

function useText() {
  const t = useEmrTheme();
  // Body text never below textMd with normal leading; no fixed heights so large text reflows.
  const base = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd, lineHeight: t.textMd * t.leadingNormal };
  return {
    t,
    body: base,
    bold: { ...base, fontWeight: fontWeight(t.weightBold) },
    small: { ...base, fontSize: t.textSm, lineHeight: t.textSm * t.leadingNormal, color: t.textMuted },
  };
}

const opts = (list: { id: string; label: string }[]) => list.map(o => ({ value: o.id, label: o.label }));

/**
 * L4. Consent capture. Renders what the app resolved and emits intents; decides nothing.
 * Purposes are one checkbox list. A row is ticked only when the model says `decision: 'granted'`; nothing is
 * pre-ticked except essential purposes (read-only). Ticking emits 'granted', unticking emits 'refused', and
 * "Agree to all" emits one categoryDecided / purposeDecided per unlocked row. An untouched row emits nothing:
 * the app's submit path must record every untouched optional row as 'refused' (never just "the ticked ones").
 */
export function EmrConsentCapture({ model: m, labels, onIntent }: {
  model: EmrConsentCaptureModel;
  labels?: Partial<EmrConsentLabels>;
  onIntent: (intent: EmrConsentIntent) => void;
}) {
  const { t, body, bold, small } = useText();
  const l = { ...DEFAULTS, ...labels };
  const g = m.guardian;
  // Decidable rows: a whole-mode category is one row (its purposes as the hint); per-purpose gives one row each.
  const rows = m.categories.flatMap(c => {
    const choosable = c.purposes.filter(p => !p.essential);
    if (!choosable.length) return [];
    return c.mode === 'whole'
      ? [{ key: `c:${c.id}`, label: c.label, hint: [c.description, ...choosable.map(p => p.label)].filter(Boolean).join(' · '), decision: c.decision, locked: c.locked,
          decide: (d: EmrConsentDecision) => onIntent({ type: 'categoryDecided', id: c.id, decision: d }) }]
      : choosable.map(p => ({ key: `p:${p.id}`, label: p.label, hint: p.description, decision: p.decision, locked: p.locked,
          decide: (d: EmrConsentDecision) => onIntent({ type: 'purposeDecided', id: p.id, decision: d }) }));
  });
  // Locked rows were decided earlier; "Agree to all" reflects and changes only what can still change.
  const open = rows.filter(r => !r.locked);
  const allGranted = open.length > 0 && open.every(r => r.decision === 'granted');

  return (
    <View style={styles.root}>
      <View role="radiogroup" aria-label={l.language}>
        <EmrRow>
          {m.languageOptions.map(o => (
            <EmrOptionChip key={o.id} label={o.label} selected={o.id === m.selectedLanguage}
              onPress={() => onIntent({ type: 'languageSelected', id: o.id })} />
          ))}
        </EmrRow>
      </View>

      <View role="region" aria-label={m.notice.title || l.notice} style={styles.gap}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: NOTICE_MAX_HEIGHT, borderColor: t.border, borderWidth: 1, borderRadius: 8, backgroundColor: t.surface }} contentContainerStyle={styles.notice}>
          <Text role="heading" style={[bold, { fontSize: t.textLg, lineHeight: t.textLg * t.leadingNormal }]}>{m.notice.title}</Text>
          {m.notice.sections.map((s, i) => (
            <View key={i} style={styles.tight}>
              <Text role="heading" style={bold}>{s.heading}</Text>
              <Text style={body}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={small}>{l.noticeVersion(m.notice.version, m.notice.languageLabel)}</Text>
      </View>

      {/* One list: a checkbox per decision (a whole-mode category is one row), essential purposes shown ticked
          and read-only, and "Agree to all" on top. Ticked = granted, unticked = refused. */}
      <EmrCard label={l.purposes}>
        <View style={styles.gap}>
          {open.length ? (
            <EmrCheckbox label={l.agreeToAll} value={allGranted} mixed={!allGranted && open.some(r => r.decision === 'granted')}
              onValueChange={() => open.forEach(r => r.decide(allGranted ? 'refused' : 'granted'))} />
          ) : null}
          {m.categories.flatMap(c => c.purposes.filter(p => p.essential)).map(p => (
            <EmrCheckbox key={p.id} label={p.label} hint={`${l.requiredForCare}. ${p.description}`} readOnly value onValueChange={() => undefined} />
          ))}
          {rows.map(r => (
            <EmrCheckbox key={r.key} label={r.label} hint={r.hint} readOnly={r.locked} value={r.decision === 'granted'}
              onValueChange={v => r.decide(v ? 'granted' : 'refused')} />
          ))}
        </View>
      </EmrCard>

      <EmrRadioGroup label={l.givenBy} options={opts(m.givenByOptions)} value={m.selectedGivenBy ?? null}
        onValueChange={id => onIntent({ type: 'givenBySelected', id })} />
      {g ? (
        <View style={styles.gap}>
          <EmrTextInput label={l.guardianName} required={g.required} value={g.name ?? null} error={g.nameError}
            onValueChange={v => onIntent({ type: 'guardianChanged', name: v ?? '' })} />
          <EmrTextInput label={l.guardianRelationship} required={g.required} value={g.relationship ?? null} error={g.relationshipError}
            onValueChange={v => onIntent({ type: 'guardianChanged', relationship: v ?? '' })} />
        </View>
      ) : null}

      <EmrRadioGroup label={l.method} options={opts(m.methodOptions)} value={m.selectedMethod ?? null}
        onValueChange={id => onIntent({ type: 'methodSelected', id: id as EmrConsentMethod })} />
      {m.selectedMethod === 'signature' ? (
        <CapturePanel label={l.captureSignature} status={m.capture?.signatureLabel} onPress={() => onIntent({ type: 'signatureRequested' })} />
      ) : null}
      {m.selectedMethod === 'thumbprint' ? (
        <CapturePanel label={l.captureThumbprint} status={m.capture?.thumbprintLabel} onPress={() => onIntent({ type: 'thumbprintRequested' })} />
      ) : null}
      {m.selectedMethod === 'verbal_attested' && m.attestation ? (
        <EmrAttestation model={m.attestation} onIntent={i => { if (i.type === 'signRequested') onIntent({ type: 'attestationConfirmed' }); }} />
      ) : null}

      <View style={styles.gap}>
        {m.canSubmit
          ? <EmrButton label={l.submit} onPress={() => onIntent({ type: 'submitRequested' })} />
          : m.submitError ? <EmrAlert tone="danger">{m.submitError}</EmrAlert> : null}
        <EmrButton variant="outline" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
      </View>
    </View>
  );
}

function CapturePanel({ label, status, onPress }: { label: string; status?: string; onPress: () => void }) {
  const { small } = useText();
  return (
    <View style={styles.tight}>
      <EmrButton variant="outline" label={label} onPress={onPress} />
      {status ? <Text role="status" style={small}>{status}</Text> : null}
    </View>
  );
}

/** L2. Consent state as a controller-resolved badge plus optional detail; tappable when `onIntent` is given. */
export function EmrConsentStatusBadge({ badge, detail, onIntent }: {
  badge: EmrBadge;
  detail?: string;
  onIntent?: (intent: { type: 'consentDetailsRequested' }) => void;
}) {
  const { t, small } = useText();
  const name = [badge.assistiveText ?? badge.label, detail].filter(Boolean).join(', ');
  const content = (
    <View style={styles.badgeRow}>
      <EmrBadgeView badge={{ ...badge, assistiveText: name }} />
      {detail ? <Text style={[small, styles.shrink]}>{detail}</Text> : null}
    </View>
  );
  if (!onIntent) return content;
  return (
    <Pressable role="button" aria-label={name} onPress={() => onIntent({ type: 'consentDetailsRequested' })}
      style={({ focused }: PressState) => [focusRing(t, focused), { minHeight: t.controlHeight, justifyContent: 'center' }]}>
      {content}
    </Pressable>
  );
}

/**
 * Fixed, not a share of the window: the server (Next.js SSR) has no window height, so a window-based value
 * renders 0 there and mismatches on hydration. ~Half a 640dp phone screen; the notice scrolls inside.
 */
const NOTICE_MAX_HEIGHT = 320;

const styles = StyleSheet.create({
  root: { gap: 16 },
  gap: { gap: 8 },
  tight: { gap: 4 },
  notice: { padding: 12, gap: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
  shrink: { flexShrink: 1, minWidth: 0 },
});
