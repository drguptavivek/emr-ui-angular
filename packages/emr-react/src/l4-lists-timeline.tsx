'use client';

import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { TimelineEvent, TimelineIntent, TimelineKindDefinition } from '@drguptavivek/emr-controller';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { useContainerWidth } from './l4-lists-shared';
import { timelineTarget } from './l4-lists.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; each is overridable through the `labels` prop. */
const DEFAULTS = {
  ariaLabel: 'Patient encounters',
  current: 'selected',
};
export type TimelineLabels = typeof DEFAULTS;

/** Glyph per tone so the marker never relies on colour alone. */
const GLYPH = { neutral: '●', info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' } as const;

/**
 * L4 timeline. Controlled: events arrive ordered; selecting one emits `eventSelected` (Angular's
 * `eventSelected` output as a `TimelineIntent`). Kind tone colours the marker, but the kind label
 * is always printed beside the date. Horizontal falls back to vertical below `horizontalFrom` px.
 * Web: roving tab stop with Arrow/Home/End; native: list semantics only.
 */
export function EmrTimeline({ events, kinds, selectedId, orientation = 'vertical', onIntent, labels, horizontalFrom = 480 }: {
  events: readonly TimelineEvent[];
  kinds: readonly TimelineKindDefinition[];
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  onIntent: (intent: TimelineIntent) => void;
  labels?: Partial<TimelineLabels>;
  horizontalFrom?: number;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const horizontal = orientation === 'horizontal' && (width === null || width >= horizontalFrom);
  const refs = useRef<({ focus(): void } | null)[]>([]);
  const stop = events.some(e => e.id === selectedId) ? events.findIndex(e => e.id === selectedId) : 0;
  const kindOf = (id: string) => kinds.find(k => k.id === id);
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = timelineTarget(e.key, index, events.length, horizontal);
    if (target === null) return;
    e.preventDefault();
    refs.current[target]?.focus();
  };

  return (
    <View role="list" aria-label={l.ariaLabel} onLayout={onLayout} style={horizontal ? styles.horizontal : styles.vertical}>
      {events.map((event, i) => {
        const kind = kindOf(event.kindId);
        const tone = kind?.tone ?? 'neutral';
        const c = toneColors(t, tone);
        const selected = event.id === selectedId;
        const kindLabel = kind?.label ?? event.kindId;
        return (
          <View key={event.id} role="listitem" style={horizontal ? styles.itemH : undefined}>
            <Pressable ref={el => { refs.current[i] = el; }} role="button" aria-current={selected ? 'true' : undefined}
              aria-label={[event.dateLabel, kindLabel, event.title, event.summary, selected ? l.current : ''].filter(Boolean).join(', ')}
              onPress={() => onIntent({ type: 'eventSelected', eventId: event.id })}
              {...webProps({ tabIndex: i === stop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
              style={({ focused }: PressState) => [styles.event, focusRing(t, focused), {
                minHeight: t.controlHeight, borderColor: selected ? t.primary : t.border, borderWidth: selected ? 2 : 1,
                backgroundColor: selected ? t.primarySoft : t.surface,
              }]}>
              <View aria-hidden style={[styles.dot, { backgroundColor: c.backgroundColor, borderColor: c.color }]}>
                <Text style={{ color: c.color, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>{GLYPH[tone]}</Text>
              </View>
              <View style={styles.text}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{event.dateLabel} · {kindLabel}</Text>
                <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(t.weightBold) }}>{event.title}</Text>
                {event.summary ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{event.summary}</Text> : null}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: { gap: 8 },
  horizontal: { flexDirection: 'row', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' },
  itemH: { flexGrow: 1, flexBasis: 200, minWidth: 0 },
  event: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8, alignItems: 'flex-start' },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
