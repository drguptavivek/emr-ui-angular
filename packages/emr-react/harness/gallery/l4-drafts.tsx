'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ClinicalFormIntent, ClinicalFormViewModel, DraftRecordListIntent, DraftRecordRowView } from '@drguptavivek/emr-controller';
import { EmrClinicalForm } from '../../src/clinical-form';
import { EmrDraftRecordList } from '../../src/l4-drafts';
import type { GallerySection } from './types';

const ROWS: DraftRecordRowView[] = [
  { id: 'd1', title: 'Eye examination', subtitle: 'Started at Test Centre', patientLabel: 'Test Patient A · 900000001', updatedAtLabel: '16-10-2026 09:40', stateBadge: { label: 'Draft', tone: 'neutral' }, canOpen: true, canMove: true, canDiscard: true },
  { id: 'd2', title: 'Visual acuity', patientLabel: 'Test Patient B · 900000002', updatedAtLabel: '16-10-2026 09:12', stateBadge: { label: 'Waiting to send', tone: 'info' }, canOpen: true, canMove: true, canDiscard: false },
  { id: 'd3', title: 'Referral', patientLabel: 'Test Patient C · 900000003', updatedAtLabel: '15-10-2026 17:05', stateBadge: { label: 'Conflict', tone: 'danger' }, canOpen: true, canMove: false, canDiscard: true },
];

// Demo plays controller: row actions and the discard confirmation wording are the app's.
function ListDemo() {
  const [rows, setRows] = useState(ROWS);
  const [pending, setPending] = useState<string>();
  const [last, setLast] = useState('');
  const row = rows.find(r => r.id === pending);
  const onIntent = (i: DraftRecordListIntent) => {
    setLast(i.type);
    if (i.type === 'discardRequested') setPending(i.id);
    else if (i.type === 'discardDismissed') setPending(undefined);
    else if (i.type === 'discardConfirmed') { setRows(r => r.filter(x => x.id !== i.id)); setPending(undefined); }
  };
  return (
    <View style={{ gap: 8, maxWidth: 360 }}>
      <EmrDraftRecordList onIntent={onIntent} model={{
        rows, state: rows.length ? 'ready' : 'empty', message: rows.length ? undefined : 'No drafts',
        pendingDiscard: row && { id: row.id, title: 'Discard this draft?', body: `${row.title} has not been sent and cannot be recovered.`, confirmLabel: 'Discard', cancelLabel: 'Keep' },
      }} />
      <Text>Last intent: {last}</Text>
    </View>
  );
}

const MODEL: ClinicalFormViewModel = {
  schema: {
    id: 'demo-correction', label: 'Eye examination',
    sections: [{ id: 'main', label: 'Findings', blocks: [{ id: 'va', label: 'Visual acuity', type: 'text', span: 6 }, { id: 'note', label: 'Note', type: 'text', span: 6 }] }],
  },
  fields: { va: { value: '6/9' }, note: { value: 'Synthetic record' } },
  repeatableGroups: {},
  readOnly: true,
  correction: { label: 'Request correction', description: 'Wrong patient? Ask for this record to be corrected.' },
};

function CorrectionDemo() {
  const [last, setLast] = useState('');
  return (
    <View style={{ gap: 8, maxWidth: 360 }}>
      <EmrClinicalForm model={MODEL} onIntent={(i: ClinicalFormIntent) => setLast(i.type)} />
      <Text>Last intent: {last}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'l4-drafts', title: 'EmrDraftRecordList', render: ListDemo },
  { id: 'l4-drafts-correction', title: 'EmrClinicalForm read-only with correction', render: CorrectionDemo },
];
