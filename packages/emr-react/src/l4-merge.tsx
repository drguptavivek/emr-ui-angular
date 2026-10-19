'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrMergeCompareModel, EmrMergeIntent, EmrMergeRow } from '@drguptavivek/emr-controller';
import { EmrBadgeView, EmrButton } from './primitives';
import { EmrPatientIdentityCard } from './l4-identity';
import { useContainerWidth } from './l4-lists-shared';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings. Every key is overridable via `labels`. */
const DEFAULTS = {
  record: (n: number) => `Record ${n}`,
  keepSurvivor: 'Keep as surviving record',
  survivorGroup: 'Surviving record',
  field: 'Field',
  use: 'Use',
  useFor: (record: string, label: string) => `Use ${record} value for ${label}`,
  differs: '≠ Differs',
  differsAssistive: 'Values differ',
  same: 'Same',
  comparison: 'Field comparison',
  confirmMerge: 'Confirm merge',
  reject: 'Reject',
  cancel: 'Cancel',
};
type Labels = Partial<typeof DEFAULTS>;

export type { EmrMergeCompareModel, EmrMergeIntent, EmrMergeRow };

/** Container width at which the table layout fits: 2 sources keep today's 720; 3–4 need 240 per source plus the field column. */
const MIN_PER_SOURCE = 240;
const FIELD_COLUMN = 160;

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
 * L4. N-way (2–4) patient merge comparison. The domain supplies `differs` and `canConfirm`; this only renders
 * and emits intents. Wide containers get a column per source, narrower ones a card per row listing each value.
 */
export function EmrMergeCompare({ model, labels, onIntent }: { model: EmrMergeCompareModel; labels?: Labels; onIntent: (intent: EmrMergeIntent) => void }) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const n = model.sources.length;
  const wide = width === null || width >= (n <= 2 ? 720 : MIN_PER_SOURCE * n + FIELD_COLUMN);
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const bold = { ...text, fontWeight: fontWeight(t.weightBold) };
  const noop = () => undefined;
  const heading = (i: number) => model.sources[i]!.label ?? l.record(i + 1);
  const status = (r: EmrMergeRow) => (r.differs
    ? <EmrBadgeView badge={{ label: l.differs, tone: 'warning', assistiveText: l.differsAssistive }} />
    : <Text style={muted}>{l.same}</Text>);
  const choice = (r: EmrMergeRow, i: number) => (
    <Choice label={l.use} name={l.useFor(heading(i), r.label)} selected={r.chosenSourceId === model.sources[i]!.id}
      onPress={() => onIntent({ type: 'fieldChosen', rowId: r.id, sourceId: model.sources[i]!.id })} />
  );
  const rule = { borderColor: t.border };

  return (
    <View onLayout={onLayout} style={styles.root}>
      <View role="radiogroup" aria-label={l.survivorGroup} style={[styles.patients, !wide && styles.stack]}>
        {model.sources.map((s, i) => (
          <View key={s.id} style={styles.patient}>
            <Text style={muted}>{heading(i)}</Text>
            <EmrPatientIdentityCard model={s} mode="compact" onIntent={noop} />
            <Choice label={l.keepSurvivor} name={`${l.keepSurvivor}: ${s.name}`} selected={model.survivorSourceId === s.id}
              onPress={() => onIntent({ type: 'survivorChosen', sourceId: s.id })} />
          </View>
        ))}
      </View>
      {wide ? (
        <View role="table" aria-label={l.comparison} style={[styles.table, rule]}>
          <View role="row" style={[styles.tr, { backgroundColor: t.surfaceSoft }, rule]}>
            <View role="columnheader" style={styles.td}><Text style={bold}>{l.field}</Text></View>
            {model.sources.map((s, i) => <View key={s.id} role="columnheader" style={styles.td}><Text style={bold}>{heading(i)}</Text></View>)}
          </View>
          {model.rows.map(r => (
            <View key={r.id} role="row" style={[styles.tr, rule]}>
              <View role="cell" style={styles.td}><Text style={bold}>{r.label}</Text><View style={styles.statusRow}>{status(r)}</View></View>
              {model.sources.map((s, i) => (
                <View key={s.id} role="cell" style={styles.td}>
                  <View style={styles.cellBody}>
                    <Text selectable style={text}>{r.values[s.id] ?? ''}</Text>
                    {r.differs ? choice(r, i) : null}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View role="list" aria-label={l.comparison} style={styles.stack}>
          {model.rows.map(r => (
            <View key={r.id} role="listitem" style={[styles.card, rule, { backgroundColor: t.surface }]}>
              <View style={styles.statusRow}><Text style={bold}>{r.label}</Text>{status(r)}</View>
              {model.sources.map((s, i) => (
                <View key={s.id} style={styles.value}>
                  <Text style={text}><Text style={muted}>{heading(i)}: </Text>{r.values[s.id] ?? ''}</Text>
                  {r.differs ? choice(r, i) : null}
                </View>
              ))}
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
  value: { gap: 6, alignItems: 'flex-start' },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  choice: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
