'use client';

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

/** RNW adds `focused` to the Pressable state; RN's types only declare `pressed`. */
type PressState = PressableStateCallbackType & { focused?: boolean };

/** L1. Tone is controller-supplied; the label always carries the meaning, never colour alone. */
export function EmrBadgeView({ badge }: { badge: EmrBadge }) {
  const t = useEmrTheme();
  return (
    <View role="status" aria-label={badge.assistiveText} style={[styles.badge, { backgroundColor: toneColors(t, badge.tone).backgroundColor }]}>
      <Text style={{ color: toneColors(t, badge.tone).color, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{badge.label}</Text>
    </View>
  );
}

export type EmrButtonVariant = 'primary' | 'outline' | 'ghost';

/** L1. `disabled` is allowed here (below L2), and is the only way a button leaves the flow. */
export function EmrButton({ label, onPress, variant = 'primary', small, disabled, accessibilityLabel, expanded }: {
  label: string;
  onPress: () => void;
  variant?: EmrButtonVariant;
  small?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  expanded?: boolean;
}) {
  const t = useEmrTheme();
  const height = small ? t.compactHeight : t.controlHeight;
  return (
    <Pressable
      role="button"
      aria-label={accessibilityLabel}
      aria-disabled={disabled}
      aria-expanded={expanded}
      disabled={disabled}
      onPress={onPress}
      hitSlop={small ? (t.controlHeight - t.compactHeight) / 2 : undefined}
      style={({ pressed, focused }: PressState) => [
        styles.button,
        focusRing(t, focused),
        {
          minHeight: height,
          backgroundColor: variant === 'primary' ? (pressed ? t.primaryHover : t.primarySoft) : pressed ? t.surfaceRaised : 'transparent',
          borderColor: variant === 'ghost' ? 'transparent' : t.primaryBorder,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={{ color: t.primaryContrast, fontSize: small ? t.textSm : t.textMd, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>{label}</Text>
    </Pressable>
  );
}

/** L1. A selectable chip: radio inside a radiogroup, checkbox for multi-select. */
export function EmrOptionChip({ label, selected, multiple, readOnly, disabled, onPress }: {
  label: string;
  selected: boolean;
  multiple?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useEmrTheme();
  return (
    <Pressable
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={disabled}
      aria-readonly={readOnly}
      disabled={disabled}
      // Read-only stays focusable and announced; it just does nothing on press.
      onPress={readOnly ? undefined : onPress}
      style={({ focused }: PressState) => [
        styles.chip,
        focusRing(t, focused),
        {
          minHeight: t.controlHeight,
          borderColor: selected ? t.primary : t.border,
          borderWidth: selected ? 2 : 1,
          backgroundColor: selected ? t.primarySoft : t.surface,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>
        {selected ? '✓ ' : ''}{label}
      </Text>
    </Pressable>
  );
}

export function EmrRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  button: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  chip: { borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
