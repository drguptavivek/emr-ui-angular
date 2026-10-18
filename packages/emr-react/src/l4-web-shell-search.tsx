'use client';

import { useEffect, useId, useRef, useState, type ElementRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { textInputKeys, webProps, type WebKeyEvent } from './l1-interactive-shared';
import { ThemedInput } from './inputs-core';
import { locateHighlight, moveHighlight } from './l4-web-shell-search.logic';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

export interface EmrSearchResult { id: string; label: string; sub?: string; badge?: EmrBadge }
export interface EmrSearchGroup { id: string; label: string; results: readonly EmrSearchResult[] }

export interface EmrTopBarSearchLabels { search: string; searchPlaceholder: string; noResults: string; searching: string }

/** Delay before a blur closes the overlay, so a press on an option (which blurs the input first) registers. */
const BLUR_CLOSE_MS = 150;

/**
 * Top-bar search field with a floating, grouped results overlay anchored under the field.
 * Open state is controlled; the highlight is local (virtual focus via aria-activedescendant, the input keeps DOM focus).
 */
export function EmrTopBarSearch({ query, open, loading, groups, labels, onQueryChange, onSearchRequested, onOpenRequested, onCloseRequested, onSelect }: {
  query: string;
  open: boolean;
  loading?: boolean;
  groups: readonly EmrSearchGroup[];
  labels: EmrTopBarSearchLabels;
  onQueryChange: (query: string) => void;
  onSearchRequested: () => void;
  onOpenRequested: () => void;
  onCloseRequested: () => void;
  onSelect: (groupId: string, id: string) => void;
}) {
  const t = useEmrTheme();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputRef = useRef<ElementRef<typeof TextInput>>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressOpen = useRef(false);
  const [highlight, setHighlight] = useState(-1);
  const sizes = groups.map(g => g.results.length);
  const count = sizes.reduce((a, b) => a + b, 0);
  const active = highlight < count ? highlight : -1;
  const hasContent = count > 0 || !!loading || query.trim() !== '';
  const showing = open && hasContent;
  const optionId = (flat: number) => `${baseId}-o${flat}`;
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };

  const clearBlur = () => { if (blurTimer.current) { clearTimeout(blurTimer.current); blurTimer.current = null; } };
  useEffect(() => clearBlur, []);
  useEffect(() => { setHighlight(-1); }, [query, groups]);
  useEffect(() => {
    if (Platform.OS !== 'web' || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
  });

  const select = (groupIndex: number, resultIndex: number) => {
    clearBlur();
    const g = groups[groupIndex];
    onSelect(g.id, g.results[resultIndex].id);
  };
  const close = () => {
    onCloseRequested();
    suppressOpen.current = true;
    inputRef.current?.focus();
    setTimeout(() => { suppressOpen.current = false; }, 0);
  };
  const onKeyDown = (e: WebKeyEvent) => {
    if (e.key === 'Escape') { if (open) { e.preventDefault(); close(); } return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!open) { onOpenRequested(); return; }
    setHighlight(h => moveHighlight(h < count ? h : -1, e.key, count));
  };
  const onSubmit = () => {
    const at = locateHighlight(sizes, active);
    if (at) select(at.group, at.result); else onSearchRequested();
  };

  let flat = 0;
  return (
    <View style={styles.bar}>
      <View style={styles.field}>
        <ThemedInput ref={inputRef} role="combobox" aria-label={labels.search} aria-expanded={showing} aria-controls={listId} aria-autocomplete="list" autoComplete="off" autoCorrect={false}
          value={query} placeholder={labels.searchPlaceholder}
          onChangeText={onQueryChange} onSubmitEditing={onSubmit}
          onFocus={() => { clearBlur(); if (!suppressOpen.current) onOpenRequested(); }}
          onBlur={() => { clearBlur(); blurTimer.current = setTimeout(onCloseRequested, BLUR_CLOSE_MS); }}
          blurOnSubmit={false} {...(textInputKeys(onKeyDown) as object)}
          {...webProps({ 'aria-activedescendant': active >= 0 ? optionId(active) : undefined })} />
        {showing ? (
          <View nativeID={listId} role="list" {...webProps({ role: 'listbox' })} aria-label={labels.search}
            style={[styles.overlay, { backgroundColor: t.surface, borderColor: t.border }]}>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              {loading ? <Text style={[text, { color: t.textMuted, padding: 12 }]}>{labels.searching}</Text> : null}
              {!loading && count === 0 ? <Text style={[text, { color: t.textMuted, padding: 12 }]}>{labels.noResults}</Text> : null}
              {groups.map(g => (g.results.length === 0 ? null : (
                <View key={g.id} role="group" aria-label={g.label}>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t), paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: t.surfaceSoft }}>{g.label}</Text>
                  {g.results.map(r => {
                    const index = flat++;
                    const gi = groups.indexOf(g);
                    const ri = g.results.indexOf(r);
                    const on = index === active;
                    return (
                      <Pressable key={r.id} nativeID={optionId(index)} role="option" aria-selected={on}
                        onPressIn={clearBlur} onPress={() => select(gi, ri)}
                        style={({ pressed, focused }: PressState) => [styles.option, focusRing(t, focused), { minHeight: t.controlHeight, backgroundColor: on ? t.primarySoft : pressed ? t.surfaceRaised : t.surface }]}>
                        <View style={styles.optionText}>
                          <Text style={[text, { fontWeight: fontWeight(t.weightBold) }]}>{r.label}</Text>
                          {r.sub ? <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{r.sub}</Text> : null}
                        </View>
                        {r.badge ? <EmrBadgeView badge={r.badge} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )))}
            </ScrollView>
          </View>
        ) : null}
      </View>
      <EmrButton variant="outline" label={loading ? labels.searching : labels.search} disabled={loading} onPress={onSearchRequested} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { flex: 1, minWidth: 0, position: 'relative' },
  overlay: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 1000, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  scroll: { maxHeight: 320 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  optionText: { flex: 1, minWidth: 0 },
});
