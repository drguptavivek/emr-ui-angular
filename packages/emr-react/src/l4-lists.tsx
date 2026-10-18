'use client';

import { Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge, PatientListIntent, PatientListRow, PatientListViewModel } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrStateMessage } from './l1-display';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { useContainerWidth } from './l4-lists-shared';
import { ariaSortOf, nextSort, pagerState } from './l4-lists.logic';

export { EmrWorkQueue, type WorkQueueLabels } from './l4-lists-queue';
export { EmrTimeline, type TimelineLabels } from './l4-lists-timeline';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; each is overridable through the `labels` prop. */
const DEFAULTS = {
  title: 'Patient list',
  searchLabel: 'Search patients',
  searchPlaceholder: 'Search by name, identifier or visit',
  searchButton: 'Search',
  errorTitle: 'Patients could not be loaded',
  retry: 'Retry',
  loading: 'Loading patients…',
  empty: 'No patients match this search.',
  previous: 'Previous',
  next: 'Next',
  pageSummary: (page: number, total: number) => `Page ${page} · ${total} results`,
  nationalId: 'ID',
  none: '—',
  sortedAscending: 'sorted ascending',
  sortedDescending: 'sorted descending',
  notSorted: 'not sorted',
  selected: 'selected',
  ageSex: 'Age / sex',
  careArea: 'Care area',
  queue: 'Queue',
  status: 'Status',
  patient: 'Identifier / patient',
};
export type PatientListLabels = typeof DEFAULTS;

type ColumnKey = 'identifier' | 'age' | 'careArea' | 'queue' | 'status';
/** Relative widths of the five wide-layout columns. */
const FLEX: Record<ColumnKey, number> = { identifier: 2.2, age: 1, careArea: 1.6, queue: 1, status: 1.2 };
/** Default controller sort fields, one per column; override through `sortFields`. */
const SORT_FIELDS: Record<ColumnKey, string> = { identifier: 'identifier', age: 'age', careArea: 'careArea', queue: 'queue', status: 'status' };

function idLines(row: PatientListRow, l: PatientListLabels): string[] {
  const ids = row.nationalHealthIds?.length ? row.nationalHealthIds : row.abha ? [{ label: row.abha.label ?? l.nationalId, value: row.abha.value }] : [];
  return ids.map(id => `${id.label || l.nationalId} ${id.value}`);
}

/**
 * L4 patient list. Controlled and presentational: rows arrive already searched, sorted and paged;
 * typing, Search, header sort, row press, paging and Retry are all intents. Table-like rows when the
 * container is at least `wideFrom` px, cards below. Row press folds Angular's `select()` into `patientSelected`.
 */
