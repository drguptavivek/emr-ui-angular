'use client';

import { useState } from 'react';
import { EmrConsentReceipt, EmrConsentReview, type EmrConsentReceiptModel, type EmrConsentReviewIntent, type EmrConsentReviewModel, type EmrConsentReviewPurpose } from '../../src';
import type { GallerySection } from './types';

// Synthetic placeholder data and wording only; not legal text.
const PATIENT = {
  identifiers: [{ system: 'mrn', label: 'MRN', display: 'TEST-000123' }],
  name: 'Test Patient A', ageLabel: '42 y', sexLabel: 'Female',
};
const GRANTED = { label: 'Granted', tone: 'success' as const };
const WITHDRAWN = { label: 'Withdrawn', tone: 'warning' as const };

type Entry = { granted: boolean; channels: string[]; number: string };
type State = Record<'care' | 'followup' | 'research' | 'camp', Entry>;

const INITIAL: State = {
  care: { granted: true, channels: [], number: '' },
  followup: { granted: true, channels: ['sms'], number: '9000000000' },
  research: { granted: false, channels: [], number: '' },
  camp: { granted: true, channels: [], number: '' },
};

function buildPurpose(id: string, label: string, essential: boolean, s: Entry, contact: boolean): EmrConsentReviewPurpose {
  return {
    id, label, essential, description: 'Placeholder description.',
    statusBadge: s.granted ? GRANTED : WITHDRAWN,
    decidedAtLabel: '01 Jan 2026, 10:00', methodLabel: 'Tap', givenByLabel: 'Self',
    canWithdraw: s.granted, canGrant: !s.granted,
    contact: contact ? {
      channels: [['sms', 'SMS'], ['call', 'Call'], ['wa', 'WhatsApp']].map(([cid, cl]) => ({ id: cid, label: cl, selected: s.channels.includes(cid) })),
      preferredNumber: s.number, preferredNumberLabel: 'Preferred number',
      preferredNumberError: s.number && !/^\d{10}$/.test(s.number) ? 'Placeholder: enter 10 digits.' : undefined,
    } : undefined,
  };
}

function ReviewDemo() {
  const [state, setState] = useState<State>(INITIAL);
  const [pendingId, setPendingId] = useState<string>();
  const [note, setNote] = useState<string>();
  const patch = (id: string, p: Partial<Entry>) => setState(s => ({ ...s, [id as keyof State]: { ...s[id as keyof State], ...p } }));

  const model: EmrConsentReviewModel = {
    patient: PATIENT, noticeVersionLabel: 'Notice version 1 · English',
    categories: [
      { id: 'care', label: 'Care', purposes: [buildPurpose('care', 'Eye care records', true, state.care, false)] },
      { id: 'contact', label: 'Contact', purposes: [buildPurpose('followup', 'Follow-up contact', false, state.followup, true)] },
      { id: 'sharing', label: 'Sharing', purposes: [
        buildPurpose('research', 'Research use', false, state.research, false),
        buildPurpose('camp', 'Screening camp sharing', false, state.camp, false),
      ] },
    ],
    pendingWithdrawal: pendingId ? {
      purposeId: pendingId, title: 'Withdraw consent?',
      body: 'Placeholder: what stops if this consent is withdrawn is described here by the app.',
      confirmLabel: 'Withdraw consent', cancelLabel: 'Keep consent',
    } : undefined,
    message: note ? { tone: 'info', text: note } : undefined,
  };

  const onIntent = (i: EmrConsentReviewIntent) => {
    switch (i.type) {
      case 'withdrawRequested': setPendingId(i.purposeId); break;
      case 'withdrawConfirmed': patch(i.purposeId, { granted: false }); setPendingId(undefined); setNote('Consent withdrawn.'); break;
      case 'withdrawDismissed': setPendingId(undefined); break;
      case 'grantRequested': patch(i.purposeId, { granted: true }); setNote('Consent granted.'); break;
      case 'channelToggled': {
        const cur = state[i.purposeId as keyof State].channels;
        patch(i.purposeId, { channels: cur.includes(i.channelId) ? cur.filter(c => c !== i.channelId) : [...cur, i.channelId] });
        break;
      }
      case 'preferredNumberChanged': patch(i.purposeId, { number: i.value }); break;
      case 'receiptRequested': setNote('Receipt requested (the app would print or share it here).'); break;
      case 'cancelled': setNote('Closed.'); break;
    }
  };
  return <EmrConsentReview model={model} onIntent={onIntent} />;
}

const RECEIPT: EmrConsentReceiptModel = {
  title: 'Consent receipt', patientName: 'Test Patient A',
  identifiers: [{ label: 'MRN', display: 'TEST-000123' }, { label: 'Phone', display: '9000000000' }],
  dateLabel: '01 Jan 2026', noticeVersionLabel: 'Notice version 1 · English',
  categories: [
    { label: 'Care', purposes: [{ label: 'Eye care records', decisionLabel: 'Required for care' }] },
    { label: 'Sharing', purposes: [
      { label: 'Research use', decisionLabel: 'Withdrawn', statusBadge: WITHDRAWN },
      { label: 'Screening camp sharing', decisionLabel: 'Granted', statusBadge: GRANTED },
    ] },
  ],
  howToChange: 'To change: visit the desk or call the helpline 1800-000-0000',
  footer: 'Placeholder footer text.',
};

export const gallery: GallerySection[] = [
  { id: 'consent-review', title: 'Consent review (withdraw, grant, contact)', render: () => <ReviewDemo /> },
  { id: 'consent-receipt', title: 'Consent receipt (printable)', render: () => <EmrConsentReceipt model={RECEIPT} /> },
];
