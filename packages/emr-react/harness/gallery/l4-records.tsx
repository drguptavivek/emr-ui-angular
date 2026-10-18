'use client';

import { useEffect, useRef, useState } from 'react';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrRecordDiff, EmrUploadQueue, type EmrRecordDiffModel, type EmrUploadQueueItem, type EmrUploadQueueIntent } from '../../src/l4-records';
import type { GallerySection } from './types';

const kindBadges: EmrRecordDiffModel['kindBadges'] = {
  added: { label: '+ Added', tone: 'success' },
  removed: { label: '− Removed', tone: 'danger' },
  changed: { label: '~ Changed', tone: 'warning' },
};

const audit: EmrRecordDiffModel = {
  title: 'Edit audit — synthetic patient 0001',
  summaryLabel: '4 changes by Dr. Test, 12 Mar 2026 10:42',
  kindBadges,
  sections: [
    { id: 'vitals', label: 'Vitals', changes: [
      { id: 'c1', path: ['vitals', 'weight'], label: 'Weight (kg)', before: '68', after: '71', kind: 'changed' },
    ] },
    { id: 'meds', label: 'Medications', changes: [
      { id: 'c2', path: ['medications', 2, 'dose'], label: 'Dose', before: '250 mg', after: '500 mg', kind: 'changed' },
      { id: 'c3', path: ['medications', 3], label: 'Drug', before: 'Placebo tablet', kind: 'removed' },
      { id: 'c4', path: ['medications', 4, 'name'], label: 'Drug name', after: 'Sample syrup', kind: 'added' },
    ] },
  ],
};

const versionDiff: EmrRecordDiffModel = {
  title: 'Form version 3 → 4',
  kindBadges,
  sections: [{ id: 'f', label: 'Fields', changes: [
    { id: 'v1', path: ['history', 'smoking'], label: 'Smoking status', after: 'Choice: never / former / current', kind: 'added' },
    { id: 'v2', path: ['history', 'notes'], label: 'Free notes', before: 'Text, 200 chars', after: 'Text, 1000 chars', kind: 'changed' },
  ] }],
};

const NEUTRAL = (label: string): EmrBadge => ({ label, tone: 'neutral' });

function QueueDemo() {
  const [items, setItems] = useState<EmrUploadQueueItem[]>([]);
  const [picked, setPicked] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // DEMO only: fake progress. A real controller owns this.
  const tick = (id: string, pct: number, failAt?: number) => {
    timers.current.push(setTimeout(() => {
      setItems(xs => xs.map(i => {
        if (i.id !== id) return i;
        if (failAt !== undefined && pct >= failAt) return { ...i, status: { label: 'Failed', tone: 'danger' }, progress: pct, error: 'Network error (demo).' };
        if (pct >= 100) return { ...i, status: { label: 'Ready', tone: 'success' }, progress: 100 };
        return { ...i, status: { label: 'Uploading', tone: 'info' }, progress: pct };
      }));
      if (pct < 100 && !(failAt !== undefined && pct >= failAt)) tick(id, pct + 20, failAt);
    }, 400));
  };

  const onIntent = (intent: EmrUploadQueueIntent) => {
    if (intent.type === 'filesPicked') {
      const added = intent.files.map((f, n) => ({
        id: `f${picked + n}`, name: f.name, sizeLabel: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        status: NEUTRAL('Queued'), progress: 0,
      }));
      added.forEach((a, n) => tick(a.id, 20, (picked + n) % 3 === 1 ? 60 : undefined));
      setPicked(p => p + added.length);
      setItems(xs => [...xs, ...added]);
    } else if (intent.type === 'removeRequested') setItems(xs => xs.filter(i => i.id !== intent.id));
    else if (intent.type === 'retryRequested') {
      setItems(xs => xs.map(i => (i.id === intent.id ? { ...i, error: undefined, status: NEUTRAL('Queued'), progress: 0 } : i)));
      tick(intent.id, 20);
    }
  };

  return (
    <EmrUploadQueue
      model={{
        label: 'Attach documents', accept: 'application/pdf,image/*', acceptDescription: 'PDF or images (the second picked file fails once, to show retry)',
        multiple: true, items, canPublish: items.length > 0 && items.every(i => i.status.tone === 'success'),
      }}
      onIntent={onIntent}
    />
  );
}

export const gallery: GallerySection[] = [
  { id: 'record-diff-audit', title: 'EmrRecordDiff — edit audit', render: () => <EmrRecordDiff model={audit} onIntent={() => {}} /> },
  { id: 'record-diff-version', title: 'EmrRecordDiff — form version', render: () => <EmrRecordDiff model={versionDiff} /> },
  { id: 'upload-queue', title: 'EmrUploadQueue (web only)', render: () => <QueueDemo /> },
];
