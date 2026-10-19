'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrRecordChange,
  EmrRecordChangeKind,
  EmrRecordDiffIntent,
  EmrRecordDiffModel,
  EmrRecordDiffSection,
} from '@drguptavivek/emr-controller';
import { EmrBadgeView } from './primitives';
import { EmrCard } from './l1-display';
import { useContainerWidth } from './l4-lists-shared';
import { pathBreadcrumb } from './l4-records.logic';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export * from './upload-queue';

export type {
  EmrRecordChange,
  EmrRecordChangeKind,
  EmrRecordDiffIntent,
  EmrRecordDiffModel,
  EmrRecordDiffSection,
};

export interface EmrRecordDiffLabels { before: string; after: string; empty: string }

export interface EmrRecordDiffProps {
  model: EmrRecordDiffModel;
  onIntent?: (intent: EmrRecordDiffIntent) => void;
  labels?: Partial<EmrRecordDiffLabels>;
}

const DEFAULTS: EmrRecordDiffLabels = { before: 'Before', after: 'After', empty: 'No changes.' };
const FALLBACK_KIND: Record<EmrRecordChangeKind, string> = { added: '+ Added', removed: '− Removed', changed: '~ Changed' };
const WIDE_MIN = 480;

type PressState = PressableStateCallbackType & { focused?: boolean };

/** L4. Renders a pre-computed audit/version diff; it never computes one. */
export function EmrRecordDiff({ model, onIntent, labels }: EmrRecordDiffProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= WIDE_MIN;
  const family = fontFamily(t);

  const side = (caption: string, text: string, struck: boolean) => (
    <View style={styles.side}>
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>{caption}</Text>
      <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: family, textDecorationLine: struck ? 'line-through' : 'none' }}>{text}</Text>
    </View>
  );

  const body = (c: EmrRecordChange) => (
    <>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(600), fontFamily: family }}>{c.label}</Text>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: family }}>{pathBreadcrumb(c.path)}</Text>
        </View>
        <EmrBadgeView badge={model.kindBadges?.[c.kind] ?? { label: FALLBACK_KIND[c.kind], tone: 'neutral' }} />
      </View>
      {c.before !== undefined || c.after !== undefined ? (
        <View style={[styles.sides, { flexDirection: wide ? 'row' : 'column' }]}>
          {c.before !== undefined ? side(l.before, c.before, c.kind === 'removed') : null}
          {c.after !== undefined ? side(l.after, c.after, false) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <View onLayout={onLayout} style={styles.root}>
      {model.title ? <Text role="heading" aria-level={2} style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>{model.title}</Text> : null}
      {model.summaryLabel ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{model.summaryLabel}</Text> : null}
      {model.sections.length === 0 ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{l.empty}</Text> : null}
      {model.sections.map(s => (
        <EmrCard key={s.id} label={s.label}>
          <View style={styles.list}>
            {s.changes.map(c => onIntent ? (
              <Pressable
                key={c.id} role="button" onPress={() => onIntent({ type: 'changeSelected', id: c.id })}
                style={(st: PressState) => [styles.change, { borderColor: t.border, minHeight: 44 }, focusRing(t, st.focused)]}
              >{body(c)}</Pressable>
            ) : (
              <View key={c.id} style={[styles.change, { borderColor: t.border }]}>{body(c)}</View>
            ))}
          </View>
        </EmrCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  list: { gap: 8 },
  change: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  sides: { gap: 12 },
  side: { flex: 1, gap: 2 },
});
