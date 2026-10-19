'use client';

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrPatientHistoryIntent,
  EmrPatientHistoryModel,
  EmrPatientSnapshot,
  EmrRxEyeValues,
} from '@drguptavivek/emr-controller';
import { EmrCard, EmrChip, EmrColumns, EmrStateMessage } from './l1-display';
import { EmrCataractEpisodeCard, type EmrEpisodeLabels } from './l4-history-episode';
import { hasSummary, present } from './l4-history.logic';
import { EmrPatientIdentityCard } from './l4-identity';
import { useContainerWidth } from './l4-lists-shared';
import { EmrBadgeView } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export * from './l4-history-episode';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; every one is overridable via the `labels` prop. */
const DEFAULTS = {
  ariaLabel: 'Patient history',
  summary: 'Summary',
  visits: 'Visits',
  newPatient: 'New patient',
  newPatientMessage: 'No visits or screenings recorded yet.',
  loading: 'Loading patient history',
  rx: 'Last spectacle prescription',
  glaucoma: 'Last glaucoma screen',
  dr: 'Last diabetic retinopathy screen',
  referrals: 'Open referrals',
  bookings: 'Open bookings',
  episodes: 'Open cataract episodes',
  od: 'OD',
  os: 'OS',
  re: 'RE',
  le: 'LE',
  sph: 'Sph',
  cyl: 'Cyl',
  axis: 'Axis',
  add: 'Add',
  iop: 'IOP',
  cdr: 'CDR',
  grade: 'Grade',
  maculopathy: 'Maculopathy',
  decision: 'Decision',
  pva: 'PVA',
  diagnosis: 'Diagnosis',
  advice: 'Advice',
};
export type EmrHistoryLabels = typeof DEFAULTS;

// ---- Model (pre-resolved strings, frozen contract item 3) ----

export type {
  EmrPatientHistoryIntent,
  EmrPatientHistoryModel,
  EmrPatientSnapshot,
  EmrRxEyeValues,
};

function useText() {
  const t = useEmrTheme();
  const base = { fontSize: t.textMd, fontFamily: fontFamily(t), color: t.text };
  return { t, body: base, muted: { ...base, color: t.textMuted, fontSize: t.textSm }, bold: { ...base, fontWeight: fontWeight(t.weightBold) } };
}

/** Pressable list row: full-width, >= control height, focus ring on web. */
function RowButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  const { t } = useText();
  return (
    <Pressable role="button" aria-label={label} onPress={onPress}
      style={({ pressed, focused }: PressState) => [styles.rowButton, focusRing(t, focused), { minHeight: t.controlHeight, borderColor: t.border, backgroundColor: pressed ? t.surfaceRaised : t.surface }]}>
      {children}
    </Pressable>
  );
}

function Block({ title, date, children }: { title: string; date?: string; children: ReactNode }) {
  const { body, bold, muted } = useText();
  return (
    <EmrCard>
      <View role="group" aria-label={title} style={styles.stack}>
        <View style={styles.wrap}>
          <Text role="heading" style={[bold, styles.grow]}>{title}</Text>
          {date ? <Text style={muted}>{date}</Text> : null}
        </View>
        {children}
      </View>
    </EmrCard>
  );
}

/** One "RE: a · b" line per eye; omitted when the eye has no values. */
function EyeLine({ eye, parts }: { eye: string; parts: string[] }) {
  const { body, bold } = useText();
  if (parts.length === 0) return null;
  return <Text style={body}><Text style={bold}>{eye}  </Text>{parts.join(' · ')}</Text>;
}

function RxTable({ rx, l }: { rx: NonNullable<EmrPatientSnapshot['summary']['lastSpectacleRx']>; l: EmrHistoryLabels }) {
  const { t, body, bold, muted } = useText();
  const cols = [l.sph, l.cyl, l.axis, l.add];
  const row = (eye: string, v: EmrRxEyeValues) => (
    <View role="row" style={[styles.tableRow, { borderTopColor: t.border }]}>
      <Text role="rowheader" style={[bold, styles.eyeCell]}>{eye}</Text>
      {[v.sph, v.cyl, v.axis, v.add].map((x, i) => <Text key={i} role="cell" style={[body, styles.cell]}>{x}</Text>)}
    </View>
  );
  return (
    <View role="table" aria-label={l.rx}>
      <View role="row" style={styles.tableRow}>
        <View style={styles.eyeCell} />
        {cols.map(c => <Text key={c} role="columnheader" style={[muted, styles.cell]}>{c}</Text>)}
      </View>
      {row(l.od, rx.re)}
      {row(l.os, rx.le)}
    </View>
  );
}

