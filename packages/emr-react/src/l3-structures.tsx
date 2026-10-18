'use client';

import { useState, type ComponentType } from 'react';
import { useEmrLabels } from './labels';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type PressableStateCallbackType } from 'react-native';
import type {
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalCellValue,
  ClinicalColumn,
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalQuantityValue,
  ClinicalRow,
} from '@drguptavivek/emr-controller';
import { EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  cellNumberValue, cellSelectValue, formatCellValue, isApplicable, isMatrixStacked, quantityUnit,
} from './l3-structures.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for every built-in string; override any of them through the `strings` prop. */
const DEFAULTS = {
  add: 'Add',
  edit: 'Edit',
  remove: 'Remove',
  emptyList: 'Status not supplied.',
  clinicalListTitle: 'Clinical information',
  medicationsTitle: 'Medications',
  allergiesTitle: 'Allergies',
  chronicDiseasesTitle: 'Chronic diseases',
  personalHistoryTitle: 'Significant personal history',
  clinicalField: 'Clinical field',
  remarks: 'Remarks',
  notApplicable: 'Not applicable',
  notRecorded: 'Not recorded',
  yes: 'Yes',
  no: 'No',
  warning: 'Warning',
  assessmentStatus: 'Assessment status for',
  statusNotSet: 'Status not set',
  customRendererUnavailable: 'Custom renderer unavailable',
} as const;

export type EmrL3Strings = { [K in keyof typeof DEFAULTS]: string };

// ---------------------------------------------------------------------------
// Clinical lists
// ---------------------------------------------------------------------------

/** View model for a clinical list. An empty list has no clinical meaning; the controller supplies `emptyMessage`. */
export interface EmrClinicalListModel {
  items: readonly ClinicalListItem[];
  allowAdd?: boolean;
  emptyMessage?: string;
}

interface ClinicalListProps {
  model: EmrClinicalListModel;
  onIntent: (intent: ClinicalListIntent) => void;
  headingId?: string;
  title?: string;
  strings?: Partial<EmrL3Strings>;
}

