'use client';

import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { EmrButton } from '../../src/primitives';
import { EmrDataTable, type EmrDataTableIntent, type EmrDataTableRow } from '../../src/data-table';
import type { GallerySection } from './types';

type Source = { id: string; patient: string; centre: string; status: { label: string; tone: 'warning' | 'success' | 'danger' }; day: number };

const CENTRES = ['Sankara Eye Centre', 'District Hospital', 'Vision Centre North', 'Community Clinic'];
const STATUS: Source['status'][] = [
  { label: 'Pending', tone: 'warning' },
  { label: 'Accepted', tone: 'success' },
  { label: 'Declined', tone: 'danger' },
];
const SOURCE_ROWS: Source[] = Array.from({ length: 40 }, (_, i) => ({
  id: `ref-${i + 1}`,
  patient: `Patient ${String(40 - i).padStart(2, '0')}`,
  centre: CENTRES[i % 4],
  status: STATUS[i % 3],
  day: 1 + (i % 28),
}));

const COLUMNS = [
  { id: 'patient', label: 'Patient', sortable: true },
  { id: 'centre', label: 'Centre', sortable: true },
  { id: 'date', label: 'Referred', sortable: true, align: 'end' as const },
  { id: 'status', label: 'Status' },
];
const SAVED = [{ id: 'pending', label: 'Pending only' }, { id: 'north', label: 'Vision Centre North' }];
const FILTER_DEFS: Record<string, { label: string; valueLabel: string; test: (r: Source) => boolean }> = {
  pending: { label: 'Status', valueLabel: 'Pending', test: r => r.status.label === 'Pending' },
  north: { label: 'Centre', valueLabel: 'Vision Centre North', test: r => r.centre === 'Vision Centre North' },
};

/** Plays controller: owns sort/filter/paging state and feeds the table pre-resolved rows. */
function Demo() {
  const [sort, setSort] = useState<{ columnId: string; direction: 'asc' | 'desc' } | undefined>();
  const [filters, setFilters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');
  const [note, setNote] = useState('');

  const filtered = useMemo(() => {
    const rows = SOURCE_ROWS.filter(r => filters.every(f => FILTER_DEFS[f].test(r)));
    if (!sort) return rows;
    const key = (r: Source) => (sort.columnId === 'date' ? r.day : sort.columnId === 'centre' ? r.centre : r.patient);
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (key(a) < key(b) ? -sign : key(a) > key(b) ? sign : 0));
  }, [filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);
  const rows: EmrDataTableRow[] = slice.map(r => ({
    id: r.id,
    cells: { patient: r.patient, centre: r.centre, date: `${String(r.day).padStart(2, '0')} Oct 2026`, status: { text: '', badge: r.status } },
  }));
  const first = slice.length ? (current - 1) * pageSize + 1 : 0;

  const onIntent = (i: EmrDataTableIntent) => {
    setNote(JSON.stringify(i));
    switch (i.type) {
      case 'sortChanged': setSort({ columnId: i.columnId, direction: i.direction }); break;
      case 'filterRemoved': setFilters(f => f.filter(x => x !== i.id)); setPage(1); break;
      case 'filterAddRequested': setFilters(f => (f.includes('pending') ? f : [...f, 'pending'])); setPage(1); break;
      case 'savedFilterSelected': setFilters([i.id]); setPage(1); break;
      case 'densityChanged': setDensity(i.density); break;
      case 'selectionChanged': setSelected(i.selectedIds); break;
      case 'pageChanged': setPage(i.page); break;
      case 'pageSizeChanged': setPageSize(i.pageSize); setPage(1); break;
      case 'retryRequested': setStatus('ready'); break;
      default: break;
    }
  };

  return (
    // RN primitives, not DOM: this demo also renders in the Expo harness (as the native notice).
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['ready', 'loading', 'error'] as const).map(s => (
          <EmrButton key={s} small variant={status === s ? 'primary' : 'outline'} label={s} onPress={() => setStatus(s)} />
        ))}
        <EmrButton small variant="outline" label="Force empty" onPress={() => setFilters(['pending', 'north'])} />
      </View>
      <EmrDataTable
        onIntent={onIntent}
        model={{
          caption: 'Referrals',
          columns: COLUMNS,
          rows,
          selectedIds: selected,
          sort,
          filters: filters.map(id => ({ id, label: FILTER_DEFS[id].label, valueLabel: FILTER_DEFS[id].valueLabel })),
          savedFilters: SAVED,
          bulkActions: [{ id: 'accept', label: 'Accept selected' }],
          density,
          page: current,
          pageCount,
          pageSize,
          pageSizeOptions: [5, 10, 20],
          summaryLabel: `Showing ${first}-${first + slice.length - (first ? 1 : 0)} of ${filtered.length}`,
          status,
          error: 'The referral service did not respond.',
        }}
      />
      <Text style={{ fontSize: 13 }}>{note || 'last intent appears here'}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [{ id: 'data-table', title: 'Referral data table', render: () => <Demo /> }];
