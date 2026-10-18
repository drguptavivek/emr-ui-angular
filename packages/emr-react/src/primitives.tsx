'use client';

import { Children, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { ClinicalOption, EmrBadge } from '@drguptavivek/emr-controller';
import { useEmrLabels } from './labels';
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
          // Square minimum too: "NC" or "6/6" would otherwise be a target narrower than it is tall.
          minHeight: t.controlHeight,
          minWidth: t.controlHeight,
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

/** L1. Single-choice dropdown: a field-shaped trigger that opens the option list in a modal sheet. */
export function EmrSelect({ label, options, value, invalid, readOnly, disabled, onChange }: {
  label: string;
  options: readonly ClinicalOption[];
  value: string | null | undefined;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const [open, setOpen] = useState(false);
  const current = options.find(option => option.value === value)?.label;
  const pick = (next: string | null) => { setOpen(false); if (next !== (value ?? null)) onChange(next); };
  const row = (key: string, text: string, selected: boolean, next: string | null, optionDisabled?: boolean) => (
    <Pressable key={key} role="radio" aria-checked={selected} aria-disabled={optionDisabled} disabled={optionDisabled} onPress={() => pick(next)}
      style={({ pressed, focused }: PressState) => [styles.option, focusRing(t, focused),
        { minHeight: t.controlHeight, backgroundColor: selected ? t.primarySoft : pressed ? t.surfaceRaised : t.surface, opacity: optionDisabled ? 0.6 : 1 }]}>
      <Text style={{ color: next === null ? t.textMuted : t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>
        {selected ? '✓ ' : ''}{text}
      </Text>
    </Pressable>
  );
  return (
    <>
      <Pressable role="combobox" aria-expanded={open} aria-label={`${label}, ${current ?? labels.select}`} aria-disabled={disabled} aria-readonly={readOnly}
        disabled={disabled} onPress={readOnly ? undefined : () => setOpen(true)}
        style={({ focused }: PressState) => [styles.select, focusRing(t, focused), {
          minHeight: t.controlHeight, borderColor: invalid ? t.danger : t.border,
          backgroundColor: disabled ? t.surfaceRaised : t.surface, opacity: disabled ? 0.6 : 1,
        }]}>
        <Text numberOfLines={1} style={[styles.flex, { color: current ? t.text : t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }]}>{current ?? labels.select}</Text>
        <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textMd }}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable aria-label={labels.close} style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Inner Pressable swallows taps so only the backdrop closes the sheet. */}
          <Pressable role="radiogroup" aria-label={label} style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text role="heading" style={[styles.sheetTitle, { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }]}>{label}</Text>
            <ScrollView>
              {row('', labels.select, value == null, null)}
              {options.map(option => row(option.value, option.label, option.value === value, option.value, option.disabled))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Chips lay out as equal-width columns, so wrapped rows line up instead of going ragged. */
const CHIP_COLUMN_MIN = 140;
const ROW_GAP = 8;

export function EmrRow({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const columns = Math.max(1, Math.floor((width + ROW_GAP) / (CHIP_COLUMN_MIN + ROW_GAP)));
  const cell = width ? (width - ROW_GAP * (columns - 1)) / columns : undefined;
  return (
    <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {Children.map(children, child => <View style={{ width: cell }}>{child}</View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  button: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  chip: { borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: ROW_GAP },
  flex: { flex: 1, minWidth: 0 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 480, maxHeight: '80%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, overflow: 'hidden' },
  sheetTitle: { paddingHorizontal: 16, paddingVertical: 8 },
  option: { justifyContent: 'center', paddingHorizontal: 16 },
});
