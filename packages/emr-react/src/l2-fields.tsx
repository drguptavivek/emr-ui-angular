'use client';

import { useId } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  ClinicalAssessmentStatus,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  EmrOption,
  ScheduleAmountMode,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
  ScheduleSlotSeed,
} from '@drguptavivek/emr-controller';
import { NumberInput, ThemedInput } from './inputs-core';
import { EmrSearchSelect } from './l1-interactive';
import {
  applySlotPreset,
  codedConceptKey,
  codedInputChips,
  formatSlotReadout,
  isPresetActive,
  setSlotAmount,
  toggleSlot,
} from './l2-fields.logic';
import { EmrBadgeView, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrFieldFrame } from './typed-field';

type PressState = PressableStateCallbackType & { focused?: boolean };

export const CODED_INPUT_DEFAULTS = {
  searchLabel: 'Search terminology',
  placeholder: 'Search by name or code',
  notSupplied: 'Not supplied',
  selectedList: (label: string) => `${label} selected`,
  removeConcept: (display: string) => `Remove ${display}`,
  assessmentStatus: (label: string) => `${label} assessment status`,
  error: 'Error',
  warning: 'Warning',
  note: 'Note',
} as const;

export const SLOT_PICKER_DEFAULTS = {
  presetsGroup: (label: string) => `${label} presets`,
  notSelected: 'Not selected',
  selectedNoAmount: 'Selected, no amount',
  slotAmount: (slotLabel: string, unitLabel?: string) =>
    unitLabel ? `${slotLabel} amount in ${unitLabel}` : `${slotLabel} amount`,
  required: 'Required',
  errorPrefix: 'Error:',
} as const;

/**
 * L2 capture-side coded entry. Chosen concepts show as chips with system name and code as text;
 * the search box emits search intents scoped to the contract's answer-value-set binding.
 * Never filters options or resolves terminology itself.
 */
