'use client';

import { useId } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  DoseScheduleIntent,
  DoseScheduleViewModel,
  DoseSlot,
  MedicationReconciliationIntent,
  MedicationReconciliationViewModel,
  ReconMedication,
  ReconRow,
  ScoreResultCardIntent,
  ScoreResultCardViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrStateMessage } from './l1-display';
import { useContainerWidth } from './l4-lists-shared';
import {
  DOSE_ICON_GLYPH,
  SCORE_STATUS_DEFAULTS,
  doseAmountWord,
  dosePatternNotation,
  dosePatternSentence,
  doseSlotIcons,
  doseUnitText,
  formatDoseAmount,
  hasDoseMeta,
  isDoseGridCompact,
  isDoseSlotNone,
  isReconReasonInvalid,
  isReconRowLocked,
  isReconRowSelected,
  isReconStacked,
  reconRowName,
  reconSeverityWord,
  scoreStatusText,
  showFrequencyCode,
  showScoreResult,
  taperHasPattern,
} from './l4-medications.logic';
import { EmrBadgeView, EmrButton, EmrOptionChip } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

// ---------------------------------------------------------------------------
// 1. EmrScoreResultCard
// ---------------------------------------------------------------------------

export const SCORE_CARD_DEFAULTS = {
  ...SCORE_STATUS_DEFAULTS,
  calculating: 'Calculating score…',
  calculationFailed: 'Score could not be calculated.',
  total: 'total',
  bandPrefix: 'Band:',
  bandNotSupplied: 'Band not supplied',
  outOfDate: 'Out of date',
  notSupplied: 'Not supplied',
  tryAgain: 'Try again',
  recompute: 'Recompute',
  details: 'Details',
  detailsFor: (instrumentLabel: string) => `Details for ${instrumentLabel}`,
  scoreComponents: 'Score components',
  component: 'Component',
  score: 'Score',
  computed: 'Computed',
};

export interface EmrScoreResultCardProps {
  model: ScoreResultCardViewModel;
  headingId?: string;
  labels?: Partial<typeof SCORE_CARD_DEFAULTS>;
  onIntent?: (intent: ScoreResultCardIntent) => void;
}

/**
 * L4. Controlled card that shows a controller-computed score: total, band badge, component breakdown,
 * interpretation and computed-at time. Never sums, thresholds, or interprets numbers itself.
 */
