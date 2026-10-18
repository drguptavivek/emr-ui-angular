'use client';

import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFormIntent,
  ClinicalFormViewModel,
  ClinicalMatrixBlockDefinition,
  EmrBadge,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrTypedField, type EmrCustomRenderers } from './typed-field';
import { isFieldShown } from './typed-field.logic';

/** Same breakpoint as the Angular form's media query, measured on the form's own width. */
const STACK_BELOW = 720;

/** L3. Collapsible section container: heading, description, status badge. */
export function EmrSectionCard({ sectionId, label, description, status, collapsible, collapsed, onToggle, children }: {
  sectionId: string;
  label: string;
  description?: string;
  status?: EmrBadge;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const headingId = `emr-section-${sectionId}-heading`;
  return (
    <View role="region" aria-labelledby={headingId} style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text role="heading" aria-level={2} nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{label}</Text>
          {description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{description}</Text> : null}
        </View>
        {status ? <EmrBadgeView badge={status} /> : null}
        {collapsible ? <EmrButton variant="ghost" small label={collapsed ? labels.show : labels.hide} expanded={!collapsed}
          accessibilityLabel={`${collapsed ? labels.show : labels.hide} ${label}`} onPress={() => onToggle?.()} /> : null}
      </View>
      {/* Collapsed content stays mounted (display none, like Angular's [hidden]) so print can restore it:
          a collapsed section on paper is omitted clinical data. */}
      <View nativeID={`emr-section-${sectionId}-content`} style={collapsed ? styles.collapsed : undefined}>{children}</View>
    </View>
  );
}

/** L3. Schema-driven clinical form: the React twin of emr-clinical-form. One intent out. */
export function EmrClinicalForm({ model, onIntent, idPrefix = '', customRenderers }: {
  model: ClinicalFormViewModel;
  onIntent: (intent: ClinicalFormIntent) => void;
  idPrefix?: string;
  customRenderers?: EmrCustomRenderers;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const [width, setWidth] = useState(0);
  const stacked = width > 0 && width < STACK_BELOW;
  const schemaId = model.schema.id;
  const domId = (value: string) => (idPrefix ? `${idPrefix}-${value}` : value);
  const controlId = (field: ClinicalFieldDefinition, itemId?: string) => domId(`${schemaId}-${itemId ? itemId + '-' : ''}${field.id}`);
  const span = (field: { span?: number }) => (stacked ? '100%' : `${((field.span ?? 6) / 12) * 100}%`) as `${number}%`;

  const typedField = (field: ClinicalFieldDefinition, state: ClinicalFieldState | undefined, readOnly: boolean, item?: RepeatableItemState, groupId?: string, labelHidden?: boolean) => (
      <EmrTypedField
        definition={field}
        labelHidden={labelHidden}
        model={state}
        controlId={controlId(field, item?.id)}
        readOnly={readOnly}
        customRenderers={customRenderers}
        onFocus={() => onIntent({ type: 'fieldFocused', fieldId: field.id })}
        onValueChange={value => onIntent(item && groupId
          ? { type: 'repeatItemEditRequested', groupId, itemId: item.id, fieldId: field.id, value }
          : { type: 'fieldEditRequested', fieldId: field.id, value })}
        onStatusChange={status => onIntent(item && groupId
          ? { type: 'repeatItemStatusEditRequested', groupId, itemId: item.id, fieldId: field.id, status }
          : { type: 'fieldStatusEditRequested', fieldId: field.id, status })}
      />
  );

  const fieldCell = (field: ClinicalFieldDefinition, state: ClinicalFieldState | undefined, readOnly: boolean, item?: RepeatableItemState, groupId?: string) => (
    <View key={field.id} style={[styles.cell, { width: span(field) }]}>{typedField(field, state, readOnly, item, groupId)}</View>
  );

  // Rows × columns of ordinary fields. Headers are the visible labels; each control keeps its own field label as its accessible name.
  const matrix = (block: ClinicalMatrixBlockDefinition) => {
    const rows = block.rows.filter(row => Object.values(row.cells).some(cell => isFieldShown(model.fields[cell.id])));
    if (rows.length === 0) return null;
    const textStyle = { color: t.text, fontFamily: fontFamily(t) };
    return (
      <View key={block.id} style={[styles.cell, styles.full]}>
        <View role="table" aria-label={block.label} style={styles.matrix}>
          <Text role="heading" aria-level={3} style={[textStyle, { fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }]}>{block.label}</Text>
          {block.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{block.description}</Text> : null}
          <View role="row" style={styles.matrixRow}>
            {stacked ? null : <View style={styles.matrixRowLabel} />}
            {block.columns.map(column => (
              <Text key={column.id} role="columnheader" style={[textStyle, styles.matrixCell, { fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }]}>{column.label}</Text>
            ))}
          </View>
          {rows.map(row => {
            const required = Object.values(row.cells).some(cell => model.fields[cell.id]?.required ?? cell.required);
            return (
              <View key={row.id} role="row" style={[styles.matrixRowWrap, { borderTopColor: t.border }, stacked ? null : styles.matrixRow]}>
                <Text role="rowheader" style={[textStyle, stacked ? null : styles.matrixRowLabel, { fontSize: t.textMd, fontWeight: fontWeight(650) }]}>
                  {row.label}{required ? <Text style={{ color: t.danger }}> *</Text> : null}
                </Text>
                <View style={styles.matrixCells}>
                  {block.columns.map(column => {
                    const cell = row.cells[column.id];
                    const state = cell ? model.fields[cell.id] : undefined;
                    return (
                      <View key={column.id} role="cell" style={styles.matrixCell}>
                        {cell && isFieldShown(state) ? typedField(cell, state, model.readOnly ?? false, undefined, undefined, true) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View role="form" aria-label={model.schema.label} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={styles.form}>
      {model.schema.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{model.schema.description}</Text> : null}
      {model.schema.sections.map(section => (
        <EmrSectionCard key={section.id} sectionId={domId(`${schemaId}-${section.id}`)} label={section.label} description={section.description}
          collapsible={section.collapsible} collapsed={model.collapsedSectionIds?.includes(section.id)} status={model.sectionStatuses?.[section.id]}
          onToggle={() => onIntent({ type: 'sectionToggleRequested', sectionId: section.id })}>
          <View style={styles.grid}>
            {section.blocks.map(block => {
              if (block.kind === 'matrix') return matrix(block);
              if (block.kind !== 'repeatable') {
                const state = model.fields[block.id];
                return isFieldShown(state) ? fieldCell(block, state, model.readOnly ?? false) : null;
              }
              const items = model.repeatableGroups[block.id] ?? [];
              return (
                <View key={block.id} style={[styles.cell, styles.full]}>
                  <View style={[styles.repeatable, { borderColor: t.border, backgroundColor: t.surfaceSlate }]}>
                    <View style={styles.repeatHeading}>
                      <View style={styles.flex}>
                        <Text role="heading" aria-level={3} style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{block.label}</Text>
                        {block.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{block.description}</Text> : null}
                      </View>
                      <EmrButton variant="outline" small label={block.addLabel ?? labels.add} disabled={model.readOnly}
                        onPress={() => onIntent({ type: 'repeatItemAddRequested', groupId: block.id })} />
                    </View>
                    {items.length === 0 ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t), marginTop: 12 }}>{labels.noEntries}</Text> : null}
                    {items.map((item, index) => {
                      const itemLabel = item.label ?? labels.entry(index + 1);
                      return (
                        <View key={item.id} style={[styles.repeatItem, { borderColor: t.border, backgroundColor: t.surface }]}>
                          <View style={styles.repeatHeading}>
                            <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>{itemLabel}</Text>
                            <EmrButton variant="ghost" small label={labels.remove} accessibilityLabel={`${labels.remove} ${itemLabel}`}
                              disabled={model.readOnly || item.readOnly}
                              onPress={() => onIntent({ type: 'repeatItemRemoveRequested', groupId: block.id, itemId: item.id })} />
                          </View>
                          <View style={styles.grid}>
                            {block.fields.map(field => isFieldShown(item.fields[field.id])
                              ? fieldCell(field, item.fields[field.id], !!(model.readOnly || item.readOnly), item, block.id)
                              : null)}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </EmrSectionCard>
      ))}
    </View>
  );
}

const GAP = 16;

const styles = StyleSheet.create({
  form: { gap: GAP },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  collapsed: { display: 'none' },
  // 12-column grid as wrapping percentages; cells carry half-gutters so spans add up to 100%.
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, rowGap: GAP },
  cell: { paddingHorizontal: GAP / 2, minWidth: 0 },
  full: { width: '100%' },
  repeatable: { borderWidth: 1, borderRadius: 8, padding: 16 },
  repeatHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  matrix: { gap: 8 },
  matrixRow: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  matrixRowWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 6 },
  matrixCells: { flex: 1, minWidth: 0, flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  matrixCell: { flex: 1, minWidth: 0 },
  matrixRowLabel: { width: '22%', paddingTop: 12 },
  repeatItem: { marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 8, gap: 12 },
});
