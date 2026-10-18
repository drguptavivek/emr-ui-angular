'use client';

import { useState } from 'react';
import { View } from 'react-native';
import type { AttestationViewModel, CaptureStatusBarViewModel, PatientBannerViewModel } from '@drguptavivek/emr-controller';
import { EmrAttestation, EmrButton, EmrCaptureStatusBar, EmrPatientBanner, EmrSheet } from '../../src';
import type { GallerySection } from './types';

const patient: PatientBannerViewModel = {
  patientId: 'TP-0001',
  displayName: 'Test Patient A',
  identifiers: [{ label: 'Health ID', value: '00-0000-0000-0001' }],
  ageLabel: '54 y',
  sexLabel: 'Female',
  careSetting: 'ipd',
  careSettingLabel: 'Inpatient',
  locationLabel: 'Ward 3',
  encounterLabel: 'Encounter 0001',
  criticality: { label: 'Critical', tone: 'danger' },
  allergies: [
    { id: 'a1', label: 'Penicillin', tone: 'danger' },
    { id: 'a2', label: 'Latex', tone: 'warning' },
    { id: 'a3', label: 'Peanut', tone: 'warning' },
  ],
  allergyStatus: { label: 'Allergies recorded', tone: 'warning' },
  allergyChipPrefix: 'Allergy:',
  allergyOverflow: { label: '+1 allergies', tone: 'warning' },
  chronicDiseases: [{ id: 'c1', label: 'Type 2 diabetes', tone: 'info' }],
  alerts: [{ id: 'f1', label: 'Fall risk', tone: 'warning' }],
  expanded: false,
  bedLabel: 'Bed 12',
  wardLabel: 'Ward 3',
  lengthOfStayLabel: 'Day 4',
  codeStatus: { label: 'Full code', tone: 'neutral' },
  weightLabel: '62 kg',
};

const signatory = (id: string, name: string, signed: boolean) => ({
  id, displayName: name, roleLabel: 'Nurse',
  status: { label: signed ? 'Signed' : 'Awaiting signature', tone: signed ? 'success' : 'warning' } as const,
  signedAtLabel: signed ? '10 Oct 2026 09:14' : undefined,
});

function Banner({ compact }: { compact?: boolean }) {
  const [m, setM] = useState(patient);
  return <EmrPatientBanner model={m} compact={compact} onIntent={(i) => setM({ ...m, expanded: i.expanded })} />;
}

function StatusBar() {
  const [m, setM] = useState<CaptureStatusBarViewModel>({
    session: { dirty: true, saving: false, savedAt: null, conflict: null, error: null },
    attributionLabel: 'Recorded by Test Clinician, 10 Oct 2026 09:14',
    signature: { status: { label: 'Unsigned', tone: 'warning' }, signatories: [signatory('s1', 'Test Nurse B', false)], canSign: true, canAmend: false },
    connection: { label: 'Offline', tone: 'warning' },
    outbox: { count: 3, label: '3 waiting to sync', tone: 'warning' },
    lastSync: '10 Oct 2026 08:50',
  });
  return (
    <EmrCaptureStatusBar
      model={m}
      onIntent={(i) => {
        if (i.type === 'saveRequested') setM({ ...m, savedAtLabel: '09:20', session: { ...m.session, dirty: false, savedAt: '2026-10-10T09:20:00Z', error: null } });
        else if (i.type === 'discardRequested') setM({ ...m, session: { ...m.session, dirty: false } });
        else if (i.type === 'conflictDetailRequested' || i.type === 'conflictResolutionRequested') setM({ ...m, session: { ...m.session, conflict: null } });
        else setM({ ...m, session: { ...m.session, error: 'Network unavailable' } });
      }}
    />
  );
}

function Attestation() {
  const [last, setLast] = useState('');
  const model: AttestationViewModel = {
    id: 'att1', title: 'Administered by', statement: 'I confirm the dose was given as charted.',
    signatories: [signatory('s1', 'Test Nurse B', true), signatory('s2', 'Test Nurse C', false)],
    canSign: true, canAmend: true,
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrAttestation model={model} onIntent={(i) => setLast(i.type)} />
      {last ? <EmrCaptureStatusBar model={{ session: { dirty: false, saving: false, savedAt: null, conflict: null, error: null }, attributionLabel: `Last intent: ${last}` }} onIntent={() => {}} /> : null}
    </View>
  );
}

function Sheet() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <EmrButton label="Open sheet" onPress={() => setOpen(true)} />
      <EmrSheet
        open={open}
        title="Discard changes?"
        onIntent={() => setOpen(false)}
        footer={<><EmrButton variant="outline" label="Cancel" onPress={() => setOpen(false)} /><EmrButton label="Discard" onPress={() => setOpen(false)} /></>}
      >
        <EmrAttestation model={{ id: 'a', statement: 'Unsaved changes for Test Patient A will be lost.', signatories: [], canSign: false }} onIntent={() => {}} />
      </EmrSheet>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'patient-banner', title: 'EmrPatientBanner', render: () => <Banner /> },
  { id: 'patient-banner-compact', title: 'EmrPatientBanner compact', render: () => <Banner compact /> },
  { id: 'capture-status-bar', title: 'EmrCaptureStatusBar (with sync state)', render: () => <StatusBar /> },
  { id: 'attestation', title: 'EmrAttestation', render: () => <Attestation /> },
  { id: 'sheet', title: 'EmrSheet', render: () => <Sheet /> },
];
