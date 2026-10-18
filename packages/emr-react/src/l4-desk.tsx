'use client';

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrChip, EmrStateMessage } from './l1-display';
import { EmrDateInput, EmrRadioGroup } from './l1-inputs';
import { EmrBarcodeScanField, EmrPatientIdentityCard, type EmrPatientIdentity } from './l4-identity';
import { useContainerWidth } from './l4-lists-shared';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

/** English fallbacks for built-in strings; each is overridable through the `labels` prop. */
const DEFAULTS = {
  purpose: 'Purpose of visit',
  referrals: 'Open referrals',
  noReferral: 'No referral / self',
  noOpenReferrals: 'No open referrals for this patient.',
  uhid: 'UHID',
  uhidInput: 'Enter UHID',
  uhidUse: 'Use this UHID',
  uhidSkip: 'UHID not issued yet / skip',
  submit: 'Submit',
  cancel: 'Cancel',
  bookings: 'Spectacle bookings',
  noBookings: 'No bookings to deliver.',
  deliveryDate: 'Delivery date',
  listTitle: 'Booked, not delivered',
  centre: 'Centre',
  allCentres: 'All centres',
  bookedFrom: 'Booked from',
  bookedTo: 'Booked to',
  call: 'Call',
  previous: 'Previous',
  next: 'Next',
  loading: 'Loading bookings…',
  empty: 'No bookings match these filters.',
  errorTitle: 'Bookings could not be loaded',
  retry: 'Retry',
  selected: 'selected',
  patient: 'Patient',
  phone: 'Phone',
  booked: 'Booked',
  type: 'Type',
  status: 'Status',
};
export type EmrDeskLabels = typeof DEFAULTS;

// ---- Models and intents (pre-resolved strings; the controller owns every rule) ----

export interface EmrOpenReferral {
  id: string;
  date: string;
  centreName: string;
  purpose: string;
  flags: string[];
  daysSinceAdviceLabel: string;
  overdueBadge?: EmrBadge;
  /** Multi-visit referrals, pre-formatted by the app: "2 visits", "Next visit 26-10-2026". */
  visitCountLabel?: string;
  nextDueLabel?: string;
}
export interface EmrArrivalLinkerModel {
  patient: EmrPatientIdentity;
  openReferrals: EmrOpenReferral[];
  purposeOptions: { id: string; label: string }[];
  selectedPurpose?: string;
  selectedReferralIds: string[];
  noReferral: boolean;
  /**
   * Controlled like BarcodeScanField: the app keeps `value` (from typing or a scan) and supplies the
   * domain normaliser's normalisedValue / error / warning.
   */
  uhid?: {
    existing?: { label: string; display: string };
    value?: string;
    normalisedValue?: string;
    error?: string;
    warning?: string;
    required: false;
  };
  canSubmit: boolean;
}
/** `uhidChanged` and `scanRequested` extend the frozen contract: the UHID step is controlled by the app. */
export type EmrArrivalLinkerIntent =
  | { type: 'purposeSelected'; id: string }
  | { type: 'referralToggled'; id: string }
  | { type: 'noReferralToggled' }
  | { type: 'uhidChanged'; raw: string }
  | { type: 'uhidProvided'; raw: string }
  | { type: 'uhidSkipped' }
  | { type: 'scanRequested' }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

export interface EmrSpectacleBooking {
  id: string;
  bookedDate: string;
  type: string;
  paidBadge: EmrBadge;
  rxSummary: string;
  daysOpenLabel: string;
  statusBadge: EmrBadge;
}
export interface EmrSpectacleDeliveryModel {
  patient: EmrPatientIdentity;
  bookings: EmrSpectacleBooking[];
  /** Not in the contract (it has no ticked state): mirrors ArrivalLinker's selectedReferralIds. */
  selectedBookingIds: string[];
  deliveryDate: string;
  canSubmit: boolean;
}
export type EmrSpectacleDeliveryIntent =
  | { type: 'bookingToggled'; id: string }
  | { type: 'deliveryDateChanged'; iso: string | null }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

