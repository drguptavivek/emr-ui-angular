'use client';

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { QueueCard, QueueStation, WorkQueueIntent, WorkQueueViewModel } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrStateMessage } from './l1-display';
import { EmrTabs } from './l1-interactive';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { pressedProps, useContainerWidth } from './l4-lists-shared';
import { activeStationId, filterCards } from './l4-lists.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; each is overridable through the `labels` prop. */
const DEFAULTS = {
  refresh: 'Refresh',
  errorTitle: 'Queue could not be loaded',
  retry: 'Retry',
  loading: 'Loading queue…',
  filterLabel: 'Filter patients by name, identifier or token',
  filterPlaceholder: 'Filter by name, identifier or token',
  showing: (shown: number, total: number) => `Showing ${shown} of ${total} patients`,
  stations: 'Stations',
  callNext: 'Call next',
  callNextIn: (station: string) => `Call next in ${station}`,
  moveTo: 'Move to',
  openPatient: 'Open patient',
  openPatientFor: (name: string) => `Open patient ${name}`,
  waiting: (wait: string) => `waiting ${wait}`,
  selected: 'selected',
  tabLabel: (station: string, count: string) => `${station} (${count})`,
};
export type WorkQueueLabels = typeof DEFAULTS;

/**
 * L4 work queue (station board). Controlled and presentational: stations, card order, waits and
 * priority badges are controller-supplied. Stations are columns when the container is at least
 * `wideFrom` px, otherwise one EmrTabs tab per station. The free-text filter and the narrow-screen
 * tab are view-only state, as in Angular. Intents are exactly `WorkQueueIntent`.
 */
