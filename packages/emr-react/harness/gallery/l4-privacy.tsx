'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  AccessLogEntryView, AccessLogViewModel, PrivacyCentreViewModel, RightsRequestDraft, RightsRequestKind, RightsRequestView,
  RightsRequestsViewModel, SharingGrantView, SharingGrantsViewModel,
} from '@drguptavivek/emr-controller';
import { EmrAccessLog, EmrPrivacyCentre, EmrRightsRequests, EmrSharingGrants } from '../../src';
import type { GallerySection } from './types';

// ---- Grants: the demo plays controller (revoke needs a confirm; revoked grants lose their action) ----
const grants0: SharingGrantView[] = [
  {
    id: 'g1', recipientLabel: 'Test City Hospital', recipientTypeLabel: 'Hospital', purposeLabel: 'Ongoing care',
    dataScope: ['Prescriptions', 'Lab reports'], recordsPeriodLabel: 'Jan 2024 – Dec 2026', validFromLabel: '01-01-2026',
    validToLabel: '31-12-2026', statusBadge: { label: 'Active', tone: 'success' }, grantedAtLabel: '01-01-2026', grantedByLabel: 'Test Patient A', canRevoke: true,
  },
  {
    id: 'g2', recipientLabel: 'Health locker app', recipientTypeLabel: 'Personal app', purposeLabel: 'Keep my records',
    dataScope: ['Eye examination', 'Prescriptions', 'Discharge summaries'], validFromLabel: '15-03-2026',
    statusBadge: { label: 'Active', tone: 'success' }, grantedAtLabel: '15-03-2026', canRevoke: true,
  },
  {
    id: 'g3', recipientLabel: 'Test City Hospital', recipientTypeLabel: 'Hospital', purposeLabel: 'Second opinion',
    dataScope: ['Imaging'], validFromLabel: '01-02-2025', validToLabel: '01-03-2025',
    statusBadge: { label: 'Expired', tone: 'neutral' }, grantedAtLabel: '01-02-2025', canRevoke: false,
  },
];

const Grants = ({ state = 'ready' }: { state?: SharingGrantsViewModel['state'] }) => {
  const [list, setList] = useState(grants0);
  const [pending, setPending] = useState<string>();
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState<SharingGrantsViewModel['notice']>();
  const shown = list.filter(g => filter === 'all' || (filter === 'active') === (g.statusBadge.label === 'Active'));
  const target = list.find(g => g.id === pending);
  const model: SharingGrantsViewModel = {
    grants: shown, state: state === 'ready' && shown.length === 0 ? 'empty' : state, notice,
    message: state === 'error' ? 'Could not load your sharing list.' : shown.length === 0 && state === 'ready' ? 'No sharing in this view.' : undefined,
    filters: [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'ended', label: 'Ended' }], selectedFilter: filter,
    pendingRevoke: target ? {
      grantId: target.id, title: `Stop sharing with ${target.recipientLabel}?`,
      body: 'They will no longer be able to see new records. Records they already received stay with them.',
      confirmLabel: 'Stop sharing', cancelLabel: 'Keep sharing',
    } : undefined,
  };
  return (
    <EmrSharingGrants model={model} onIntent={i => {
      if (i.type === 'filterSelected') setFilter(i.id);
      if (i.type === 'revokeRequested') setPending(i.grantId);
      if (i.type === 'revokeDismissed') setPending(undefined);
      if (i.type === 'revokeConfirmed') {
        setList(l => l.map(g => (g.id === i.grantId ? { ...g, canRevoke: false, statusBadge: { label: 'Revoked', tone: 'danger' } } : g)));
        setPending(undefined);
        setNotice({ tone: 'success', text: 'Sharing stopped.' });
      }
    }} />
  );
};

// ---- Access log ----
const entry = (n: number, period: string): AccessLogEntryView => ({
  id: `${period}-${n}`, atLabel: `${10 + n}-10-2026 09:${10 + n}`, actorLabel: 'Test Clinician B', actorRoleLabel: 'Ophthalmologist',
  organisationLabel: 'Test City Hospital', actionLabel: n % 2 ? 'Viewed' : 'Updated', dataLabel: 'Eye examination, 12-10-2026',
  purposeLabel: 'Treatment', badge: n % 2 ? undefined : { label: 'Changed', tone: 'info' }, canReportConcern: true,
});