export interface EmrBookedRow {
  bookingId: string;
  patientName: string;
  primaryIdentifier: string;
  phone?: string;
  centreName: string;
  bookedDate: string;
  daysOpenLabel: string;
  overdueBadge?: EmrBadge;
  type: string;
  paidBadge: EmrBadge;
}
export interface EmrBookedFilters { centreId?: string; bookedFrom?: string; bookedTo?: string }
export interface EmrBookedNotDeliveredModel {
  rows: EmrBookedRow[];
  filters: { centreOptions: { id: string; label: string }[]; selectedCentreId?: string; bookedFrom?: string; bookedTo?: string };
  page: number;
  pageCount: number;
  pagingSummaryLabel: string;
  /** Not in the contract: optional list state. `message` is the error text. */
  state?: 'loading' | 'empty' | 'error';
  message?: string;
}
export type EmrBookedNotDeliveredIntent =
  | { type: 'rowSelected'; bookingId: string }
  | { type: 'filterChanged'; centreId?: string; bookedFrom?: string; bookedTo?: string }
  | { type: 'pageChanged'; page: number }
  | { type: 'callRequested'; phone: string }
  | { type: 'retryRequested' };

// ---- shared bits ----

function useText() {
  const t = useEmrTheme();
  const base = { fontSize: t.textMd, fontFamily: fontFamily(t) };
  return {
    t,
    body: { ...base, color: t.text },
    muted: { ...base, color: t.textMuted, fontSize: t.textSm },
    bold: { ...base, color: t.text, fontWeight: fontWeight(t.weightBold) },
  };
}

