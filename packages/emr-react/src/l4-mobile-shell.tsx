'use client';

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrFieldFrame } from './typed-field';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; every key is overridable through the component's `labels` prop. */
const DEFAULTS = {
  pinEntered: (n: number, m: number) => `${n} of ${m} digits entered`,
  pinDelete: 'Delete',
  pinSubmit: 'Submit PIN',
  pinForgot: 'Forgot PIN?',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  tabs: 'Main navigation',
  scan: 'Scan',
  dismiss: 'Dismiss',
  syncDetails: 'Sync details',
};
export type EmrMobileShellLabels = typeof DEFAULTS;

/** Glyph paired with text so tone is never colour alone. */
const GLYPH: Record<EmrTone, string> = { neutral: '•', info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };

// ---- PinPad -------------------------------------------------------------------------------

export interface EmrPinPadModel {
  mode: 'set' | 'confirm' | 'unlock' | 'change';
  title: string;
  prompt?: string;
  /** Count only: the digits themselves never reach this component. */
  digitsEntered: number;
  length: number;
  error?: string;
  lockoutMessage?: string;
  locked?: boolean;
}
export type EmrPinPadIntent =
  | { type: 'digitPressed'; digit: string }
  | { type: 'deleted' }
  | { type: 'submitted' }
  | { type: 'forgotRequested' };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete', '0', 'submit'] as const;

/**
 * L4 PIN pad. Holds no secret and no policy: it counts taps for the dots and emits intents; the app
 * stores, compares and rate-limits. Keys go inert (still focusable) while `locked`. An error shakes the
 * dots briefly (skipped under reduce-motion) but the error text is always shown, never the shake alone.
 */
export function EmrPinPad({ model: m, onIntent, labels, showForgot }: {
  model: EmrPinPadModel;
  onIntent: (intent: EmrPinPadIntent) => void;
  labels?: Partial<EmrMobileShellLabels>;
  /** Renders the "Forgot PIN?" link; the app decides whether recovery exists. */
  showForgot?: boolean;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!m.error) return;
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!live || reduce) return;
      Animated.sequence([10, -10, 6, -6, 0].map(to => Animated.timing(shake, { toValue: to, duration: 50, useNativeDriver: true }))).start();
    }).catch(() => undefined);
    return () => { live = false; };
  }, [m.error, shake]);
  const keyHeight = Platform.OS === 'web' ? t.controlHeight : Math.max(64, t.controlHeight);
  const text = { color: t.text, fontFamily: fontFamily(t) };
  return (
    <View style={styles.pad}>
      <Text role="heading" style={[text, { fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), textAlign: 'center' }]}>{m.title}</Text>
      {m.prompt ? <Text style={[text, { fontSize: t.textMd, color: t.textMuted, textAlign: 'center' }]}>{m.prompt}</Text> : null}
      <Animated.View role="img" aria-label={l.pinEntered(m.digitsEntered, m.length)} style={[styles.dots, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length: m.length }, (_, i) => (
          <View key={i} style={[styles.dot, { borderColor: t.primary, backgroundColor: i < m.digitsEntered ? t.primary : 'transparent' }]} />
        ))}
      </Animated.View>
      {m.error ? <Text role="alert" style={[text, { fontSize: t.textMd, color: t.danger, textAlign: 'center' }]}>{GLYPH.danger} {m.error}</Text> : null}
      {m.locked && m.lockoutMessage ? <Text role="alert" style={[text, { fontSize: t.textMd, color: t.warning, textAlign: 'center' }]}>{GLYPH.warning} {m.lockoutMessage}</Text> : null}
      <View style={styles.keys}>
        {KEYS.map(key => {
          const glyph = key === 'delete' ? '⌫' : key === 'submit' ? '✓' : key;
          const name = key === 'delete' ? l.pinDelete : key === 'submit' ? l.pinSubmit : key;
          const press = () => {
            if (m.locked) return;
            onIntent(key === 'delete' ? { type: 'deleted' } : key === 'submit' ? { type: 'submitted' } : { type: 'digitPressed', digit: key });
          };
          return (
            <Pressable key={key} role="button" aria-label={name} aria-disabled={m.locked} onPress={press}
              style={({ pressed, focused }: PressState) => [styles.key, focusRing(t, focused), {
                height: keyHeight, borderColor: t.border, opacity: m.locked ? 0.5 : 1,
                backgroundColor: key === 'submit' ? t.primarySoft : pressed ? t.surfaceRaised : t.surface,
              }]}>
              <Text aria-hidden style={[text, { fontSize: t.text2xl, fontWeight: fontWeight(t.weightMedium) }]}>{glyph}</Text>
            </Pressable>
          );
        })}
      </View>
      {showForgot ? <EmrButton variant="ghost" label={l.pinForgot} onPress={() => onIntent({ type: 'forgotRequested' })} /> : null}
    </View>
  );
}