export function EmrScoreResultCard({ model, headingId, labels, onIntent }: EmrScoreResultCardProps) {
  const t = useEmrTheme();
  const l = { ...SCORE_CARD_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-score-${uid}-heading`;
  const font = fontFamily(t);
  const statusText = scoreStatusText(model.status, l);
  const r = model.result;
  const recomputeWord = model.error ? l.tryAgain : l.recompute;

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      aria-busy={model.loading || undefined}
      style={[
        styles.sc,
        model.compact ? styles.scCompact : null,
        { borderColor: t.border, backgroundColor: t.surface },
      ]}
    >
      <View style={model.compact ? styles.scCompactHeader : styles.scHeaderRow}>
        <Text
          role="heading"
          aria-level={3}
          nativeID={titleId}
          style={{
            color: model.compact ? t.text : t.textMuted,
            fontSize: t.textMd,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: font,
            flexShrink: 1,
          }}
        >
          {model.instrumentLabel}
        </Text>

        <View style={styles.scBody}>
          {model.loading ? (
            <Text role="status" style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
              {l.calculating}
            </Text>
          ) : model.error ? (
            <Text role="alert" style={{ color: t.danger, fontSize: t.textMd, fontFamily: font }}>
              <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{l.calculationFailed}</Text> {model.error}
            </Text>
          ) : statusText ? (
            <EmrBadgeView badge={{ label: statusText, tone: 'neutral' }} />
          ) : r ? (
            <>
              <View style={styles.scTotal}>
                <Text
                  style={{
                    color: t.text,
                    fontSize: model.compact ? t.textXl : t.text2xl,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {r.total}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.total}</Text>
              </View>
              <EmrBadgeView
                badge={{
                  label: r.bandLabel || l.bandNotSupplied,
                  tone: r.bandLabel ? r.bandTone : 'neutral',
                  assistiveText: `${l.bandPrefix} ${r.bandLabel || l.bandNotSupplied}`,
                }}
              />
              {model.stale ? (
                <Text
                  style={{
                    color: t.warning,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightMedium),
                    fontFamily: font,
                  }}
                >
                  ⚠ {model.staleLabel || l.outOfDate}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.notSupplied}</Text>
          )}
        </View>

        <View style={styles.scActions}>
          {model.canRecompute && !model.loading ? (
            <EmrButton
              small
              variant="outline"
              label={model.compact ? '↻' : `↻ ${recomputeWord}`}
              accessibilityLabel={`${recomputeWord} ${model.instrumentLabel}`}
              onPress={() => onIntent?.({ type: 'recomputeRequested', instrumentId: model.id })}
            />
          ) : null}
          {model.canViewDetail && r && !model.loading ? (
            <EmrButton
              small
              variant="ghost"
              label={model.compact ? '›' : `${l.details} ›`}
              accessibilityLabel={l.detailsFor(model.instrumentLabel)}
              onPress={() => onIntent?.({ type: 'detailRequested', instrumentId: model.id })}
            />
          ) : null}
        </View>
      </View>

      {!model.compact && showScoreResult(model) && r ? (
        <View style={styles.scDetails}>
          {r.interpretation ? (
            <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font, lineHeight: t.textMd * t.leadingNormal }}>
              {r.interpretation}
            </Text>
          ) : null}

          {r.components?.length ? (
            <View role="table" aria-label={l.scoreComponents} style={[styles.scTable, { borderColor: t.border }]}>
              <View
                role="row"
                style={[styles.scTableRow, styles.scTableHead, { backgroundColor: t.surfaceRaised, borderBottomColor: t.border }]}
              >
                <Text
                  role="columnheader"
                  style={[styles.flex, { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}
                >
                  {l.component}
                </Text>
                <Text
                  role="columnheader"
                  style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.score}
                </Text>
              </View>
              {r.components.map((c) => (
                <View key={c.id} role="row" style={[styles.scTableRow, { borderBottomColor: t.border, minHeight: t.controlHeight }]}>
                  <View role="rowheader" style={styles.flex}>
                    <Pressable
                      role="button"
                      onPress={() => onIntent?.({ type: 'componentSelected', componentId: c.id })}
                      style={({ focused }: PressState) => [
                        styles.scPick,
                        { minHeight: t.controlHeight },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textMd,
                          fontFamily: font,
                          textDecorationLine: 'underline',
                        }}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  </View>
                  <View role="cell" style={styles.scValCell}>
                    <Text
                      style={{
                        color: t.text,
                        fontSize: t.textMd,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: font,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {c.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {r.computedAt ? (
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
              {l.computed} {r.computedAt}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrDoseSchedule
// ---------------------------------------------------------------------------

export const DOSE_SCHEDULE_DEFAULTS = {
  dosePattern: 'Dose pattern',
  site: 'Site',
  none: 'none',
  notGiven: 'not given',
  route: 'Route',
  food: 'Food',
  duration: 'Duration',
  start: 'Start',
  reducingSchedule: 'Reducing schedule',
  period: 'Period',
  howOften: 'How often',
  showInstructions: 'Show instructions',
  editSchedule: 'Edit schedule',
};

export interface EmrDoseScheduleProps {
  model: DoseScheduleViewModel;
  headingId?: string;
  labels?: Partial<typeof DOSE_SCHEDULE_DEFAULTS>;
  onIntent?: (intent: DoseScheduleIntent) => void;
}

/**
 * L4. Controlled, display-first card stating how a medicine is taken. Formats fractions as ¼ ½ ¾,
 * renders a "1 - 0 - 1" pattern, slot icons, PRN limits, and taper schedule without deriving clinical rules.
 */
export function EmrDoseSchedule({ model, headingId, labels, onIntent }: EmrDoseScheduleProps) {
  const t = useEmrTheme();
  const l = { ...DOSE_SCHEDULE_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-dose-${uid}-heading`;
  const { width, onLayout } = useContainerWidth();
  const font = fontFamily(t);
  const monoFont = Platform.OS === 'web' ? t.fontMono : undefined;
  const form = model.medication.form;
  const pattern = dosePatternNotation(model.slots, form);
  const compactGrid = isDoseGridCompact(width, model.slots.length);
  const showTaperPattern = taperHasPattern(model.taper);

  const renderSlotCell = (slot: DoseSlot) => {
    const none = isDoseSlotNone(slot);
    const icons = none ? [] : doseSlotIcons(slot, form);
    const unit = doseUnitText(slot.amount, model.unit);
    const word = doseAmountWord(slot.amount, form);
    return (
      <View
        key={slot.id}
        style={[
          styles.dsCell,
          compactGrid ? styles.dsCellHalf : styles.flex,
          {
            borderColor: none ? t.border : t.primaryBorder,
            backgroundColor: none ? t.surfaceSoft : t.primarySoft,
          },
        ]}
      >
        <View>
          <Text style={{ color: none ? t.textMuted : t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {slot.label}
          </Text>
          {slot.timeHint ? (
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{slot.timeHint}</Text>
          ) : null}
        </View>
        <View style={styles.dsAmount}>
          {none ? (
            <Text aria-label={l.none} style={{ color: t.textMuted, fontSize: t.text2xl, fontFamily: font }}>
              —
            </Text>
          ) : (
            <>
              <View aria-hidden style={styles.dsIcons}>
                {icons.map((ic, idx) => (
                  <Text key={idx} style={{ color: t.text, fontSize: t.textLg }}>
                    {DOSE_ICON_GLYPH[ic]}
                  </Text>
                ))}
              </View>
              {slot.amountLabel ? (
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textLg,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                    textAlign: 'center',
                  }}
                >
                  {slot.amountLabel}
                </Text>
              ) : (
                <>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.text2xl,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {formatDoseAmount(slot.amount, form)}
                  </Text>
                  {unit ? <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>{unit}</Text> : null}
                  {word ? <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{word}</Text> : null}
                </>
              )}
              {slot.householdLabel ? (
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, textAlign: 'center' }}>
                  {slot.householdLabel}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      onLayout={onLayout}
      style={[styles.ds, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.dsHead}>
        <View style={styles.flex}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.text2xs,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {model.medication.formLabel}
          </Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={titleId}
            style={{
              color: t.text,
              fontSize: t.textXl,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {model.medication.label}
            {model.medication.strength ? (
              <Text style={{ color: t.textMuted, fontWeight: fontWeight(t.weightRegular) }}> {model.medication.strength}</Text>
            ) : null}
          </Text>
        </View>
        {model.status ? <EmrBadgeView badge={model.status} /> : null}
      </View>

      <View style={styles.dsWhen}>
        <Text style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
          {model.frequency.label}
          {showFrequencyCode(model.frequency.code, model.site?.code) ? (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontWeight: fontWeight(t.weightRegular) }}>
              {' '}({model.frequency.code})
            </Text>
          ) : null}
        </Text>
        {pattern ? (
          <View
            aria-label={`${l.dosePattern}: ${dosePatternSentence(model.slots, form, model.unit, l.none)}.`}
            style={[styles.dsNotation, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
          >
            <Text
              aria-hidden
              style={{
                color: t.text,
                fontSize: t.textXl,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: monoFont,
              }}
            >
              {pattern}
            </Text>
          </View>
        ) : null}
      </View>

      {model.site ? (
        <View style={[styles.dsBanner, { borderColor: t.info, backgroundColor: t.infoSoft }]}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
              textTransform: 'uppercase',
            }}
          >
            {l.site}
          </Text>
          <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {model.site.label}
            {model.site.code ? ` (${model.site.code})` : ''}
          </Text>
        </View>
      ) : null}

      {model.prn ? (
        <View style={[styles.dsPrn, { borderColor: t.warning, backgroundColor: t.warningSoft }]}>
          <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {model.prn.label}
          </Text>
          {model.prn.maxLabel ? (
            <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.prn.maxLabel}</Text>
          ) : null}
        </View>
      ) : null}

      {model.slots.length ? (
        <View style={[styles.dsGrid, compactGrid ? styles.dsGridWrap : null]}>
          {model.slots.map(renderSlotCell)}
        </View>
      ) : null}

      {hasDoseMeta(model) ? (
        <View style={styles.dsMeta}>
          {model.route ? (
            <View>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>{l.route}</Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.route}</Text>
            </View>
          ) : null}
          {model.foodRelation ? (
            <View>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>{l.food}</Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.foodRelation}</Text>
            </View>
          ) : null}
          {model.duration ? (
            <View>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>{l.duration}</Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.duration}</Text>
            </View>
          ) : null}
          {model.startLabel ? (
            <View>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>{l.start}</Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.startLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {model.taper?.length ? (
        <View role="table" aria-label={l.reducingSchedule} style={styles.dsTaperWrap}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {l.reducingSchedule}
          </Text>
          <View style={[styles.scTable, { borderColor: t.border }]}>
            <View
              role="row"
              style={[styles.scTableRow, styles.scTableHead, { backgroundColor: t.surfaceRaised, borderBottomColor: t.border }]}
            >
              <Text role="columnheader" style={[styles.flex, { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}>
                {l.period}
              </Text>
              <Text role="columnheader" style={[styles.flex, { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}>
                {l.howOften}
              </Text>
              {showTaperPattern ? (
                <Text role="columnheader" style={[styles.flex, { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}>
                  {l.dosePattern}
                </Text>
              ) : null}
            </View>
            {model.taper.map((step) => {
              const stepNotation = step.slots ? dosePatternNotation(step.slots, form) : '';
              return (
                <View key={step.id} role="row" style={[styles.scTableRow, { borderBottomColor: t.border, paddingVertical: 8 }]}>
                  <Text
                    role="rowheader"
                    style={[styles.flex, { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}
                  >
                    {step.periodLabel}
                  </Text>
                  <Text role="cell" style={[styles.flex, { color: t.text, fontSize: t.textMd, fontFamily: font }]}>
                    {step.frequencyLabel}
                  </Text>
                  {showTaperPattern ? (
                    <View role="cell" style={styles.flex}>
                      {step.slots && stepNotation ? (
                        <Text
                          aria-label={dosePatternSentence(step.slots, form, model.unit, l.none)}
                          style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: monoFont }}
                        >
                          {stepNotation}
                        </Text>
                      ) : (
                        <Text aria-label={l.notGiven} style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: monoFont }}>
                          —
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {model.separationNote ? (
        <View role="note" style={[styles.dsNote, { backgroundColor: t.infoSoft }]}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{model.separationNote}</Text>
        </View>
      ) : null}

      {model.instructions?.length ? (
        <View role="list" style={styles.dsInstr}>
          {model.instructions.map((line, idx) => (
            <View key={idx} role="listitem">
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>• {line}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {!model.readOnly && (model.canEdit || model.canShowInstructions) ? (
        <View style={styles.dsActions}>
          {model.canShowInstructions ? (
            <EmrButton
              variant="outline"
              label={l.showInstructions}
              onPress={() => onIntent?.({ type: 'instructionsRequested' })}
            />
          ) : null}
          {model.canEdit ? (
            <EmrButton
              variant="outline"
              label={l.editSchedule}
              onPress={() => onIntent?.({ type: 'editRequested' })}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrMedicationReconciliation
// ---------------------------------------------------------------------------

export const MED_RECON_DEFAULTS = {
  summary: 'Summary',
  loadingMedicines: 'Loading medicines',
  loadFailed: 'Medicines could not be loaded',
  tryAgain: 'Try again',
  addTo: (sideLabel: string) => `Add medicine to ${sideLabel}`,
  comparedWith: 'compared with',
  decision: 'Decision',
  selected: 'Selected.',
  notSupplied: 'Not supplied',
  lastTaken: 'Last taken',
  notOn: (sideLabel: string) => `Not on ${sideLabel}`,
  decisionFor: (name: string) => `Decision for ${name}`,
  notDecided: 'Not decided',
  reasonFor: (name: string) => `Reason for ${name}`,
  medicineFallback: 'medicine',
  error: 'Error',
  warning: 'Warning',
  info: 'Note',
  completeReconciliation: 'Complete reconciliation',
};

export interface EmrMedicationReconciliationProps {
  model: MedicationReconciliationViewModel;
  headingId?: string;
  labels?: Partial<typeof MED_RECON_DEFAULTS>;
  onIntent: (intent: MedicationReconciliationIntent) => void;
}

/**
 * L4. Controlled two-source medication reconciliation. Renders a table on wide containers (>= 760px)
 * and stacked cards on narrow ones. Never matches, counts, or evaluates validity itself.
 */
export function EmrMedicationReconciliation({ model, headingId, labels, onIntent }: EmrMedicationReconciliationProps) {
  const t = useEmrTheme();
  const l = { ...MED_RECON_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-recon-${uid}-heading`;
  const { width, onLayout } = useContainerWidth();
  const stacked = isReconStacked(width);
  const font = fontFamily(t);

  const selectRow = (row: ReconRow) => {
    if (!isReconRowSelected(row, model.selectedRowId)) {
      onIntent({ type: 'rowSelected', rowId: row.id });
    }
  };

  const renderMed = (m: ReconMedication | undefined, sideLabel: string, row: ReconRow) => {
    if (!m) {
      return (
        <View style={{ minHeight: t.controlHeight, justifyContent: 'center' }}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontStyle: 'italic', fontFamily: font }}>
            {l.notOn(sideLabel)}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.reconMed}>
        <Pressable
          role="button"
          onPress={() => {
            selectRow(row);
            onIntent({ type: 'medicationDetailRequested', medicationId: m.id });
          }}
          style={({ focused }: PressState) => [
            styles.reconNameBtn,
            { minHeight: t.controlHeight },
            focusRing(t, focused),
          ]}
        >
          <Text
            style={{
              color: t.primary,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
              textDecorationLine: 'underline',
            }}
          >
            {m.nameLabel}
          </Text>
        </Pressable>
        {m.code && m.code.display !== m.nameLabel ? (
          <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>{m.code.display}</Text>
        ) : null}
        <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{m.doseSummary || l.notSupplied}</Text>
        {m.lastTakenLabel || m.badges?.length ? (
          <View style={styles.reconMeta}>
            {m.lastTakenLabel ? (
              <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
                {l.lastTaken}: {m.lastTakenLabel}
              </Text>
            ) : null}
            {m.badges?.map((badge, idx) => (
              <EmrBadgeView key={idx} badge={badge} />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderDecision = (row: ReconRow, bare: boolean) => {
    const locked = isReconRowLocked(model.readOnly, row.readOnly);
    const name = reconRowName(row, l.medicineFallback);
    const decisionLabel = l.decisionFor(name);
    const reasonLabel = l.reasonFor(name);
    const reasonInvalid = isReconReasonInvalid(row);

    return (
      <View style={styles.reconDecision}>
        {!bare ? (
          <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {decisionLabel}
          </Text>
        ) : null}
        <View role="radiogroup" aria-label={decisionLabel} style={styles.reconChips}>
          {row.decisionOptions.map((option) => (
            <EmrOptionChip
              key={option.value}
              label={option.label}
              selected={row.decision === option.value}
              readOnly={locked}
              disabled={option.disabled}
              onPress={() => {
                selectRow(row);
                if (!locked && option.value) {
                  onIntent({ type: 'decisionChangeRequested', path: row.path, decision: option.value });
                }
              }}
            />
          ))}
        </View>

        {row.reasonRequired ? (
          <View style={styles.reconReason}>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {reasonLabel} <Text aria-hidden style={{ color: t.danger }}>*</Text>
            </Text>
            <ThemedInput
              aria-label={reasonLabel}
              multiline
              numberOfLines={2}
              value={row.reason ?? ''}
              readOnly={locked}
              invalid={reasonInvalid}
              onFocus={() => selectRow(row)}
              onChangeText={(reason) => onIntent({ type: 'reasonChangeRequested', path: row.path, reason })}
            />
          </View>
        ) : null}

        {row.messages?.length ? (
          <View style={styles.reconMessages}>
            {row.messages.map((msg, idx) => {
              const color = msg.severity === 'error' ? t.danger : msg.severity === 'warning' ? t.warning : t.info;
              const bg = msg.severity === 'error' ? t.dangerSoft : msg.severity === 'warning' ? t.warningSoft : t.infoSoft;
              return (
                <View
                  key={idx}
                  role={msg.severity === 'error' ? 'alert' : 'status'}
                  style={[styles.reconMessage, { borderLeftColor: color, backgroundColor: bg }]}
                >
                  <Text style={{ color, fontSize: t.textSm, fontFamily: font }}>
                    <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{reconSeverityWord(msg.severity, l)}: </Text>
                    {msg.message}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      aria-busy={model.loading || undefined}
      onLayout={onLayout}
      style={styles.recon}
    >
      <View style={styles.reconHead}>
        <Text
          role="heading"
          aria-level={3}
          nativeID={titleId}
          style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
        >
          {model.title}
        </Text>
        {model.summary?.length ? (
          <View role="list" aria-label={l.summary} style={styles.reconSummary}>
            {model.summary.map((badge, idx) => (
              <View key={idx} role="listitem">
                <EmrBadgeView badge={badge} />
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {model.loading ? (
        <EmrStateMessage kind="loading" title={l.loadingMedicines} />
      ) : model.error ? (
        <EmrStateMessage kind="error" title={l.loadFailed} message={model.error}>
          <View style={styles.reconRetry}>
            <EmrButton variant="outline" label={l.tryAgain} onPress={() => onIntent({ type: 'retryRequested' })} />
          </View>
        </EmrStateMessage>
      ) : (
        <>
          {!model.readOnly ? (
            <View style={styles.reconActions}>
              <EmrButton
                variant="outline"
                label={l.addTo(model.leftLabel)}
                onPress={() => onIntent({ type: 'addMedicationRequested', side: 'left' })}
              />
              <EmrButton
                variant="outline"
                label={l.addTo(model.rightLabel)}
                onPress={() => onIntent({ type: 'addMedicationRequested', side: 'right' })}
              />
            </View>
          ) : null}

          {!model.rows.length ? (
            <EmrStateMessage kind="empty" title={model.emptyMessage} />
          ) : stacked ? (
            <View role="list" style={styles.reconCards}>
              {model.rows.map((row) => {
                const selected = isReconRowSelected(row, model.selectedRowId);
                return (
                  <Pressable
                    key={row.id}
                    role="listitem"
                    onPress={() => selectRow(row)}
                    style={[
                      styles.reconCard,
                      {
                        borderColor: selected ? t.primary : t.border,
                        borderWidth: selected ? 2 : 1,
                        backgroundColor: selected ? t.primarySoft : t.surface,
                      },
                    ]}
                  >
                    <View style={[styles.reconSide, { borderBottomColor: t.border }]}>
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: font,
                          textTransform: 'uppercase',
                        }}
                      >
                        {model.leftLabel}
                      </Text>
                      {renderMed(row.left, model.leftLabel, row)}
                    </View>
                    <View style={[styles.reconSide, { borderBottomColor: t.border }]}>
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: font,
                          textTransform: 'uppercase',
                        }}
                      >
                        {model.rightLabel}
                      </Text>
                      {renderMed(row.right, model.rightLabel, row)}
                    </View>
                    {renderDecision(row, false)}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View
              role="table"
              aria-label={`${model.title}: ${model.leftLabel} ${l.comparedWith} ${model.rightLabel}`}
              style={[styles.reconTable, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <View
                role="row"
                style={[styles.reconTr, { backgroundColor: t.surfaceRaised, borderBottomColor: t.border }]}
              >
                <View role="columnheader" style={styles.reconColSide}>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {model.leftLabel}
                  </Text>
                </View>
                <View role="columnheader" style={styles.reconColSide}>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {model.rightLabel}
                  </Text>
                </View>
                <View role="columnheader" style={styles.reconColDecision}>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {l.decision}
                  </Text>
                </View>
              </View>
              {model.rows.map((row) => {
                const selected = isReconRowSelected(row, model.selectedRowId);
                return (
                  <Pressable
                    key={row.id}
                    role="row"
                    onPress={() => selectRow(row)}
                    style={[
                      styles.reconTr,
                      {
                        borderBottomColor: t.border,
                        backgroundColor: selected ? t.primarySoft : t.surface,
                        borderLeftWidth: selected ? 4 : 0,
                        borderLeftColor: t.primary,
                      },
                    ]}
                  >
                    <View role="rowheader" style={styles.reconColSide}>
                      {renderMed(row.left, model.leftLabel, row)}
                    </View>
                    <View role="cell" style={styles.reconColSide}>
                      {renderMed(row.right, model.rightLabel, row)}
                    </View>
                    <View role="cell" style={styles.reconColDecision}>
                      {renderDecision(row, true)}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!model.readOnly ? (
            <View style={styles.reconFooter}>
              <EmrButton
                variant="primary"
                disabled={!model.canComplete}
                label={l.completeReconciliation}
                onPress={() => onIntent({ type: 'completeRequested' })}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },

  // EmrScoreResultCard
  sc: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  scCompact: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, minHeight: 48, justifyContent: 'center' },
  scHeaderRow: { gap: 8 },
  scCompactHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scBody: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, minWidth: 0 },
  scTotal: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  scDetails: { gap: 10 },
  scTable: { borderTopWidth: 1 },
  scTableHead: { paddingVertical: 6, paddingHorizontal: 8 },
  scTableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 1, gap: 8 },
  scPick: { justifyContent: 'center', alignSelf: 'stretch' },
  scValCell: { justifyContent: 'center', alignItems: 'flex-end' },

  // EmrDoseSchedule
  ds: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  dsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  dsWhen: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 },
  dsNotation: { borderWidth: 1, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 10 },
  dsBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  dsPrn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, gap: 2 },
  dsGrid: { flexDirection: 'row', gap: 8 },
  dsGridWrap: { flexWrap: 'wrap' },
  dsCell: { minHeight: 120, borderWidth: 1, borderRadius: 8, padding: 8, justifyContent: 'space-between' },
  dsCellHalf: { flexBasis: '47%', flexGrow: 1, minWidth: 120 },
  dsAmount: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4 },
  dsIcons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginBottom: 2 },
  dsMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dsTaperWrap: { gap: 4 },
  dsNote: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  dsInstr: { gap: 4 },
  dsActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // EmrMedicationReconciliation
  recon: { gap: 12 },
  reconHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reconSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reconRetry: { marginTop: 12 },
  reconActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reconFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  reconTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  reconTr: { flexDirection: 'row', borderBottomWidth: 1 },
  reconColSide: { flex: 35, minWidth: 0, padding: 10 },
  reconColDecision: { flex: 30, minWidth: 0, padding: 10 },
  reconCards: { gap: 10 },
  reconCard: { borderRadius: 10, padding: 12, gap: 10, minWidth: 0 },
  reconSide: { paddingBottom: 10, borderBottomWidth: 1, gap: 4, minWidth: 0 },
  reconMed: { gap: 2, minWidth: 0 },
  reconNameBtn: { justifyContent: 'center', alignSelf: 'flex-start' },
  reconMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  reconDecision: { gap: 8, minWidth: 0 },
  reconChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reconReason: { gap: 4 },
  reconMessages: { gap: 4 },
  reconMessage: { borderLeftWidth: 4, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8 },
});
