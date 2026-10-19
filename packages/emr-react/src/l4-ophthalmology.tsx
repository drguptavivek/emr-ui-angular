'use client';

import { useId, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  ClinicalAssessmentStatus,
  DiagnosticMetric,
  DiagnosticResultIntent,
  DiagnosticResultViewModel,
  GazePosition,
  MeridianCrossEye,
  MeridianCrossIntent,
  MeridianCrossViewModel,
  MotilityEye,
  OctEyeRecord,
  OctFinding,
  OctFindingRecordIntent,
  OctFindingRecordViewModel,
  OctFrameRef,
  OcularMotilityIntent,
  OcularMotilityViewModel,
  SpectaclePrescriptionEye,
  SpectaclePrescriptionField,
  SpectaclePrescriptionIntent,
  SpectaclePrescriptionViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import {
  ASSESSMENT_STATUS_DEFAULTS,
  MERIDIAN_CX,
  MERIDIAN_CY,
  MERIDIAN_DIAL_HEIGHT,
  MERIDIAN_DIAL_WIDTH,
  MERIDIAN_HALF,
  MOTILITY_ROWS,
  OCT_FRAME_KIND_DEFAULTS,
  OCT_SEVERITY_DEFAULTS,
  assessmentStatusLabel,
  drawnMeridians,
  isDiagnosticStacked,
  isMotilityCellSelected,
  isSpectacleFieldReadOnly,
  isSpectacleStacked,
  isTwoColumnStacked,
  motilityCell,
  motilityCellAccessibleLabel,
  nonRecordedStatusLabel,
  octFindingAccessibleName,
  octFindingFrameLabel,
  octFrameAccessibleName,
  selectedMotilityCell,
  selectedOctFrame,
  shownMotilityEyes,
  spectacleErrorEntries,
  spectacleEyeAccessibleLabel,
  spectacleFieldError,
  spectacleFieldValue,
  spectacleFieldWarning,
  spectacleInputMode,
  spectacleKeyboardType,
  spectacleNoteValue,
  spokenMeridians,
  type DiagnosticResultSummaryIntent,
  type DiagnosticResultSummaryViewModel,
  type OcularMotilityChartIntent,
  type OcularMotilityChartViewModel,
} from './l4-ophthalmology.logic';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrTokens } from './tokens';

