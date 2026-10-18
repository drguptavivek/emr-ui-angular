'use client';

import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  ConsentCaptureIntent, ConsentCaptureViewModel, ConsentCategoryView, ConsentDecision, ConsentMethod, ConsentPurposeView, EmrBadge,
} from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard } from './l1-display';
import { EmrRadioGroup, EmrTextInput } from './l1-inputs';
import { EmrAttestation } from './l4-shell';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  agree: 'Agree',
  doNotAgree: 'Do not agree',
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

/** L4. Consent capture. Renders what the app resolved and emits intents; decides nothing. */
export function EmrConsentCapture({ model: m, labels, onIntent }: {
  model: EmrConsentCaptureModel;
  labels?: Partial<EmrConsentLabels>;
  onIntent: (intent: EmrConsentIntent) => void;
}) {
  const { t, body, bold, small } = useText();
  const l = { ...DEFAULTS, ...labels };
  const decisionOptions = [{ value: 'granted', label: l.agree }, { value: 'refused', label: l.doNotAgree }];
  const g = m.guardian;

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

      <View role="group" aria-label={l.purposes} style={styles.gap}>
        <Text role="heading" style={bold}>{l.purposes}</Text>
        {m.categories.map(c => {
          const essential = (p: EmrConsentPurpose) => (
            <View key={p.id} style={styles.tight}>
              <Text style={bold}>{p.label}</Text>
              <Text style={body}>{p.description}</Text>
              {p.essential ? <Text style={[bold, { color: t.success }]}>✓ {l.requiredForCare}</Text> : null}
            </View>
          );
          const allEssential = c.purposes.every(p => p.essential);
          return (
            <EmrCard key={c.id} label={c.label}>
              <View style={styles.gap}>
                {c.description ? <Text style={body}>{c.description}</Text> : null}
                {c.mode === 'whole' || allEssential ? (
                  <>
                    {/* One decision for the category; its purposes are listed for information. */}
                    {allEssential ? null : (
                      <EmrRadioGroup label={c.label} labelHidden options={decisionOptions} value={c.decision ?? null} readOnly={c.locked}
                        onValueChange={v => onIntent({ type: 'categoryDecided', id: c.id, decision: v as EmrConsentDecision })} />
                    )}
                    {c.purposes.map(essential)}
                  </>
                ) : c.purposes.map(p => p.essential ? essential(p) : (
                  <EmrRadioGroup key={p.id} label={p.label} hint={p.description} options={decisionOptions}
                    value={p.decision ?? null} readOnly={p.locked}
                    onValueChange={v => onIntent({ type: 'purposeDecided', id: p.id, decision: v as EmrConsentDecision })} />
                ))}
              </View>
            </EmrCard>
          );
        })}
      </View>

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
