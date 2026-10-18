'use client';

import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrTone } from '@drguptavivek/emr-controller';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { interactiveLabelDefaults, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';
import { likertPoints, vasKeyValue, vasPercent, vasTicks, vasValueFromOffset } from './l1-interactive.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

export interface EmrScaleAnchor {
  /** Value this label is anchored to (typically min or max). */
  value: number;
  label: string;
  /** Read by screen readers in place of the visible label. */
  assistiveLabel?: string;
}

interface ScaleFrameProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  labels: InteractiveLabels;
}

function Legend({ label, required, labels }: { label: string; required?: boolean; labels: InteractiveLabels }) {
  const t = useEmrTheme();
  return (
    <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
      {label}{required ? ` * (${labels.required})` : ''}
    </Text>
  );
}

function Messages({ error, hint, disabled }: { error?: string; hint?: string; disabled?: boolean }) {
  const t = useEmrTheme();
  if (!error && (disabled || !hint)) return null;
  return (
    <Text role={error ? 'alert' : undefined} aria-live="polite"
      style={{ color: error ? t.danger : t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{error || hint}</Text>
  );
}

/**
 * L1 Likert / numeric scale: radiogroup of pips. The selected pip's colour comes from the
 * controller-supplied `tone`; selection is also shown by a heavier border and bold text.
 */
export function EmrLikert({ label, hint, error, min = 0, max = 10, value, anchors = [], disabled, readOnly, required, tone, onValueChange, labels }: Omit<ScaleFrameProps, 'labels'> & {
  min?: number;
  max?: number;
  value: number | null | undefined;
  anchors?: readonly EmrScaleAnchor[];
  readOnly?: boolean;
  tone?: EmrTone;
  onValueChange: (value: number) => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const points = useMemo(() => likertPoints(min, max), [min, max]);
  const minAnchor = anchors.find(a => a.value === min);
  const maxAnchor = anchors.find(a => a.value === max);
  const interactive = !disabled && !readOnly;
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, (value ?? (delta > 0 ? min - 1 : max + 1)) + delta));
    if (interactive && next !== value) onValueChange(next);
  };
  const pipText = (point: number) => {
    const a = anchors.find(x => x.value === point);
    return l.likertOption(point, a?.assistiveLabel ?? a?.label ?? String(point));
  };
  return (
    <View role="radiogroup" aria-label={label} aria-required={required} aria-readonly={readOnly} aria-disabled={disabled} style={styles.frame}>
      <Legend label={label} required={required} labels={l} />
      <View style={styles.track}>
        {points.map(point => {
          const selected = value === point;
          const colors = selected && tone ? toneColors(t, tone) : null;
          return (
            <Pressable key={point} role="radio" aria-checked={selected} aria-label={pipText(point)} aria-disabled={disabled} aria-readonly={readOnly}
              disabled={disabled} onPress={interactive ? () => onValueChange(point) : undefined}
              accessibilityActions={[{ name: 'increment', label: l.increment }, { name: 'decrement', label: l.decrement }]}
              onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'increment') step(1); else if (e.nativeEvent.actionName === 'decrement') step(-1); }}
              style={({ focused }: PressState) => [styles.pip, focusRing(t, focused), {
                minHeight: t.controlHeight, minWidth: t.controlHeight,
                borderColor: selected ? colors?.color ?? t.primary : t.border, borderWidth: selected ? 3 : 1,
                backgroundColor: selected ? colors?.backgroundColor ?? t.primarySoft : t.surface, opacity: disabled ? 0.6 : 1,
              }]}>
              <Text aria-hidden style={{ color: colors?.color ?? t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>{point}</Text>
            </Pressable>
          );
        })}
      </View>
      {!disabled && (minAnchor || maxAnchor) ? (
        <View aria-hidden style={styles.anchors}>
          <Text style={[styles.anchor, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{minAnchor?.label}</Text>
          <Text style={[styles.anchor, styles.anchorEnd, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{maxAnchor?.label}</Text>
        </View>
      ) : null}
      <Messages error={error} hint={hint} disabled={disabled} />
    </View>
  );
}

const TRACK_THICKNESS = 4;
const THUMB = 28;
const VERTICAL_LENGTH = 240;

/**
 * L1 visual analogue scale: a ruler marked by tap/drag (responder props, no dependencies) or,
 * on web, the keyboard. Native uses accessibility increment/decrement actions. It derives no
 * severity: anchors, tone and `valueText` come from the controller.
 */
export function EmrVas({ label, hint, error, min = 0, max = 100, value, step = 1, majorInterval = 10, minorInterval = 2, orientation = 'horizontal', anchors = [], readOnly, disabled, required, tone, valueText, onValueChange, labels }: Omit<ScaleFrameProps, 'labels'> & {
  min?: number;
  max?: number;
  value: number | null | undefined;
  /** Snap granularity; 0 records the raw continuous position. */
  step?: number;
  majorInterval?: number;
  minorInterval?: number;
  orientation?: 'horizontal' | 'vertical';
  anchors?: readonly EmrScaleAnchor[];
  readOnly?: boolean;
  tone?: EmrTone;
  /** Spoken value, e.g. "72 out of 100". */
  valueText?: string;
  onValueChange: (value: number | null) => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const vertical = orientation === 'vertical';
  const interactive = !disabled && !readOnly;
  const [length, setLength] = useState(0);
  const [focused, setFocused] = useState(false);
  const start = useRef(0);
  // PanResponder is built once; it reads the latest props through this ref.
  const live = useRef({ min, max, step, vertical, length, interactive, value, onValueChange });
  live.current = { min, max, step, vertical, length, interactive, value, onValueChange };
  const emit = (offset: number) => {
    const c = live.current;
    const next = vasValueFromOffset(offset, c.length, c.min, c.max, c.step, c.vertical);
    if (next !== c.value) c.onValueChange(next);
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => live.current.interactive,
    onMoveShouldSetPanResponder: () => live.current.interactive,
    // A scroll parent must not steal a drag that is already marking the scale.
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => {
      start.current = live.current.vertical ? e.nativeEvent.locationY : e.nativeEvent.locationX;
      emit(start.current);
    },
    onPanResponderMove: (_e, g) => emit(start.current + (live.current.vertical ? g.dy : g.dx)),
  })).current;
  const ticks = useMemo(() => vasTicks(min, max, majorInterval, minorInterval), [min, max, majorInterval, minorInterval]);
  const percent = value == null ? null : vasPercent(value, min, max);
  const accent = tone ? toneColors(t, tone).color : t.primary;
  const minAnchor = anchors.find(a => a.value === min);
  const maxAnchor = anchors.find(a => a.value === max);
  const change = (key: string) => {
    const next = vasKeyValue(key, value ?? null, min, max, step, majorInterval);
    if (next !== null && next !== value) onValueChange(next);
    return next !== null;
  };
  const pos = (p: number) => (vertical ? { bottom: `${p}%` as const } : { left: `${p}%` as const });
  const thickness = Math.max(t.controlHeight, THUMB);
  return (
    <View style={styles.frame}>
      <Legend label={label} required={required} labels={l} />
      <View style={[styles.vasFrame, vertical && styles.vasFrameVertical]}>
        <View
          role="slider"
          aria-label={label}
          aria-orientation={orientation}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-valuetext={valueText}
          aria-readonly={readOnly}
          aria-disabled={disabled}
          aria-invalid={error ? true : undefined}
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value ?? undefined, text: valueText }}
          accessibilityActions={[{ name: 'increment', label: l.increment }, { name: 'decrement', label: l.decrement }]}
          onAccessibilityAction={e => { if (interactive) change(e.nativeEvent.actionName); }}
          onLayout={e => setLength(vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...webProps({
            tabIndex: disabled ? undefined : 0,
            onKeyDown: (e: WebKeyEvent) => { if (interactive && change(e.key)) e.preventDefault(); },
          })}
          {...pan.panHandlers}
          style={[vertical ? { width: thickness, height: VERTICAL_LENGTH } : { height: thickness, width: '100%' }, focusRing(t, focused), { opacity: disabled ? 0.6 : 1 }]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[vertical ? styles.ruleV : styles.ruleH, { backgroundColor: t.border }]} />
            {ticks.map(tick => (
              <View key={tick.value} style={[styles.tickBox, pos(tick.percent), vertical ? styles.tickBoxV : styles.tickBoxH]}>
                <View style={{ backgroundColor: t.textMuted, ...(vertical ? { height: 1, width: tick.major ? 16 : 8 } : { width: 1, height: tick.major ? 16 : 8 }) }} />
                {tick.label !== null ? <Text style={[styles.tickLabel, { color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }]}>{tick.label}</Text> : null}
              </View>
            ))}
            {percent !== null ? (
              // Mark = filled thumb with the numeric value inside: position and value are text, not colour alone.
              <View style={[styles.thumb, pos(percent), vertical ? styles.thumbV : styles.thumbH, { backgroundColor: accent, borderColor: t.surface }]}>
                <Text style={{ color: t.surface, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{value}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {minAnchor || maxAnchor ? (
          <View aria-hidden style={vertical ? styles.anchorsV : styles.anchors}>
            <Text style={[styles.anchor, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{vertical ? maxAnchor?.label : minAnchor?.label}</Text>
            <Text style={[styles.anchor, !vertical && styles.anchorEnd, { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }]}>{vertical ? minAnchor?.label : maxAnchor?.label}</Text>
          </View>
        ) : null}
      </View>
      <Messages error={error} hint={hint} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6 },
  track: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pip: { flexGrow: 1, flexBasis: 0, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  anchors: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  anchorsV: { justifyContent: 'space-between', height: VERTICAL_LENGTH, flexShrink: 1 },
  anchor: { flexShrink: 1 },
  anchorEnd: { textAlign: 'right' },
  vasFrame: { gap: 4 },
  vasFrameVertical: { flexDirection: 'row', gap: 12 },
  ruleH: { position: 'absolute', left: 0, right: 0, top: '50%', height: TRACK_THICKNESS, marginTop: -TRACK_THICKNESS / 2, borderRadius: 2 },
  ruleV: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: TRACK_THICKNESS, marginLeft: -TRACK_THICKNESS / 2, borderRadius: 2 },
  tickBox: { position: 'absolute', alignItems: 'center' },
  tickBoxH: { top: '50%', marginTop: 4, width: 40, marginLeft: -20 },
  tickBoxV: { left: '50%', marginLeft: 4, flexDirection: 'row', gap: 4, height: 20, marginBottom: -10 },
  tickLabel: { textAlign: 'center' },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  thumbH: { top: '50%', marginTop: -THUMB / 2, marginLeft: -THUMB / 2 },
  thumbV: { left: '50%', marginLeft: -THUMB / 2, marginBottom: -THUMB / 2 },
});