export type {
  DiagnosticResultSummaryIntent,
  DiagnosticResultSummaryViewModel,
  OcularMotilityChartIntent,
  OcularMotilityChartViewModel,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

function fontMono(t: EmrTokens): string | undefined {
  return Platform.OS === 'web' ? t.fontMono : undefined;
}

// ===========================================================================
// 1. EmrDiagnosticResultSummary
// ===========================================================================

export const DIAG_SUMMARY_DEFAULTS = {
  eyebrow: 'Diagnostic result',
  loading: 'Loading result details…',
  errorTitle: 'Result details could not be loaded',
  retry: 'Retry',
  resultMetadata: 'Result metadata',
  measurementCol: 'Measurement',
  valueCol: 'Value',
  referenceCol: 'Reference',
  statusCol: 'Record status',
  notSupplied: 'Not supplied',
  dash: '—',
  noMeasurements: 'No measurements recorded.',
  suppliedNote: 'Supplied note',
  suppliedTrendNote: 'Supplied trend note',
  availableFiles: 'Available files',
} as const;

export type EmrDiagnosticResultSummaryLabels = typeof DIAG_SUMMARY_DEFAULTS;

export interface EmrDiagnosticResultSummaryProps {
  model: DiagnosticResultSummaryViewModel;
  headingId?: string;
  labels?: Partial<EmrDiagnosticResultSummaryLabels>;
  onIntent?: (intent: DiagnosticResultSummaryIntent) => void;
}

/**
 * L4. Diagnostic device report summary (e.g. perimetry) with loading, error, and populated states,
 * metadata, per-eye / global metrics, reliability/interpretation badges, notes, and attachments.
 */
export function EmrDiagnosticResultSummary({
  model,
  headingId = 'emr-diagnostic-result-heading',
  labels,
  onIntent,
}: EmrDiagnosticResultSummaryProps) {
  const t = useEmrTheme();
  const l = { ...DIAG_SUMMARY_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const [width, setWidth] = useState(0);
  const stacked = isDiagnosticStacked(width);
  const attachmentsHeadingId = `${headingId}-attachments`;

  const renderMetricStatus = (metric: DiagnosticMetric) => (
    <View style={styles.metricStatusWrap}>
      {metric.status ? (
        <EmrBadgeView badge={metric.status} />
      ) : (
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.notSupplied}</Text>
      )}
      {metric.helpText ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{metric.helpText}</Text>
      ) : null}
    </View>
  );

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      aria-busy={model.loading}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.cardSurface, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.diagHeader, stacked ? styles.colStack : null]}>
        <View style={styles.flex}>
          <Text
            style={[
              styles.eyebrow,
              { color: t.primary, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
            ]}
          >
            {l.eyebrow}
          </Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.title}
          </Text>
          {model.subtitle ? (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font, marginTop: 4 }}>
              {model.subtitle}
            </Text>
          ) : null}
        </View>
        {model.status ? <EmrBadgeView badge={model.status} /> : null}
      </View>

      {model.loading ? (
        <View role="status" style={[styles.stateBox, { backgroundColor: t.surfaceSoft }]}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{l.loading}</Text>
        </View>
      ) : model.error ? (
        <View role="alert" style={[styles.stateBox, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {l.errorTitle}
          </Text>
          <Text style={{ color: t.danger, fontSize: t.textMd, fontFamily: font }}>{model.error}</Text>
          <View style={styles.buttonRow}>
            <EmrButton
              small
              variant="outline"
              label={l.retry}
              onPress={() => onIntent?.({ type: 'retryRequested', resultId: model.id })}
            />
          </View>
        </View>
      ) : (
        <View style={styles.sectionGap}>
          {model.metadata.length > 0 ? (
            <View
              role="group"
              aria-label={l.resultMetadata}
              style={[styles.metadataGrid, { borderBottomColor: t.border }]}
            >
              {model.metadata.map(item => (
                <View key={item.label} style={styles.metadataItem}>
                  <Text
                    style={{
                      color: t.textMuted,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font, marginTop: 3 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {model.metrics.length > 0 ? (
            stacked ? (
              <View role="list" aria-label={model.title} style={styles.compactMetrics}>
                {model.metrics.map(metric => (
                  <View key={metric.id} role="listitem" style={[styles.compactMetricRow, { borderBottomColor: t.border }]}>
                    <View style={styles.compactMetricTop}>
                      <Text
                        style={[
                          styles.metricLabel,
                          { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                        ]}
                      >
                        {metric.label}
                      </Text>
                      <Text style={[styles.metricValue, { color: t.text, fontSize: t.textMd, fontFamily: font }]}>{metric.valueLabel}</Text>
                    </View>
                    {metric.referenceLabel ? (
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                        {`${l.referenceCol}: ${metric.referenceLabel}`}
                      </Text>
                    ) : null}
                    {renderMetricStatus(metric)}
                  </View>
                ))}
              </View>
            ) : (
              <View role="table" aria-label={model.title} style={[styles.tableWrap, { borderColor: t.border }]}>
                <View role="row" style={[styles.tableHeadRow, { backgroundColor: t.surfaceBlue, borderBottomColor: t.border }]}>
                  <Text
                    role="columnheader"
                    style={[
                      styles.tableColWide,
                      styles.eyebrow,
                      { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                    ]}
                  >
                    {l.measurementCol}
                  </Text>
                  <Text
                    role="columnheader"
                    style={[
                      styles.tableCol,
                      styles.eyebrow,
                      { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                    ]}
                  >
                    {l.valueCol}
                  </Text>
                  <Text
                    role="columnheader"
                    style={[
                      styles.tableCol,
                      styles.eyebrow,
                      { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                    ]}
                  >
                    {l.referenceCol}
                  </Text>
                  <Text
                    role="columnheader"
                    style={[
                      styles.tableCol,
                      styles.eyebrow,
                      { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                    ]}
                  >
                    {l.statusCol}
                  </Text>
                </View>
                {model.metrics.map(metric => (
                  <View key={metric.id} role="row" style={[styles.tableDataRow, { borderBottomColor: t.border }]}>
                    <Text
                      role="rowheader"
                      style={[
                        styles.tableColWide,
                        { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                      ]}
                    >
                      {metric.label}
                    </Text>
                    <Text role="cell" style={[styles.tableCol, { color: t.text, fontSize: t.textMd, fontFamily: font }]}>
                      {metric.valueLabel}
                    </Text>
                    <Text role="cell" style={[styles.tableCol, { color: t.text, fontSize: t.textMd, fontFamily: font }]}>
                      {metric.referenceLabel || l.dash}
                    </Text>
                    <View role="cell" style={styles.tableCol}>
                      {renderMetricStatus(metric)}
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : (
            <View role="status" style={[styles.stateBox, { backgroundColor: t.surfaceSoft }]}>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{l.noMeasurements}</Text>
            </View>
          )}

          {model.interpretation ? (
            <View style={[styles.noteCallout, { borderLeftColor: t.primary, backgroundColor: t.surfaceSoft }]}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: t.primary, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                ]}
              >
                {l.suppliedNote}
              </Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font, marginTop: 4 }}>
                {model.interpretation}
              </Text>
            </View>
          ) : null}

          {model.trendSummary ? (
            <View style={[styles.noteCallout, { borderLeftColor: t.primary, backgroundColor: t.surfaceSoft }]}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: t.primary, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                ]}
              >
                {l.suppliedTrendNote}
              </Text>
              <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font, marginTop: 4 }}>
                {model.trendSummary}
              </Text>
            </View>
          ) : null}

          {model.attachments && model.attachments.length > 0 ? (
            <View
              role="group"
              aria-labelledby={attachmentsHeadingId}
              style={[styles.attachmentsSection, { borderTopColor: t.border }]}
            >
              <Text
                role="heading"
                aria-level={3}
                nativeID={attachmentsHeadingId}
                style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
              >
                {l.availableFiles}
              </Text>
              <View style={styles.buttonRow}>
                {model.attachments.map(att => (
                  <EmrButton
                    key={att.id}
                    small
                    variant="outline"
                    disabled={att.disabled}
                    label={att.label}
                    accessibilityLabel={att.assistiveDescription || att.label}
                    onPress={() =>
                      onIntent?.({
                        type: 'attachmentRequested',
                        resultId: model.id,
                        attachmentId: att.id,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ===========================================================================
// 2. EmrSpectaclePrescription
// ===========================================================================

export const SPECTACLE_RX_DEFAULTS = {
  eyebrow: 'Ophthalmology',
  readOnly: 'Read only',
  reviewErrors: 'Review prescription entries',
  eyeCol: 'Eye',
  notesCol: 'Notes',
  notesFor: 'Notes for',
  forWord: 'for',
  dash: '—',
} as const;

export type EmrSpectaclePrescriptionLabels = typeof SPECTACLE_RX_DEFAULTS;

export interface EmrSpectaclePrescriptionProps {
  model: SpectaclePrescriptionViewModel;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrSpectaclePrescriptionLabels>;
  onIntent: (intent: SpectaclePrescriptionIntent) => void;
}

/**
 * L4. OD / OS spectacle prescription table (or stacked eye cards when narrow) with sphere,
 * cylinder, axis, prism, base, near addition, visual acuity, and notes per eye.
 */
export function EmrSpectaclePrescription({
  model,
  headingId,
  idPrefix = '',
  labels,
  onIntent,
}: EmrSpectaclePrescriptionProps) {
  const t = useEmrTheme();
  const l = { ...SPECTACLE_RX_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const [width, setWidth] = useState(0);
  const stacked = isSpectacleStacked(width);
  const resolvedHeadingId = headingId ?? `${idPrefix || model.id}-heading`;
  const errorEntries = spectacleErrorEntries(model);

  const renderFieldCell = (eye: SpectaclePrescriptionEye, field: SpectaclePrescriptionField) => {
    const val = spectacleFieldValue(model, eye.id, field.id);
    const err = spectacleFieldError(model, eye.id, field.id);
    const warn = spectacleFieldWarning(model, eye.id, field.id);
    const eyeLabel = spectacleEyeAccessibleLabel(eye);
    const ariaLabel = `${field.label} ${l.forWord} ${eyeLabel}`;
    const readOnly = isSpectacleFieldReadOnly(model, field);

    let control;
    if (readOnly) {
      control = (
        <View style={styles.rxReadOnlyCell}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{val || l.dash}</Text>
        </View>
      );
    } else if (field.type === 'select') {
      control = (
        <EmrSelect
          label={ariaLabel}
          options={field.options ?? []}
          value={val || null}
          invalid={Boolean(err)}
          disabled={field.disabled}
          onChange={next =>
            onIntent({
              type: 'cellEditRequested',
              eyeId: eye.id,
              fieldId: field.id,
              value: next ?? '',
            })
          }
        />
      );
    } else {
      control = (
        <ThemedInput
          aria-label={ariaLabel}
          value={val}
          placeholder={field.placeholder ?? ''}
          editable={!field.disabled}
          invalid={Boolean(err)}
          inputMode={spectacleInputMode(field.type)}
          keyboardType={spectacleKeyboardType(field.type)}
          onFocus={() => onIntent({ type: 'cellFocused', eyeId: eye.id, fieldId: field.id })}
          onChangeText={next =>
            onIntent({
              type: 'cellEditRequested',
              eyeId: eye.id,
              fieldId: field.id,
              value: next,
            })
          }
        />
      );
    }

    return (
      <View style={styles.rxCellInner}>
        {control}
        {warn ? (
          <Text style={{ color: t.warning, fontSize: t.textXs, fontFamily: font }}>{warn}</Text>
        ) : null}
        {err ? (
          <Text role="alert" style={{ color: t.danger, fontSize: t.textXs, fontFamily: font }}>
            {err}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderNotesCell = (eye: SpectaclePrescriptionEye) => {
    const val = spectacleNoteValue(model, eye.id);
    const err = spectacleFieldError(model, eye.id, 'notes');
    const warn = spectacleFieldWarning(model, eye.id, 'notes');
    const eyeLabel = spectacleEyeAccessibleLabel(eye);
    const ariaLabel = `${l.notesFor} ${eyeLabel}`;
    const readOnly = isSpectacleFieldReadOnly(model);

    return (
      <View style={styles.rxCellInner}>
        {readOnly ? (
          <View style={styles.rxReadOnlyCell}>
            <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{val || l.dash}</Text>
          </View>
        ) : (
          <ThemedInput
            aria-label={ariaLabel}
            value={val}
            invalid={Boolean(err)}
            onFocus={() => onIntent({ type: 'cellFocused', eyeId: eye.id, fieldId: 'notes' })}
            onChangeText={next =>
              onIntent({
                type: 'notesEditRequested',
                eyeId: eye.id,
                value: next,
              })
            }
          />
        )}
        {warn ? (
          <Text style={{ color: t.warning, fontSize: t.textXs, fontFamily: font }}>{warn}</Text>
        ) : null}
        {err ? (
          <Text role="alert" style={{ color: t.danger, fontSize: t.textXs, fontFamily: font }}>
            {err}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={resolvedHeadingId}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.cardSurface, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.diagHeader}>
        <View style={styles.flex}>
          <Text
            style={[
              styles.eyebrow,
              { color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
            ]}
          >
            {l.eyebrow}
          </Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={resolvedHeadingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.label}
          </Text>
          {model.description ? (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font, marginTop: 2 }}>
              {model.description}
            </Text>
          ) : null}
        </View>
        {model.readOnly ? (
          <View style={[styles.statusPill, { borderColor: t.border }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{l.readOnly}</Text>
          </View>
        ) : null}
      </View>

      {errorEntries.length > 0 ? (
        <View role="alert" style={[styles.rxErrorBanner, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {l.reviewErrors}
          </Text>
          {errorEntries.map(([key, msg]) => (
            <Text key={key} style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>
              {`• ${msg}`}
            </Text>
          ))}
        </View>
      ) : null}

      {stacked ? (
        <View style={styles.sectionGap}>
          {model.eyes.map(eye => (
            <View
              key={eye.id}
              role="group"
              aria-label={spectacleEyeAccessibleLabel(eye)}
              style={[styles.rxMobileCard, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                {spectacleEyeAccessibleLabel(eye)}
              </Text>
              {model.fields.map(field => (
                <View key={field.id} style={styles.rxMobileField}>
                  <Text
                    style={{
                      color: t.textMuted,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(t.weightMedium),
                      fontFamily: font,
                    }}
                  >
                    {field.unit ? `${field.label} (${field.unit})` : field.label}
                  </Text>
                  {renderFieldCell(eye, field)}
                </View>
              ))}
              <View style={styles.rxMobileField}>
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightMedium),
                    fontFamily: font,
                  }}
                >
                  {l.notesCol}
                </Text>
                {renderNotesCell(eye)}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View role="table" aria-label={model.label} style={styles.rxTable}>
            <View role="row" style={[styles.tableHeadRow, { backgroundColor: t.surfaceRaised, borderBottomColor: t.border }]}>
              <View role="columnheader" style={styles.rxEyeCol}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                  {l.eyeCol}
                </Text>
              </View>
              {model.fields.map(field => (
                <View key={field.id} role="columnheader" style={styles.rxFieldCol}>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {field.label}
                  </Text>
                  {field.unit ? (
                    <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: font }}>{`(${field.unit})`}</Text>
                  ) : null}
                </View>
              ))}
              <View role="columnheader" style={styles.rxNotesCol}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                  {l.notesCol}
                </Text>
              </View>
            </View>
            {model.eyes.map(eye => (
              <View key={eye.id} role="row" style={[styles.tableDataRow, { borderBottomColor: t.border }]}>
                <View role="rowheader" style={[styles.rxEyeCol, { paddingTop: 10 }]}>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {spectacleEyeAccessibleLabel(eye)}
                  </Text>
                </View>
                {model.fields.map(field => (
                  <View key={field.id} role="cell" style={styles.rxFieldCol}>
                    {renderFieldCell(eye, field)}
                  </View>
                ))}
                <View role="cell" style={styles.rxNotesCol}>
                  {renderNotesCell(eye)}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ===========================================================================
// 3. EmrMeridianCross
// ===========================================================================

export const MERIDIAN_CROSS_DEFAULTS = {
  opticalCross: 'Optical cross',
  retinoscopyCross: 'Retinoscopy cross',
  edit: 'Edit',
  notSupplied: 'Not supplied',
  opticalFootnote:
    "Optical cross: powers are shown as supplied, each at the end of its meridian. Axes follow the TABO convention as the examiner sees the eye: 0° at the viewer's right, counter-clockwise.",
  retinoscopyFootnote:
    "Retinoscopy cross: values are shown as supplied; working distance and gross or net are stated in each eye's captions. Axes follow the TABO convention as the examiner sees the eye.",
  ...ASSESSMENT_STATUS_DEFAULTS,
} as const;

export type EmrMeridianCrossLabels = typeof MERIDIAN_CROSS_DEFAULTS;

export interface EmrMeridianCrossProps {
  model: MeridianCrossViewModel;
  headingId?: string;
  labels?: Partial<EmrMeridianCrossLabels>;
  onIntent?: (intent: MeridianCrossIntent) => void;
}

/**
 * L4. Optical (power) cross and retinoscopy cross, one panel per eye (OD on the viewer's left).
 * Renders two perpendicular meridian lines at controller-supplied TABO degree angles using
 * React Native View bars with `transform: [{ rotate }]` and positioned power/axis labels.
 */
export function EmrMeridianCross({
  model,
  headingId,
  labels,
  onIntent,
}: EmrMeridianCrossProps) {
  const t = useEmrTheme();
  const l = { ...MERIDIAN_CROSS_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const mono = fontMono(t);
  const uid = useId();
  const titleId = headingId ?? `${uid}-heading`;
  const [width, setWidth] = useState(0);
  const stacked = isTwoColumnStacked(width, 560) || model.eyes.length <= 1;

  const renderEyePanel = (eye: MeridianCrossEye) => {
    const meridians = drawnMeridians(eye);
    const eyeHeadingId = `${uid}-eye-${eye.eyeId}`;
    const dialLabel = `${eye.label}: ${spokenMeridians(eye)}`;

    const sideBadge = (
      <View
        style={[
          styles.eyeSideBadge,
          { borderColor: t.primaryBorder, backgroundColor: t.primarySoft },
        ]}
      >
        <Text
          style={{
            color: t.primaryContrast,
            fontFamily: mono,
            fontSize: t.textMd,
            fontWeight: fontWeight(t.weightBold),
            textAlign: 'center',
          }}
        >
          {eye.shortLabel}
        </Text>
      </View>
    );

    const dialContent = (
      <View
        role="img"
        aria-label={dialLabel}
        style={styles.mcDial}
      >
        {/* Reference circle */}
        <View
          style={[
            styles.mcRing,
            {
              left: MERIDIAN_CX - MERIDIAN_HALF,
              top: MERIDIAN_CY - MERIDIAN_HALF,
              width: MERIDIAN_HALF * 2,
              height: MERIDIAN_HALF * 2,
              borderRadius: MERIDIAN_HALF,
              borderColor: t.border,
            },
          ]}
        />
        {/* Two rotated meridian lines and endpoint labels */}
        {meridians.map((m, idx) => (
          <View key={`${m.axisDeg}-${idx}`} style={StyleSheet.absoluteFill} pointerEvents="none">
            <View
              style={[
                styles.mcLine,
                {
                  left: MERIDIAN_CX - MERIDIAN_HALF,
                  top: MERIDIAN_CY - 1.5,
                  width: MERIDIAN_HALF * 2,
                  backgroundColor: t.text,
                  transform: [{ rotate: `${m.rotationDeg}deg` }],
                },
              ]}
            />
            <View
              style={[
                styles.mcLabelBox,
                {
                  left: m.powerX - 46,
                  top: m.powerY - 12,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: t.text,
                  fontFamily: mono,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightBold),
                  textAlign: 'center',
                }}
              >
                {m.powerLabel}
              </Text>
            </View>
            <View
              style={[
                styles.mcLabelBox,
                {
                  left: m.axisX - 36,
                  top: m.axisY - 11,
                },
              ]}
            >
              <Text
                aria-hidden
                numberOfLines={1}
                style={{
                  color: t.textMuted,
                  fontFamily: mono,
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightRegular),
                  textAlign: 'center',
                }}
              >
                {m.axisLabel}
              </Text>
            </View>
          </View>
        ))}
        {/* Center dot */}
        <View
          style={{
            position: 'absolute',
            left: MERIDIAN_CX - 3.5,
            top: MERIDIAN_CY - 3.5,
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: t.text,
          }}
        />
      </View>
    );

    return (
      <View
        key={eye.eyeId}
        role="group"
        aria-labelledby={eyeHeadingId}
        style={[
          styles.mcEyeCard,
          stacked ? null : styles.flex,
          { borderColor: t.border, backgroundColor: t.surfaceSoft },
        ]}
      >
        <View style={[styles.mcEyeHeader, { minHeight: t.controlHeight }]}>
          {model.readOnly ? (
            <View style={[styles.rowCenter, styles.flex]} nativeID={eyeHeadingId}>
              {sideBadge}
              <Text
                style={{
                  color: t.text,
                  fontSize: t.textLg,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: font,
                }}
              >
                {eye.label}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                role="button"
                nativeID={eyeHeadingId}
                accessibilityLabel={`${eye.shortLabel} ${eye.label}`}
                onPress={() => onIntent?.({ type: 'eyeSelected', eyeId: eye.eyeId })}
                style={({ focused }: PressState) => [
                  styles.rowCenter,
                  styles.flex,
                  { minHeight: t.controlHeight, borderRadius: 6 },
                  focusRing(t, focused),
                ]}
              >
                {sideBadge}
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textLg,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                  }}
                >
                  {eye.label}
                </Text>
              </Pressable>
              <EmrButton
                small
                variant="outline"
                label={l.edit}
                accessibilityLabel={`${l.edit} ${eye.label}`}
                onPress={() => onIntent?.({ type: 'editRequested', eyeId: eye.eyeId })}
              />
            </>
          )}
          {eye.flag ? <EmrBadgeView badge={eye.flag} /> : null}
        </View>

        {eye.status === 'recorded' && meridians.length > 0 ? (
          model.readOnly ? (
            <View style={styles.mcDialCenter}>{dialContent}</View>
          ) : (
            <Pressable
              role="button"
              accessibilityLabel={dialLabel}
              onPress={() => onIntent?.({ type: 'eyeSelected', eyeId: eye.eyeId })}
              style={({ focused }: PressState) => [
                styles.mcDialCenter,
                { borderRadius: 8 },
                focusRing(t, focused),
              ]}
            >
              {dialContent}
            </Pressable>
          )
        ) : (
          <View style={[styles.mcMissingState, { borderColor: t.border }]}>
            <Text
              style={{
                color: eye.status === 'recorded' ? t.textMuted : t.text,
                fontSize: t.textLg,
                fontWeight: fontWeight(eye.status === 'recorded' ? t.weightRegular : t.weightBold),
                fontFamily: font,
                textAlign: 'center',
              }}
            >
              {eye.status === 'recorded' ? l.notSupplied : nonRecordedStatusLabel(eye.status, l)}
            </Text>
          </View>
        )}

        {eye.captionLines && eye.captionLines.length > 0 ? (
          <View style={styles.mcCaptions}>
            {eye.captionLines.map((line, i) => (
              <Text key={`${i}-${line}`} style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      aria-label={model.summaryText}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.cardSurface, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View>
        <Text
          style={[
            styles.eyebrow,
            { color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
          ]}
        >
          {model.kind === 'retinoscopy' ? l.retinoscopyCross : l.opticalCross}
        </Text>
        <Text
          role="heading"
          aria-level={3}
          nativeID={titleId}
          style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
        >
          {model.title}
        </Text>
      </View>

      <View style={[styles.eyesRow, stacked ? styles.colStack : styles.rowSideBySide]}>
        {model.eyes.map(renderEyePanel)}
      </View>

      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
        {model.kind === 'retinoscopy' ? l.retinoscopyFootnote : l.opticalFootnote}
      </Text>
    </View>
  );
}

// ===========================================================================
// 4. EmrOcularMotilityChart
// ===========================================================================

export const MOTILITY_DEFAULTS = {
  notSupplied: 'Not supplied',
  selected: 'Selected',
  edit: 'Edit',
  ...ASSESSMENT_STATUS_DEFAULTS,
} as const;

export type EmrOcularMotilityChartLabels = typeof MOTILITY_DEFAULTS;

export interface EmrOcularMotilityChartProps {
  model: OcularMotilityChartViewModel;
  headingId?: string;
  labels?: Partial<EmrOcularMotilityChartLabels>;
  onIntent?: (intent: OcularMotilityChartIntent) => void;
}

/**
 * L4. Nine-gaze (3×3) motility or duction grid, one per eye or one binocular.
 * Every cell shows the controller-supplied gaze label, value, status, and optional badge.
 */
export function EmrOcularMotilityChart({
  model,
  headingId,
  labels,
  onIntent,
}: EmrOcularMotilityChartProps) {
  const t = useEmrTheme();
  const l = { ...MOTILITY_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const mono = fontMono(t);
  const uid = useId();
  const titleId = headingId ?? `${uid}-heading`;
  const [width, setWidth] = useState(0);
  const eyes = shownMotilityEyes(model);
  const stacked = isTwoColumnStacked(width, 560) || eyes.length <= 1;
  const selected = selectedMotilityCell(model);

  const renderCellBody = (eye: MotilityEye, pos: GazePosition, isSel: boolean) => {
    const c = motilityCell(eye, pos);
    const posLabel = model.positionLabels[pos];
    return (
      <>
        <Text
          style={{
            color: isSel ? t.text : t.textMuted,
            fontSize: t.textXs,
            fontFamily: font,
            textAlign: 'center',
          }}
        >
          {posLabel}
        </Text>
        {c ? (
          c.status === 'recorded' && c.valueLabel !== null ? (
            <Text
              style={{
                color: t.text,
                fontFamily: c.valueLabel.length > 6 ? font : mono,
                fontSize: c.valueLabel.length > 6 ? t.textMd : t.textXl,
                fontWeight: fontWeight(t.weightBold),
                textAlign: 'center',
              }}
            >
              {c.valueLabel}
            </Text>
          ) : c.status === 'recorded' ? (
            <Text style={{ color: isSel ? t.text : t.textMuted, fontSize: t.textSm, fontFamily: font, textAlign: 'center' }}>
              {l.notSupplied}
            </Text>
          ) : (
            <Text
              style={{
                color: t.text,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: font,
                textAlign: 'center',
              }}
            >
              {nonRecordedStatusLabel(c.status, l)}
            </Text>
          )
        ) : (
          <Text style={{ color: isSel ? t.text : t.textMuted, fontSize: t.textSm, fontFamily: font, textAlign: 'center' }}>
            {l.notSupplied}
          </Text>
        )}
        {c?.badge ? <EmrBadgeView badge={c.badge} /> : null}
        {c?.note ? (
          <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: font, textAlign: 'center' }}>{c.note}</Text>
        ) : null}
        {isSel ? (
          <Text
            aria-hidden
            style={[
              styles.mtCheck,
              { color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) },
            ]}
          >
            ✓
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      aria-label={model.summaryText}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.cardSurface, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <Text
        role="heading"
        aria-level={3}
        nativeID={titleId}
        style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
      >
        {model.title}
      </Text>

      <View style={[styles.eyesRow, stacked ? styles.colStack : styles.rowSideBySide]}>
        {eyes.map(eye => (
          <View
            key={eye.eyeId}
            role="group"
            aria-label={`${eye.shortLabel} ${eye.label}`}
            style={[
              styles.mtEyePanel,
              stacked ? null : styles.flex,
              { borderColor: t.border, backgroundColor: t.surfaceSoft },
            ]}
          >
            <View style={styles.mtEyeCaption}>
              <View
                style={[
                  styles.eyeSideBadge,
                  { borderColor: t.primaryBorder, backgroundColor: t.primarySoft },
                ]}
              >
                <Text
                  style={{
                    color: t.primaryContrast,
                    fontFamily: mono,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    textAlign: 'center',
                  }}
                >
                  {eye.shortLabel}
                </Text>
              </View>
              <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                {eye.label}
              </Text>
            </View>

            <View style={styles.mtGrid}>
              {MOTILITY_ROWS.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.mtRow}>
                  {row.map(pos => {
                    const isSel = isMotilityCellSelected(model, eye.eyeId, pos);
                    const cellA11y = motilityCellAccessibleLabel(model, eye, pos, l.notSupplied, l);
                    const cellBoxStyle = [
                      styles.mtCell,
                      {
                        minHeight: t.controlHeight,
                        borderColor: isSel ? t.primary : t.border,
                        borderWidth: isSel ? 3 : 1,
                        backgroundColor: isSel ? t.primarySoft : t.surface,
                      },
                    ];

                    if (model.readOnly) {
                      return (
                        <View key={pos} aria-label={cellA11y} style={[styles.flex, ...cellBoxStyle]}>
                          {renderCellBody(eye, pos, isSel)}
                        </View>
                      );
                    }
                    return (
                      <Pressable
                        key={pos}
                        role="button"
                        aria-pressed={isSel}
                        aria-label={cellA11y}
                        onPress={() => onIntent?.({ type: 'cellSelected', eyeId: eye.eyeId, position: pos })}
                        style={({ focused, pressed }: PressState) => [
                          styles.flex,
                          ...cellBoxStyle,
                          pressed ? { backgroundColor: t.primarySoft } : null,
                          focusRing(t, focused),
                        ]}
                      >
                        {renderCellBody(eye, pos, isSel)}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {selected && !model.readOnly ? (
        <View style={styles.buttonRow}>
          <EmrButton
            small
            variant="outline"
            label={`${l.edit} ${selected.eye.label}, ${model.positionLabels[selected.position]}`}
            onPress={() =>
              onIntent?.({
                type: 'cellEditRequested',
                eyeId: selected.eye.eyeId,
                position: selected.position,
              })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

// ===========================================================================
// 5. EmrOctFindingRecord
// ===========================================================================

export const OCT_RECORD_DEFAULTS = {
  loading: 'Loading OCT record…',
  errorTitle: 'OCT record could not be loaded.',
  retry: 'Retry',
  validationMessages: 'Validation messages',
  noRecordForEye: 'No OCT record is shown for this eye.',
  scanDetails: 'Scan details',
  scanDetailsNotSupplied: 'Scan details: Not supplied',
  frames: 'Frames',
  noImageSupplied: 'No image supplied',
  selected: 'Selected',
  openSelectedFrame: 'Open selected frame',
  openFrame: 'Open frame',
  noFramesSupplied: 'No frames supplied',
  measurements: 'Measurements',
  measurementCol: 'Measurement',
  valueCol: 'Value',
  referenceCol: 'Reference',
  statusCol: 'Status',
  notSupplied: 'Not supplied',
  findings: 'Findings',
  addFinding: 'Add finding',
  onFrame: 'On frame',
  edit: 'Edit',
  remove: 'Remove',
  editFinding: 'Edit finding',
  removeFinding: 'Remove finding',
  interpretation: 'Interpretation',
  noEyes: 'No eyes supplied',
  ...ASSESSMENT_STATUS_DEFAULTS,
  ...OCT_FRAME_KIND_DEFAULTS,
  ...OCT_SEVERITY_DEFAULTS,
} as const;

export type EmrOctFindingRecordLabels = typeof OCT_RECORD_DEFAULTS;

export interface EmrOctFindingRecordProps {
  model: OctFindingRecordViewModel;
  headingId?: string;
  labels?: Partial<EmrOctFindingRecordLabels>;
  onIntent: (intent: OctFindingRecordIntent) => void;
}

/**
 * L4. Controlled, display-first OCT finding record: OD and OS panels side by side (stacked when narrow)
 * with scan metadata, frame thumbnails strip, quantitative metrics with badges, coded findings,
 * interpretation text, and validation messages.
 */
export function EmrOctFindingRecord({
  model,
  headingId,
  labels,
  onIntent,
}: EmrOctFindingRecordProps) {
  const t = useEmrTheme();
  const l = { ...OCT_RECORD_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const mono = fontMono(t);
  const uid = useId();
  const titleId = headingId ?? `${uid}-heading`;
  const [width, setWidth] = useState(0);
  const stacked = isTwoColumnStacked(width, 720) || model.eyes.length <= 1;

  const statusText = (s: ClinicalAssessmentStatus) => assessmentStatusLabel(s, l);
  const kindText = (k: OctFrameRef['kind']) => l[k] ?? OCT_FRAME_KIND_DEFAULTS[k];
  const severityText = (s: 'error' | 'warning' | 'info') => l[s] ?? OCT_SEVERITY_DEFAULTS[s];

  const renderEye = (eye: OctEyeRecord) => {
    const eyeHeadingId = `${uid}-${eye.eyeId}-h`;
    const selFrame = selectedOctFrame(eye);

    return (
      <View
        key={eye.eyeId}
        role="group"
        aria-labelledby={eyeHeadingId}
        style={[
          styles.octEyeCard,
          stacked ? null : styles.flex,
          { borderColor: t.border, backgroundColor: t.surface },
        ]}
      >
        <View style={styles.octEyeHead}>
          <View
            style={[
              styles.eyeSideBadge,
              {
                minWidth: t.controlHeight,
                height: t.compactHeight,
                borderColor: t.primaryBorder,
                backgroundColor: t.primarySoft,
              },
            ]}
          >
            <Text
              aria-hidden
              style={{
                color: t.primaryContrast,
                fontFamily: mono,
                fontSize: t.textMd,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {eye.shortLabel}
            </Text>
          </View>
          <Text
            role="heading"
            aria-level={4}
            nativeID={eyeHeadingId}
            style={[
              styles.flex,
              { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font },
            ]}
          >
            {`${eye.label} (${eye.shortLabel})`}
          </Text>
          {eye.status !== 'recorded' ? (
            <EmrBadgeView badge={{ label: statusText(eye.status), tone: 'neutral' }} />
          ) : null}
        </View>

        {eye.status !== 'recorded' ? (
          <View style={[styles.octEmptyEyeState, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
              <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{`${statusText(eye.status)}. `}</Text>
              {l.noRecordForEye}
            </Text>
          </View>
        ) : (
          <View style={styles.sectionGap}>
            {/* Scan metadata */}
            <View role="group" aria-label={`${l.scanDetails}, ${eye.label}`} style={styles.octSection}>
              {eye.metadata.length > 0 ? (
                <View style={styles.octMetaGrid}>
                  {eye.metadata.map(item => (
                    <View key={item.label} style={styles.octMetaItem}>
                      <Text
                        style={{
                          color: t.textMuted,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: font,
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
                  {l.scanDetailsNotSupplied}
                </Text>
              )}
            </View>

            {/* Frames strip */}
            <View role="group" aria-label={`${l.frames}, ${eye.label}`} style={styles.octSection}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                ]}
              >
                {l.frames}
              </Text>
              {eye.frames.length > 0 ? (
                <>
                  <View style={styles.octFramesGrid}>
                    {eye.frames.map(f => {
                      const isSel = f.frameId === eye.selectedFrameId;
                      return (
                        <Pressable
                          key={f.frameId}
                          role="button"
                          aria-pressed={isSel}
                          aria-label={octFrameAccessibleName(f, l.noImageSupplied)}
                          onPress={() =>
                            onIntent({
                              type: 'frameSelected',
                              eyeId: eye.eyeId,
                              frameId: f.frameId,
                            })
                          }
                          style={({ focused }: PressState) => [
                            styles.octFrameBtn,
                            {
                              minHeight: t.controlHeight,
                              borderColor: isSel ? t.primary : t.border,
                              borderWidth: isSel ? 2 : 1,
                              backgroundColor: isSel ? t.primarySoft : t.surface,
                            },
                            focusRing(t, focused),
                          ]}
                        >
                          <View style={[styles.octThumbBox, { backgroundColor: t.neutralSoft }]}>
                            {f.thumbnailUrl ? (
                              <Image
                                source={{ uri: f.thumbnailUrl }}
                                style={styles.octThumbImg}
                                resizeMode="contain"
                                accessibilityLabel=""
                              />
                            ) : (
                              <Text
                                style={{
                                  color: t.textMuted,
                                  fontSize: t.textXs,
                                  fontFamily: font,
                                  textAlign: 'center',
                                  padding: 4,
                                }}
                              >
                                {l.noImageSupplied}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={{
                              color: t.text,
                              fontSize: t.textSm,
                              fontWeight: fontWeight(t.weightMedium),
                              fontFamily: font,
                            }}
                          >
                            {f.label}
                          </Text>
                          <View style={styles.octFrameKindRow}>
                            <Text style={{ color: isSel ? t.text : t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                              {kindText(f.kind)}
                            </Text>
                            {isSel ? (
                              <Text
                                style={{
                                  color: t.text,
                                  fontSize: t.textXs,
                                  fontWeight: fontWeight(t.weightBold),
                                  fontFamily: font,
                                }}
                              >
                                {`✓ ${l.selected}`}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  {selFrame ? (
                    <View style={styles.buttonRow}>
                      <EmrButton
                        small
                        variant="outline"
                        label={l.openSelectedFrame}
                        accessibilityLabel={`${l.openFrame}: ${selFrame.label}`}
                        onPress={() =>
                          onIntent({
                            type: 'frameOpenRequested',
                            eyeId: eye.eyeId,
                            frameId: selFrame.frameId,
                          })
                        }
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.noFramesSupplied}</Text>
              )}
            </View>

            {/* Measurements */}
            <View role="group" aria-label={`${l.measurements}, ${eye.label}`} style={styles.octSection}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                ]}
              >
                {l.measurements}
              </Text>
              {eye.metrics.length > 0 ? (
                <View role="table" aria-label={`${eye.label} ${l.measurements}`} style={[styles.tableWrap, { borderColor: t.border }]}>
                  <View role="row" style={[styles.tableHeadRow, { backgroundColor: t.surfaceRaised, borderBottomColor: t.border }]}>
                    <Text
                      role="columnheader"
                      style={[
                        styles.tableColWide,
                        { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                      ]}
                    >
                      {l.measurementCol}
                    </Text>
                    <Text
                      role="columnheader"
                      style={[
                        styles.tableCol,
                        { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                      ]}
                    >
                      {l.valueCol}
                    </Text>
                    <Text
                      role="columnheader"
                      style={[
                        styles.tableCol,
                        { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                      ]}
                    >
                      {l.referenceCol}
                    </Text>
                    <Text
                      role="columnheader"
                      style={[
                        styles.tableCol,
                        { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                      ]}
                    >
                      {l.statusCol}
                    </Text>
                  </View>
                  {eye.metrics.map((m, idx) => (
                    <View
                      key={m.id}
                      role="row"
                      style={[
                        styles.tableDataRow,
                        idx < eye.metrics.length - 1 ? { borderBottomColor: t.border, borderBottomWidth: 1 } : { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text
                        role="rowheader"
                        style={[
                          styles.tableColWide,
                          { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightMedium), fontFamily: font },
                        ]}
                      >
                        {m.label}
                      </Text>
                      <Text
                        role="cell"
                        style={[
                          styles.tableCol,
                          { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: mono },
                        ]}
                      >
                        {m.valueLabel}
                      </Text>
                      <Text
                        role="cell"
                        style={[
                          styles.tableCol,
                          { color: m.referenceLabel ? t.text : t.textMuted, fontSize: t.textMd, fontFamily: font },
                        ]}
                      >
                        {m.referenceLabel || l.notSupplied}
                      </Text>
                      <View role="cell" style={styles.tableCol}>
                        {m.status ? (
                          <EmrBadgeView badge={m.status} />
                        ) : (
                          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.notSupplied}</Text>
                        )}
                        {m.helpText ? (
                          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font, marginTop: 2 }}>
                            {m.helpText}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.notSupplied}</Text>
              )}
            </View>

            {/* Findings */}
            <View role="group" aria-label={`${l.findings}, ${eye.label}`} style={styles.octSection}>
              <View style={styles.octSectionRow}>
                <Text
                  style={[
                    styles.eyebrow,
                    { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                  ]}
                >
                  {l.findings}
                </Text>
                {!model.readOnly ? (
                  <EmrButton
                    small
                    variant="outline"
                    label={`+ ${l.addFinding}`}
                    accessibilityLabel={`${l.addFinding}, ${eye.label}`}
                    onPress={() => onIntent({ type: 'findingAddRequested', eyeId: eye.eyeId })}
                  />
                ) : null}
              </View>
              {eye.findings.length > 0 ? (
                <View role="list" style={styles.octFindingsList}>
                  {eye.findings.map((f: OctFinding) => {
                    const fl = octFindingFrameLabel(eye, f);
                    const fName = octFindingAccessibleName(eye, f);
                    return (
                      <View
                        key={f.id}
                        role="listitem"
                        style={[styles.octFindingCard, { borderColor: t.border, backgroundColor: t.surface }]}
                      >
                        <Pressable
                          role="button"
                          onPress={() => onIntent({ type: 'findingSelected', eyeId: eye.eyeId, path: f.path })}
                          style={({ focused }: PressState) => [
                            styles.octFindingMain,
                            { minHeight: t.controlHeight },
                            focusRing(t, focused),
                          ]}
                        >
                          <View style={styles.octFindingTop}>
                            <Text
                              style={{
                                color: t.text,
                                fontSize: t.textMd,
                                fontWeight: fontWeight(t.weightBold),
                                fontFamily: font,
                              }}
                            >
                              {f.label}
                            </Text>
                            {f.locationLabel ? (
                              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                                {f.locationLabel}
                              </Text>
                            ) : null}
                          </View>
                          {f.status !== 'recorded' || f.badge || f.code ? (
                            <View style={styles.octFindingTags}>
                              {f.status !== 'recorded' ? (
                                <EmrBadgeView badge={{ label: statusText(f.status), tone: 'neutral' }} />
                              ) : null}
                              {f.badge ? <EmrBadgeView badge={f.badge} /> : null}
                              {f.code ? (
                                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: mono }}>
                                  {f.code.code}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                          {f.note ? (
                            <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>{f.note}</Text>
                          ) : null}
                          {fl ? (
                            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                              {`${l.onFrame}: ${fl}`}
                            </Text>
                          ) : null}
                        </Pressable>
                        {!model.readOnly && !f.readOnly ? (
                          <View style={styles.octFindingActions}>
                            <EmrButton
                              small
                              variant="ghost"
                              label={l.edit}
                              accessibilityLabel={`${l.editFinding}: ${fName}`}
                              onPress={() => onIntent({ type: 'findingEditRequested', eyeId: eye.eyeId, path: f.path })}
                            />
                            <EmrButton
                              small
                              variant="ghost"
                              label={l.remove}
                              accessibilityLabel={`${l.removeFinding}: ${fName}`}
                              onPress={() => onIntent({ type: 'findingRemoveRequested', eyeId: eye.eyeId, path: f.path })}
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.notSupplied}</Text>
              )}
            </View>

            {/* Interpretation */}
            <View role="group" aria-label={`${l.interpretation}, ${eye.label}`} style={styles.octSection}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: font },
                ]}
              >
                {l.interpretation}
              </Text>
              {eye.interpretation ? (
                <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>{eye.interpretation}</Text>
              ) : (
                <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.notSupplied}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      aria-busy={model.loading}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.cardSurface, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <Text
        role="heading"
        aria-level={3}
        nativeID={titleId}
        style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
      >
        {model.title}
      </Text>

      {model.loading ? (
        <View aria-live="polite" role="status">
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.loading}</Text>
        </View>
      ) : null}

      {model.error ? (
        <View
          role="alert"
          style={[styles.octErrorBox, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}
        >
          <Text style={[styles.flex, { color: t.text, fontSize: t.textMd, fontFamily: font }]}>
            <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{`${l.errorTitle} `}</Text>
            {model.error}
          </Text>
          <EmrButton
            small
            variant="outline"
            label={l.retry}
            onPress={() => onIntent({ type: 'retryRequested' })}
          />
        </View>
      ) : null}

      {model.messages.length > 0 ? (
        <View role="list" aria-label={l.validationMessages} style={styles.octMessages}>
          {model.messages.map((m, idx) => {
            const borderColor =
              m.severity === 'error' ? t.danger : m.severity === 'warning' ? t.warning : t.info;
            const bgColor =
              m.severity === 'error' ? t.dangerSoft : m.severity === 'warning' ? t.warningSoft : t.infoSoft;
            return (
              <View
                key={`${idx}-${m.message}`}
                role="listitem"
                style={[styles.octMsgItem, { borderColor, backgroundColor: bgColor }]}
              >
                <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: font }}>
                  <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{`${severityText(m.severity)}: `}</Text>
                  {m.message}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {!model.loading && !model.error ? (
        model.eyes.length > 0 ? (
          <View style={[styles.eyesRow, stacked ? styles.colStack : styles.rowSideBySide]}>
            {model.eyes.map(renderEye)}
          </View>
        ) : (
          <View role="status">
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.noEyes}</Text>
          </View>
        )
      ) : null}
    </View>
  );
}

// ===========================================================================
// Styles
// ===========================================================================

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  cardSurface: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minWidth: 0,
  },
  sectionGap: { gap: 14 },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  diagHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  colStack: {
    flexDirection: 'column',
  },
  rowSideBySide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyesRow: {
    gap: 12,
  },
  stateBox: {
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  metadataItem: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: 150,
  },
  tableWrap: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
    alignItems: 'flex-start',
  },
  tableColWide: {
    flex: 1.5,
    minWidth: 120,
  },
  tableCol: {
    flex: 1,
    minWidth: 90,
  },
  metricStatusWrap: {
    gap: 4,
    alignItems: 'flex-start',
  },
  compactMetrics: {
    gap: 8,
  },
  compactMetricRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    gap: 6,
  },
  compactMetricTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  // Label keeps a readable width; a long value ("MD and PSD available in report") wraps under it.
  metricLabel: { flexGrow: 1, flexShrink: 1, flexBasis: 140, minWidth: 0 },
  metricValue: { flexShrink: 1, minWidth: 0 },
  noteCallout: {
    borderLeftWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  attachmentsSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 10,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  rxErrorBanner: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  rxTable: {
    minWidth: 740,
  },
  rxEyeCol: {
    width: 140,
  },
  rxFieldCol: {
    width: 118,
  },
  rxNotesCol: {
    width: 180,
  },
  rxCellInner: {
    gap: 4,
    minWidth: 0,
  },
  rxReadOnlyCell: {
    minHeight: 44,
    justifyContent: 'center',
  },
  rxMobileCard: {
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
    gap: 12,
  },
  rxMobileField: {
    gap: 5,
  },
  eyeSideBadge: {
    minWidth: 36,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mcEyeCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minWidth: 0,
  },
  mcEyeHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  mcDialCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mcDial: {
    width: MERIDIAN_DIAL_WIDTH,
    height: MERIDIAN_DIAL_HEIGHT,
    position: 'relative',
  },
  mcRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  mcLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },
  mcLabelBox: {
    position: 'absolute',
    width: 92,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mcMissingState: {
    minHeight: 180,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  mcCaptions: {
    gap: 2,
  },
  mtEyePanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    minWidth: 0,
  },
  mtEyeCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mtGrid: {
    gap: 6,
  },
  mtRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mtCell: {
    position: 'relative',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
  },
  mtCheck: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  octEyeCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 12,
    minWidth: 0,
  },
  octEyeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  octEmptyEyeState: {
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  octSection: {
    gap: 6,
    minWidth: 0,
  },
  octSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  octMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  octMetaItem: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 120,
    gap: 2,
  },
  octFramesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  octFrameBtn: {
    flexGrow: 1,
    flexBasis: 110,
    minWidth: 100,
    maxWidth: 180,
    borderRadius: 8,
    padding: 6,
    gap: 4,
  },
  octThumbBox: {
    width: '100%',
    height: 76,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  octThumbImg: {
    width: '100%',
    height: '100%',
  },
  octFrameKindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  octFindingsList: {
    gap: 6,
  },
  octFindingCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  octFindingMain: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  octFindingTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  octFindingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  octFindingActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    padding: 4,
  },
  octErrorBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  octMessages: {
    gap: 6,
  },
  octMsgItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});