/** Whole-row checkbox with free content. The glyph carries the state, never colour alone. */
function CheckRow({ checked, name, onPress, children }: { checked: boolean; name: string; onPress: () => void; children: ReactNode }) {
  const { t } = useText();
  return (
    <Pressable role="checkbox" aria-checked={checked} aria-label={name} onPress={onPress}
      style={({ focused }: PressState) => [styles.checkRow, focusRing(t, focused), {
        minHeight: t.controlHeight, borderColor: checked ? t.primary : t.border, borderWidth: checked ? 2 : 1,
        backgroundColor: checked ? t.primarySoft : t.surface,
      }]}>
      <View aria-hidden style={[styles.box, { borderColor: checked ? t.primary : t.border, backgroundColor: checked ? t.primary : t.surface }]}>
        {checked ? <Text style={{ color: t.surface, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>✓</Text> : null}
      </View>
      <View style={styles.grow}>{children}</View>
    </Pressable>
  );
}

function Footer({ l, canSubmit, onSubmit, onCancel }: { l: EmrDeskLabels; canSubmit: boolean; onSubmit: () => void; onCancel: () => void }) {
  return (
    <View style={styles.wrap}>
      <EmrButton label={l.submit} disabled={!canSubmit} onPress={onSubmit} />
      <EmrButton variant="outline" label={l.cancel} onPress={onCancel} />
    </View>
  );
}

// ---- 1. ArrivalLinker ----

/** L4. RPC desk arrival: purpose, referrals to link (or none), optional UHID. Submit follows `canSubmit` only. */
export function EmrArrivalLinker({ model: m, labels, onIntent }: {
  model: EmrArrivalLinkerModel;
  labels?: Partial<EmrDeskLabels>;
  onIntent: (intent: EmrArrivalLinkerIntent) => void;
}) {
  const { body, muted, bold } = useText();
  const l = { ...DEFAULTS, ...labels };
  const draft = m.uhid?.value ?? '';
  const hasDraft = draft.trim() !== '';
  return (
    <View role="form" aria-label={m.patient.name} style={styles.stack}>
      <EmrPatientIdentityCard mode="compact" model={m.patient} onIntent={noop} />
      <EmrRadioGroup label={l.purpose} value={m.selectedPurpose ?? null}
        options={m.purposeOptions.map(o => ({ value: o.id, label: o.label }))}
        onValueChange={id => onIntent({ type: 'purposeSelected', id })} />
      <View role="group" aria-label={l.referrals} style={styles.stack}>
        <Text role="heading" style={bold}>{l.referrals}</Text>
        {m.openReferrals.length === 0 ? <Text style={muted}>{l.noOpenReferrals}</Text> : null}
        {m.openReferrals.map(r => (
          <CheckRow key={r.id} checked={m.selectedReferralIds.includes(r.id)}
            name={[r.date, r.centreName, r.purpose].join(', ')} onPress={() => onIntent({ type: 'referralToggled', id: r.id })}>
            <Text style={bold}>{r.date} · {r.centreName}</Text>
            <Text style={body}>{r.purpose}</Text>
            {r.visitCountLabel || r.nextDueLabel ? <Text style={muted}>{[r.visitCountLabel, r.nextDueLabel].filter(Boolean).join(' · ')}</Text> : null}
            <View style={styles.wrap}>
              {r.flags.map(f => <EmrChip key={f}>{f}</EmrChip>)}
              <Text style={muted}>{r.daysSinceAdviceLabel}</Text>
              {r.overdueBadge ? <EmrBadgeView badge={r.overdueBadge} /> : null}
            </View>
          </CheckRow>
        ))}
        <CheckRow checked={m.noReferral} name={l.noReferral} onPress={() => onIntent({ type: 'noReferralToggled' })}>
          <Text style={body}>{l.noReferral}</Text>
        </CheckRow>
      </View>
      {m.uhid ? (
        m.uhid.existing ? (
          <View style={styles.stack}>
            <Text style={muted}>{m.uhid.existing.label}</Text>
            <Text selectable style={bold}>{m.uhid.existing.display}</Text>
          </View>
        ) : (
          <View style={styles.stack}>
            <EmrBarcodeScanField label={l.uhid} value={draft} normalisedValue={m.uhid.normalisedValue} error={m.uhid.error} warning={m.uhid.warning}
              onValueChange={raw => onIntent({ type: 'uhidChanged', raw })} onIntent={i => i.type === 'scanRequested' && onIntent({ type: 'scanRequested' })} />
            <View style={styles.wrap}>
              <EmrButton variant="outline" small label={l.uhidUse} disabled={!hasDraft} onPress={() => onIntent({ type: 'uhidProvided', raw: draft.trim() })} />
              <EmrButton variant="ghost" small label={l.uhidSkip} onPress={() => onIntent({ type: 'uhidSkipped' })} />
            </View>
          </View>
        )
      ) : null}
      <Footer l={l} canSubmit={m.canSubmit} onSubmit={() => onIntent({ type: 'submitRequested' })} onCancel={() => onIntent({ type: 'cancelled' })} />
    </View>
  );
}

function noop() { /* the compact card is display-only here */ }

// ---- 2. SpectacleDelivery ----

/** L4. Tick the bookings handed over and set the delivery date. Submit follows `canSubmit` only. */
export function EmrSpectacleDelivery({ model: m, labels, onIntent }: {
  model: EmrSpectacleDeliveryModel;
  labels?: Partial<EmrDeskLabels>;
  onIntent: (intent: EmrSpectacleDeliveryIntent) => void;
}) {
  const { body, muted, bold } = useText();
  const l = { ...DEFAULTS, ...labels };
  return (
    <View role="form" aria-label={m.patient.name} style={styles.stack}>
      <EmrPatientIdentityCard mode="compact" model={m.patient} onIntent={noop} />
      <View role="group" aria-label={l.bookings} style={styles.stack}>
        <Text role="heading" style={bold}>{l.bookings}</Text>
        {m.bookings.length === 0 ? <Text style={muted}>{l.noBookings}</Text> : null}
        {m.bookings.map(b => (
          <CheckRow key={b.id} checked={m.selectedBookingIds.includes(b.id)} name={[b.bookedDate, b.type, b.rxSummary].join(', ')}
            onPress={() => onIntent({ type: 'bookingToggled', id: b.id })}>
            <Text style={bold}>{b.bookedDate} · {b.type}</Text>
            <Text style={body}>{b.rxSummary}</Text>
            <View style={styles.wrap}>
              <EmrBadgeView badge={b.paidBadge} />
              <EmrBadgeView badge={b.statusBadge} />
              <Text style={muted}>{b.daysOpenLabel}</Text>
            </View>
          </CheckRow>
        ))}
      </View>
      <EmrDateInput label={l.deliveryDate} value={m.deliveryDate || null} onValueChange={iso => onIntent({ type: 'deliveryDateChanged', iso })} />
      <Footer l={l} canSubmit={m.canSubmit} onSubmit={() => onIntent({ type: 'submitRequested' })} onCancel={() => onIntent({ type: 'cancelled' })} />
    </View>
  );
}

// ---- 3. BookedNotDeliveredList ----

/**
 * L4. Booked-but-not-delivered work list. Rows arrive filtered and paged; filters, paging, row press, Call and
 * Retry are all intents. Table-like when the container is at least `wideFrom` px, cards below.
 */
export function EmrBookedNotDeliveredList({ model: m, labels, wideFrom = 640, onIntent }: {
  model: EmrBookedNotDeliveredModel;
  labels?: Partial<EmrDeskLabels>;
  wideFrom?: number;
  onIntent: (intent: EmrBookedNotDeliveredIntent) => void;
}) {
  const { t, body, muted, bold } = useText();
  const l = { ...DEFAULTS, ...labels };
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= wideFrom;
  const f = m.filters;
  const emit = (patch: EmrBookedFilters) => onIntent({ type: 'filterChanged', centreId: f.selectedCentreId, bookedFrom: f.bookedFrom, bookedTo: f.bookedTo, ...patch });
  const select = (r: EmrBookedRow) => () => onIntent({ type: 'rowSelected', bookingId: r.bookingId });
  const call = (r: EmrBookedRow) => r.phone
    ? <EmrButton small variant="outline" label={l.call} accessibilityLabel={`${l.call} ${r.patientName}`} onPress={() => onIntent({ type: 'callRequested', phone: r.phone! })} />
    : null;
  const badges = (r: EmrBookedRow) => (
    <View style={styles.wrap}>
      <EmrBadgeView badge={r.paidBadge} />
      {r.overdueBadge ? <EmrBadgeView badge={r.overdueBadge} /> : null}
    </View>
  );
  const rowName = (r: EmrBookedRow) => [r.primaryIdentifier, r.patientName, r.bookedDate, r.type].join(', ');
  const ident = (r: EmrBookedRow) => (
    <>
      <Text style={bold}>{r.primaryIdentifier}</Text>
      <Text style={body}>{r.patientName}</Text>
      {r.phone ? <Text style={muted}>{r.phone}</Text> : null}
    </>
  );
  const pressStyle = ({ focused }: PressState) => [focusRing(t, focused), { minHeight: t.controlHeight, justifyContent: 'center' as const }];

  const wideRow = (r: EmrBookedRow) => (
    <View key={r.bookingId} role="row" style={[styles.row, { minHeight: t.controlHeight, borderBottomColor: t.border }]}>
      <View role="cell" style={[styles.cell, { flexGrow: 2 }]}>
        <Pressable role="button" aria-label={rowName(r)} onPress={select(r)} style={pressStyle}>{ident(r)}</Pressable>
      </View>
      <View role="cell" style={[styles.cell, { flexGrow: 1.4 }]}><Text style={body}>{r.centreName}</Text></View>
      <View role="cell" style={[styles.cell, { flexGrow: 1.4 }]}><Text style={body}>{r.bookedDate}</Text><Text style={muted}>{r.daysOpenLabel}</Text></View>
      <View role="cell" style={[styles.cell, { flexGrow: 1.4 }]}><Text style={body}>{r.type}</Text></View>
      <View role="cell" style={[styles.cell, { flexGrow: 1.4 }]}>{badges(r)}</View>
      <View role="cell" style={[styles.cell, { flexGrow: 0.8 }]}>{call(r)}</View>
    </View>
  );
  const card = (r: EmrBookedRow) => (
    <View key={r.bookingId} role="listitem" style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      <Pressable role="button" aria-label={rowName(r)} onPress={select(r)} style={pressStyle}>
        {ident(r)}
        <Text style={muted}>{[r.centreName, r.bookedDate, r.type].join(' · ')}</Text>
        <Text style={muted}>{r.daysOpenLabel}</Text>
      </Pressable>
      <View style={styles.wrap}>{badges(r)}{call(r)}</View>
    </View>
  );
  const head = [l.patient, l.centre, l.booked, l.type, l.status, ''];

  let body_;
  if (m.state === 'error') {
    body_ = <EmrStateMessage kind="error" title={l.errorTitle} message={m.message}><EmrButton variant="outline" small label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} /></EmrStateMessage>;
  } else if (m.state === 'loading' && m.rows.length === 0) {
    body_ = <EmrStateMessage kind="loading" title={m.message ?? l.loading} />;
  } else if (m.state === 'empty' || m.rows.length === 0) {
    body_ = <EmrStateMessage kind="empty" title={m.message ?? l.empty} />;
  } else {
    body_ = (
      <>
        {wide ? (
          <View role="table" aria-label={l.listTitle}>
            <View role="row" style={[styles.row, { backgroundColor: t.surfaceAccent, borderBottomColor: t.border }]}>
              {head.map((h, i) => <View key={i} role="columnheader" style={[styles.cell, { flexGrow: [2, 1.4, 1.4, 1.4, 1.4, 0.8][i] }]}><Text style={muted}>{h}</Text></View>)}
            </View>
            {m.rows.map(wideRow)}
          </View>
        ) : <View role="list" aria-label={l.listTitle} style={styles.stack}>{m.rows.map(card)}</View>}
        <View style={styles.pager}>
          <EmrButton variant="outline" small label={l.previous} disabled={m.page <= 1} onPress={() => onIntent({ type: 'pageChanged', page: m.page - 1 })} />
          <Text role="status" style={[muted, styles.grow, { textAlign: 'center' }]}>{m.pagingSummaryLabel}</Text>
          <EmrButton variant="outline" small label={l.next} disabled={m.page >= m.pageCount} onPress={() => onIntent({ type: 'pageChanged', page: m.page + 1 })} />
        </View>
      </>
    );
  }

  return (
    <View role="region" aria-label={l.listTitle} aria-busy={m.state === 'loading'} onLayout={onLayout} style={styles.stack}>
      <View role="group" aria-label={l.listTitle} style={styles.stack}>
        <EmrSelect label={l.centre} value={f.selectedCentreId ?? ''}
          options={[{ value: '', label: l.allCentres }, ...f.centreOptions.map(o => ({ value: o.id, label: o.label }))]}
          onChange={v => emit({ centreId: v || undefined })} />
        <View style={styles.wrap}>
          <View style={styles.date}><EmrDateInput label={l.bookedFrom} value={f.bookedFrom ?? null} onValueChange={v => emit({ bookedFrom: v ?? undefined })} /></View>
          <View style={styles.date}><EmrDateInput label={l.bookedTo} value={f.bookedTo ?? null} onValueChange={v => emit({ bookedTo: v ?? undefined })} /></View>
        </View>
      </View>
      {body_}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8, minWidth: 0 },
  grow: { flex: 1, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  date: { flexGrow: 1, flexBasis: 140, minWidth: 0 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 8, padding: 10 },
  box: { width: 24, height: 24, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, borderBottomWidth: 1 },
  cell: { flexBasis: 0, minWidth: 0, paddingVertical: 6 },
  card: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 6 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
