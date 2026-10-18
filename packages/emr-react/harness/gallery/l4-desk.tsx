'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  EmrArrivalLinker, EmrBookedNotDeliveredList, EmrSpectacleDelivery,
  type EmrArrivalLinkerModel, type EmrBookedRow, type EmrPatientIdentity, type EmrSpectacleBooking,
} from '../../src';
import type { GallerySection } from './types';

const patient: EmrPatientIdentity = {
  name: 'Test Patient A', ageLabel: '54 y', sexLabel: 'Female',
  identifiers: [{ system: 'project', label: 'Project ID', display: '17-26-000123' }],
};
const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
const Log = ({ text }: { text: string }) => <Text style={{ fontSize: 12 }}>{text}</Text>;

const Linker = ({ existing }: { existing: boolean }) => {
  const [purpose, setPurpose] = useState<string>();
  const [refs, setRefs] = useState<string[]>([]);
  const [none, setNone] = useState(false);
  const [uhid, setUhid] = useState('');
  const [log, setLog] = useState('');
  // Demo stands in for domain normaliseUhid: 9 digits OK, 10–13 warn, anything else errors.
  const digits = uhid.replace(/\D/g, '');
  const uhidCheck = uhid === '' ? {} : digits.length === 9 ? { normalisedValue: digits } : digits.length >= 10 && digits.length <= 13 ? { normalisedValue: digits, warning: 'Longer than usual; check the card.' } : { error: 'UHID must be 9 digits.' };
  const model: EmrArrivalLinkerModel = {
    patient,
    openReferrals: [
      { id: 'r1', date: '01-10-2026', centreName: 'Test Vision Centre 1', purpose: 'Cataract surgery', flags: ['Urgent', 'Diabetic'], daysSinceAdviceLabel: '17 days since advice', overdueBadge: { label: 'Overdue', tone: 'danger' } },
      { id: 'r2', date: '12-10-2026', centreName: 'Test Vision Centre 2', purpose: 'Glaucoma review', flags: [], daysSinceAdviceLabel: '6 days since advice', visitCountLabel: '2 visits', nextDueLabel: 'Next visit 26-10-2026' },
    ],
    purposeOptions: [{ id: 'surgery', label: 'Surgery' }, { id: 'review', label: 'Review' }, { id: 'spectacles', label: 'Spectacles' }],
    selectedPurpose: purpose, selectedReferralIds: refs, noReferral: none,
    uhid: { existing: existing ? { label: 'UHID', display: '900000001' } : undefined, value: uhid, ...uhidCheck, required: false },
    canSubmit: !!purpose && (refs.length > 0 || none),
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrArrivalLinker model={model} onIntent={i => {
        setLog(JSON.stringify(i));
        if (i.type === 'purposeSelected') setPurpose(i.id);
        else if (i.type === 'referralToggled') { setRefs(r => toggle(r, i.id)); setNone(false); }
        else if (i.type === 'noReferralToggled') { setNone(n => !n); setRefs([]); }
        else if (i.type === 'uhidChanged') setUhid(i.raw);
        else if (i.type === 'scanRequested') setUhid('900000002');
      }} />
      <Log text={`Last intent: ${log}`} />
    </View>
  );
};

const Delivery = () => {
  const [ids, setIds] = useState<string[]>([]);
  const [date, setDate] = useState('2026-10-18');
  const [log, setLog] = useState('');
  const bookings: EmrSpectacleBooking[] = [
    { id: 'b1', bookedDate: '05-10-2026', type: 'Distance glasses', paidBadge: { label: 'Paid', tone: 'success' }, rxSummary: 'R -1.50 / L -1.25', daysOpenLabel: '13 days open', statusBadge: { label: 'Ready', tone: 'info' } },
    { id: 'b2', bookedDate: '10-10-2026', type: 'Reading glasses', paidBadge: { label: 'Balance due', tone: 'warning' }, rxSummary: 'Add +2.00 both', daysOpenLabel: '8 days open', statusBadge: { label: 'Ordered', tone: 'neutral' } },
  ];
  return (
    <View style={{ gap: 8 }}>
      <EmrSpectacleDelivery model={{ patient, bookings, selectedBookingIds: ids, deliveryDate: date, canSubmit: ids.length > 0 && !!date }}
        onIntent={i => {
          setLog(JSON.stringify(i));
          if (i.type === 'bookingToggled') setIds(x => toggle(x, i.id));
          else if (i.type === 'deliveryDateChanged') setDate(i.iso ?? '');
        }} />
      <Log text={`Last intent: ${log}`} />
    </View>
  );
};

const ALL: EmrBookedRow[] = Array.from({ length: 6 }, (_, n) => ({
  bookingId: `bk${n}`, patientName: `Test Patient ${String.fromCharCode(65 + n)}`, primaryIdentifier: `17-26-00010${n}`,
  phone: n === 2 ? undefined : `900000010${n}`, centreName: n % 2 ? 'Test Vision Centre 2' : 'Test Vision Centre 1',
  bookedDate: `0${n + 1}-10-2026`, daysOpenLabel: `${17 - n * 2} days open`,
  overdueBadge: n === 0 ? { label: 'Overdue', tone: 'danger' } : undefined, type: n % 2 ? 'Reading glasses' : 'Distance glasses',
  paidBadge: n % 3 ? { label: 'Paid', tone: 'success' } : { label: 'Balance due', tone: 'warning' },
}));
const PAGE = 3;

const List = () => {
  const [filters, setFilters] = useState<{ centreId?: string; bookedFrom?: string; bookedTo?: string }>({});
  const [page, setPage] = useState(1);
  const [log, setLog] = useState('');
  const centres = [{ id: 'c1', label: 'Test Vision Centre 1' }, { id: 'c2', label: 'Test Vision Centre 2' }];
  const rows = ALL.filter(r => !filters.centreId || r.centreName === centres.find(c => c.id === filters.centreId)?.label);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pageCount);
  return (
    <View style={{ gap: 8 }}>
      <EmrBookedNotDeliveredList
        model={{
          rows: rows.slice((cur - 1) * PAGE, cur * PAGE),
          filters: { centreOptions: centres, selectedCentreId: filters.centreId, bookedFrom: filters.bookedFrom, bookedTo: filters.bookedTo },
          page: cur, pageCount, pagingSummaryLabel: `Page ${cur} of ${pageCount} · ${rows.length} bookings`,
        }}
        onIntent={i => {
          setLog(JSON.stringify(i));
          if (i.type === 'filterChanged') { setFilters({ centreId: i.centreId, bookedFrom: i.bookedFrom, bookedTo: i.bookedTo }); setPage(1); }
          else if (i.type === 'pageChanged') setPage(i.page);
        }} />
      <Log text={`Last intent: ${log}`} />
    </View>
  );
};

export const gallery: GallerySection[] = [
  { id: 'arrival-linker', title: 'ArrivalLinker (no UHID yet)', render: () => <Linker existing={false} /> },
  { id: 'arrival-linker-uhid', title: 'ArrivalLinker (existing UHID)', render: () => <Linker existing /> },
  { id: 'spectacle-delivery', title: 'SpectacleDelivery', render: () => <Delivery /> },
  { id: 'booked-not-delivered', title: 'BookedNotDeliveredList', render: () => <List /> },
  { id: 'booked-not-delivered-error', title: 'BookedNotDeliveredList (error)', render: () => (
    <EmrBookedNotDeliveredList onIntent={() => undefined}
      model={{ rows: [], filters: { centreOptions: [] }, page: 1, pageCount: 1, pagingSummaryLabel: '', state: 'error', message: 'Could not reach the server.' }} />
  ) },
];
