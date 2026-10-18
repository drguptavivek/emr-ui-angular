'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import type {
  ClinicalAssessmentStatus,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
} from '@drguptavivek/emr-controller';
import { EmrBadgeView, EmrOptionChip, EmrRow } from './primitives';
import { useEmrLabels } from './labels';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { numberTextOf, parseNumberDraft, sanitizeNumberText, textOf, toggled } from './typed-field.logic';

/** What a custom renderer receives — the React twin of Angular's EmrCustomFieldContext. */
export interface EmrCustomFieldProps {
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
  readOnly: boolean;
  onValueChange: (value: ClinicalFieldValue) => void;
}

export type EmrCustomRenderers = Readonly<Record<string, ComponentType<EmrCustomFieldProps>>>;

export interface EmrTypedFieldProps {
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
  readOnly?: boolean;
  labelHidden?: boolean;
  customRenderers?: EmrCustomRenderers;
  onValueChange: (value: ClinicalFieldValue) => void;
  onStatusChange: (status: ClinicalAssessmentStatus | undefined) => void;
  onFocus?: () => void;
}

/** L2 frame: label, required marker, and one message line (error > warning > hint). */
export function EmrFieldFrame({ label, labelHidden, controlId, required, hint, warning, error, children }: {
  label: string;
  /** Matrix cells: the row and column headers are the visible label; the control keeps it as its accessible name. */
  labelHidden?: boolean;
  controlId: string;
  required?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const message = error ?? warning ?? hint;
  const messageColor = error ? t.danger : warning ? t.warning : t.textMuted;
  return (
    <View style={styles.frame}>
      {labelHidden ? null : <Text nativeID={`${controlId}-label`} aria-label={required ? `${label}, ${labels.required}` : label}
        style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>
        {label}
        {required ? <Text style={{ color: t.danger }}> *</Text> : null}
      </Text>}
      {children}
      <View aria-live="polite">
        {message ? (
          <Text nativeID={`${controlId}-message`} style={{ color: messageColor, fontSize: t.textXs, fontFamily: fontFamily(t), fontWeight: fontWeight(error || warning ? 600 : t.weightRegular) }}>
            {error ? '⚠ ' : warning ? '! ' : ''}{message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** L2. Renders mechanics only; validation and meaning stay in the controller. */
export function EmrTypedField({ definition, model, controlId, readOnly = false, labelHidden, customRenderers = {}, onValueChange, onStatusChange, onFocus }: EmrTypedFieldProps) {
  const labels = useEmrLabels();
  const required = model?.required ?? definition.required ?? false;
  const isReadOnly = readOnly || !!model?.readOnly;
  const isDisabled = !!model?.disabled;
  const hasMessage = !!(model?.error ?? model?.warning ?? definition.hint);

  const inputProps = {
    id: controlId,
    'aria-labelledby': labelHidden ? undefined : `${controlId}-label`,
    'aria-describedby': hasMessage ? `${controlId}-message` : undefined,
    invalid: !!model?.error,
    accessibilityLabel: required ? `${definition.label}, ${labels.required}` : definition.label,
    accessibilityHint: model?.error ?? model?.warning ?? definition.hint,
    // Read-only never becomes disabled: a disabled control leaves the tab order and is unannounceable.
    readOnly: isReadOnly,
    editable: !isDisabled && !isReadOnly,
    placeholder: definition.placeholder,
    onFocus,
  } as const;

  let control: React.ReactNode;
  switch (definition.type) {
    case 'integer':
    case 'decimal':
    case 'quantity':
      control = <NumberInput {...inputProps} integer={definition.type === 'integer'} value={model?.value}
        unit={definition.type === 'quantity' ? definition.unit : undefined}
        onNumber={n => onValueChange(definition.type === 'quantity' ? { value: n, unit: definition.unit ?? '' } : n)} />;
      break;
    case 'select':
    case 'multiselect': {
      const multiple = definition.type === 'multiselect';
      control = (
        <View role={multiple ? 'group' : 'radiogroup'} aria-labelledby={labelHidden ? undefined : `${controlId}-label`} accessibilityLabel={definition.label}>
          <EmrRow>
            {(definition.options ?? []).map(option => {
              const selected = multiple ? Array.isArray(model?.value) && (model.value as readonly string[]).includes(option.value) : model?.value === option.value;
              return (
                <EmrOptionChip key={option.value} label={option.label} selected={selected} multiple={multiple}
                  readOnly={isReadOnly} disabled={isDisabled || option.disabled}
                  onPress={() => { onFocus?.(); onValueChange(multiple ? toggled(model?.value, option.value) : selected ? null : option.value); }} />
              );
            })}
          </EmrRow>
        </View>
      );
      break;
    }
    case 'boolean':
      control = <EmrRow><EmrOptionChip label={labels.yes} multiple selected={model?.value === true} readOnly={isReadOnly} disabled={isDisabled}
        onPress={() => { onFocus?.(); onValueChange(model?.value !== true); }} /></EmrRow>;
      break;
    case 'custom': {
      const Custom = definition.customRendererKey ? customRenderers[definition.customRendererKey] : undefined;
      control = Custom
        ? <Custom definition={definition} model={model} controlId={controlId} readOnly={isReadOnly} onValueChange={onValueChange} />
        : <Unsupported text={labels.unregisteredRenderer(definition.customRendererKey ?? definition.id)} />;
      break;
    }
    default: {
      // text, multiline, date, time, datetime. Dates are ISO strings, same as the web input emits.
      // ponytail: dates are typed text with a format placeholder; add a native picker widget when needed.
      const format = { date: 'YYYY-MM-DD', time: 'HH:MM', datetime: 'YYYY-MM-DDTHH:MM' }[definition.type as string];
      const multiline = definition.type === 'multiline';
      control = <ThemedInput {...inputProps} placeholder={definition.placeholder ?? format} value={textOf(model?.value)}
        multiline={multiline} numberOfLines={multiline ? definition.rows ?? 3 : undefined}
        onChangeText={onValueChange} />;
    }
  }

  const statusOptions = definition.assessmentStatusOptions ?? [];
  const status = model?.assessmentStatus;
  const statusOption = statusOptions.find(option => option.value === status);

  return (
    <EmrFieldFrame label={definition.label} labelHidden={labelHidden} controlId={controlId} required={required} hint={definition.hint} warning={model?.warning} error={model?.error}>
      {control}
      {statusOptions.length || status ? (
        <View style={styles.status}>
          {status ? <EmrBadgeView badge={{ label: statusOption?.label ?? status, tone: statusOption?.tone ?? 'neutral' }} /> : null}
          {statusOptions.length ? (
            <View role="radiogroup" accessibilityLabel={labels.assessmentStatus(definition.label)}>
              <EmrRow>
                {statusOptions.map(option => (
                  <EmrOptionChip key={option.value} label={option.label} selected={status === option.value} readOnly={isReadOnly} disabled={isDisabled}
                    onPress={() => onStatusChange(status === option.value ? undefined : option.value)} />
                ))}
              </EmrRow>
            </View>
          ) : null}
        </View>
      ) : null}
    </EmrFieldFrame>
  );
}

type ThemedInputProps = React.ComponentProps<typeof TextInput> & { invalid?: boolean };

function ThemedInput({ invalid, ...props }: ThemedInputProps) {
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

function NumberInput({ value, integer, unit, onNumber, ...props }: Omit<ThemedInputProps, 'value'> & {
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
function Unsupported({ text }: { text: string }) {
  const t = useEmrTheme();
  return (
    <View role="status" style={[styles.unsupported, { borderColor: t.border }]}>
      <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6, minWidth: 0 },
  input: { width: '100%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  status: { gap: 6, marginTop: 6 },
  unsupported: { padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
});
