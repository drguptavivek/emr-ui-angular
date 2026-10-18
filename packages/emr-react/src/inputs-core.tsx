'use client';

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import type { ClinicalFieldValue } from '@drguptavivek/emr-controller';
import { focusRing, fontFamily, useEmrTheme } from './theme';
import { numberTextOf, parseNumberDraft, sanitizeNumberText } from './typed-field.logic';
import {
  formatDate, formatTime, parseDateText, parseTimeText, sanitizeDateText, sanitizeTimeText,
  type DateDisplayFormat, type TextParse,
} from './l1-inputs.logic';

export type ThemedInputProps = React.ComponentProps<typeof TextInput> & { invalid?: boolean };

/** L1 text input: token styling, focus ring, invalid border. Read-only stays focusable. */
export function ThemedInput({ invalid, ...props }: ThemedInputProps) {
  const t = useEmrTheme();
  const [focused, setFocused] = useState(false);
  const lines = props.numberOfLines ?? 1;
  return (
    <TextInput
      {...props}
      {...(invalid ? ({ 'aria-invalid': true } as object) : null)}
      placeholderTextColor={t.textMuted}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={[
        styles.input,
        {
          minHeight: props.multiline ? Math.max(88, lines * t.textMd * t.leadingNormal + 18) : t.controlHeight,
          borderColor: focused ? t.focus : invalid ? t.danger : t.border,
          borderWidth: focused ? 2 : 1,
          backgroundColor: props.editable === false && !props.readOnly ? t.surfaceRaised : t.surface,
          color: t.text,
          fontSize: t.textMd,
          fontFamily: fontFamily(t),
        },
        focusRing(t, focused),
        props.style,
      ]}
    />
  );
}

/** L1 number input: sanitises as typed, holds incomplete drafts ("-", "7."), emits number | null. */
export function NumberInput({ value, integer, unit, onNumber, ...props }: Omit<ThemedInputProps, 'value'> & {
  value: ClinicalFieldValue | undefined;
  integer: boolean;
  unit?: string;
  onNumber: (value: number | null) => void;
}) {
  const t = useEmrTheme();
  const external = numberTextOf(value);
  const [draft, setDraft] = useState(external);
  // A new value from the controller replaces whatever draft is on screen.
  useEffect(() => setDraft(current => (parseNumberDraft(current).complete && current !== external ? external : current)), [external]);
  const keyboardType: KeyboardTypeOptions = integer ? 'number-pad' : 'decimal-pad';
  const input = (
    <ThemedInput {...props} value={draft} keyboardType={keyboardType} inputMode={integer ? 'numeric' : 'decimal'}
      style={unit ? styles.flex : undefined}
      onChangeText={text => {
        const clean = sanitizeNumberText(text, integer);
        setDraft(clean);
        const parsed = parseNumberDraft(clean);
        if (parsed.complete) onNumber(parsed.value);
      }} />
  );
  if (!unit) return input;
  return (
    <View style={styles.quantity}>
      {input}
      <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{unit}</Text>
    </View>
  );
}

/** Never skip a field silently: an unrenderable field is visible clinical data that's missing. */
export function Unsupported({ text }: { text: string }) {
  const t = useEmrTheme();
  return (
    <View role="status" style={[styles.unsupported, { borderColor: t.border }]}>
      <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{text}</Text>
    </View>
  );
}

// ---- day-first date / time text ------------------------------------------------------------

export type EmrTypedTextMode = DateDisplayFormat | 'time';
type TextMode = EmrTypedTextMode;

const parseText = (text: string, mode: TextMode): TextParse => (mode === 'time' ? parseTimeText(text) : parseDateText(text, mode));
const formatText = (value: string | null, mode: TextMode) => (mode === 'time' ? formatTime(value) : formatDate(value, mode));
const valueOf = (parsed: TextParse) => (parsed.status === 'valid' ? parsed.value : null);

/**
 * Typed text bound to an ISO / HH:mm value. Emits only on empty or a real date/time; an incomplete
 * draft stays on screen (like NumberInput) and is flagged invalid once the field loses focus.
 * Exported frameless so schema renderers (form fields, matrix cells) share the day-first behaviour.
 */
export function EmrTypedText({ value, mode, invalid, onValueChange, ...props }: Omit<ThemedInputProps, 'value'> & {
  value: string | null;
  mode: TextMode;
  onValueChange: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(() => formatText(value, mode));
  const [left, setLeft] = useState(false);
  // A new value from the controller replaces the draft, unless the draft is still being typed.
  useEffect(() => setDraft(current => {
    const parsed = parseText(current, mode);
    return parsed.status === 'draft' || valueOf(parsed) === value ? current : formatText(value, mode);
  }), [value, mode]);
  return (
    <ThemedInput {...props} value={draft} keyboardType="numbers-and-punctuation" inputMode="numeric"
      invalid={invalid || (left && parseText(draft, mode).status === 'draft')}
      // Leaving the field tidies a valid entry into display form (keypad 05032026 → 05-03-2026).
      onBlur={e => { setLeft(true); setDraft(d => { const p = parseText(d, mode); return p.status === 'valid' ? formatText(p.value, mode) : d; }); props.onBlur?.(e); }}
      onChangeText={text => {
        const clean = mode === 'time' ? sanitizeTimeText(text) : sanitizeDateText(text);
        setDraft(clean);
        setLeft(false);
        const parsed = parseText(clean, mode);
        if (parsed.status !== 'draft') onValueChange(valueOf(parsed));
      }} />
  );
}


const styles = StyleSheet.create({
  input: { width: '100%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  unsupported: { padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
});
