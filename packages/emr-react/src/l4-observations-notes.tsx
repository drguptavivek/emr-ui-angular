'use client';

import { useId, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  ClinicalAssessmentStatus,
  EmrValidationMessage,
  FieldSuggestion,
  FlowsheetCell,
  FlowsheetCellMap,
  FlowsheetRow,
  ObservationTrendIntent,
  ObservationTrendViewModel,
  TranscriptSegment,
  TrendBand,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrStateMessage } from './l1-display';
import { pressedProps, useContainerWidth } from './l4-lists-shared';
import {
  SUGGESTION_STATUS_META,
  buildFlowsheetItems,
  buildSuggestionListView,
  buildTranscriptSegmentViews,
  flowsheetCellName,
  flowsheetCellOf,
  flowsheetStatusWord,
  groupFlowsheetColumns,
  hasFlowsheetReferenceRange,
  initialSuggestionDraft,
  isFlowsheetCellSelected,
  isSuggestionDraftValid,
  layoutTrendChart,
  nextTrendMarker,
  parseSuggestionDraft,
  resolveTrendAxis,
  suggestionEditKind,
  trendShapeGlyph,
  type ClinicalTranscriptIntent,
  type ClinicalTranscriptViewModel,
  type EvidenceSuggestionListIntent,
  type EvidenceSuggestionListViewModel,
  type ObservationFlowsheetIntent,
  type ObservationFlowsheetViewModel,
  type TrendMarkerGeometry,
} from './l4-observations-notes.logic';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

export type {
  ClinicalTranscriptIntent,
  ClinicalTranscriptViewModel,
  EvidenceSuggestionListIntent,
  EvidenceSuggestionListViewModel,
  ObservationFlowsheetIntent,
  ObservationFlowsheetViewModel,
} from './l4-observations-notes.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrObservationFlowsheet
// ===========================================================================

export const FLOWSHEET_DEFAULTS = {
  addColumn: 'Add column',
  loadingTitle: 'Loading',
  loadingMessage: 'Loading observations.',
  errorTitle: 'Could not load observations',
  retry: 'Try again',
  observationHeader: 'Observation',
  referenceRangeHeader: 'Reference range',
  noReferenceRange: 'No reference range supplied',
  noReferenceSymbol: '—',
  currentBadge: 'Current',
  notSupplied: 'Not supplied',
  statusRecorded: 'Not supplied',
  statusNotAssessed: 'Not assessed',
  statusUnableToAssess: 'Unable to assess',
  statusNotApplicable: 'Not applicable',
  statusDeclined: 'Declined',
  statusUnknown: 'Unknown',
};

export type EmrObservationFlowsheetLabels = typeof FLOWSHEET_DEFAULTS;

export interface EmrObservationFlowsheetProps {
  model: ObservationFlowsheetViewModel;
  headingId?: string;
  labels?: Partial<typeof FLOWSHEET_DEFAULTS>;
  onIntent: (intent: ObservationFlowsheetIntent) => void;
}

const FLOWSHEET_ROW_WIDTH = 148;
const FLOWSHEET_REF_WIDTH = 104;
const FLOWSHEET_COL_WIDTH = 108;
const FLOWSHEET_CG_HEIGHT = 32;
const FLOWSHEET_HEAD_HEIGHT = 56;
const FLOWSHEET_GROUP_HEIGHT = 32;
const FLOWSHEET_BODY_ROW_HEIGHT = 68;

/**
 * L4 time-series observation flowsheet: vitals, cumulative labs with a reference-range column,
 * intake/output with controller-supplied summary totals, and medication administration records.
 */
