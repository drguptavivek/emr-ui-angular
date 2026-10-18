'use client';

import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge, EmrOption, TimeAxisIntent, TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrButton, EmrOptionChip } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { interactiveLabelDefaults, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';
import { clampedTarget, rovingTarget, tabStopTick } from './l1-interactive.logic';

export { EmrLikert, EmrVas, type EmrScaleAnchor } from './l1-interactive-scales';
export { interactiveLabelDefaults, type InteractiveLabels } from './l1-interactive-shared';

type PressState = PressableStateCallbackType & { focused?: boolean };
type FocusRef = ({ focus(): void } | null)[];

/** L1 tablist. On web, Left/Right/Home/End move selection and focus (wrapping, skipping disabled tabs). */
export function EmrTabs({ tabs, active, onTabChange, ariaLabel, labels }: {
  tabs: readonly EmrOption[];
  active: string;
  onTabChange: (value: string) => void;
  ariaLabel?: string;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const refs = useRef<FocusRef>([]);
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = rovingTarget(e.key, index, tabs.map(tab => !tab.disabled));
    if (target === null) return;
    e.preventDefault();
    onTabChange(tabs[target].value);
    refs.current[target]?.focus();
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View role="tablist" aria-label={ariaLabel ?? l.tabsAria} style={[styles.tabs, { borderBottomColor: t.border }]}>
        {tabs.map((tab, i) => {
          const selected = tab.value === active;
          return (
            <Pressable key={tab.value} ref={el => { refs.current[i] = el; }} role="tab" aria-selected={selected} aria-disabled={tab.disabled}
              disabled={tab.disabled} onPress={() => onTabChange(tab.value)}
              {...webProps({ tabIndex: selected ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
              style={({ focused }: PressState) => [styles.tab, focusRing(t, focused), {
                minHeight: t.controlHeight, borderBottomWidth: 3, borderBottomColor: selected ? t.primary : 'transparent', opacity: tab.disabled ? 0.6 : 1,
              }]}>
              <Text style={{ color: selected ? t.primary : t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(selected ? t.weightBold : t.weightRegular) }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * L1 search-select. Results come from props; it only emits query changes and requests, never fetches.
 * On web ArrowDown in the input enters the list; Arrow/Home/End move; Escape asks to close.
 */
export function EmrSearchSelect({ label, labelHidden, placeholder, query, options, selected, multiple, open, loading, disabled, error, emptyMessage, labels,
  onQueryChange, onSearchRequested, onOpenRequested, onCloseRequested, onOptionSelect, onRemoveRequested }: {
  label?: string;
  /** Keep the label for assistive tech but not on screen. */
  labelHidden?: boolean;
  placeholder?: string;
  query: string;
  options: readonly EmrOption[];
  selected: readonly EmrOption[];
  multiple?: boolean;
  open: boolean;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
  labels?: Partial<InteractiveLabels>;
  onQueryChange: (query: string) => void;
  onSearchRequested: () => void;
  onOpenRequested: () => void;
  onCloseRequested: () => void;
  onOptionSelect: (value: string) => void;
  onRemoveRequested: (value: string) => void;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const name = label ?? l.searchLabel;
  const refs = useRef<FocusRef>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0);
  const focusAt = (pos: number) => refs.current[enabled[Math.max(0, Math.min(pos, enabled.length - 1))]]?.focus();
  const onInputKey = (e: WebKeyEvent) => {
    if (e.key === 'ArrowDown' && open && enabled.length) { e.preventDefault(); focusAt(0); }
    else if (e.key === 'Escape') onCloseRequested();
  };
  const onOptionKey = (e: WebKeyEvent, index: number) => {
    if (e.key === 'Escape') { onCloseRequested(); return; }
    const target = clampedTarget(e.key, enabled.indexOf(index), enabled.length);
    if (target === null) return;
    e.preventDefault();
    focusAt(target);
  };
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  return (
    <View style={styles.stack}>
      {labelHidden ? null : <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{name}</Text>}
      {multiple && selected.length ? (
        <View role="list" aria-label={l.selectedOptions} style={styles.wrap}>
          {selected.map(item => (
            <View key={item.value} role="listitem" style={[styles.selectedChip, { backgroundColor: t.neutralSoft, borderColor: t.border }]}>
              <Text style={text}>{item.label}</Text>
              <EmrButton small variant="ghost" label={l.remove} accessibilityLabel={l.removeItem(item.label)} disabled={disabled} onPress={() => onRemoveRequested(item.value)} />
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.bar}>
        <View style={styles.grow}>
          <ThemedInput role="combobox" aria-label={name} aria-expanded={open} aria-autocomplete="list" autoComplete="off" autoCorrect={false}
            value={query} placeholder={placeholder ?? l.searchPlaceholder} editable={!disabled} invalid={!!error}
            onChangeText={onQueryChange} onFocus={onOpenRequested} onSubmitEditing={onSearchRequested}
            {...webProps({ onKeyDown: onInputKey })} />
        </View>
        <EmrButton variant="outline" label={loading ? l.searching : l.searchButton} disabled={disabled || loading} onPress={onSearchRequested} />
      </View>
      {error ? <Text role="alert" style={{ color: t.danger, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{error}</Text> : null}
      {open ? (
        <View role="list" {...webProps({ role: 'listbox' })} aria-multiselectable={multiple} aria-label={name} style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }]}>
          {!loading && options.length === 0 ? <Text style={[text, { color: t.textMuted, padding: 12 }]}>{emptyMessage ?? l.noMatches}</Text> : null}
          {options.map((option, i) => {
            const isSelected = selected.some(s => s.value === option.value);
            return (
              <Pressable key={option.value} ref={el => { refs.current[i] = el; }} role="option" aria-selected={isSelected} aria-disabled={option.disabled}
                disabled={option.disabled} onPress={() => onOptionSelect(option.value)}
                {...webProps({ onKeyDown: (e: WebKeyEvent) => onOptionKey(e, i) })}
                style={({ pressed, focused }: PressState) => [styles.option, focusRing(t, focused), {
                  minHeight: t.controlHeight, backgroundColor: isSelected ? t.primarySoft : pressed ? t.surfaceRaised : t.surface, opacity: option.disabled ? 0.6 : 1,
                }]}>
                <Text style={[text, { fontWeight: fontWeight(t.weightBold) }]}>{isSelected ? '✓ ' : ''}{option.label}</Text>
                {option.description ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{option.description}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export interface EmrStage {
  readonly id: string;
  readonly label: string;
  readonly status?: EmrBadge;
  readonly description?: string;
}

/**
 * L1 numbered stages. Mechanical: caller supplies stages, the active id and any status badge.
 * `readOnly` renders plain list items. Otherwise one tab stop (focused, else active, else first);
 * on web arrows/Home/End move focus.
 */
export function EmrStageStepper({ stages, activeId, orientation = 'horizontal', readOnly, ariaLabel, onStageSelect, labels }: {
  stages: readonly EmrStage[];
  activeId?: string;
  orientation?: 'horizontal' | 'vertical';
  readOnly?: boolean;
  ariaLabel?: string;
  onStageSelect?: (id: string) => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<FocusRef>([]);
  const tabStop = tabStopTick(stages, focusedId, activeId) ?? stages[0]?.id;
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = clampedTarget(e.key, index, stages.length);
    if (target === null) return;
    e.preventDefault();
    refs.current[target]?.focus();
  };
  const vertical = orientation === 'vertical';
  return (
    <View role="navigation" aria-label={ariaLabel ?? l.stagesAria}>
      <View role="list" style={[styles.stages, vertical && styles.stagesV, { borderColor: t.border, backgroundColor: t.surfaceSlate }]}>
        {stages.map((stage, i) => {
          const active = stage.id === activeId;
          const badge = stage.status ? toneColors(t, stage.status.tone) : null;
          const body = (
            <>
              <View aria-hidden style={[styles.number, { backgroundColor: t.neutralSoft }]}>
                <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{i + 1}</Text>
              </View>
              <View style={styles.grow}>
                <Text style={{ color: active ? t.primary : t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(active ? t.weightBold : t.weightRegular) }}>{stage.label}</Text>
                {stage.description ? <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{stage.description}</Text> : null}
              </View>
              {stage.status && badge ? (
                <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
                  <Text style={{ color: badge.color, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{stage.status.label}</Text>
                </View>
              ) : null}
            </>
          );
          const a11yLabel = [`${i + 1}. ${stage.label}`, stage.description, stage.status ? l.stageStatus(stage.status.label, stage.status.assistiveText) : null].filter(Boolean).join(', ');
          const frame = [styles.stage, { minHeight: t.controlHeight, borderBottomWidth: 3, borderBottomColor: active ? t.primary : 'transparent', backgroundColor: active ? t.surfaceAccent : 'transparent' }];
          return (
            <View key={stage.id} role="listitem" style={vertical ? undefined : styles.stageItem}>
              {readOnly ? (
                <View aria-current={active ? 'step' : undefined} accessible aria-label={a11yLabel} style={frame}>{body}</View>
              ) : (
                <Pressable ref={el => { refs.current[i] = el; }} aria-current={active ? 'step' : undefined} aria-label={a11yLabel}
                  onPress={() => onStageSelect?.(stage.id)} onFocus={() => setFocusedId(stage.id)}
                  {...webProps({ tabIndex: stage.id === tabStop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
                  style={({ focused }: PressState) => [...frame, focusRing(t, focused)]}>{body}</Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const TICK_WIDTH = 88;

/**
 * L1 time axis. The controller supplies ticks and moves the window on intent; this never computes
 * times. The current tick says "Current" in text. On web Left/Right/Home/End move focus; press selects.
 */
export function EmrTimeAxis({ model, headingId, onIntent, labels }: {
  model: TimeAxisViewModel;
  headingId?: string;
  onIntent: (intent: TimeAxisIntent) => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<FocusRef>([]);
  const tabStop = tabStopTick(model.ticks, focusedId, model.selectedTickId);
  const font = { fontFamily: fontFamily(t) };
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = clampedTarget(e.key, index, model.ticks.length);
    if (target === null) return;
    e.preventDefault();
    setFocusedId(model.ticks[target].id);
    refs.current[target]?.focus();
  };
  return (
    <View nativeID={headingId} style={styles.stack}>
      <View style={styles.axisHead}>
        <Text role="heading" style={[font, { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }]}>{model.title || l.timeAxisTitle}</Text>
        <View style={styles.wrap}>
          {!model.readOnly && model.steps?.length ? (
            <View role="radiogroup" aria-label={l.step} style={styles.wrap}>
              {model.steps.map(s => (
                <EmrOptionChip key={s.id} label={s.label} selected={s.id === model.selectedStepId} onPress={() => onIntent({ type: 'stepChangeRequested', stepId: s.id })} />
              ))}
            </View>
          ) : model.stepLabel ? <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{l.stepValue(model.stepLabel)}</Text> : null}
          {model.readOnly ? null : (
            <>
              <EmrButton small variant="outline" label={`‹ ${l.earlier}`} accessibilityLabel={l.earlier} disabled={!model.canShiftEarlier} onPress={() => onIntent({ type: 'shiftEarlierRequested' })} />
              <EmrButton small variant="outline" label={`${l.later} ›`} accessibilityLabel={l.later} disabled={!model.canShiftLater} onPress={() => onIntent({ type: 'shiftLaterRequested' })} />
            </>
          )}
        </View>
      </View>
      {!model.ticks.length ? (
        <Text style={[font, { color: t.textMuted, fontSize: t.textSm, fontStyle: 'italic' }]}>{l.noTimes}</Text>
      ) : (
        <ScrollView horizontal style={[styles.axisScroll, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <View role="list" {...(model.readOnly ? null : webProps({ role: 'listbox' }))} aria-orientation="horizontal" aria-label={model.title || l.timeAxisTitle} style={styles.strip}>
            {model.ticks.map((tick, i) => {
              const sel = tick.id === model.selectedTickId;
              const body = (
                <>
                  <Text style={[font, { color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), textAlign: 'center' }]}>{tick.label}</Text>
                  {tick.sublabel ? <Text style={[font, { color: t.textMuted, fontSize: t.textXs, textAlign: 'center' }]}>{tick.sublabel}</Text> : null}
                  {tick.current ? <Text style={[font, { color: t.primary, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), textTransform: 'uppercase' }]}>{l.current}</Text> : null}
                </>
              );
              const frame = [styles.tick, { minHeight: t.controlHeight, borderColor: sel ? t.primary : t.border, borderWidth: sel ? 2 : 0, borderRightWidth: sel ? 2 : 1, borderLeftWidth: sel ? 2 : tick.current ? 3 : 0,
                backgroundColor: sel || tick.current ? t.primarySoft : 'transparent' }];
              const a11y = [tick.label, tick.sublabel, tick.current ? l.current : null, model.readOnly && sel ? l.selected : null].filter(Boolean).join(', ');
              return model.readOnly ? (
                <View key={tick.id} role="listitem" accessible aria-label={a11y} aria-current={tick.current ? 'time' : undefined} style={frame}>{body}</View>
              ) : (
                <Pressable key={tick.id} ref={el => { refs.current[i] = el; }} role="option" aria-selected={sel} aria-current={tick.current ? 'time' : undefined} aria-label={a11y}
                  onPress={() => onIntent({ type: 'tickSelected', tickId: tick.id })} onFocus={() => setFocusedId(tick.id)}
                  {...webProps({ tabIndex: tick.id === tabStop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
                  style={({ focused }: PressState) => [...frame, focusRing(t, focused)]}>{body}</Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { paddingHorizontal: 16, justifyContent: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingLeft: 12 },
  panel: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  option: { justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1 },
  stagesV: { flexDirection: 'column', flexWrap: 'nowrap' },
  stageItem: { flexGrow: 1, flexBasis: 180 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  axisHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  axisScroll: { borderWidth: 1, borderRadius: 8 },
  strip: { flexDirection: 'row' },
  tick: { width: TICK_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 1, paddingVertical: 4, paddingHorizontal: 6 },
});