function SummaryBlocks({ s, l, onIntent, episodeLabels, parity }: {
  s: EmrPatientSnapshot['summary'];
  l: EmrHistoryLabels;
  onIntent: (i: EmrPatientHistoryIntent) => void;
  episodeLabels?: Partial<EmrEpisodeLabels>;
  /** Wide layout: 0 or 1 keeps every other block for that column. Omitted keeps all. */
  parity?: 0 | 1;
}) {
  const { body, muted, bold } = useText();
  const rx = s.lastSpectacleRx;
  const gl = s.lastGlaucomaScreen;
  const dr = s.lastDrScreen;
  const glRe = gl ? present(gl.iopRe && `${l.iop} ${gl.iopRe}`, gl.cdrRe && `${l.cdr} ${gl.cdrRe}`) : [];
  const glLe = gl ? present(gl.iopLe && `${l.iop} ${gl.iopLe}`, gl.cdrLe && `${l.cdr} ${gl.cdrLe}`) : [];
  const drRe = dr ? present(dr.gradeRe && `${l.grade} ${dr.gradeRe}`, dr.maculopathyRe && `${l.maculopathy} ${dr.maculopathyRe}`) : [];
  const drLe = dr ? present(dr.gradeLe && `${l.grade} ${dr.gradeLe}`, dr.maculopathyLe && `${l.maculopathy} ${dr.maculopathyLe}`) : [];
  const blocks: ReactNode[] = [];

  if (rx) blocks.push(
    <Block key="rx" title={l.rx} date={rx.date}>
      <RxTable rx={rx} l={l} />
      <View style={styles.wrap}>
        {rx.type ? <Text style={muted}>{rx.type}</Text> : null}
        <EmrBadgeView badge={rx.statusBadge} />
      </View>
    </Block>);
  if (gl) blocks.push(
    <Block key="gl" title={l.glaucoma} date={gl.date}>
      <EyeLine eye={l.re} parts={glRe} />
      <EyeLine eye={l.le} parts={glLe} />
      {gl.decision ? <Text style={body}><Text style={bold}>{l.decision}  </Text>{gl.decision}</Text> : null}
    </Block>);
  if (dr) blocks.push(
    <Block key="dr" title={l.dr} date={dr.date}>
      <EyeLine eye={l.re} parts={drRe} />
      <EyeLine eye={l.le} parts={drLe} />
      {dr.decision ? <Text style={body}><Text style={bold}>{l.decision}  </Text>{dr.decision}</Text> : null}
    </Block>);
  if (s.openReferrals.length) blocks.push(
    <Block key="ref" title={l.referrals}>
      {s.openReferrals.map(r => (
        <RowButton key={r.id} label={`${r.purpose}, ${r.centreName}, ${r.date}`} onPress={() => onIntent({ type: 'referralSelected', id: r.id })}>
          <View style={styles.stack}>
            <View style={styles.wrap}>
              <Text style={[bold, styles.grow]}>{r.purpose}</Text>
              <EmrBadgeView badge={r.statusBadge} />
            </View>
            <Text style={muted}>{`${r.centreName} · ${r.date}`}</Text>
            {r.visitCountLabel || r.nextDueLabel ? <Text style={muted}>{[r.visitCountLabel, r.nextDueLabel].filter(Boolean).join(' · ')}</Text> : null}
            {r.flags.length ? <View style={styles.wrap}>{r.flags.map(f => <EmrChip key={f}>{f}</EmrChip>)}</View> : null}
          </View>
        </RowButton>
      ))}
    </Block>);
  if (s.openBookings.length) blocks.push(
    <Block key="bk" title={l.bookings}>
      {s.openBookings.map(b => (
        <RowButton key={b.id} label={`${b.type}, ${b.date}, ${b.daysOpenLabel}`} onPress={() => onIntent({ type: 'bookingSelected', id: b.id })}>
          <View style={styles.stack}>
            <View style={styles.wrap}>
              <Text style={[bold, styles.grow]}>{b.type}</Text>
              <EmrBadgeView badge={b.paidBadge} />
              {b.overdueBadge ? <EmrBadgeView badge={b.overdueBadge} /> : null}
            </View>
            <Text style={muted}>{`${b.date} · ${b.daysOpenLabel}`}</Text>
          </View>
        </RowButton>
      ))}
    </Block>);
  if (s.openEpisodes.length) blocks.push(
    <View key="ep" role="group" aria-label={l.episodes} style={styles.stack}>
      {s.openEpisodes.map(e => (
        <EmrCataractEpisodeCard key={e.id} episode={e} openOnly labels={episodeLabels}
          onIntent={i => i.type === 'openRequested' && onIntent({ type: 'episodeSelected', id: i.id })} />
      ))}
    </View>);

  return <>{parity === undefined ? blocks : blocks.filter((_, i) => i % 2 === parity)}</>;
}