// ---- LoginForm ----------------------------------------------------------------------------

export interface EmrLoginFormModel {
  title?: string;
  username: string;
  error?: string;
  busy?: boolean;
  usernameLabel: string;
  passwordLabel: string;
}
export type EmrLoginFormIntent =
  | { type: 'usernameChanged'; value: string }
  | { type: 'submitRequested'; username: string; password: string };

/**
 * L4 login form. The password lives only in this component's local draft: it is not in the model, not
 * logged, and leaves exactly once, inside `submitRequested`. Busy relabels Sign in but keeps the button focusable.
 */
export function EmrLoginForm({ model: m, onIntent, labels }: {
  model: EmrLoginFormModel;
  onIntent: (intent: EmrLoginFormIntent) => void;
  labels?: Partial<EmrMobileShellLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const [password, setPassword] = useState('');
  const submit = () => { if (!m.busy) onIntent({ type: 'submitRequested', username: m.username, password }); };
  return (
    <View style={{ gap: 16 }}>
      {m.title ? <Text role="heading" style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{m.title}</Text> : null}
      <EmrFieldFrame label={m.usernameLabel} controlId="login-username">
        <ThemedInput id="login-username" aria-label={m.usernameLabel} value={m.username} onChangeText={v => onIntent({ type: 'usernameChanged', value: v })}
          textContentType="username" autoComplete="username" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
      </EmrFieldFrame>
      <EmrFieldFrame label={m.passwordLabel} controlId="login-password" error={m.error}>
        <ThemedInput id="login-password" aria-label={m.passwordLabel} value={password} onChangeText={setPassword} invalid={!!m.error}
          secureTextEntry textContentType="password" autoComplete="current-password" autoCapitalize="none" autoCorrect={false}
          returnKeyType="go" onSubmitEditing={submit} />
      </EmrFieldFrame>
      {/* Not `disabled`: a busy button stays in the tab order and just ignores presses. */}
      <EmrButton label={m.busy ? l.signingIn : l.signIn} onPress={submit} />
    </View>
  );
}

// ---- BottomTabBar -------------------------------------------------------------------------

export interface EmrBottomTabItem { id: string; label: string; badge?: EmrBadge }
export type EmrBottomTabBarIntent = { type: 'tabSelected'; id: string } | { type: 'scanRequested' };

/** L4 bottom tab bar with a raised centre Scan button. `bottomInset` is the app's safe-area inset. */
export function EmrBottomTabBar({ items, activeId, bottomInset = 0, onIntent, labels }: {
  items: readonly EmrBottomTabItem[];
  activeId: string;
  bottomInset?: number;
  onIntent: (intent: EmrBottomTabBarIntent) => void;
  labels?: Partial<EmrMobileShellLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const half = Math.ceil(items.length / 2);
  const tab = (item: EmrBottomTabItem) => {
    const selected = item.id === activeId;
    return (
      <Pressable key={item.id} role="tab" aria-selected={selected} onPress={() => onIntent({ type: 'tabSelected', id: item.id })}
        style={({ focused }: PressState) => [styles.tab, focusRing(t, focused), { minHeight: 56, borderTopColor: selected ? t.primary : 'transparent' }]}>
        <Text style={{ color: selected ? t.primary : t.text, fontSize: t.textSm, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>{item.label}</Text>
        {item.badge ? <EmrBadgeView badge={item.badge} /> : null}
      </Pressable>
    );
  };
  return (
    <View style={[styles.bar, { backgroundColor: t.surface, borderTopColor: t.border, paddingBottom: bottomInset }]}>
      <View role="tablist" aria-label={l.tabs} style={styles.barRow}>
        {items.slice(0, half).map(tab)}
        <Pressable role="button" aria-label={l.scan} onPress={() => onIntent({ type: 'scanRequested' })}
          style={({ pressed, focused }: PressState) => [styles.scan, focusRing(t, focused), { backgroundColor: pressed ? t.primaryHover : t.primarySoft, borderColor: t.primaryBorder }]}>
          <Text aria-hidden style={{ color: t.primaryContrast, fontSize: t.textXl }}>▣</Text>
          <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>{l.scan}</Text>
        </Pressable>
        {items.slice(half).map(tab)}
      </View>
    </View>
  );
}

// ---- SyncPill -----------------------------------------------------------------------------

export interface EmrSyncPillModel { label: string; tone: EmrTone; detail?: string }
export type EmrSyncPillIntent = { type: 'syncDetailsRequested' };

/** L4 compact header pill. Glyph + text; tappable only when `onIntent` is given. */
export function EmrSyncPill({ model: m, onIntent, labels }: {
  model: EmrSyncPillModel;
  onIntent?: (intent: EmrSyncPillIntent) => void;
  labels?: Partial<EmrMobileShellLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const c = toneColors(t, m.tone);
  const name = [m.label, m.detail].filter(Boolean).join(', ');
  const body = <Text style={{ color: c.color, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{GLYPH[m.tone]} {m.label}</Text>;
  const base = [styles.pill, { backgroundColor: c.backgroundColor, borderColor: c.color }];
  if (!onIntent) return <View role="status" aria-label={name} style={base}>{body}</View>;
  return (
    <Pressable role="button" aria-label={`${name}. ${l.syncDetails}`} onPress={() => onIntent({ type: 'syncDetailsRequested' })}
      style={({ focused }: PressState) => [...base, focusRing(t, focused), { minHeight: 48 }]}>
      {body}
    </Pressable>
  );
}

// ---- Toast --------------------------------------------------------------------------------

export interface EmrToastModel { id: string; message: string; tone: EmrTone; actionLabel?: string }
export type EmrToastIntent = { type: 'dismissed'; id: string } | { type: 'actionPressed'; id: string };

/**
 * L4 toast. No timers: the app's queue dismisses. It is transient, so it must never be the only carrier
 * of a blocking clinical error; those belong in an inline EmrAlert. `bottomOffset` lifts it above the tab bar.
 */
export function EmrToast({ model, bottomOffset = 0, onIntent, labels }: {
  model: EmrToastModel | null;
  bottomOffset?: number;
  onIntent: (intent: EmrToastIntent) => void;
  labels?: Partial<EmrMobileShellLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  if (!model) return null;
  const c = toneColors(t, model.tone);
  const urgent = model.tone === 'danger' || model.tone === 'warning';
  return (
    <View pointerEvents="box-none" style={[styles.toastHost, { bottom: bottomOffset }]}>
      <View role={urgent ? 'alert' : 'status'} style={[styles.toast, { backgroundColor: c.backgroundColor, borderColor: c.color }]}>
        <Text style={{ flex: 1, minWidth: 0, color: c.color, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{GLYPH[model.tone]} {model.message}</Text>
        {model.actionLabel ? <EmrButton small variant="outline" label={model.actionLabel} onPress={() => onIntent({ type: 'actionPressed', id: model.id })} /> : null}
        <EmrButton small variant="ghost" label="✕" accessibilityLabel={l.dismiss} onPress={() => onIntent({ type: 'dismissed', id: model.id })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 16, alignItems: 'center', width: '100%', maxWidth: 360, alignSelf: 'center' },
  dots: { flexDirection: 'row', gap: 16, paddingVertical: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  key: { width: '30%', flexGrow: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bar: { borderTopWidth: 1 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end' },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2, borderTopWidth: 3, paddingVertical: 6 },
  scan: { width: 72, height: 72, marginTop: -20, marginHorizontal: 4, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, justifyContent: 'center' },
  toastHost: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 8 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
});
