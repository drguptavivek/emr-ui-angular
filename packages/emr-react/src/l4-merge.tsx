'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { EmrBadgeView, EmrButton } from './primitives';
import { EmrPatientIdentityCard, type EmrPatientIdentity } from './l4-identity';
import { useContainerWidth } from './l4-lists-shared';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings. Every key is overridable via `labels`. */
const DEFAULTS = {
  leftRecord: 'Left record',
  rightRecord: 'Right record',
  keepSurvivor: 'Keep as surviving record',
  survivorGroup: 'Surviving record',
  field: 'Field',
  left: 'Left',
  right: 'Right',
  use: 'Use',
  useLeftFor: (label: string) => `Use left value for ${label}`,
  useRightFor: (label: string) => `Use right value for ${label}`,
  differs: '≠ Differs',
  differsAssistive: 'Values differ',
  same: 'Same',
  comparison: 'Field comparison',
  confirmMerge: 'Confirm merge',
  reject: 'Reject',
  cancel: 'Cancel',
};
type Labels = Partial<typeof DEFAULTS>;

export type EmrMergeSide = 'left' | 'right';
export interface EmrMergeRow { id: string; label: string; leftValue: string; rightValue: string; differs: boolean; chosen?: EmrMergeSide }
export interface EmrMergeCompareModel {
  left: EmrPatientIdentity & { id: string };
  right: EmrPatientIdentity & { id: string };
  rows: readonly EmrMergeRow[];
  survivorSide?: EmrMergeSide;
  /** Domain decision: the component never compares values or judges completeness. */
  canConfirm: boolean;
}
export type EmrMergeIntent =
  | { type: 'fieldChosen'; rowId: string; side: EmrMergeSide }
  | { type: 'survivorChosen'; side: EmrMergeSide }
  | { type: 'mergeConfirmed' }
  | { type: 'rejected' }
  | { type: 'cancelled' };

/** Radio-style target with an explicit accessible name (EmrOptionChip has no aria-label). */
function Choice({ label, name, selected, onPress }: { label: string; name: string; selected: boolean; onPress: () => void }) {
  const t = useEmrTheme();
  return (
    <Pressable role="radio" aria-checked={selected} aria-label={name} onPress={onPress}
      style={({ focused }: PressState) => [styles.choice, focusRing(t, focused), {
        minHeight: t.controlHeight, minWidth: t.controlHeight,
        borderColor: selected ? t.primary : t.border, borderWidth: selected ? 2 : 1, backgroundColor: selected ? t.primarySoft : t.surface,
      }]}>
      <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>{selected ? '✓ ' : '○ '}{label}</Text>
    </Pressable>
  );
}

/**
 * L4. Side-by-side patient merge comparison. The domain supplies `differs` and `canConfirm`; this only
 * renders and emits intents. Container width >= 720 is a three-column table, below it a card per row.
 */
export function EmrMergeCompare({ model, labels, onIntent }: { model: EmrMergeCompareModel; labels?: Labels; onIntent: (intent: EmrMergeIntent) => void }) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= 720;
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const bold = { ...text, fontWeight: fontWeight(t.weightBold) };
  const noop = () => undefined;
  const status = (r: EmrMergeRow) => (r.differs
    ? <EmrBadgeView badge={{ label: l.differs, tone: 'warning', assistiveText: l.differsAssistive }} />
    : <Text style={muted}>{l.same}</Text>);
  const choice = (r: EmrMergeRow, side: EmrMergeSide) => (
    <Choice label={l.use} name={(side === 'left' ? l.useLeftFor : l.useRightFor)(r.label)} selected={r.chosen === side}
      onPress={() => onIntent({ type: 'fieldChosen', rowId: r.id, side })} />
  );
  const value = (r: EmrMergeRow, side: EmrMergeSide) => (
    <View style={styles.cellBody}>
      <Text selectable style={text}>{side === 'left' ? r.leftValue : r.rightValue}</Text>
      {r.differs ? choice(r, side) : null}
    </View>
  );
  const rule = { borderColor: t.border };

  const patient = (side: EmrMergeSide) => {
    const m = model[side];
    return (
      <View key={side} style={styles.patient}>
        <Text style={muted}>{side === 'left' ? l.leftRecord : l.rightRecord}</Text>
        <EmrPatientIdentityCard model={m} mode="compact" onIntent={noop} />
        <Choice label={l.keepSurvivor} name={`${l.keepSurvivor}: ${m.name}`} selected={model.survivorSide === side} onPress={() => onIntent({ type: 'survivorChosen', side })} />
      </View>
    );
  };

  return (
    <View onLayout={onLayout} style={styles.root}>
      <View role="radiogroup" aria-label={l.survivorGroup} style={[styles.patients, !wide && styles.stack]}>{patient('left')}{patient('right')}</View>
      {wide ? (
        <View role="table" aria-label={l.comparison} style={[styles.table, rule]}>
          <View role="row" style={[styles.tr, { backgroundColor: t.surfaceSoft }, rule]}>
            {[l.field, l.left, l.right].map(h => <View key={h} role="columnheader" style={styles.td}><Text style={bold}>{h}</Text></View>)}
          </View>
          {model.rows.map(r => (
            <View key={r.id} role="row" style={[styles.tr, rule]}>
              <View role="cell" style={styles.td}><Text style={bold}>{r.label}</Text><View style={styles.statusRow}>{status(r)}</View></View>
              <View role="cell" style={styles.td}>{value(r, 'left')}</View>
              <View role="cell" style={styles.td}>{value(r, 'right')}</View>
            </View>
          ))}
        </View>
      ) : (
        <View role="list" aria-label={l.comparison} style={styles.stack}>
          {model.rows.map(r => (
            <View key={r.id} role="listitem" style={[styles.card, rule, { backgroundColor: t.surface }]}>
              <View style={styles.statusRow}><Text style={bold}>{r.label}</Text>{status(r)}</View>
              <Text style={text}><Text style={muted}>{l.left}: </Text>{r.leftValue}</Text>
              {r.differs ? choice(r, 'left') : null}
              <Text style={text}><Text style={muted}>{l.right}: </Text>{r.rightValue}</Text>
              {r.differs ? choice(r, 'right') : null}
            </View>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        {model.canConfirm ? <EmrButton label={l.confirmMerge} onPress={() => onIntent({ type: 'mergeConfirmed' })} /> : null}
        <EmrButton variant="outline" label={l.reject} onPress={() => onIntent({ type: 'rejected' })} />
        <EmrButton variant="outline" label={l.cancel} onPress={() => onIntent({ type: 'cancelled' })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  patients: { flexDirection: 'row', gap: 12 },
  stack: { flexDirection: 'column', gap: 12 },
  patient: { flex: 1, minWidth: 0, gap: 8 },
  table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: 1 },
  td: { flex: 1, minWidth: 0, padding: 10, gap: 6, justifyContent: 'center' },
  cellBody: { gap: 6, alignItems: 'flex-start' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  choice: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