function Skeleton({ label }: { label: string }) {
  const { t } = useText();
  const bar = (w: `${number}%`, h = 14) => <View style={{ width: w, height: h, borderRadius: 4, backgroundColor: t.neutralSoft }} />;
  return (
    <View role="status" aria-busy aria-label={label} style={styles.stack}>
      <View style={[styles.skel, { borderColor: t.border }]}>{bar('50%', 18)}{bar('70%')}</View>
      <View style={[styles.skel, { borderColor: t.border }]}>{bar('40%')}{bar('90%')}{bar('90%')}</View>
      <View style={[styles.skel, { borderColor: t.border }]}>{bar('60%')}{bar('80%')}</View>
    </View>
  );
}

/**
 * L4. Patient history: compact identity, a pinned summary (two columns when the container is wide,
 * one when narrow), then visits newest first. Controlled and read-only; selecting a row emits an
 * intent. Missing optional blocks are omitted. `model.loading` shows a skeleton; no visits and no
 * summary shows the "New patient" state.
 */
export function EmrPatientHistoryTimeline({ model, labels, episodeLabels, wideFrom = 720, onIntent }: {
  model: EmrPatientHistoryModel;
  labels?: Partial<EmrHistoryLabels>;
  episodeLabels?: Partial<EmrEpisodeLabels>;
  /** Container width (px) from which the summary uses two columns. */
  wideFrom?: number;
  onIntent: (intent: EmrPatientHistoryIntent) => void;
}) {
  const { body, muted, bold } = useText();
  const l: EmrHistoryLabels = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  if (model.loading) return <Skeleton label={l.loading} />;

  const empty = model.visits.length === 0 && !hasSummary(model.summary);
  const wide = width !== null && width >= wideFrom;
  return (
    <View role="region" aria-label={l.ariaLabel} onLayout={onLayout} style={styles.stack}>
      <EmrPatientIdentityCard model={model.patient} mode="compact" onIntent={() => undefined} />
      {empty ? <EmrStateMessage kind="empty" title={l.newPatient} message={l.newPatientMessage} /> : null}
      {hasSummary(model.summary) ? (
        <View role="group" aria-label={l.summary} style={styles.stack}>
          <Text role="heading" style={bold}>{l.summary}</Text>
          {wide ? (
            <EmrColumns count={2} collapseBelow={0}>
              <View style={styles.stack}><SummaryBlocks s={model.summary} l={l} onIntent={onIntent} episodeLabels={episodeLabels} parity={0} /></View>
              <View style={styles.stack}><SummaryBlocks s={model.summary} l={l} onIntent={onIntent} episodeLabels={episodeLabels} parity={1} /></View>
            </EmrColumns>
          ) : (
            <SummaryBlocks s={model.summary} l={l} onIntent={onIntent} episodeLabels={episodeLabels} />
          )}
        </View>
      ) : null}
      {model.visits.length ? (
        <View role="list" aria-label={l.visits} style={styles.stack}>
          <Text role="heading" style={bold}>{l.visits}</Text>
          {model.visits.map(v => {
            const pva = present(v.pvaRe && `${l.re} ${v.pvaRe}`, v.pvaLe && `${l.le} ${v.pvaLe}`);
            return (
              <View key={v.id} role="listitem">
                <RowButton label={`${v.date}, ${v.centreName}`} onPress={() => onIntent({ type: 'visitSelected', id: v.id })}>
                  <View style={styles.stack}>
                    <View style={styles.wrap}><Text style={[bold, styles.grow]}>{v.date}</Text><Text style={muted}>{`${v.centreName} · ${v.teamName}`}</Text></View>
                    {pva.length ? <Text style={body}><Text style={bold}>{l.pva}  </Text>{pva.join(' · ')}</Text> : null}
                    {v.diagnosis ? <Text style={body}><Text style={bold}>{l.diagnosis}  </Text>{v.diagnosis}</Text> : null}
                    {v.advice ? <Text style={muted}>{`${l.advice}: ${v.advice}`}</Text> : null}
                  </View>
                </RowButton>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  grow: { flexGrow: 1, flexShrink: 1 },
  rowButton: { borderWidth: 1, borderRadius: 8, padding: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'transparent' },
  eyeCell: { width: 40 },
  cell: { flex: 1, minWidth: 0, textAlign: 'center' },
  skel: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
});
