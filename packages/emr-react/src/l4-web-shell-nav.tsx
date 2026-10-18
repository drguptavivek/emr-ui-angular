'use client';

import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { LeftNavIntent, NavItem } from '@drguptavivek/emr-controller';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import { navKeyAction, tabStopIndex, visibleRows } from './l4-web-shell.logic';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings. Every key is overridable via `labels`. */
const DEFAULTS = { navigation: 'Primary navigation' };

/** The nav never collapses to a rail (the shell hides it instead), so that controller intent is not emitted. */
export type EmrLeftNavIntent = Exclude<LeftNavIntent, { type: 'collapseToggleRequested' }>;

/**
 * L4. Port of EmrLeftNav: a nested, expandable tree that renders exactly the items it is given
 * (role filtering is the controller's job). Parent rows request expansion; leaves request selection.
 * On web: one tab stop with roving focus; Up/Down/Home/End move, Right/Left open/close or enter/leave a branch,
 * Enter activates through the Pressable. Native gets a plain list.
 */
export function EmrLeftNav({ items, activeId = '', expandedIds, labels, onIntent }: {
  items: readonly NavItem[];
  activeId?: string;
  expandedIds: readonly string[];
  labels?: Partial<typeof DEFAULTS>;
  onIntent: (intent: EmrLeftNavIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const web = Platform.OS === 'web';
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<({ focus?: () => void } | null)[]>([]);
  const rows = visibleRows(items, expandedIds);
  const stop = tabStopIndex(rows, focusedId, activeId);

  const activate = (index: number) => {
    const { item, hasChildren, expanded } = rows[index];
    if (hasChildren) onIntent({ type: 'itemExpansionRequested', itemId: item.id, expanded: !expanded });
    else onIntent({ type: 'itemSelected', itemId: item.id });
  };
  const onKey = (e: WebKeyEvent, index: number) => {
    const action = navKeyAction(e.key, rows, index);
    if (!action) return;
    e.preventDefault();
    if (action.type === 'focus') refs.current[action.index]?.focus?.();
    else onIntent({ type: 'itemExpansionRequested', itemId: action.id, expanded: action.expanded });
  };

  return (
    <View role={web ? 'tree' : 'list'} aria-label={l.navigation} style={styles.list}>
      {rows.map(({ item, level, hasChildren, expanded }, i) => {
        const active = item.id === activeId;
        return (
          <Pressable key={item.id} ref={el => { refs.current[i] = el; }} disabled={item.disabled}
            role={web ? 'treeitem' : undefined} aria-level={level + 1} aria-expanded={hasChildren ? expanded : undefined}
            aria-current={active ? 'page' : undefined} aria-disabled={item.disabled}
            onPress={() => activate(i)} onFocus={() => setFocusedId(item.id)}
            {...webProps({ tabIndex: i === stop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
            style={({ pressed, focused }: PressState) => [styles.row, focusRing(t, focused), {
              minHeight: t.controlHeight, paddingLeft: 12 + level * 16,
              backgroundColor: active ? t.primarySoft : pressed ? t.surfaceRaised : 'transparent', opacity: item.disabled ? 0.5 : 1,
            }]}>
            <Text aria-hidden style={{ width: 16, color: t.textMuted, fontSize: t.textSm }}>{hasChildren ? (expanded ? '▾' : '▸') : ''}</Text>
            <Text numberOfLines={1} style={[styles.label, {
              color: active ? t.primary : t.text, fontSize: t.textMd, fontFamily: fontFamily(t),
              fontWeight: fontWeight(active ? t.weightBold : t.weightRegular),
            }]}>{item.label}</Text>
            {item.badge ? <EmrBadgeView badge={item.badge} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 12, borderRadius: 6 },
  label: { flex: 1 },
});