/** L3. Titled list of clinical items with select / edit / remove / add intents. */
export function EmrClinicalList({ model, onIntent, headingId = 'emr-clinical-list-title', title, strings }: ClinicalListProps) {
  const t = useEmrTheme();
  const s = { ...DEFAULTS, ...strings };
  const font = fontFamily(t);
  return (
    <View role="region" aria-labelledby={headingId} style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={[styles.panelHeader, { backgroundColor: t.surfaceAccent, borderBottomColor: t.border, minHeight: t.controlHeight }]}>
        <Text role="heading" aria-level={2} nativeID={headingId} style={[styles.flex, { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }]}>
          {title ?? s.clinicalListTitle}
        </Text>
        {model.allowAdd !== false ? <EmrButton small label={s.add} onPress={() => onIntent({ type: 'addRequested' })} /> : null}
      </View>
      {model.items.length === 0 ? (
        <View role="status" style={styles.empty}>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{model.emptyMessage ?? s.emptyList}</Text>
        </View>
      ) : (
        <View role="list">
          {model.items.map((item, index) => (
            <View key={item.id} role="listitem" style={[styles.item, index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border } : null]}>
              <Pressable role="button" onPress={() => onIntent({ type: 'selected', id: item.id })}
                style={({ focused, pressed }: PressState) => [styles.flex, styles.itemBody, focusRing(t, focused), { minHeight: t.controlHeight, backgroundColor: pressed ? t.surfaceRaised : 'transparent' }]}>
                <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>{item.title}</Text>
                {item.subtitle ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{item.subtitle}</Text> : null}
                {item.detail ? <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>{item.detail}</Text> : null}
                {item.badges?.length ? <View style={styles.badges}>{item.badges.map(badge => <EmrBadgeView key={badge.label} badge={badge} />)}</View> : null}
              </Pressable>
              {!item.readOnly ? (
                <View style={styles.actions}>
                  <EmrButton small variant="ghost" label={s.edit} accessibilityLabel={`${s.edit} ${item.title}`} onPress={() => onIntent({ type: 'editRequested', id: item.id })} />
                  <EmrButton small variant="ghost" label={s.remove} accessibilityLabel={`${s.remove} ${item.title}`} onPress={() => onIntent({ type: 'removeRequested', id: item.id })} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type DomainListProps = Omit<ClinicalListProps, 'title'> & { title?: string };

/** L4 wrapper in Angular; kept beside the list as the Angular file does. Fixed title and heading id, otherwise a pass-through. */
export function EmrMedicationList({ title, strings, headingId = 'emr-medication-list-title', ...rest }: DomainListProps) {
  return <EmrClinicalList {...rest} headingId={headingId} title={title ?? strings?.medicationsTitle ?? DEFAULTS.medicationsTitle} strings={strings} />;
}
export function EmrAllergyList({ title, strings, headingId = 'emr-allergy-list-title', ...rest }: DomainListProps) {
  return <EmrClinicalList {...rest} headingId={headingId} title={title ?? strings?.allergiesTitle ?? DEFAULTS.allergiesTitle} strings={strings} />;
}
export function EmrChronicDiseaseList({ title, strings, headingId = 'emr-chronic-list-title', ...rest }: DomainListProps) {
  return <EmrClinicalList {...rest} headingId={headingId} title={title ?? strings?.chronicDiseasesTitle ?? DEFAULTS.chronicDiseasesTitle} strings={strings} />;
}
export function EmrPersonalHistoryList({ title, strings, headingId = 'emr-history-list-title', ...rest }: DomainListProps) {
  return <EmrClinicalList {...rest} headingId={headingId} title={title ?? strings?.personalHistoryTitle ?? DEFAULTS.personalHistoryTitle} strings={strings} />;
}

// ---------------------------------------------------------------------------
// Clinical matrix
// ---------------------------------------------------------------------------

/** What a custom cell renderer receives; `emit` becomes a `customCellIntent`. */
export interface EmrMatrixCellRendererProps {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit: (action: string, payload?: unknown) => void;
}

export type EmrMatrixCellRenderers = Readonly<Record<string, ComponentType<EmrMatrixCellRendererProps>>>;

/**
 * L3. Rows x columns clinical matrix. A table when its container is wide, one card per row when
 * narrow (container width via onLayout, not the window). One intent out.
 */
export function EmrClinicalMatrix({ definition, model = {}, onIntent, readOnly = false, idPrefix = '', customRenderers, strings }: {
  definition: ClinicalMatrixSchema;
  model?: ClinicalMatrixValues;
  onIntent: (intent: ClinicalMatrixIntent) => void;
  readOnly?: boolean;
  idPrefix?: string;
  customRenderers?: EmrMatrixCellRenderers;
  strings?: Partial<EmrL3Strings>;
}) {
  const t = useEmrTheme();
  const s = { ...DEFAULTS, ...strings };
  const dateFormat = useEmrLabels().dateFormat;
  const font = fontFamily(t);
  const [width, setWidth] = useState(0);
  const stacked = isMatrixStacked(width);
  const titleId = `${idPrefix ? idPrefix + '-' : ''}${definition.id}-title`;
  const text = { yes: s.yes, no: s.no, notRecorded: s.notRecorded };
  const small = { color: t.textMuted, fontSize: t.textSm, fontFamily: font };

  const emitCell = (row: ClinicalRow, column: ClinicalColumn, value: ClinicalCellValue | ClinicalQuantityValue) =>
    onIntent({ type: 'cellEditRequested', rowId: row.id, columnId: column.id, value });

  const cellEditor = (row: ClinicalRow, column: ClinicalColumn) => {
    if (!isApplicable(row, column.id)) {
      return <Text role="img" aria-label={s.notApplicable} style={{ color: t.textMuted, fontSize: t.textMd, paddingVertical: 10 }}>—</Text>;
    }
    const cell = model[row.id]?.cells[column.id];
    const name = `${row.label}, ${column.label}`;
    const invalid = !!cell?.error;
    const focus = () => onIntent({ type: 'cellFocused', rowId: row.id, columnId: column.id });
    const locked = readOnly || !!cell?.readOnly;
    const disabled = !!cell?.disabled;

    let editor;
    if (locked && row.type !== 'custom') {
      // Read-only stays a focusable, announced input (never disabled): keyboard users can still reach the value.
      editor = <ThemedInput aria-label={name} readOnly value={formatCellValue(cell?.value, text)} onFocus={focus} />;
    } else {
      switch (row.type) {
        case 'select':
          editor = <EmrSelect label={name} options={row.options ?? []} value={cellSelectValue(cell?.value)} invalid={invalid} disabled={disabled}
            onChange={value => emitCell(row, column, value)} />;
          break;
        case 'boolean':
          editor = <EmrSelect label={name} value={cellSelectValue(cell?.value)} invalid={invalid} disabled={disabled}
            options={[{ value: 'true', label: s.yes }, { value: 'false', label: s.no }]}
            onChange={value => emitCell(row, column, value === null ? null : value === 'true')} />;
          break;
        case 'integer':
        case 'decimal':
          editor = <NumberInput aria-label={name} value={cellNumberValue(cell?.value)} integer={row.type === 'integer'} invalid={invalid} editable={!disabled}
            onFocus={focus} onNumber={value => emitCell(row, column, value)} />;
          break;
        case 'quantity':
          editor = <NumberInput aria-label={`${row.label} ${column.label}`} value={cellNumberValue(cell?.value)} integer={false} unit={quantityUnit(row, cell?.value)}
            invalid={invalid} editable={!disabled} onFocus={focus}
            onNumber={value => emitCell(row, column, { value, unit: quantityUnit(row, cell?.value) })} />;
          break;
        case 'custom': {
          const Custom = row.customRendererKey ? customRenderers?.[row.customRendererKey] : undefined;
          editor = Custom
            ? <Custom row={row} column={column} cell={cell} readOnly={locked}
              emit={(action, payload) => onIntent({ type: 'customCellIntent', rowId: row.id, columnId: column.id, action, payload })} />
            : <Text role="status" style={small}>{s.customRendererUnavailable}</Text>;
          break;
        }
        case 'date':
          // Day-first display, ISO value — the same date entry as EmrDateInput and form fields.
          editor = <EmrTypedText aria-label={name} mode={dateFormat} placeholder={dateFormat} invalid={invalid} editable={!disabled}
            value={typeof cell?.value === 'string' && cell.value ? cell.value : null} onFocus={focus} onValueChange={next => emitCell(row, column, next)} />;
          break;
        default: {
          const value = typeof cell?.value === 'string' ? cell.value : typeof cell?.value === 'number' ? String(cell.value) : '';
          editor = <ThemedInput aria-label={name} value={value} invalid={invalid} editable={!disabled} 
            onFocus={focus} onChangeText={next => emitCell(row, column, next)} />;
        }
      }
    }

    return (
      <View style={styles.cell}>
        {editor}
        {cell?.warning ? <Text style={[small, { color: t.warning }]}>{`${s.warning}: ${cell.warning}`}</Text> : null}
        {cell?.error ? <Text role="alert" style={[small, { color: t.danger }]}>{cell.error}</Text> : null}
        {cell?.assessmentStatus ? <EmrBadgeView badge={cell.assessmentStatus} /> : null}
        {!locked && row.assessmentStatusOptions?.length ? (
          <EmrSelect label={`${s.assessmentStatus} ${name}`} disabled={disabled} value={cell?.assessmentStatus?.value ?? null}
            options={row.assessmentStatusOptions.map(option => ({ value: option.value, label: option.label }))}
            onChange={value => onIntent({ type: 'cellAssessmentStatusEditRequested', rowId: row.id, columnId: column.id, status: value as ClinicalAssessmentStatus | null })} />
        ) : null}
      </View>
    );
  };

  const remark = (row: ClinicalRow) => {
    const value = model[row.id];
    return (
      <View style={styles.cell}>
        <ThemedInput aria-label={`${s.remarks} — ${row.label}`} value={value?.remark ?? ''} invalid={!!value?.remarkError}
          readOnly={readOnly || !!value?.remarkReadOnly} editable={!value?.remarkDisabled}
          onChangeText={next => onIntent({ type: 'remarkEditRequested', rowId: row.id, remark: next })} />
        {value?.remarkError ? <Text role="alert" style={[small, { color: t.danger }]}>{value.remarkError}</Text> : null}
      </View>
    );
  };

  const head = { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font };
  const rowLabel = (row: ClinicalRow) => (
    <>
      <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(650), fontFamily: font }}>{row.unit ? `${row.label} (${row.unit})` : row.label}</Text>
      {row.helpText ? <Text style={small}>{row.helpText}</Text> : null}
    </>
  );

  return (
    <View role="region" aria-labelledby={titleId} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={styles.matrix}>
      <Text role="heading" aria-level={2} nativeID={titleId} style={[head, { fontSize: t.textLg }]}>{definition.label}</Text>
      {stacked ? (
        definition.rows.map(row => (
          <View key={row.id} style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View>{rowLabel(row)}</View>
            {definition.columns.map(column => (
              <View key={column.id} style={styles.cardCell}>
                <Text style={small}>{column.label}</Text>
                {cellEditor(row, column)}
              </View>
            ))}
            <View style={styles.cardCell}><Text style={small}>{s.remarks}</Text>{remark(row)}</View>
          </View>
        ))
      ) : (
        <View role="table" aria-label={definition.label}>
          {definition.columnGroups?.length ? (
            <View role="row" style={styles.tableRow}>
              <View style={styles.rowLabel} />
              {definition.columnGroups.map(group => (
                <Text key={group.id} role="columnheader" style={[head, { flex: group.columnIds.length }, styles.col]}>{group.label}</Text>
              ))}
              <View style={styles.col} />
            </View>
          ) : null}
          <View role="row" style={[styles.tableRow, { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
            <Text role="columnheader" style={[head, styles.rowLabel]}>{s.clinicalField}</Text>
            {definition.columns.map(column => <Text key={column.id} role="columnheader" style={[head, styles.col]}>{column.label}</Text>)}
            <Text role="columnheader" style={[head, styles.col]}>{s.remarks}</Text>
          </View>
          {definition.rows.map(row => (
            <View key={row.id} role="row" style={[styles.tableRow, { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View role="rowheader" style={[styles.rowLabel, { paddingTop: 10 }]}>{rowLabel(row)}</View>
              {definition.columns.map(column => <View key={column.id} role="cell" style={styles.col}>{cellEditor(row, column)}</View>)}
              <View role="cell" style={styles.col}>{remark(row)}</View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  panel: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  empty: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 8 },
  itemBody: { gap: 2, padding: 4, borderRadius: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 4 },
  matrix: { gap: 8 },
  tableRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, alignItems: 'flex-start' },
  rowLabel: { width: '20%', minWidth: 0 },
  col: { flex: 1, minWidth: 0 },
  cell: { gap: 4, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 10 },
  cardCell: { gap: 4 },
});