const Log = ({ state = 'ready' }: { state?: AccessLogViewModel['state'] }) => {
  const [period, setPeriod] = useState('30');
  const [pages, setPages] = useState(1);
  const [last, setLast] = useState('');
  const entries = Array.from({ length: pages * 3 }, (_, n) => entry(n, period));
  const model: AccessLogViewModel = {
    entries: state === 'ready' ? entries : [], state, canLoadMore: state === 'ready' && pages < 3,
    message: state === 'empty' ? 'No one has accessed your records in this period.' : state === 'error' ? 'Could not load the access log.' : undefined,
    periodOptions: [{ id: '30', label: 'Last 30 days' }, { id: '90', label: 'Last 90 days' }, { id: 'all', label: 'All time' }], selectedPeriod: period,
  };
  return (
    <View style={{ gap: 4 }}>
      <EmrAccessLog model={model} onIntent={i => {
        if (i.type === 'periodSelected') { setPeriod(i.id); setPages(1); }
        if (i.type === 'loadMoreRequested') setPages(p => p + 1);
        if (i.type === 'concernRequested') setLast(`concern ${i.entryId}`);
      }} />
      {last ? <Text accessibilityLabel={`last intent ${last}`}>{last}</Text> : null}
    </View>
  );
};

// ---- Rights requests ----
const requests0: RightsRequestView[] = [
  {
    id: 'r1', kind: 'access', kindLabel: 'Copy of my data', submittedAtLabel: '05-10-2026', statusBadge: { label: 'In progress', tone: 'info' },
    dueLabel: 'Reply due by 20-10-2026', summary: 'All records from Test City Hospital.', canWithdraw: true,
  },
  {
    id: 'r2', kind: 'correction', kindLabel: 'Correct my details', submittedAtLabel: '01-09-2026', statusBadge: { label: 'Completed', tone: 'success' },
    summary: 'Phone number updated.', responseText: 'Your phone number was corrected on 05-09-2026.', canWithdraw: false,
  },
];
const kindOptions: RightsRequestDraft['kindOptions'] = [
  { id: 'access', label: 'Copy of my data', description: 'Get a copy of the records we hold about you.' },
  { id: 'erasure', label: 'Erase my data', description: 'Ask us to delete your data where the law allows.' },
  { id: 'nominee', label: 'Name a nominee', description: 'Choose someone to act for you if you cannot.' },
];
const GUIDANCE: Partial<Record<RightsRequestKind, string>> = {
  erasure: 'Records we must keep by law, such as treatment records, cannot be erased. We will tell you what was kept and why.',
};

