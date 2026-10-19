'use client';

import { StyleSheet, Text, View } from 'react-native';
import type { EmrCataractEpisode, EmrCataractEpisodeIntent } from '@drguptavivek/emr-controller';
import { EmrCard, EmrChip } from './l1-display';
import { EmrStageStepper } from './l1-interactive';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
export const EPISODE_DEFAULTS = {
  title: 'Cataract episode',
  admitted: 'Admitted',
  operated: 'Surgery',
  stagesAria: 'Episode stages',
  followups: 'Follow-ups',
  done: 'Done',
  completeSurgery: 'Complete surgery',
  addFollowup: 'Add follow-up',
  open: 'Open',
} as const;
export type EmrEpisodeLabels = typeof EPISODE_DEFAULTS;

export type { EmrCataractEpisode, EmrCataractEpisodeIntent };

/**
 * L4. Read-only episode summary with actions. Which actions show follows the contract's `status`
 * (admitted: complete surgery; operated: add follow-up). `openOnly` keeps just Open, for embedding
 * where the only available intent is opening the episode.
 */
export function EmrCataractEpisodeCard({ episode: e, openOnly, labels, onIntent }: {
  episode: EmrCataractEpisode;
  openOnly?: boolean;
  labels?: Partial<EmrEpisodeLabels>;
  onIntent: (intent: EmrCataractEpisodeIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...EPISODE_DEFAULTS, ...labels };
  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const muted = { ...text, color: t.textMuted, fontSize: t.textSm };
  const dates = [e.admissionDate && `${l.admitted} ${e.admissionDate}`, e.sxDate && `${l.operated} ${e.sxDate}`].filter(Boolean).join(' · ');
  return (
    <EmrCard label={e.eye ? `${l.title} · ${e.eye}` : l.title}>
      <View style={styles.col}>
        <View style={styles.row}>
          <EmrBadgeView badge={e.statusBadge} />
          {dates ? <Text style={[muted, styles.grow]}>{dates}</Text> : null}
        </View>
        {e.stages.stages.length > 0 ? (
          <EmrStageStepper stages={e.stages.stages} activeId={e.stages.activeId} readOnly ariaLabel={l.stagesAria} />
        ) : null}
        {e.followups.length > 0 ? (
          <View role="list" aria-label={l.followups} style={styles.col}>
            <Text style={[text, { fontWeight: fontWeight(t.weightBold) }]}>{l.followups}</Text>
            {e.followups.map((f, i) => (
              <View key={i} role="listitem" style={[styles.row, styles.followup, { borderTopColor: t.border }]}>
                <Text style={[text, styles.grow]}>{f.label}</Text>
                <Text style={muted}>{f.due}</Text>
                {f.done ? <EmrChip tone="success">{l.done}</EmrChip> : null}
                <EmrBadgeView badge={f.statusBadge} />
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.row}>
          {!openOnly && e.canCompleteSurgery ? <EmrButton label={l.completeSurgery} onPress={() => onIntent({ type: 'completeSurgeryRequested', id: e.id })} /> : null}
          {!openOnly && e.canAddFollowup ? <EmrButton label={l.addFollowup} onPress={() => onIntent({ type: 'addFollowupRequested', id: e.id })} /> : null}
          <EmrButton label={l.open} variant="outline" onPress={() => onIntent({ type: 'openRequested', id: e.id })} />
        </View>
      </View>
    </EmrCard>
  );
}

const styles = StyleSheet.create({
  col: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  grow: { flexGrow: 1, flexShrink: 1 },
  followup: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
});