export function EmrPatientList({ model, onIntent, labels, sortFields, wideFrom = 640 }: {
  model: PatientListViewModel;
  onIntent: (intent: PatientListIntent) => void;
  labels?: Partial<PatientListLabels>;
  /** Sort field sent in `sortChanged` for each column. */
  sortFields?: Partial<Record<ColumnKey, string>>;
  wideFrom?: number;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= wideFrom;
  const web = Platform.OS === 'web';
  const fields = { ...SORT_FIELDS, ...sortFields };
  const cols: { key: ColumnKey; label: string }[] = [
    { key: 'identifier', label: l.patient }, { key: 'age', label: l.ageSex }, { key: 'careArea', label: l.careArea },
    { key: 'queue', label: l.queue }, { key: 'status', label: l.status },
  ];
  const pager = pagerState(model.page, model.pageSize, model.total);
  const text = (size: number, extra?: object) => ({ color: t.text, fontSize: size, fontFamily: fontFamily(t), ...extra });
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };

  const identity = (row: PatientListRow) => (
    <View style={styles.min}>
      <Text style={text(t.textMd, { fontFamily: web ? t.fontMono : undefined, fontWeight: fontWeight(t.weightBold) })}>{row.primaryIdentifier}</Text>
      <Text style={text(t.textMd, { fontWeight: fontWeight(t.weightMedium) })}>{row.displayName}</Text>
      {idLines(row, l).map(line => <Text key={line} style={muted}>{line}</Text>)}
    </View>
  );
  const status = (s?: EmrBadge) => (s ? <EmrBadgeView badge={s} /> : null);
  const select = (row: PatientListRow) => () => onIntent({ type: 'patientSelected', patientId: row.patientId });
  const isSelected = (row: PatientListRow) => model.selectedPatientId === row.patientId;
  const rowName = (row: PatientListRow) => [row.primaryIdentifier, row.displayName, isSelected(row) ? l.selected : ''].filter(Boolean).join(', ');
  const rowFrame = (row: PatientListRow) => ({ minHeight: t.controlHeight, borderBottomColor: t.border, backgroundColor: isSelected(row) ? t.primarySoft : undefined });

  const headerCell = (c: { key: ColumnKey; label: string }) => {
    const field = fields[c.key];
    const sorted = ariaSortOf(model.sort, field);
    const glyph = sorted === 'ascending' ? ' ▲' : sorted === 'descending' ? ' ▼' : '';
    const state = sorted === 'ascending' ? l.sortedAscending : sorted === 'descending' ? l.sortedDescending : l.notSorted;
    return (
      <View key={c.key} role="columnheader" {...(web ? { 'aria-sort': sorted } : null)} style={[styles.cell, { flexGrow: FLEX[c.key] }]}>
        <Pressable role="button" aria-label={`${c.label}, ${state}`} onPress={() => onIntent({ type: 'sortChanged', ...nextSort(model.sort, field) })}
          style={({ focused }: PressState) => [focusRing(t, focused), { minHeight: t.controlHeight, justifyContent: 'center' }]}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t), fontWeight: fontWeight(t.weightBold) }}>{c.label}{glyph}</Text>
        </Pressable>
      </View>
    );
  };

  const wideRow = (row: PatientListRow) => (
    <View key={row.patientId} role={web ? 'row' : 'listitem'} aria-selected={web ? isSelected(row) : undefined} style={[styles.row, rowFrame(row)]}>
      <View role="cell" style={[styles.cell, { flexGrow: FLEX.identifier }]}>
        <Pressable role="button" aria-label={rowName(row)} onPress={select(row)}
          style={({ focused }: PressState) => [focusRing(t, focused), { minHeight: t.controlHeight, justifyContent: 'center' }]}>
          {identity(row)}
        </Pressable>
      </View>
      <View role="cell" style={[styles.cell, { flexGrow: FLEX.age }]}><Text style={text(t.textMd)}>{row.ageLabel} / {row.sexLabel}</Text></View>
      <View role="cell" style={[styles.cell, { flexGrow: FLEX.careArea }]}>
        <Text style={text(t.textMd)}>{row.careSettingLabel}</Text>
        <Text style={muted}>{row.locationLabel}</Text>
      </View>
      <View role="cell" style={[styles.cell, { flexGrow: FLEX.queue }]}><Text style={text(t.textMd)}>{row.queueLabel || l.none}</Text></View>
      <View role="cell" style={[styles.cell, { flexGrow: FLEX.status }]}>{status(row.status)}</View>
    </View>
  );

  const card = (row: PatientListRow) => (
    <View key={row.patientId} role="listitem">
      <Pressable role="button" aria-label={rowName(row)} onPress={select(row)}
        style={({ focused }: PressState) => [styles.card, focusRing(t, focused), {
          minHeight: t.controlHeight, borderColor: isSelected(row) ? t.primary : t.border, borderWidth: isSelected(row) ? 2 : 1,
          backgroundColor: isSelected(row) ? t.primarySoft : t.surface,
        }]}>
        <View style={styles.cardTop}>
          <Text style={text(t.textMd, { fontWeight: fontWeight(t.weightBold) })}>{row.primaryIdentifier}</Text>
          {status(row.status)}
        </View>
        <Text style={text(t.textMd, { fontWeight: fontWeight(t.weightMedium) })}>{row.displayName}</Text>
        {idLines(row, l).map(line => <Text key={line} style={muted}>{line}</Text>)}
        <Text style={muted}>{row.ageLabel} / {row.sexLabel}</Text>
        <Text style={muted}>{[row.careSettingLabel, row.locationLabel, row.queueLabel].filter(Boolean).join(' · ')}</Text>
      </Pressable>
    </View>
  );

  let body;
  if (model.error) {
    body = <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}><EmrButton variant="outline" small label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} /></EmrStateMessage>;
  } else if (model.loading && model.rows.length === 0) {
    body = <EmrStateMessage kind="loading" title={l.loading} />;
  } else if (model.rows.length === 0) {
    body = <EmrStateMessage kind="empty" title={l.empty} />;
  } else {
    body = (
      <>
        {wide ? (
          <View role={web ? 'table' : 'list'} aria-label={l.title}>
            <View role={web ? 'row' : 'none'} style={[styles.row, { backgroundColor: t.surfaceAccent, borderBottomColor: t.border }]}>{cols.map(headerCell)}</View>
            {model.rows.map(wideRow)}
          </View>
        ) : <View role="list" aria-label={l.title} style={styles.cards}>{model.rows.map(card)}</View>}
        <View style={styles.pager}>
          <EmrButton variant="outline" small label={l.previous} disabled={!pager.canPrev} onPress={() => onIntent({ type: 'pageChanged', page: model.page - 1 })} />
          <Text role="status" style={muted}>{l.pageSummary(model.page, model.total)}</Text>
          <EmrButton variant="outline" small label={l.next} disabled={!pager.canNext} onPress={() => onIntent({ type: 'pageChanged', page: model.page + 1 })} />
        </View>
      </>
    );
  }

  return (
    <View role="region" aria-label={l.title} aria-busy={model.loading} onLayout={onLayout} style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.min}>
          <ThemedInput value={model.query} aria-label={l.searchLabel} placeholder={l.searchPlaceholder} returnKeyType="search" inputMode="search"
            onChangeText={query => onIntent({ type: 'queryChanged', query })} onSubmitEditing={() => onIntent({ type: 'searchRequested' })} />
        </View>
        <EmrButton label={l.searchButton} onPress={() => onIntent({ type: 'searchRequested' })} />
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, minWidth: 0 },
  min: { flex: 1, minWidth: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, borderBottomWidth: 1 },
  cell: { flexBasis: 0, minWidth: 0, paddingVertical: 6 },
  cards: { gap: 8 },
  card: { borderRadius: 8, padding: 10, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