const Rights = ({ start }: { start?: 'erasure' | 'nominee' | 'withdraw' }) => {
  const [list, setList] = useState(requests0);
  // Sheets are full-screen overlays, so no demo starts with one open (it would cover the gallery).
  const [pending, setPending] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<{ kind?: RightsRequestKind; description: string; nominee: { name: string; relationship: string; contact: string }; attached: boolean; tried: boolean } | undefined>(
    start === 'erasure' || start === 'nominee'
      ? { kind: start, description: '', nominee: { name: '', relationship: '', contact: '' }, attached: false, tried: start === 'nominee' }
      : undefined,
  );
  const [notice, setNotice] = useState<RightsRequestsViewModel['notice']>();
  const d = draft;
  const nominee = d?.kind === 'nominee' ? d.nominee : undefined;
  const need = (v: string, msg: string) => (d?.tried && !v.trim() ? msg : undefined);
  const valid = !!d?.kind && !!d.description.trim() && (!nominee || (!!nominee.name.trim() && !!nominee.relationship.trim() && !!nominee.contact.trim()));
  const model: RightsRequestsViewModel = {
    requests: list, state: 'ready', notice,
    draft: d ? {
      kindOptions, kind: d.kind, guidance: d.kind ? GUIDANCE[d.kind] : undefined, description: d.description, descriptionLabel: 'Tell us what you need',
      descriptionError: need(d.description, 'Describe your request'),
      nominee: nominee ? {
        ...nominee, nameError: need(nominee.name, 'Enter the nominee name'), relationshipError: need(nominee.relationship, 'Enter the relationship'),
        contactError: need(nominee.contact, 'Enter a phone number'),
      } : undefined,
      attachmentsLabel: d.attached ? '1 document attached' : undefined, canAttach: !d.attached, canSubmit: valid,
      submitError: d.tried && !valid ? 'Complete the highlighted fields to submit.' : undefined,
    } : undefined,
    pendingWithdrawal: pending ? {
      requestId: pending, title: 'Withdraw this request?', body: 'We will stop working on it. You can send a new request later.',
      confirmLabel: 'Withdraw request', cancelLabel: 'Keep request',
    } : undefined,
  };
  return (
    <EmrRightsRequests model={model} onIntent={i => {
      if (i.type === 'newRequestStarted') setDraft({ description: '', nominee: { name: '', relationship: '', contact: '' }, attached: false, tried: false });
      if (i.type === 'kindSelected') setDraft(x => x && { ...x, kind: i.kind });
      if (i.type === 'descriptionChanged') setDraft(x => x && { ...x, description: i.value });
      if (i.type === 'nomineeChanged') setDraft(x => x && { ...x, nominee: { name: i.name ?? x.nominee.name, relationship: i.relationship ?? x.nominee.relationship, contact: i.contact ?? x.nominee.contact } });
      if (i.type === 'attachRequested') setDraft(x => x && { ...x, attached: true });
      if (i.type === 'draftCancelled') setDraft(undefined);
      if (i.type === 'draftSubmitted') { setDraft(undefined); setNotice({ tone: 'success', text: 'Request sent. We will reply by the date shown.' }); }
      if (i.type === 'withdrawRequested') setPending(i.requestId);
      if (i.type === 'withdrawDismissed') setPending(undefined);
      if (i.type === 'withdrawConfirmed') {
        setList(l => l.map(r => (r.id === i.requestId ? { ...r, canWithdraw: false, statusBadge: { label: 'Withdrawn', tone: 'neutral' } } : r)));
        setPending(undefined);
      }
    }} />
  );
};

// ---- Privacy centre composition: the active section is passed as children ----
const Centre = () => {
  const [section, setSection] = useState<PrivacyCentreViewModel['activeSection']>('grants');
  const model: PrivacyCentreViewModel = {
    title: 'My privacy',
    tiles: [
      { key: 'grants', label: 'Sharing', value: '2', sub: 'active' },
      { key: 'access', label: 'Access log', value: '6', sub: 'last 30 days' },
      { key: 'requests', label: 'Requests', value: '1', sub: 'open', status: { label: 'Reply due', tone: 'warning' } },
    ],
    sections: [{ id: 'consents', label: 'Consents' }, { id: 'grants', label: 'Sharing' }, { id: 'access', label: 'Access log' }, { id: 'requests', label: 'Requests' }],
    activeSection: section, contactText: 'Questions? Call the helpline 000-000-0000 or ask at the desk.',
  };
  return (
    <EmrPrivacyCentre model={model} onIntent={i => setSection(i.type === 'sectionSelected' ? i.id : (i.key as typeof section))}>
      {section === 'grants' ? <Grants /> : section === 'access' ? <Log /> : section === 'requests' ? <Rights /> : <Text>Consents section is supplied by the app.</Text>}
    </EmrPrivacyCentre>
  );
};

export const gallery: GallerySection[] = [
  { id: 'grants', title: 'Sharing grants', render: () => <Grants /> },
  { id: 'grants-loading', title: 'Sharing grants · loading', render: () => <Grants state="loading" /> },
  { id: 'grants-error', title: 'Sharing grants · error', render: () => <Grants state="error" /> },
  { id: 'access-log', title: 'Access log', render: () => <Log /> },
  { id: 'access-log-empty', title: 'Access log · empty', render: () => <Log state="empty" /> },
  { id: 'access-log-error', title: 'Access log · error', render: () => <Log state="error" /> },
  { id: 'rights', title: 'Rights requests', render: () => <Rights /> },
  { id: 'rights-erasure', title: 'Rights requests · erasure draft', render: () => <Rights start="erasure" /> },
  { id: 'rights-nominee', title: 'Rights requests · nominee draft with errors', render: () => <Rights start="nominee" /> },
  { id: 'rights-withdraw', title: 'Rights requests · withdraw (press Withdraw)', render: () => <Rights start="withdraw" /> },
  { id: 'centre', title: 'Privacy centre', render: () => <Centre /> },
];
