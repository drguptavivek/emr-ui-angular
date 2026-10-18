'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

/**
 * One count or KPI. Every string is controller-supplied and already formatted: the tile never
 * counts, rounds, compares or picks a tone. A tone, when wanted, arrives as a labelled badge.
 */
export interface EmrStatTileModel {
  key: string;
  label: string;
  value: string;
  sub?: string;
  status?: EmrBadge;
  /** Spoken instead of "label value sub", e.g. "12 patients seen today, opens the list". */
  accessibilityLabel?: string;
}

export type EmrStatTileIntent = { type: 'statSelected'; key: string };

type PressState = PressableStateCallbackType & { focused?: boolean };

/** L1. Tappable when `onIntent` is given (opens the list behind the count); plain text otherwise. */
export function EmrStatTile({ model, onIntent }: { model: EmrStatTileModel; onIntent?: (intent: EmrStatTileIntent) => void }) {
  const t = useEmrTheme();
  const body = (
    <>
      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>{model.label}</Text>
      <Text style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{model.value}</Text>
      {model.sub ? <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{model.sub}</Text> : null}
      {model.status ? <EmrBadgeView badge={model.status} /> : null}
    </>
  );
  const label = model.accessibilityLabel ?? [model.label, model.value, model.sub].filter(Boolean).join(', ');
  const base = [styles.tile, { borderColor: t.border, backgroundColor: t.surface, minHeight: t.controlHeight * 2 }];
  if (!onIntent) return <View aria-label={label} style={base}>{body}</View>;
  return (
    <Pressable role="button" aria-label={label} onPress={() => onIntent({ type: 'statSelected', key: model.key })}
      style={({ pressed, focused }: PressState) => [...base, pressed ? { backgroundColor: t.surfaceRaised } : null, focusRing(t, focused)]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 16, gap: 4, justifyContent: 'center', minWidth: 0 },
});