export function EmrWorkQueue({ model, onIntent, labels, wideFrom = 640 }: {
  model: WorkQueueViewModel;
  onIntent: (intent: WorkQueueIntent) => void;
  labels?: Partial<WorkQueueLabels>;
  wideFrom?: number;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= wideFrom;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<string | undefined>();
  const cards = model.stations.flatMap(s => s.cards);
  const visible = (s: QueueStation) => filterCards(s.cards, query);
  const shown = model.stations.reduce((n, s) => n + visible(s).length, 0);
  // Reserve the next-step and badge rows on every card when any card has them, so cards stay equal height.
  const anyNext = cards.some(c => !!c.nextStepLabel);
  const anyBadges = cards.some(c => !!c.priority || !!c.flags?.length);
  const active = activeStationId(model.stations, tab, model.selectedCardId);
  const muted = { color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) };
  const strong = { color: t.text, fontFamily: fontFamily(t), fontWeight: fontWeight(t.weightBold) };

  const cardName = (c: QueueCard) =>
    [c.primaryIdentifier, c.tokenLabel, c.displayName, l.waiting(c.waitLabel), c.priority?.label, ...(c.flags ?? []).map(f => f.label), c.nextStepLabel, c.id === model.selectedCardId ? l.selected : '']
      .filter(Boolean).join(', ');

  const renderCard = (c: QueueCard, station: QueueStation) => {
    const selected = c.id === model.selectedCardId;
    return (
      <View key={c.id} role="listitem" style={styles.item}>
        <Pressable role="button" aria-label={cardName(c)} {...pressedProps(selected)} onPress={() => onIntent({ type: 'cardSelected', cardId: c.id })}
          style={({ focused, pressed }: PressState) => [styles.card, focusRing(t, focused), {
            minHeight: t.controlHeight, borderColor: selected ? t.primary : t.border, borderWidth: selected ? 2 : 1,
            backgroundColor: selected || pressed ? t.primarySoft : t.surface,
          }]}>
          <View style={styles.between}>
            <Text numberOfLines={1} style={[strong, styles.min, { fontSize: t.textMd, fontFamily: t.fontMono }]}>{c.primaryIdentifier}</Text>
            {selected ? <Text aria-hidden style={{ color: t.primary, fontSize: t.textMd }}>✓</Text> : null}
          </View>
          <Text numberOfLines={1} style={{ color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(t.weightMedium) }}>
            {c.displayName}{c.ageSexLabel ? <Text style={muted}> {c.ageSexLabel}</Text> : null}
          </Text>
          <View style={styles.between}>
            <Text style={[strong, { fontSize: t.textSm }]}>{c.tokenLabel}</Text>
            <Text numberOfLines={1} style={[muted, styles.min, { textAlign: 'right' }]}>{c.waitLabel}</Text>
          </View>
          {anyNext ? <Text numberOfLines={1} style={[muted, { minHeight: t.textSm * t.leadingNormal }]}>{c.nextStepLabel ?? ''}</Text> : null}
          {anyBadges ? (
            <View style={[styles.flags, { minHeight: t.compactHeight }]}>
              {c.priority ? <EmrBadgeView badge={c.priority} /> : null}
              {c.flags?.map((f, i) => <EmrBadgeView key={i} badge={f} />)}
            </View>
          ) : null}
        </Pressable>
        {selected ? (
          <View style={styles.tray}>
            {!model.readOnly && !c.readOnly && model.moveTargets.length ? (
              <View style={styles.move}>
                <EmrSelect label={l.moveTo} value={null}
                  options={model.moveTargets.map(o => ({ ...o, disabled: o.disabled || o.value === station.id }))}
                  onChange={stationId => { if (stationId) onIntent({ type: 'moveRequested', cardId: c.id, stationId }); }} />
              </View>
            ) : null}
            <EmrButton variant="outline" small label={l.openPatient} accessibilityLabel={l.openPatientFor(c.displayName)}
              onPress={() => onIntent({ type: 'patientOpenRequested', patientId: c.patientId })} />
          </View>
        ) : null}
      </View>
    );
  };

  const renderStation = (s: QueueStation) => (
    <View key={s.id} role="group" aria-label={s.label}
      style={[styles.col, { borderColor: t.border, backgroundColor: t.surfaceSoft }, wide ? styles.colWide : null, wide && model.stations.length === 1 ? styles.colSingle : null]}>
      <View style={styles.colHead}>
        <Text role="heading" style={[strong, styles.min, { fontSize: t.textMd }]}>{s.label}</Text>
        <Text style={[muted, { fontWeight: fontWeight(t.weightMedium) }]}>{s.countLabel}</Text>
        {!model.readOnly ? (
          <EmrButton variant="outline" small label={l.callNext} accessibilityLabel={l.callNextIn(s.label)} disabled={!s.canCallNext}
            onPress={() => onIntent({ type: 'callNextRequested', stationId: s.id })} />
        ) : null}
      </View>
      {s.cards.length ? <View role="list" style={styles.list}>{visible(s).map(c => renderCard(c, s))}</View> : <Text style={[muted, styles.none]}>{model.emptyMessage}</Text>}
    </View>
  );

  let body;
  if (model.error) {
    body = <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}><EmrButton variant="outline" small label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} /></EmrStateMessage>;
  } else if (model.loading) {
    body = <EmrStateMessage kind="loading" title={l.loading} />;
  } else if (!model.stations.length) {
    body = <EmrStateMessage kind="empty" title={model.emptyMessage} />;
  } else {
    body = (
      <>
        {cards.length > 0 ? (
          <View style={styles.filter}>
            <ThemedInput value={query} aria-label={l.filterLabel} placeholder={l.filterPlaceholder} inputMode="search" onChangeText={setQuery} />
            {query.trim() ? <Text role="status" style={muted}>{l.showing(shown, cards.length)}</Text> : null}
          </View>
        ) : null}
        {wide ? (
          <ScrollView horizontal contentContainerStyle={styles.board} role="region" aria-label={l.stations}>{model.stations.map(renderStation)}</ScrollView>
        ) : (
          <>
            {model.stations.length > 1 ? (
              <EmrTabs ariaLabel={l.stations} active={active} onTabChange={setTab} tabs={model.stations.map(s => ({ value: s.id, label: l.tabLabel(s.label, s.countLabel) }))} />
            ) : null}
            {model.stations.filter(s => s.id === active).map(renderStation)}
          </>
        )}
      </>
    );
  }

  return (
    <View role="region" aria-label={model.title} aria-busy={model.loading} onLayout={onLayout} style={styles.root}>
      <View style={styles.head}>
        <Text role="heading" style={[strong, styles.min, { fontSize: t.textXl }]}>{model.title}</Text>
        {wide && model.updatedLabel ? <Text role="status" style={muted}>{model.updatedLabel}</Text> : null}
        <EmrButton variant="outline" small label={l.refresh} onPress={() => onIntent({ type: 'refreshRequested' })} />
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, minWidth: 0 },
  min: { flexShrink: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filter: { gap: 4, maxWidth: 448 },
  board: { flexGrow: 1, gap: 8, alignItems: 'flex-start', paddingBottom: 4 },
  col: { gap: 8, padding: 8, borderWidth: 1, borderRadius: 12, minWidth: 0 },
  colWide: { flex: 1, minWidth: 176 },
  colSingle: { maxWidth: 448 },
  colHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  list: { gap: 8 },
  none: { padding: 12, textAlign: 'center' },
  item: { gap: 4, minWidth: 0 },
  card: { borderRadius: 8, padding: 8, gap: 2, minWidth: 0 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, paddingHorizontal: 2 },
  move: { flexGrow: 1, flexBasis: 144, minWidth: 0 },
});
