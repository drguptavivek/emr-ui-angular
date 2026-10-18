'use client';

import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmrTypedText, NumberInput, ThemedInput, Unsupported } from './inputs-core';
import type {
  ClinicalAssessmentStatus,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
} from '@drguptavivek/emr-controller';
import { EmrBadgeView, EmrOptionChip, EmrRow, EmrSelect } from './primitives';

/** Selects with more options than this render as a dropdown instead of chips. */
const DROPDOWN_ABOVE = 6;
import { useEmrLabels } from './labels';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import { textOf, toggled } from './typed-field.logic';

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
      // A long single-choice list (e.g. 17 VA steps) is a dropdown; short lists stay one-tap chips.
      if (definition.type === 'select' && (definition.options?.length ?? 0) > DROPDOWN_ABOVE) {
        control = <EmrSelect label={definition.label} options={definition.options ?? []} value={model?.value as string | null | undefined}
          invalid={!!model?.error} readOnly={isReadOnly} disabled={isDisabled}
          onChange={value => { onFocus?.(); onValueChange(value); }} />;
        break;
      }
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
      if (definition.type === 'date' || definition.type === 'time') {
        // Day-first display, ISO value (same as EmrDateInput): keypad 05032026 → 2026-03-05; impossible dates never emit.
        const mode = definition.type === 'time' ? 'time' : 'dd-mm-yyyy';
        control = <EmrTypedText {...inputProps} mode={mode} placeholder={definition.placeholder ?? (mode === 'time' ? 'hh:mm' : 'dd-mm-yyyy')}
          value={textOf(model?.value) || null} onValueChange={onValueChange} />;
        break;
      }
      // text, multiline, datetime. datetime stays ISO text until it gets a paired widget.
      const format = { datetime: 'YYYY-MM-DDTHH:MM' }[definition.type as string];
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

const styles = StyleSheet.create({
  frame: { gap: 6, minWidth: 0 },
  status: { gap: 6, marginTop: 6 },
});
