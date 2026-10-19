'use client';

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  EmrAppShellIntent,
  EmrAppShellModel,
  EmrTopBarIntent,
  EmrTopBarModel,
} from '@drguptavivek/emr-controller';
import { EmrTopBarSearch } from './l4-web-shell-search';
import { EmrLeftNav } from './l4-web-shell-nav';
import { EmrSheet } from './l4-shell-sheet';
import { useContainerWidth } from './l4-lists-shared';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export * from './l4-web-shell-nav';
export type { EmrSearchGroup, EmrSearchResult } from './l4-web-shell-search';
export type {
  EmrAppShellIntent,
  EmrAppShellModel,
  EmrTopBarIntent,
  EmrTopBarModel,
};

/** English fallbacks for built-in strings. Every key is overridable via `labels`. */
const DEFAULTS = {
  openNavigation: 'Open navigation',
  navigationTitle: 'Navigation',
  navigation: 'Primary navigation',
  search: 'Search',
  searchPlaceholder: 'Search patients, barcodes, records',
  noResults: 'No matching results',
  searching: 'Searching…',
  userMenu: 'User menu',
  main: 'Main content',
  sidePanel: 'Side panel',
};
type Labels = Partial<typeof DEFAULTS>;

/**
 * L4. Product title, global search and user-menu trigger. Results arrive grouped from props and render in a floating overlay
 * under the field (the bar height never changes). The search button re-emits queryChanged with the current query (Enter does too).
 */
export function EmrTopBar({ model, labels, onIntent }: { model: EmrTopBarModel; labels?: Labels; onIntent: (intent: EmrTopBarIntent) => void }) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { query, open, loading, groups } = model.search;
  return (
    <View role="banner" style={[styles.top, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      {model.showNavToggle ? <EmrButton small variant="ghost" label="☰" accessibilityLabel={l.openNavigation} onPress={() => onIntent({ type: 'navToggleRequested' })} /> : null}
      {(model.titleSlot as ReactNode) ?? (model.title ? <Text role="heading" style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{model.title}</Text> : null)}
      <View style={styles.search}>
        <EmrTopBarSearch query={query} open={open} loading={loading} groups={groups} labels={l}
          onQueryChange={q => onIntent({ type: 'queryChanged', query: q })}
          onSearchRequested={() => onIntent({ type: 'queryChanged', query })}
          onOpenRequested={() => onIntent({ type: 'searchOpenRequested' })}
          onCloseRequested={() => onIntent({ type: 'searchCloseRequested' })}
          onSelect={(groupId, id) => onIntent({ type: 'resultSelected', groupId, id })} />
      </View>
      <EmrButton variant="outline" label={model.userLabel ?? l.userMenu} accessibilityLabel={l.userMenu} onPress={() => onIntent({ type: 'menuRequested' })} />
    </View>
  );
}

/**
 * L4. Port of EmrAppShell: top bar, nav, main content, optional right panel.
 * At container width >= `wideBreakpoint` (default 1024) the nav is a persistent column;
 * below it the nav lives in an EmrSheet driven by `model.navOpen`. Unmeasured counts as wide.
 */
export function EmrAppShell({ model, rightPanel, wideBreakpoint = 1024, labels, onIntent, children }: {
  model: EmrAppShellModel;
  rightPanel?: ReactNode;
  wideBreakpoint?: number;
  labels?: Labels;
  onIntent: (intent: EmrAppShellIntent) => void;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= wideBreakpoint;
  const nav = (
    <EmrLeftNav items={model.nav.items} activeId={model.nav.activeId} expandedIds={model.nav.expandedIds} labels={{ navigation: l.navigation }} onIntent={onIntent} />
  );
  return (
    <View onLayout={onLayout} style={[styles.root, { backgroundColor: t.surfaceSoft }]}>
      <EmrTopBar model={{ ...model.topBar, showNavToggle: !wide }} labels={labels} onIntent={onIntent} />
      <View style={[styles.body, !wide && styles.stack]}>
        {wide ? <View style={[styles.nav, { backgroundColor: t.surface, borderRightColor: t.border }]}>{nav}</View> : null}
        <ScrollView role="main" aria-label={l.main} style={styles.main} contentContainerStyle={styles.mainContent}>{children}</ScrollView>
        {rightPanel ? <View role="complementary" aria-label={l.sidePanel} style={[wide ? styles.right : styles.rightStack, { backgroundColor: t.surface, borderColor: t.border }]}>{rightPanel}</View> : null}
      </View>
      {wide ? null : (
        <EmrSheet open={model.navOpen} title={model.nav.title ?? l.navigationTitle} onIntent={() => onIntent({ type: 'navToggleRequested' })}>{nav}</EmrSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, zIndex: 10 },
  search: { flex: 1, maxWidth: 560 },
  body: { flex: 1, flexDirection: 'row', minHeight: 0 },
  stack: { flexDirection: 'column' },
  nav: { width: 260, borderRightWidth: 1 },
  main: { flex: 1 },
  mainContent: { padding: 16 },
  right: { width: 320, borderLeftWidth: 1 },
  rightStack: { borderTopWidth: 1 },
});