export function EmrCodedInput({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: CodedInputViewModel;
  headingId?: string;
  labels?: Partial<typeof CODED_INPUT_DEFAULTS>;
  onIntent: (intent: CodedInputIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...CODED_INPUT_DEFAULTS, ...labels };
  const inputId = useId();

  const label = model.definition.presentation.label;
  const placeholder = model.definition.presentation.placeholder ?? l.placeholder;
  const required = model.definition.contract.cardinality.min >= 1;
  const statusOptions = model.definition.presentation.assessmentStatusOptions ?? [];
  const statusOption = statusOptions.find(o => o.value === model.status);
  const statusLabel = statusOption?.label ?? (model.status ? String(model.status).replaceAll('-', ' ') : '');
  const statusTone = statusOption?.tone ?? 'neutral';

  const chips = codedInputChips(model.value, model.systemLabels);
  const searchOptions: EmrOption[] = model.options.map(c => ({
    value: codedConceptKey(c),
    label: c.display,
    description: `${model.systemLabels?.[c.system] ?? c.system} ${c.code}`,
  }));
  const selectedOptions: EmrOption[] = chips.map(c => ({
    value: c.key,
    label: c.concept.display,
  }));

  const msgIds = model.messages.map((_, i) => `${inputId}-msg-${i}`);
  if (model.definition.presentation.hint) msgIds.unshift(`${inputId}-message`);
  const describedBy = msgIds.join(' ');

  const handleSearch = () => {
    const valueSetCanonical = model.definition.contract.terminology.find(b => b.role === 'answer-value-set')?.valueSetCanonical;
    onIntent({
      type: 'searchRequested',
      query: model.query,
      ...(valueSetCanonical ? { valueSetCanonical } : {}),
    });
  };

  const handleSelect = (key: string) => {
    const concept = model.options.find(c => codedConceptKey(c) === key);
    if (concept) onIntent({ type: 'conceptSelected', concept });
  };

  return (
    <EmrFieldFrame label={label} controlId={inputId} required={required} hint={model.definition.presentation.hint}>
      <View
        role="group"
        aria-labelledby={headingId}
        aria-label={headingId ? undefined : label}
        aria-describedby={describedBy || undefined}
        style={styles.ci}
      >
        {chips.length > 0 ? (
          <View role="list" aria-label={l.selectedList(label)} style={styles.chips}>
            {chips.map(chip => (
              <View
                key={chip.key}
                role="listitem"
                style={[styles.chip, { minHeight: t.controlHeight, borderColor: t.border, backgroundColor: t.surfaceSoft }]}
              >
                <View style={styles.chipText}>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                    {chip.concept.display}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
                    <Text style={{ fontWeight: fontWeight(t.weightMedium) }}>{chip.system}</Text> {chip.concept.code}
                  </Text>
                </View>
                {!model.readOnly ? (
                  <Pressable
                    role="button"
                    aria-label={l.removeConcept(chip.concept.display)}
                    onPress={() => onIntent({ type: 'conceptRemoveRequested', code: chip.concept.code, system: chip.concept.system })}
                    style={({ pressed, focused }: PressState) => [
                      styles.chipRemove,
                      focusRing(t, focused),
                      {
                        width: t.controlHeight,
                        minHeight: t.controlHeight,
                        borderLeftColor: t.border,
                        backgroundColor: pressed ? t.dangerSoft : 'transparent',
                      },
                    ]}
                  >
                    {({ pressed }: PressState) => (
                      <Text aria-hidden style={{ color: pressed ? t.danger : t.text, fontSize: t.textLg, fontFamily: fontFamily(t) }}>
                        ×
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : model.readOnly && !model.status ? (
          <View style={[styles.noneRow, { minHeight: t.controlHeight }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{l.notSupplied}</Text>
          </View>
        ) : null}

        {!model.readOnly ? (
          <EmrSearchSelect
            label={l.searchLabel}
            labelHidden
            placeholder={placeholder}
            query={model.query}
            options={searchOptions}
            selected={selectedOptions}
            open={model.open && (model.options.length > 0 || model.loading)}
            loading={model.loading}
            onQueryChange={query => onIntent({ type: 'queryChangeRequested', query })}
            onSearchRequested={handleSearch}
            onOpenRequested={() => onIntent({ type: 'openRequested' })}
            onCloseRequested={() => onIntent({ type: 'closeRequested' })}
            onOptionSelect={handleSelect}
            onRemoveRequested={key => {
              const chip = chips.find(c => c.key === key);
              if (chip) onIntent({ type: 'conceptRemoveRequested', code: chip.concept.code, system: chip.concept.system });
            }}
          />
        ) : null}

        {model.open && !model.loading && !model.options.length && !model.readOnly ? (
          <View role="status" style={[styles.emptyBox, { borderColor: t.border }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{model.emptyMessage}</Text>
          </View>
        ) : null}

        {model.status || (statusOptions.length > 0 && !model.readOnly) ? (
          <View style={styles.statusRow}>
            {model.status ? <EmrBadgeView badge={{ label: statusLabel, tone: statusTone }} /> : null}
            {statusOptions.length > 0 && !model.readOnly ? (
              <View style={styles.statusSelect}>
                <EmrSelect
                  label={l.assessmentStatus(label)}
                  options={statusOptions}
                  value={model.status ?? null}
                  onChange={status => {
                    if (status) onIntent({ type: 'statusChangeRequested', status: status as ClinicalAssessmentStatus });
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {model.messages.length > 0 ? (
          <View role="list" aria-live="polite" style={styles.messages}>
            {model.messages.map((m, i) => {
              const msgColor = m.severity === 'error' ? t.danger : m.severity === 'warning' ? t.warning : t.textMuted;
              const sevLabel = m.severity === 'error' ? l.error : m.severity === 'warning' ? l.warning : l.note;
              return (
                <View key={i} role="listitem">
                  <Text
                    nativeID={`${inputId}-msg-${i}`}
                    style={{ color: msgColor, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}
                  >
                    <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{sevLabel}:</Text> {m.message}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

/**
 * L2 input half of `EmrDoseSchedule`: ticks dose slots and sets an amount per slot, emitting a new
 * `DoseSlot[]` in `slots` order (unticked slots omitted). Never derives frequency text, totals, or
 * presets from the selection; the controller does that from the emitted value.
 */
export function EmrScheduleSlotPicker({
  controlId,
  label,
  hint,
  error,
  required = false,
  readOnly = false,
  disabled = false,
  value,
  slots,
  unitLabel,
  amountMode = 'numeric',
  presets = [],
  defaultAmount = 1,
  defaultAmountLabel = '',
  labels,
  onValueChange,
}: {
  controlId?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  value: readonly DoseSlot[] | null;
  slots: readonly ScheduleSlotDefinition[];
  unitLabel?: string;
  amountMode?: ScheduleAmountMode;
  presets?: readonly ScheduleSlotPreset[];
  defaultAmount?: number;
  defaultAmountLabel?: string;
  labels?: Partial<typeof SLOT_PICKER_DEFAULTS>;
  onValueChange: (value: readonly DoseSlot[]) => void;
}) {
  const t = useEmrTheme();
  const l = { ...SLOT_PICKER_DEFAULTS, ...labels };
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const messageId = `${id}-message`;

  const byId = new Map((value ?? []).map(slot => [slot.id, slot]));
  const rows = slots.map(definition => ({ definition, slot: byId.get(definition.id) }));
  const seed: ScheduleSlotSeed =
    amountMode === 'numeric' ? { amount: defaultAmount } : { amount: null, amountLabel: defaultAmountLabel };

  return (
    <View
      nativeID={id}
      role="group"
      aria-label={required ? `${label}, ${l.required}` : label}
      aria-describedby={error || hint ? messageId : undefined}
      style={styles.ssp}
    >
      <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
        {label}
        {required ? <Text style={{ color: t.danger }}> *</Text> : null}
      </Text>

      {presets.length > 0 && !readOnly ? (
        <View role="group" aria-label={l.presetsGroup(label)} style={styles.presets}>
          {presets.map(preset => {
            const active = isPresetActive(value, preset);
            return (
              <Pressable
                key={preset.id}
                role="button"
                aria-pressed={active}
                aria-disabled={disabled}
                disabled={disabled}
                onPress={() => onValueChange(applySlotPreset(value, slots, preset, seed))}
                style={({ pressed, focused }: PressState) => [
                  styles.presetBtn,
                  focusRing(t, focused),
                  {
                    minHeight: t.controlHeight,
                    borderColor: active ? t.primary : t.primaryBorder,
                    borderWidth: active ? 2 : 1,
                    backgroundColor: active ? t.primarySoft : pressed ? t.surfaceRaised : 'transparent',
                    opacity: disabled ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: t.primaryContrast,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(active ? t.weightBold : 650),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {active ? '✓ ' : ''}
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View role="list" style={styles.slotsGrid}>
        {rows.map(row => {
          const ticked = !!row.slot;
          return (
            <View
              key={row.definition.id}
              role="listitem"
              style={[
                styles.slotCard,
                {
                  borderColor: ticked ? t.primaryBorder : t.border,
                  backgroundColor: ticked ? t.surfaceSoft : t.surface,
                },
              ]}
            >
              {readOnly ? (
                <View style={styles.readOnlySlot}>
                  <View>
                    <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                      {row.definition.label}
                    </Text>
                    {row.definition.timeHint ? (
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{row.definition.timeHint}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: row.slot ? t.text : t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
                    {row.slot ? formatSlotReadout(row.slot, unitLabel, l.selectedNoAmount) : l.notSelected}
                  </Text>
                </View>
              ) : (
                <>
                  <Pressable
                    id={`${id}-${row.definition.id}`}
                    role="checkbox"
                    aria-checked={ticked}
                    aria-label={
                      row.definition.timeHint ? `${row.definition.label} (${row.definition.timeHint})` : row.definition.label
                    }
                    aria-disabled={disabled}
                    disabled={disabled}
                    onPress={() => onValueChange(toggleSlot(value, slots, row.definition.id, !ticked, seed))}
                    style={({ focused }: PressState) => [
                      styles.slotToggle,
                      focusRing(t, focused),
                      { minHeight: t.controlHeight, opacity: disabled ? 0.6 : 1 },
                    ]}
                  >
                    <View
                      aria-hidden
                      style={[
                        styles.checkBox,
                        {
                          borderColor: ticked ? t.primary : t.border,
                          backgroundColor: ticked ? t.primary : t.surface,
                        },
                      ]}
                    >
                      {ticked ? (
                        <Text style={{ color: t.surface, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>✓</Text>
                      ) : null}
                    </View>
                    <View style={styles.slotNameWrap}>
                      <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                        {row.definition.label}
                      </Text>
                      {row.definition.timeHint ? (
                        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{row.definition.timeHint}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                  {row.slot ? (
                    <View style={styles.amountRow}>
                      {amountMode === 'numeric' ? (
                        <NumberInput
                          id={`${id}-${row.definition.id}-amount`}
                          aria-label={l.slotAmount(row.definition.label, unitLabel)}
                          integer={false}
                          value={row.slot.amount}
                          unit={unitLabel}
                          editable={!disabled}
                          onNumber={amount => onValueChange(setSlotAmount(value, slots, row.definition.id, { amount }))}
                        />
                      ) : (
                        <ThemedInput
                          id={`${id}-${row.definition.id}-amount`}
                          aria-label={l.slotAmount(row.definition.label)}
                          value={row.slot.amountLabel ?? ''}
                          editable={!disabled}
                          onChangeText={amountLabel =>
                            onValueChange(setSlotAmount(value, slots, row.definition.id, { amount: null, amountLabel }))
                          }
                        />
                      )}
                    </View>
                  ) : null}
                </>
              )}
            </View>
          );
        })}
      </View>

      {error || hint ? (
        <View aria-live="polite">
          {error ? (
            <Text nativeID={messageId} style={{ color: t.danger, fontSize: t.textXs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
              {l.errorPrefix} {error}
            </Text>
          ) : hint ? (
            <Text nativeID={messageId} style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ci: { gap: 8, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'stretch', maxWidth: '100%', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  chipText: { justifyContent: 'center', gap: 1, minWidth: 0, flexShrink: 1, paddingVertical: 5, paddingHorizontal: 10 },
  chipRemove: { borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noneRow: { justifyContent: 'center' },
  emptyBox: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  statusSelect: { minWidth: 180, maxWidth: '100%' },
  messages: { gap: 3 },
  ssp: { gap: 10, minWidth: 0 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetBtn: { borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotCard: { flexGrow: 1, flexBasis: 180, minWidth: 160, gap: 6, paddingTop: 4, paddingHorizontal: 10, paddingBottom: 8, borderWidth: 1, borderRadius: 8 },
  readOnlySlot: { gap: 4, paddingVertical: 4 },
  slotToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBox: { width: 20, height: 20, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  slotNameWrap: { flex: 1, minWidth: 0 },
  amountRow: { minWidth: 0 },
});