export function EmrObservationFlowsheet({
  model,
  headingId,
  labels,
  onIntent,
}: EmrObservationFlowsheetProps) {
  const t = useEmrTheme();
  const l: EmrObservationFlowsheetLabels = { ...FLOWSHEET_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-flowsheet-${uid}-heading`;
  const font = fontFamily(t);
  const mono = Platform.OS === 'web' ? t.fontMono : font;

  const statusWords: Record<ClinicalAssessmentStatus, string> = {
    recorded: l.statusRecorded,
    'not-assessed': l.statusNotAssessed,
    'unable-to-assess': l.statusUnableToAssess,
    'not-applicable': l.statusNotApplicable,
    declined: l.statusDeclined,
    unknown: l.statusUnknown,
  };

  const items = buildFlowsheetItems(model.rows, model.groups);
  const showRef = hasFlowsheetReferenceRange(model.rows, model.footerRows);
  const headGroups = groupFlowsheetColumns(model.columns, model.columnGroups);
  const hasColGroups = headGroups.length > 0;
  const totalHeaderHeight = (hasColGroups ? FLOWSHEET_CG_HEIGHT : 0) + FLOWSHEET_HEAD_HEIGHT;

  const renderRowHeaderCell = (row: FlowsheetRow, isFooter: boolean) => {
    const content = (
      <>
        <Text
          numberOfLines={2}
          style={{
            color: t.text,
            fontSize: t.textSm,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: font,
          }}
        >
          {row.label}
        </Text>
        {row.unitLabel ? (
          <Text
            numberOfLines={1}
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightRegular),
              fontFamily: font,
            }}
          >
            {row.unitLabel}
          </Text>
        ) : null}
      </>
    );

    return (
      <View
        key={`lh-${row.id}`}
        style={[
          styles.fsFixedRow,
          {
            height: FLOWSHEET_BODY_ROW_HEIGHT,
            borderBottomColor: t.border,
            backgroundColor: isFooter ? t.surfaceRaised : t.surface,
          },
        ]}
      >
        <View style={[styles.fsRowHeadCell, { width: FLOWSHEET_ROW_WIDTH, borderRightColor: t.border }]}>
          {!model.readOnly && !isFooter ? (
            <Pressable
              role="button"
              aria-label={row.unitLabel ? `${row.label} (${row.unitLabel})` : row.label}
              onPress={() => onIntent({ type: 'rowSelected', rowId: row.id })}
              style={({ pressed, focused }: PressState) => [
                styles.fsHeaderBtn,
                styles.fsHeaderBtnRow,
                focusRing(t, focused),
                { backgroundColor: pressed ? t.primarySoft : 'transparent' },
              ]}
            >
              {content}
            </Pressable>
          ) : (
            <View style={[styles.fsHeaderBtn, styles.fsHeaderBtnRow]}>{content}</View>
          )}
        </View>
        {showRef ? (
          <View
            style={[
              styles.fsRefCell,
              {
                width: FLOWSHEET_REF_WIDTH,
                borderRightColor: t.border,
                backgroundColor: isFooter ? t.surfaceRaised : t.surface,
              },
            ]}
          >
            <Text
              numberOfLines={2}
              aria-label={row.referenceLabel ? undefined : l.noReferenceRange}
              style={{
                color: t.textMuted,
                fontSize: t.textXs,
                fontFamily: mono,
              }}
            >
              {row.referenceLabel ?? l.noReferenceSymbol}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderDataRowCells = (row: FlowsheetRow, cells: FlowsheetCellMap | undefined, isFooter: boolean) => (
    <View
      key={`rc-${row.id}`}
      role="row"
      style={[
        styles.fsDataRow,
        {
          height: FLOWSHEET_BODY_ROW_HEIGHT,
          borderBottomColor: t.border,
          backgroundColor: isFooter ? t.surfaceRaised : t.surface,
        },
      ]}
    >
      {model.columns.map(col => {
        const cell: FlowsheetCell | undefined = flowsheetCellOf(cells, row.id, col.id);
        const selected = isFlowsheetCellSelected(model.selectedCell, row.id, col.id);
        const editable = !!cell?.editable && !model.readOnly && !isFooter;
        const body = cell ? (
          <>
            {cell.valueLabel !== null ? (
              <Text
                numberOfLines={1}
                style={{
                  color: t.text,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(isFooter ? t.weightBold : t.weightMedium),
                  fontFamily: mono,
                }}
              >
                {cell.valueLabel}
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                style={{
                  color: t.textMuted,
                  fontSize: t.textXs,
                  fontStyle: 'italic',
                  fontFamily: font,
                }}
              >
                {flowsheetStatusWord(cell.status, statusWords, l.notSupplied)}
              </Text>
            )}
            {cell.flag ? <EmrBadgeView badge={cell.flag} /> : null}
            {cell.note ? (
              <Text
                numberOfLines={1}
                style={{
                  color: t.textMuted,
                  fontSize: t.text2xs,
                  fontFamily: font,
                }}
              >
                {cell.note}
              </Text>
            ) : null}
          </>
        ) : (
          <Text
            numberOfLines={1}
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontStyle: 'italic',
              fontFamily: font,
            }}
          >
            {l.notSupplied}
          </Text>
        );

        return (
          <View
            key={col.id}
            role="cell"
            style={[
              styles.fsCellWrap,
              {
                width: FLOWSHEET_COL_WIDTH,
                borderRightColor: t.border,
                backgroundColor: col.current
                  ? t.surfaceSoft
                  : isFooter
                    ? t.surfaceRaised
                    : t.surface,
                borderLeftWidth: col.current ? 3 : 0,
                borderLeftColor: col.current ? t.primary : 'transparent',
              },
            ]}
          >
            {editable ? (
              <Pressable
                role="button"
                aria-label={flowsheetCellName(row, col.label, cell, statusWords, l.notSupplied)}
                {...pressedProps(selected)}
                onPress={() => onIntent({ type: 'cellSelected', rowId: row.id, columnId: col.id })}
                style={({ pressed, focused }: PressState) => [
                  styles.fsCellBtn,
                  focusRing(t, focused),
                  {
                    borderColor: selected ? t.primary : t.border,
                    borderWidth: selected ? 2 : 1,
                    backgroundColor: selected || pressed ? t.primarySoft : 'transparent',
                  },
                ]}
              >
                {body}
              </Pressable>
            ) : (
              <View
                style={[
                  styles.fsCellStatic,
                  selected
                    ? {
                        borderColor: t.primary,
                        borderWidth: 2,
                        backgroundColor: t.primarySoft,
                      }
                    : null,
                ]}
              >
                {body}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View role="region" aria-labelledby={titleId} aria-busy={model.loading} style={styles.fsRoot}>
      <View style={styles.fsHead}>
        <Text
          role="heading"
          aria-level={3}
          nativeID={titleId}
          style={[
            styles.flex,
            {
              color: t.text,
              fontSize: t.textLg,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            },
          ]}
        >
          {model.title}
        </Text>
        {!model.readOnly && !model.loading && !model.error ? (
          <EmrButton
            variant="outline"
            small
            label={l.addColumn}
            onPress={() => onIntent({ type: 'columnAddRequested' })}
          />
        ) : null}
      </View>

      {model.loading ? (
        <EmrStateMessage kind="loading" title={l.loadingTitle} message={l.loadingMessage} />
      ) : model.error ? (
        <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}>
          <EmrButton
            variant="outline"
            small
            label={l.retry}
            onPress={() => onIntent({ type: 'retryRequested' })}
          />
        </EmrStateMessage>
      ) : !model.rows.length || !model.columns.length ? (
        <EmrStateMessage kind="empty" title={model.emptyMessage} />
      ) : (
        <View style={[styles.fsTableFrame, { borderColor: t.border, backgroundColor: t.surface }]}>
          {/* Fixed Left Column (Observation + optional Reference Range) */}
          <View style={[styles.fsLeftPane, { borderRightColor: t.border }]}>
            <View
              style={[
                styles.fsFixedRow,
                {
                  height: totalHeaderHeight,
                  borderBottomColor: t.border,
                  backgroundColor: t.surfaceRaised,
                },
              ]}
            >
              <View
                style={[
                  styles.fsCornerCell,
                  { width: FLOWSHEET_ROW_WIDTH, borderRightColor: t.border },
                ]}
              >
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                  }}
                >
                  {l.observationHeader}
                </Text>
              </View>
              {showRef ? (
                <View style={[styles.fsCornerCell, { width: FLOWSHEET_REF_WIDTH }]}>
                  <Text
                    style={{
                      color: t.textMuted,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {l.referenceRangeHeader}
                  </Text>
                </View>
              ) : null}
            </View>

            {items.map(item =>
              item.kind === 'group' ? (
                <View
                  key={item.key}
                  style={[
                    styles.fsGroupCell,
                    {
                      height: FLOWSHEET_GROUP_HEIGHT,
                      backgroundColor: t.surfaceAccent,
                      borderBottomColor: t.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: t.text,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      fontFamily: font,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ) : (
                renderRowHeaderCell(item.row, false)
              ),
            )}

            {(model.footerRows ?? []).map(row => renderRowHeaderCell(row, true))}
          </View>

          {/* Horizontally Scrollable Time Columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator style={styles.flex}>
            <View>
              {hasColGroups ? (
                <View
                  role="row"
                  style={[
                    styles.fsDataRow,
                    {
                      height: FLOWSHEET_CG_HEIGHT,
                      borderBottomColor: t.border,
                      backgroundColor: t.surfaceRaised,
                    },
                  ]}
                >
                  {headGroups.map(g => (
                    <View
                      key={g.key}
                      style={[
                        styles.fsColGroupCell,
                        {
                          width: g.span * FLOWSHEET_COL_WIDTH,
                          borderRightColor: t.border,
                          borderBottomWidth: g.label !== null ? 2 : 0,
                          borderBottomColor: g.label !== null ? t.primary : 'transparent',
                        },
                      ]}
                    >
                      {g.label !== null ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: t.text,
                            fontSize: t.textXs,
                            fontWeight: fontWeight(t.weightBold),
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                            fontFamily: font,
                          }}
                        >
                          {g.label}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              <View
                role="row"
                style={[
                  styles.fsDataRow,
                  {
                    height: FLOWSHEET_HEAD_HEIGHT,
                    borderBottomColor: t.border,
                    backgroundColor: t.surfaceRaised,
                  },
                ]}
              >
                {model.columns.map(col => {
                  const colContent = (
                    <>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: t.text,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: font,
                        }}
                      >
                        {col.label}
                      </Text>
                      {col.sublabel ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: col.current ? t.text : t.textMuted,
                            fontSize: t.text2xs,
                            fontFamily: font,
                          }}
                        >
                          {col.sublabel}
                        </Text>
                      ) : null}
                      {col.current ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: t.primary,
                            fontSize: t.text2xs,
                            fontWeight: fontWeight(t.weightBold),
                            textTransform: 'uppercase',
                            fontFamily: font,
                          }}
                        >
                          {l.currentBadge}
                        </Text>
                      ) : null}
                    </>
                  );

                  return (
                    <View
                      key={col.id}
                      role="columnheader"
                      style={[
                        styles.fsColHeaderWrap,
                        {
                          width: FLOWSHEET_COL_WIDTH,
                          borderRightColor: t.border,
                          backgroundColor: col.current ? t.primarySoft : t.surfaceRaised,
                          borderLeftWidth: col.current ? 3 : 0,
                          borderLeftColor: col.current ? t.primary : 'transparent',
                        },
                      ]}
                    >
                      {!model.readOnly ? (
                        <Pressable
                          role="button"
                          aria-label={[col.label, col.sublabel, col.current ? l.currentBadge : '']
                            .filter(Boolean)
                            .join(', ')}
                          onPress={() => onIntent({ type: 'columnSelected', columnId: col.id })}
                          style={({ pressed, focused }: PressState) => [
                            styles.fsHeaderBtn,
                            focusRing(t, focused),
                            { backgroundColor: pressed ? t.primarySoft : 'transparent' },
                          ]}
                        >
                          {colContent}
                        </Pressable>
                      ) : (
                        <View style={styles.fsHeaderBtn}>{colContent}</View>
                      )}
                    </View>
                  );
                })}
              </View>

              {items.map(item =>
                item.kind === 'group' ? (
                  <View
                    key={item.key}
                    style={{
                      height: FLOWSHEET_GROUP_HEIGHT,
                      width: model.columns.length * FLOWSHEET_COL_WIDTH,
                      backgroundColor: t.surfaceAccent,
                      borderBottomWidth: 1,
                      borderBottomColor: t.border,
                    }}
                  />
                ) : (
                  renderDataRowCells(item.row, model.cells, false)
                ),
              )}

              {(model.footerRows ?? []).map(row =>
                renderDataRowCells(row, model.footerCells, true),
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ===========================================================================
// 2. EmrObservationTrend
// ===========================================================================

export const TREND_DEFAULTS = {
  timeScaleSuffix: 'time scale',
  leftAxisSuffix: ' (left axis)',
  rightAxisSuffix: ' (right axis)',
  leftAxis: 'left axis',
  rightAxis: 'right axis',
  dataPointsHelp:
    'data points. Left and right arrows move along a series, up and down switch series, Enter selects.',
  selectedPointLabel: 'Selected point',
  seriesHeader: 'Series',
  unitAxisHeader: 'Unit and axis',
  timeHeader: 'Time',
  valueHeader: 'Value',
  flagHeader: 'Flag',
  noneFlag: 'None',
};

export type EmrObservationTrendLabels = typeof TREND_DEFAULTS;

export interface EmrObservationTrendProps {
  model: ObservationTrendViewModel;
  headingId?: string;
  labels?: Partial<typeof TREND_DEFAULTS>;
  onIntent?: (intent: ObservationTrendIntent) => void;
}

/**
 * L4 time-series line and point chart for one or two series over time (blood pressure, IOP OD/OS,
 * HbA1c, weight-for-age, dual-axis vitals/infusions). Pure React Native Views, Text, and Pressable
 * markers with no external chart library.
 */
export function EmrObservationTrend({
  model,
  headingId,
  labels,
  onIntent,
}: EmrObservationTrendProps) {
  const t = useEmrTheme();
  const l: EmrObservationTrendLabels = { ...TREND_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-trend-${uid}-heading`;
  const { width, onLayout } = useContainerWidth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [plotFocused, setPlotFocused] = useState(false);

  const font = fontFamily(t);
  const mono = Platform.OS === 'web' ? t.fontMono : font;
  const hasData = model.series.some(s => s.points.length > 0);
  const view = layoutTrendChart(model, width ?? 640, `emr-trend-${uid}`, {
    leftAxis: l.leftAxis,
    rightAxis: l.rightAxis,
  });

  const axisNote = (item: { readonly axis?: TrendBand['axis'] }): string => {
    if (!model.secondaryAxis) return '';
    return resolveTrendAxis(item, model).axis === 'secondary' ? l.rightAxisSuffix : l.leftAxisSuffix;
  };

  const activeDomId = (): string | null => {
    const ms = view.markers;
    if (!ms.length) return null;
    return (
      ms.find(m => m.domId === activeId) ??
      ms.find(m => m.point.id === model.selectedPointId) ??
      ms[0]!
    ).domId;
  };

  const activeMarker: TrendMarkerGeometry | undefined = (() => {
    const id =
      hoverId ??
      (plotFocused ? activeDomId() : null) ??
      view.markers.find(m => m.point.id === model.selectedPointId)?.domId ??
      activeId;
    return id ? view.markers.find(m => m.domId === id) : undefined;
  })();

  const pickMarker = (m: TrendMarkerGeometry) => {
    setActiveId(m.domId);
    setHoverId(m.domId);
    if (!model.readOnly) {
      onIntent?.({ type: 'pointSelected', seriesId: m.seriesId, pointId: m.point.id });
    }
  };

  const handleKeyDown = (e: { key?: string; preventDefault?: () => void }) => {
    if (!e.key) return;
    const curId = activeDomId();
    const cur = view.markers.find(m => m.domId === curId);
    if (!cur) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault?.();
      pickMarker(cur);
      return;
    }
    const next = nextTrendMarker(view.markers, curId, e.key);
    if (next) {
      e.preventDefault?.();
      setHoverId(null);
      setActiveId(next.domId);
    }
  };

  // Interactive markers: when series is very dense (> 60 points), render interactive hit boxes for
  // selected/flagged/sampled points and lightweight dots for intermediate points so RN stays fast.
  const dense = model.series.some(s => s.points.length > 60);

  return (
    <View role="region" aria-labelledby={titleId} onLayout={onLayout} style={styles.trRoot}>
      <Text
        role="heading"
        aria-level={3}
        nativeID={titleId}
        style={{
          color: t.text,
          fontSize: t.textLg,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: font,
        }}
      >
        {model.title}
      </Text>

      {model.xGranularityLabel || model.granularityOptions?.length ? (
        <View style={styles.trBar}>
          {model.xGranularityLabel ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: font,
              }}
            >
              {model.xGranularityLabel}
            </Text>
          ) : null}
          {model.granularityOptions?.length ? (
            <View
              role="group"
              aria-label={`${model.title}, ${l.timeScaleSuffix}`}
              style={[styles.trSegGroup, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              {model.granularityOptions.map((g, idx) => (
                <Pressable
                  key={g.id}
                  role="button"
                  {...pressedProps(!!g.selected)}
                  onPress={() =>
                    onIntent?.({ type: 'granularityChangeRequested', granularityId: g.id })
                  }
                  style={({ pressed, focused }: PressState) => [
                    styles.trSegBtn,
                    focusRing(t, focused),
                    {
                      minHeight: t.compactHeight,
                      borderLeftWidth: idx > 0 ? 1 : 0,
                      borderLeftColor: t.border,
                      backgroundColor:
                        g.selected || pressed ? t.primarySoft : t.surface,
                      borderBottomWidth: g.selected ? 3 : 0,
                      borderBottomColor: g.selected ? t.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(g.selected ? t.weightBold : t.weightRegular),
                      fontFamily: font,
                    }}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {!hasData ? (
        <EmrStateMessage kind="empty" title={model.emptyMessage} />
      ) : (
        <>
          {/* Legend */}
          <View role="list" style={styles.trLegend}>
            {model.series.map((s, i) => {
              const tc = toneColors(t, s.tone);
              return (
                <View key={s.id} role="listitem" style={styles.trLegendItem}>
                  <View style={styles.trSwatchRow}>
                    <View
                      style={{
                        width: 24,
                        height: 0,
                        borderTopWidth: 2,
                        borderStyle: s.dashed ? 'dashed' : 'solid',
                        borderColor: tc.color,
                      }}
                    />
                    <Text
                      aria-hidden
                      style={{
                        color: tc.color,
                        fontSize: t.textXs,
                        marginLeft: -16,
                        marginRight: 4,
                        backgroundColor: t.surface,
                      }}
                    >
                      {trendShapeGlyph(i, false)}
                    </Text>
                  </View>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
                    {s.label}
                    {axisNote(s)}
                  </Text>
                </View>
              );
            })}
            {(model.bands ?? []).map(b => {
              const tc = toneColors(t, b.tone);
              return (
                <View key={b.id} role="listitem" style={styles.trLegendItem}>
                  <View
                    style={{
                      width: 24,
                      height: 12,
                      backgroundColor: tc.backgroundColor,
                      borderTopWidth: b.yTo !== undefined ? 2 : 0,
                      borderBottomWidth: b.yFrom !== undefined ? 2 : 0,
                      borderLeftWidth: b.pattern === 'hatched' ? 2 : 0,
                      borderRightWidth: b.pattern === 'hatched' ? 2 : 0,
                      borderStyle: b.pattern === 'hatched' ? 'dashed' : 'solid',
                      borderColor: tc.color,
                    }}
                  />
                  <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
                    {b.label}
                    {axisNote(b)}
                  </Text>
                </View>
              );
            })}
            {(model.referenceCurves ?? []).map(c => (
              <View key={c.id} role="listitem" style={styles.trLegendItem}>
                <View
                  style={{
                    width: 24,
                    height: 0,
                    borderTopWidth: 2,
                    borderStyle: 'dotted',
                    borderColor: t.textMuted,
                  }}
                />
                <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
                  {c.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Axis labels header row */}
          <View style={styles.trAxisCaptionRow}>
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textXs,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: font,
              }}
            >
              {model.yLabel}
            </Text>
            {model.secondaryAxis ? (
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: font,
                }}
              >
                {model.secondaryAxis.yLabel}
              </Text>
            ) : null}
          </View>

          {/* Plot Canvas */}
          <View
            accessible
            role="img"
            aria-label={`${model.title}. ${model.summaryText}`}
            {...(Platform.OS === 'web'
              ? ({
                  tabIndex: 0,
                  onFocus: () => {
                    setPlotFocused(true);
                    setActiveId(activeDomId());
                  },
                  onBlur: () => setPlotFocused(false),
                  onKeyDown: handleKeyDown,
                } as object)
              : null)}
            style={[
              styles.trPlot,
              {
                width: view.w,
                maxWidth: '100%',
                height: view.h,
                borderColor: plotFocused ? t.focus : t.border,
                backgroundColor: t.surface,
              },
            ]}
          >
            {/* Reference Bands */}
            {view.bands.map(b => {
              const tc = toneColors(t, b.tone);
              return (
                <View key={b.id} pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <View
                    style={{
                      position: 'absolute',
                      left: view.ml,
                      top: b.y,
                      width: view.plotW,
                      height: b.height,
                      backgroundColor: tc.backgroundColor,
                      opacity: b.pattern === 'hatched' ? 0.75 : 0.5,
                      borderStyle: b.pattern === 'hatched' ? 'dashed' : 'solid',
                      borderWidth: b.pattern === 'hatched' ? 1 : 0,
                      borderColor: tc.color,
                    }}
                  />
                  {b.edges.map((edgeY, idx) => (
                    <View
                      key={`${b.id}-edge-${idx}`}
                      style={{
                        position: 'absolute',
                        left: view.ml,
                        top: edgeY,
                        width: view.plotW,
                        height: 0,
                        borderTopWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: tc.color,
                      }}
                    />
                  ))}
                  {b.edgeLabel && b.labelY !== undefined ? (
                    <Text
                      style={{
                        position: 'absolute',
                        right: view.mr + 4,
                        top: b.labelY < view.mt + 14 ? b.labelY + 2 : b.labelY - 16,
                        color: tc.color,
                        fontSize: t.text2xs,
                        fontWeight: fontWeight(t.weightBold),
                        backgroundColor: t.surface,
                        paddingHorizontal: 2,
                        fontFamily: font,
                      }}
                    >
                      {b.edgeLabel}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {/* Minor X Gridlines */}
            {view.minor.map((x, idx) => (
              <View
                key={`minor-${idx}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: x,
                  top: view.mt,
                  width: 0,
                  height: view.plotH,
                  borderLeftWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: t.border,
                  opacity: 0.6,
                }}
              />
            ))}

            {/* Primary Y Gridlines and Labels */}
            {view.yt.map((tick, idx) => (
              <View key={`yt-${idx}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
                <View
                  style={{
                    position: 'absolute',
                    left: view.ml,
                    top: tick.y,
                    width: view.plotW,
                    height: 1,
                    backgroundColor: t.border,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    left: 2,
                    width: view.ml - 8,
                    top: tick.y - 8,
                    textAlign: 'right',
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontFamily: font,
                  }}
                >
                  {tick.label}
                </Text>
              </View>
            ))}

            {/* Secondary Y Labels */}
            {view.yt2.map((tick, idx) => (
              <Text
                key={`yt2-${idx}`}
                pointerEvents="none"
                numberOfLines={1}
                style={{
                  position: 'absolute',
                  left: view.ml + view.plotW + 6,
                  top: tick.y - 8,
                  color: t.textMuted,
                  fontSize: t.textXs,
                  fontFamily: font,
                }}
              >
                {tick.label}
              </Text>
            ))}

            {/* X Ticks and Labels */}
            {view.xt.map((tick, idx) => (
              <View key={`xt-${idx}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
                <View
                  style={{
                    position: 'absolute',
                    left: tick.x,
                    top: view.mt + view.plotH,
                    width: 1,
                    height: 5,
                    backgroundColor: t.textMuted,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    left:
                      tick.align === 'left'
                        ? tick.x
                        : tick.align === 'right'
                          ? tick.x - 64
                          : tick.x - 32,
                    width: 64,
                    top: view.mt + view.plotH + 6,
                    textAlign: tick.align,
                    color: t.textMuted,
                    fontSize: t.textXs,
                    fontFamily: font,
                  }}
                >
                  {tick.label}
                </Text>
              </View>
            ))}

            {/* Primary & Secondary Axis Lines */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: view.ml,
                top: view.mt,
                width: 1,
                height: view.plotH,
                backgroundColor: t.textMuted,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: view.ml,
                top: view.mt + view.plotH,
                width: view.plotW,
                height: 1,
                backgroundColor: t.textMuted,
              }}
            />
            {model.secondaryAxis ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: view.ml + view.plotW,
                  top: view.mt,
                  width: 1,
                  height: view.plotH,
                  backgroundColor: t.textMuted,
                }}
              />
            ) : null}

            {/* Reference Curves */}
            {view.curves.map(c => (
              <View key={c.id} pointerEvents="none" style={StyleSheet.absoluteFill}>
                {c.segments.map(seg => (
                  <View
                    key={seg.key}
                    style={{
                      position: 'absolute',
                      left: seg.left,
                      top: seg.top,
                      width: seg.length,
                      height: seg.thickness,
                      backgroundColor: t.textMuted,
                      opacity: 0.45,
                      transform: [{ rotate: `${seg.angleDeg}deg` }],
                    }}
                  />
                ))}
                <Text
                  style={{
                    position: 'absolute',
                    left: Math.max(view.ml, c.lx - 28),
                    top: Math.max(view.mt, c.ly),
                    color: t.textMuted,
                    fontSize: t.text2xs,
                    fontFamily: font,
                  }}
                >
                  {c.label}
                </Text>
              </View>
            ))}

            {/* Connecting Series Line Segments */}
            {view.lines.map(line => {
              const tc = toneColors(t, line.tone);
              return (
                <View key={line.id} pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {line.segments.map(seg => (
                    <View
                      key={seg.key}
                      style={{
                        position: 'absolute',
                        left: seg.left,
                        top: seg.top,
                        width: seg.length,
                        height: seg.thickness,
                        backgroundColor: line.dashed ? 'transparent' : tc.color,
                        borderTopWidth: line.dashed ? seg.thickness : 0,
                        borderStyle: line.dashed ? 'dashed' : 'solid',
                        borderColor: tc.color,
                        transform: [{ rotate: `${seg.angleDeg}deg` }],
                      }}
                    />
                  ))}
                </View>
              );
            })}

            {/* Point Markers */}
            {view.markers.map(m => {
              const tc = toneColors(t, m.tone);
              const isSelected = m.point.id === model.selectedPointId;
              const isFlagged = !!m.point.flag;
              const isActive = m.domId === activeMarker?.domId;
              if (dense && !isSelected && !isFlagged && m.idx % 10 !== 0) {
                return (
                  <View
                    key={m.domId}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: m.px - 2,
                      top: m.py - 2,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: tc.color,
                    }}
                  />
                );
              }
              return (
                <Pressable
                  key={m.domId}
                  role="button"
                  aria-label={m.name}
                  {...pressedProps(isSelected)}
                  onPress={() => pickMarker(m)}
                  onHoverIn={() => setHoverId(m.domId)}
                  onHoverOut={() => setHoverId(cur => (cur === m.domId ? null : cur))}
                  style={({ focused }: PressState) => [
                    styles.trMarkerHit,
                    {
                      left: m.px - 22,
                      top: m.py - 22,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <View
                    style={[
                      styles.trMarkerDot,
                      {
                        borderColor: isActive && plotFocused ? t.focus : tc.color,
                        borderWidth: isSelected ? 3 : isFlagged ? 2 : 1.5,
                        backgroundColor: isSelected || isFlagged ? tc.backgroundColor : t.surface,
                      },
                    ]}
                  >
                    <Text
                      aria-hidden
                      style={{
                        color: tc.color,
                        fontSize: t.text2xs,
                        lineHeight: t.text2xs + 2,
                        fontWeight: fontWeight(t.weightBold),
                      }}
                    >
                      {trendShapeGlyph(m.seriesIdx, isSelected || isFlagged)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Selected / Active Point Readout & Summary */}
          {activeMarker ? (
            <View
              role="status"
              style={[
                styles.trReadout,
                {
                  borderColor: t.border,
                  backgroundColor: t.surfaceRaised,
                },
              ]}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: font,
                }}
              >
                {activeMarker.seriesLabel}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                {activeMarker.point.xLabel}
              </Text>
              <Text
                style={{
                  color: t.text,
                  fontSize: t.textMd,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: mono,
                }}
              >
                {activeMarker.point.valueLabel}
              </Text>
              {activeMarker.point.flag ? <EmrBadgeView badge={activeMarker.point.flag} /> : null}
            </View>
          ) : null}

          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
            {model.summaryText}
          </Text>
        </>
      )}
    </View>
  );
}

// ===========================================================================
// 3. EmrClinicalTranscript
// ===========================================================================

export const TRANSCRIPT_DEFAULTS = {
  heading: 'Transcript',
  summarise: 'Summarise into fields',
  summarising: 'Summarising…',
  startDictation: 'Start dictation',
  stopDictation: 'Stop',
  spokenBadge: 'Spoken',
  typedBadge: 'Typed',
  editEntry: 'Edit',
  editEntryLabel: (entryName: string) => `Edit text of ${entryName}`,
  entryAt: (index: number, timeLabel: string) =>
    `entry ${index + 1}${timeLabel ? ` at ${timeLabel}` : ''}`,
  editWarning: 'Saving removes the evidence links from this entry, because the wording changes.',
  saveText: 'Save text',
  cancel: 'Cancel',
  feedsHeader: (count: number) => `Feeds ${count} ${count === 1 ? 'field' : 'fields'}`,
  describeFeeds: (labels: readonly string[]) =>
    labels.length
      ? `Feeds ${labels.length} ${labels.length === 1 ? 'field' : 'fields'}: ${labels.join(', ')}.`
      : 'Feeds no fields.',
  emptyMessage: 'Nothing captured yet. Start dictation or type a note below.',
  typeNoteLabel: 'Type a note',
  typeNotePlaceholder: 'Type a finding to add to the transcript',
  addToTranscript: 'Add to transcript',
  transcriptRegionLabel: 'Transcript entries',
};

export type EmrClinicalTranscriptLabels = typeof TRANSCRIPT_DEFAULTS;

export interface EmrClinicalTranscriptProps {
  model: ClinicalTranscriptViewModel;
  headingId?: string;
  labels?: Partial<typeof TRANSCRIPT_DEFAULTS>;
  onIntent: (intent: ClinicalTranscriptIntent) => void;
}

/**
 * L4 clinical transcript: left half of evidence-linked note capture.
 * Renders dictation status and controls, spoken/typed turns with inline numbered evidence spans,
 * inline segment editing, and typed-note entry.
 */
export function EmrClinicalTranscript({
  model,
  headingId,
  labels,
  onIntent,
}: EmrClinicalTranscriptProps) {
  const t = useEmrTheme();
  const l: EmrClinicalTranscriptLabels = { ...TRANSCRIPT_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-transcript-${uid}-heading`;
  const font = fontFamily(t);
  const mono = Platform.OS === 'web' ? t.fontMono : font;

  const [draft, setDraft] = useState('');
  const [editDraft, setEditDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { views } = buildTranscriptSegmentViews(model, `emr-transcript-${uid}`, l.describeFeeds);

  const startEdit = (segment: TranscriptSegment) => {
    setEditDraft(segment.text);
    setEditingId(segment.id);
  };

  const saveEdit = (segment: TranscriptSegment) => {
    const text = editDraft.trim();
    setEditingId(null);
    if (text && text !== segment.text) {
      onIntent({ type: 'segmentEditRequested', segmentId: segment.id, text });
    }
  };

  const appendNote = () => {
    const text = draft.trim();
    if (!text || model.readOnly) return;
    onIntent({ type: 'textAppendRequested', text });
    setDraft('');
  };

  const statusTone =
    model.dictation.status === 'listening'
      ? toneColors(t, 'info')
      : model.dictation.status === 'error'
        ? toneColors(t, 'danger')
        : { color: t.text, backgroundColor: t.neutralSoft };

  const statusGlyph =
    model.dictation.status === 'error'
      ? '⚠'
      : model.dictation.status === 'listening'
        ? '●'
        : model.dictation.status === 'processing'
          ? '◷'
          : '🎙';

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      style={[styles.ctRoot, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      {/* Header */}
      <View style={styles.ctHead}>
        <View style={styles.flex}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.text2xs,
              fontWeight: fontWeight(t.weightBold),
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              fontFamily: font,
            }}
          >
            {model.title}
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
            {l.heading}
          </Text>
        </View>
        {!model.readOnly ? (
          <EmrButton
            variant="outline"
            small
            disabled={!model.canSummarise || !!model.summarising}
            label={model.summarising ? l.summarising : `✦ ${l.summarise}`}
            onPress={() => onIntent({ type: 'summariseRequested' })}
          />
        ) : null}
      </View>

      {/* Dictation Status Bar */}
      <View style={styles.ctBar}>
        <View
          role="status"
          style={[
            styles.ctStatusPill,
            {
              minHeight: t.compactHeight,
              backgroundColor: statusTone.backgroundColor,
              borderColor: model.dictation.status === 'listening' ? t.info : 'transparent',
              borderWidth: model.dictation.status === 'listening' ? 2 : 0,
            },
          ]}
        >
          <Text
            aria-hidden
            style={{
              color: statusTone.color,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
            }}
          >
            {statusGlyph}
          </Text>
          <Text
            style={{
              color: statusTone.color,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {model.dictation.label}
          </Text>
        </View>
        {!model.readOnly ? (
          <View style={styles.ctDictateBtns}>
            <EmrButton
              variant="outline"
              small
              disabled={!model.dictation.canStart}
              label={`🎙 ${l.startDictation}`}
              onPress={() => onIntent({ type: 'dictationStartRequested' })}
            />
            <EmrButton
              variant="outline"
              small
              disabled={!model.dictation.canStop}
              label={`■ ${l.stopDictation}`}
              onPress={() => onIntent({ type: 'dictationStopRequested' })}
            />
          </View>
        ) : null}
      </View>

      {model.dictation.error ? (
        <View
          role="alert"
          style={[
            styles.ctErrorBanner,
            {
              borderLeftColor: t.danger,
              backgroundColor: t.dangerSoft,
            },
          ]}
        >
          <Text aria-hidden style={{ color: t.danger, fontSize: t.textMd }}>
            ⚠
          </Text>
          <Text
            style={[
              styles.flex,
              {
                color: t.danger,
                fontSize: t.textMd,
                fontWeight: fontWeight(t.weightMedium),
                fontFamily: font,
              },
            ]}
          >
            {model.dictation.error}
          </Text>
        </View>
      ) : null}

      {/* Transcript Entries Scroll Area */}
      <ScrollView
        role="region"
        aria-label={l.transcriptRegionLabel}
        style={[
          styles.ctScroll,
          {
            borderColor: t.border,
            backgroundColor: t.surfaceSoft,
          },
        ]}
      >
        {views.length === 0 ? (
          <View style={styles.ctEmpty}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
              {l.emptyMessage}
            </Text>
          </View>
        ) : (
          <View role="list">
            {views.map((v, i) => {
              const entryName = l.entryAt(i, v.segment.timeLabel);
              return (
                <View
                  key={v.segment.id}
                  role="listitem"
                  style={[
                    styles.ctSegment,
                    i < views.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: t.border }
                      : null,
                  ]}
                >
                  <View style={styles.ctMeta}>
                    {v.segment.timeLabel ? (
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: mono,
                        }}
                      >
                        {v.segment.timeLabel}
                      </Text>
                    ) : null}
                    {v.segment.speakerLabel ? (
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: font,
                        }}
                      >
                        {v.segment.speakerLabel}
                      </Text>
                    ) : null}
                    <View style={[styles.ctSrcPill, { borderColor: t.border }]}>
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                        {v.segment.source === 'typed' ? l.typedBadge : l.spokenBadge}
                      </Text>
                    </View>
                    {v.segment.editable && !model.readOnly && editingId !== v.segment.id ? (
                      <View style={styles.ctEditBtnWrap}>
                        <EmrButton
                          variant="ghost"
                          small
                          label={l.editEntry}
                          accessibilityLabel={l.editEntryLabel(entryName)}
                          onPress={() => startEdit(v.segment)}
                        />
                      </View>
                    ) : null}
                  </View>

                  {editingId === v.segment.id ? (
                    <View style={styles.ctEditor}>
                      <ThemedInput
                        multiline
                        numberOfLines={3}
                        aria-label={l.editEntryLabel(entryName)}
                        value={editDraft}
                        onChangeText={setEditDraft}
                      />
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                        {l.editWarning}
                      </Text>
                      <View style={styles.ctRowBtns}>
                        <EmrButton
                          small
                          disabled={!editDraft.trim()}
                          label={l.saveText}
                          onPress={() => saveEdit(v.segment)}
                        />
                        <EmrButton
                          variant="ghost"
                          small
                          label={l.cancel}
                          onPress={() => setEditingId(null)}
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.ctPiecesWrap}>
                        {v.pieces.map((p, pIdx) => {
                          if (!p.span) {
                            return (
                              <Text
                                key={pIdx}
                                style={{
                                  color: t.text,
                                  fontSize: t.textMd,
                                  lineHeight: t.textMd * 1.6,
                                  fontFamily: font,
                                }}
                              >
                                {p.text}
                              </Text>
                            );
                          }
                          const sp = p.span;
                          return (
                            <Pressable
                              key={sp.id}
                              role="button"
                              {...pressedProps(sp.on)}
                              aria-label={`${p.text} (${sp.descriptionText})`}
                              onPress={() => onIntent({ type: 'spanSelected', spanId: sp.id })}
                              style={({ focused }: PressState) => [
                                styles.ctSpanBtn,
                                focusRing(t, focused),
                                {
                                  backgroundColor: sp.on ? t.warningSoft : t.infoSoft,
                                  borderBottomColor: sp.on ? t.warning : t.info,
                                  borderBottomWidth: sp.on ? 3 : 2,
                                  borderColor: sp.on ? t.text : t.info,
                                  borderWidth: sp.on ? 1 : 0,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  flexShrink: 1,
                                  color: t.text,
                                  fontSize: t.textMd,
                                  fontWeight: fontWeight(sp.on ? t.weightBold : t.weightMedium),
                                  fontFamily: font,
                                }}
                              >
                                {p.text}
                              </Text>
                              {sp.marks.map(m => (
                                <View
                                  key={m}
                                  style={[
                                    styles.ctMarkBadge,
                                    {
                                      backgroundColor: sp.on ? t.text : t.surface,
                                      borderColor: sp.on ? t.text : t.info,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={{
                                      color: sp.on ? t.surface : t.info,
                                      fontSize: t.text2xs,
                                      fontWeight: fontWeight(t.weightBold),
                                      fontFamily: font,
                                    }}
                                  >
                                    {m}
                                  </Text>
                                </View>
                              ))}
                            </Pressable>
                          );
                        })}
                      </View>
                      {v.feeds.length > 0 ? (
                        <View
                          style={[
                            styles.ctFeedsStrip,
                            {
                              borderLeftColor: t.warning,
                              backgroundColor: t.warningSoft,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: t.text,
                              fontSize: t.textSm,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: font,
                            }}
                          >
                            {l.feedsHeader(v.feeds.length)}
                          </Text>
                          {v.feeds.map(f => (
                            <View key={f.n} style={styles.ctFeedItem}>
                              <View
                                style={[
                                  styles.ctMarkBadge,
                                  {
                                    backgroundColor: t.text,
                                    borderColor: t.text,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: t.surface,
                                    fontSize: t.text2xs,
                                    fontWeight: fontWeight(t.weightBold),
                                    fontFamily: font,
                                  }}
                                >
                                  {f.n}
                                </Text>
                              </View>
                              <Text
                                style={{
                                  color: t.text,
                                  fontSize: t.textSm,
                                  fontFamily: font,
                                }}
                              >
                                {f.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Typed Note Entry */}
      {!model.readOnly ? (
        <View style={styles.ctTypeForm}>
          <Text
            style={{
              color: t.text,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {l.typeNoteLabel}
          </Text>
          <View style={styles.ctTypeRow}>
            <View style={styles.ctTypeInput}>
              <ThemedInput
                multiline
                numberOfLines={2}
                aria-label={l.typeNoteLabel}
                placeholder={l.typeNotePlaceholder}
                value={draft}
                onChangeText={setDraft}
              />
            </View>
            <EmrButton
              small
              disabled={!draft.trim()}
              label={l.addToTranscript}
              onPress={appendNote}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ===========================================================================
// 4. EmrEvidenceSuggestionList
// ===========================================================================

export const SUGGESTIONS_DEFAULTS = {
  heading: 'Suggested fields',
  countSummary: (total: number, pending: number) =>
    `${total} ${total === 1 ? 'suggestion' : 'suggestions'} · ${pending} to review`,
  acceptAllPending: (pending: number) => `Accept all pending (${pending})`,
  clearHighlight: 'Clear highlight',
  highlightedBanner: (linkedText: string) =>
    `Highlighted: ${linkedText}. The matching passage is marked in the transcript.`,
  noLinkedFields: 'no fields link to this passage',
  summarisingMessage: 'Summarising the transcript…',
  statusPending: 'Needs review',
  statusAccepted: 'Accepted',
  statusEdited: 'Edited',
  statusRejected: 'Rejected',
  suggestedPrefix: 'Suggested',
  editedPrefix: 'Edited',
  evidenceCount: (count: number) =>
    count
      ? `Evidence: ${count} ${count === 1 ? 'passage' : 'passages'} in the transcript`
      : 'No transcript evidence',
  newValueLabel: (fieldLabel: string) => `New value for ${fieldLabel}`,
  save: 'Save',
  cancel: 'Cancel',
  accept: 'Accept',
  edit: 'Edit',
  reject: 'Reject',
  reopen: 'Reopen',
  emptyMessage: 'No suggestions yet. Add to the transcript, then choose Summarise into fields.',
  listRegionLabel: 'Suggested field list',
  showEvidenceSuffix: ', show evidence in transcript',
};

export type EmrEvidenceSuggestionListLabels = typeof SUGGESTIONS_DEFAULTS;

export interface EmrEvidenceSuggestionListProps {
  model: EvidenceSuggestionListViewModel;
  headingId?: string;
  labels?: Partial<typeof SUGGESTIONS_DEFAULTS>;
  onIntent: (intent: EvidenceSuggestionListIntent) => void;
}

/**
 * L4 evidence-linked field suggestion list: right half of note capture.
 * Groups suggestions by section, shows 1-based transcript span numbers and quoted source passages,
 * renders validation messages, and emits Accept, Edit inline, Reject, Reopen, and Accept-all intents.
 */
export function EmrEvidenceSuggestionList({
  model,
  headingId,
  labels,
  onIntent,
}: EmrEvidenceSuggestionListProps) {
  const t = useEmrTheme();
  const l: EmrEvidenceSuggestionListLabels = { ...SUGGESTIONS_DEFAULTS, ...labels };
  const uid = useId();
  const titleId = headingId ?? `emr-suggestions-${uid}-heading`;
  const font = fontFamily(t);
  const mono = Platform.OS === 'web' ? t.fontMono : font;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const { groups, pending, highlighted, linkedText } = buildSuggestionListView(
    model,
    `emr-suggestions-${uid}`,
    l.noLinkedFields,
  );

  const statusLabelOf = (status: FieldSuggestion['status']): string => {
    switch (status) {
      case 'pending':
        return l.statusPending;
      case 'accepted':
        return l.statusAccepted;
      case 'edited':
        return l.statusEdited;
      case 'rejected':
        return l.statusRejected;
    }
  };

  const startEdit = (s: FieldSuggestion) => {
    setDraft(initialSuggestionDraft(s));
    setEditingId(s.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (s: FieldSuggestion) => {
    if (!isSuggestionDraftValid(s, draft)) return;
    const value = parseSuggestionDraft(s, draft);
    setEditingId(null);
    onIntent({ type: 'suggestionEdited', suggestionId: s.id, value });
  };

  const messageGlyph = (m: EmrValidationMessage): string =>
    m.severity === 'info' ? 'ℹ' : '⚠';

  return (
    <View
      role="region"
      aria-labelledby={titleId}
      style={[styles.slRoot, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      {/* Header */}
      <View style={styles.slHead}>
        <View style={styles.flex}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.text2xs,
              fontWeight: fontWeight(t.weightBold),
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              fontFamily: font,
            }}
          >
            {model.title}
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
            {l.heading}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
            {l.countSummary(model.suggestions.length, pending)}
          </Text>
        </View>
        <View style={styles.slTools}>
          {!model.readOnly ? (
            <EmrButton
              small
              disabled={!pending}
              label={`✓ ${l.acceptAllPending(pending)}`}
              onPress={() => onIntent({ type: 'acceptAllPendingRequested' })}
            />
          ) : null}
          <EmrButton
            variant="outline"
            small
            disabled={!highlighted}
            label={`✕ ${l.clearHighlight}`}
            onPress={() => onIntent({ type: 'highlightClearRequested' })}
          />
        </View>
      </View>

      {/* Banners */}
      {highlighted ? (
        <View
          role="status"
          style={[
            styles.slLinkedBanner,
            {
              borderLeftColor: t.warning,
              backgroundColor: t.warningSoft,
            },
          ]}
        >
          <Text
            style={{
              color: t.text,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightMedium),
              fontFamily: font,
            }}
          >
            {l.highlightedBanner(linkedText)}
          </Text>
        </View>
      ) : null}

      {model.summarising ? (
        <View
          role="status"
          style={[
            styles.slBusyBanner,
            {
              backgroundColor: t.infoSoft,
            },
          ]}
        >
          <Text
            style={{
              color: t.info,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            ◷ {l.summarisingMessage}
          </Text>
        </View>
      ) : null}

      {model.summariseError ? (
        <View
          role="alert"
          style={[
            styles.slErrorBanner,
            {
              borderLeftColor: t.danger,
              backgroundColor: t.dangerSoft,
            },
          ]}
        >
          <Text
            style={{
              color: t.danger,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightMedium),
              fontFamily: font,
            }}
          >
            ⚠ {model.summariseError}
          </Text>
        </View>
      ) : null}

      {/* Suggestion Groups */}
      <ScrollView
        role="region"
        aria-label={l.listRegionLabel}
        style={styles.slScroll}
      >
        {groups.length === 0 ? (
          <View style={styles.slEmpty}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
              {l.emptyMessage}
            </Text>
          </View>
        ) : (
          <View style={styles.slGroupList}>
            {groups.map(g => (
              <View key={g.id} style={styles.slGroup}>
                {g.label ? (
                  <Text
                    role="heading"
                    aria-level={4}
                    style={{
                      color: t.textMuted,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      fontFamily: font,
                    }}
                  >
                    {g.label}
                  </Text>
                ) : null}
                <View role="list" style={styles.slRows}>
                  {g.rows.map(r => {
                    const s = r.s;
                    const meta = SUGGESTION_STATUS_META[s.status];
                    const editKind = suggestionEditKind(s);

                    return (
                      <View
                        key={s.id}
                        role="listitem"
                        style={[
                          styles.slRow,
                          {
                            borderColor: r.on ? t.text : t.border,
                            borderLeftColor: r.on ? t.warning : t.border,
                            borderLeftWidth: r.on ? 8 : 4,
                            backgroundColor: r.on ? t.warningSoft : t.surface,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.slNumBadge,
                            {
                              backgroundColor: r.on ? t.text : t.surface,
                              borderColor: r.on ? t.text : t.info,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: r.on ? t.surface : t.info,
                              fontSize: t.textSm,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: font,
                            }}
                          >
                            {r.n}
                          </Text>
                        </View>

                        <View style={[styles.flex, styles.slRowBody]}>
                          {/* Top Row: Field Title + Confidence & Status Badges */}
                          <View style={styles.slRowTop}>
                            <Pressable
                              role="button"
                              {...pressedProps(r.on)}
                              aria-label={`${s.fieldLabel}${l.showEvidenceSuffix}`}
                              onPress={() =>
                                onIntent({ type: 'suggestionSelected', suggestionId: s.id })
                              }
                              style={({ focused }: PressState) => [
                                styles.wrapText,
                                focusRing(t, focused),
                              ]}
                            >
                              <Text
                                style={{
                                  color: t.text,
                                  fontSize: t.textLg,
                                  fontWeight: fontWeight(t.weightBold),
                                  fontFamily: font,
                                }}
                              >
                                {s.fieldLabel}
                              </Text>
                            </Pressable>
                            <View style={styles.slBadges}>
                              {s.confidence ? <EmrBadgeView badge={s.confidence} /> : null}
                              <EmrBadgeView
                                badge={{
                                  label: `${meta.glyph} ${statusLabelOf(s.status)}`,
                                  tone: meta.tone,
                                }}
                              />
                            </View>
                          </View>

                          {/* Suggested / Edited Value */}
                          {s.status === 'edited' && s.editedValueLabel ? (
                            <View style={styles.slValueStack}>
                              <View style={styles.slValueLine}>
                                <Text
                                  style={{
                                    color: t.textMuted,
                                    fontSize: t.textXs,
                                    fontWeight: fontWeight(t.weightBold),
                                    textTransform: 'uppercase',
                                    fontFamily: font,
                                  }}
                                >
                                  {l.suggestedPrefix}
                                </Text>
                                <Text
                                  style={{
                                    color: t.textMuted,
                                    fontSize: t.textMd,
                                    textDecorationLine: 'line-through',
                                    fontFamily: font,
                                  }}
                                >
                                  {s.valueLabel}
                                </Text>
                              </View>
                              <View style={styles.slValueLine}>
                                <Text
                                  style={{
                                    color: t.textMuted,
                                    fontSize: t.textXs,
                                    fontWeight: fontWeight(t.weightBold),
                                    textTransform: 'uppercase',
                                    fontFamily: font,
                                  }}
                                >
                                  {l.editedPrefix}
                                </Text>
                                <Text
                                  style={{
                                    color: t.text,
                                    fontSize: t.textLg,
                                    fontWeight: fontWeight(t.weightBold),
                                    fontFamily: font,
                                  }}
                                >
                                  {s.editedValueLabel}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Text
                              style={{
                                color: s.status === 'rejected' ? t.textMuted : t.text,
                                fontSize: t.textLg,
                                fontWeight: fontWeight(t.weightBold),
                                textDecorationLine:
                                  s.status === 'rejected' ? 'line-through' : 'none',
                                fontFamily: font,
                              }}
                            >
                              {s.valueLabel}
                            </Text>
                          )}

                          {/* Validation Messages */}
                          {(s.messages ?? []).map((m, mIdx) => (
                            <View key={mIdx} style={styles.slMsgRow}>
                              <Text
                                aria-hidden
                                style={{
                                  color: m.severity === 'error' ? t.danger : t.warning,
                                  fontSize: t.textMd,
                                }}
                              >
                                {messageGlyph(m)}
                              </Text>
                              <Text
                                style={[
                                  styles.flex,
                                  {
                                    color: m.severity === 'error' ? t.danger : t.warning,
                                    fontSize: t.textMd,
                                    fontWeight: fontWeight(t.weightMedium),
                                    fontFamily: font,
                                  },
                                ]}
                              >
                                {m.message}
                              </Text>
                            </View>
                          ))}

                          {/* Evidence Snippets */}
                          <View style={[styles.slEvidence, { borderLeftColor: t.info }]}>
                            <Text
                              style={{
                                color: t.textMuted,
                                fontSize: t.textXs,
                                fontWeight: fontWeight(t.weightBold),
                                fontFamily: font,
                              }}
                            >
                              {l.evidenceCount(s.spanIds.length)}
                            </Text>
                            {r.snippets.map((q, qIdx) => (
                              <Text
                                key={qIdx}
                                style={{
                                  color: t.text,
                                  fontSize: t.textMd,
                                  fontFamily: font,
                                }}
                              >
                                <Text style={{ fontStyle: 'italic' }}>“{q.text}”</Text>
                                {q.time ? (
                                  <Text
                                    style={{
                                      color: t.textMuted,
                                      fontSize: t.textXs,
                                      fontFamily: mono,
                                    }}
                                  >
                                    {` ${q.time}`}
                                  </Text>
                                ) : null}
                              </Text>
                            ))}
                          </View>

                          {/* Inline Editor or Review Actions */}
                          {editingId === s.id ? (
                            <View style={styles.slEditForm}>
                              <Text
                                style={{
                                  color: t.text,
                                  fontSize: t.textMd,
                                  fontWeight: fontWeight(t.weightBold),
                                  fontFamily: font,
                                }}
                              >
                                {l.newValueLabel(s.fieldLabel)}
                              </Text>
                              {editKind === 'select' ? (
                                <EmrSelect
                                  label={l.newValueLabel(s.fieldLabel)}
                                  options={s.options ?? []}
                                  value={draft}
                                  onChange={v => setDraft(v ?? '')}
                                />
                              ) : editKind === 'number' ? (
                                <ThemedInput
                                  aria-label={l.newValueLabel(s.fieldLabel)}
                                  keyboardType="decimal-pad"
                                  inputMode="decimal"
                                  value={draft}
                                  onChangeText={setDraft}
                                />
                              ) : editKind === 'multiline' ? (
                                <ThemedInput
                                  multiline
                                  numberOfLines={3}
                                  aria-label={l.newValueLabel(s.fieldLabel)}
                                  value={draft}
                                  onChangeText={setDraft}
                                />
                              ) : (
                                <ThemedInput
                                  aria-label={l.newValueLabel(s.fieldLabel)}
                                  value={draft}
                                  onChangeText={setDraft}
                                />
                              )}
                              <View style={styles.slActions}>
                                <EmrButton
                                  small
                                  disabled={!isSuggestionDraftValid(s, draft)}
                                  label={`✓ ${l.save}`}
                                  accessibilityLabel={`${l.save} ${s.fieldLabel}`}
                                  onPress={() => saveEdit(s)}
                                />
                                <EmrButton
                                  variant="ghost"
                                  small
                                  label={l.cancel}
                                  accessibilityLabel={`${l.cancel} ${s.fieldLabel}`}
                                  onPress={cancelEdit}
                                />
                              </View>
                            </View>
                          ) : !model.readOnly ? (
                            <View style={styles.slActions}>
                              {s.status === 'pending' ? (
                                <EmrButton
                                  small
                                  label={`✓ ${l.accept}`}
                                  accessibilityLabel={`${l.accept} suggestion for ${s.fieldLabel}`}
                                  onPress={() =>
                                    onIntent({ type: 'suggestionAccepted', suggestionId: s.id })
                                  }
                                />
                              ) : null}
                              {s.status !== 'rejected' ? (
                                <>
                                  <EmrButton
                                    variant="outline"
                                    small
                                    label={`✎ ${l.edit}`}
                                    accessibilityLabel={`${l.edit} suggestion for ${s.fieldLabel}`}
                                    onPress={() => startEdit(s)}
                                  />
                                  <EmrButton
                                    variant="outline"
                                    small
                                    label={`✕ ${l.reject}`}
                                    accessibilityLabel={`${l.reject} suggestion for ${s.fieldLabel}`}
                                    onPress={() =>
                                      onIntent({ type: 'suggestionRejected', suggestionId: s.id })
                                    }
                                  />
                                </>
                              ) : null}
                              {s.status !== 'pending' ? (
                                <EmrButton
                                  variant="ghost"
                                  small
                                  label={`↺ ${l.reopen}`}
                                  accessibilityLabel={`${l.reopen} suggestion for ${s.fieldLabel}`}
                                  onPress={() =>
                                    onIntent({ type: 'suggestionReopened', suggestionId: s.id })
                                  }
                                />
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ===========================================================================
// Styles
// ===========================================================================

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  // Text column in a wrapping row: keeps a readable width and lets the badges wrap below on a phone.
  wrapText: { flexGrow: 1, flexShrink: 1, flexBasis: 160, minWidth: 0 },

  // Flowsheet
  fsRoot: { gap: 8, minWidth: 0 },
  fsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  fsTableFrame: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fsLeftPane: {
    borderRightWidth: 1,
    zIndex: 1,
  },
  fsFixedRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  fsCornerCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
  },
  fsRowHeadCell: {
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  fsRefCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
  },
  fsGroupCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  fsDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  fsColGroupCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
  },
  fsColHeaderWrap: {
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  fsHeaderBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 1,
  },
  fsHeaderBtnRow: {
    alignItems: 'flex-start',
  },
  fsCellWrap: {
    borderRightWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  fsCellBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  fsCellStatic: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },

  // Observation Trend
  trRoot: { gap: 8, minWidth: 0 },
  trBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  trSegGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  trSegBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 26,
  },
  trAxisCaptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  trPlot: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  trMarkerHit: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  trMarkerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trReadout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },

  // Clinical Transcript
  ctRoot: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minWidth: 0,
  },
  ctHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  ctBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ctStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  ctDictateBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ctErrorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  ctScroll: {
    maxHeight: 420,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ctEmpty: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  ctSegment: {
    paddingVertical: 10,
    gap: 6,
  },
  ctMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  ctSrcPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  ctEditBtnWrap: {
    marginLeft: 'auto',
  },
  ctEditor: {
    gap: 8,
  },
  ctRowBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ctPiecesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  ctSpanBtn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    // A long highlighted phrase must wrap inside the row, not run past it.
    maxWidth: '100%',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ctMarkBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctFeedsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  ctFeedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctTypeForm: {
    gap: 6,
  },
  ctTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 8,
  },
  // Basis, not flex 1 + minWidth 0: on a phone the input keeps its width and the button wraps below.
  ctTypeInput: { flexGrow: 1, flexShrink: 1, flexBasis: 220 },

  // Evidence Suggestion List
  slRoot: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minWidth: 0,
  },
  slHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  slTools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slLinkedBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  slBusyBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  slErrorBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  slScroll: {
    maxHeight: 480,
  },
  slEmpty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  slGroupList: {
    gap: 14,
  },
  slGroup: {
    gap: 8,
  },
  slRows: {
    gap: 8,
  },
  slRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  slNumBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slRowBody: {
    gap: 6,
  },
  slRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  slBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slValueStack: {
    gap: 2,
  },
  slValueLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  slMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  slEvidence: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    gap: 2,
  },
  slEditForm: {
    gap: 8,
  },
  slActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
