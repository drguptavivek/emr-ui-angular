'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import {
  EmrBarcodeScanField, EmrClinicalForm, EmrIdentifierCheckPrompt, EmrPatientIdentityCard,
  type EmrCustomFieldProps, type EmrCustomRenderer, type EmrIdentifierCheckModel, type EmrPatientIdentity,
} from '../../src';
import type { GallerySection } from './types';

const patient: EmrPatientIdentity = {
  name: 'Test Patient A',
  ageLabel: '54 y',
  sexLabel: 'Female',
  phone: '9000000001',
  centreName: 'Test Centre',
  lastVisitDate: '01-10-2026',
  aliases: ['Test A'],
  identifiers: [
    { system: 'uhid', label: 'UHID', display: '900000001' },
    { system: 'project', label: 'Project ID', display: '17-26-000123' },
    { system: 'abha', label: 'ABHA number', display: '00-0000-0000-0001', statusBadge: { label: 'Under review', tone: 'warning' } },
  ],
  addableSystems: [{ system: 'abha-address', label: 'ABHA address' }],
  alerts: [
    { id: 'phone', text: 'Phone number needs correcting', tone: 'warning', actionLabel: 'Update number' },
    { id: 'merge', text: 'Merge pending', tone: 'info' },
  ],
};
const Identity = ({ mode }: { mode: 'full' | 'compact' }) => {
  const [last, setLast] = useState('');
  return (
    <View style={{ gap: 4, maxWidth: mode === 'compact' ? 360 : undefined }}>
      <EmrPatientIdentityCard mode={mode} model={patient} onIntent={i => setLast(i.type === 'alertActionRequested' ? `alert ${i.id}` : i.type)} />
      {last ? <Text style={{ fontSize: 13 }}>Last intent: {last}</Text> : null}
    </View>
  );
};
const candidate = { ...patient, id: 'cand-1', name: 'Test Patient B', addableSystems: [] };

const Field = ({ variant }: { variant: 'plain' | 'normalised' | 'error' | 'warning' | 'type' }) => {
  const [value, setValue] = useState(variant === 'plain' ? '' : '17-26-000123');
  const [type, setType] = useState('project');
  const [scans, setScans] = useState(0);
  return (
    <View style={{ gap: 4 }}>
      <EmrBarcodeScanField
        label="Identifier" hint={variant === 'plain' ? `Scans requested: ${scans}` : undefined}
        value={value} onValueChange={setValue}
        normalisedValue={variant === 'normalised' ? '17-26-000123' : undefined}
        error={variant === 'error' ? 'Not a recognised identifier' : undefined}
        warning={variant === 'warning' ? 'Already used at another centre' : undefined}
        typeOptions={variant === 'type' ? [{ id: 'project', label: 'Project ID' }, { id: 'uhid', label: 'UHID' }, { id: 'abha', label: 'ABHA' }] : undefined}
        selectedType={variant === 'type' ? type : undefined}
        onIntent={i => (i.type === 'typeSelected' ? setType(i.id) : setScans(n => n + 1))}
      />
    </View>
  );
};

const Check = ({ outcome }: { outcome: EmrIdentifierCheckModel['outcome'] }) => {
  const [acked, setAcked] = useState<string[]>([]);
  const [log, setLog] = useState('');
  const findings: EmrIdentifierCheckModel['findings'] = outcome === 'ok' ? [] : [
    {
      id: 'f1', kind: outcome === 'blocked' ? 'on_other_patient' : 'same_type_exists',
      message: outcome === 'blocked' ? 'This identifier belongs to another patient' : 'This patient already has an identifier of this type',
      evidence: [{ label: 'Registered', value: '01-10-2026' }, { label: 'Centre', value: 'Test Centre' }],
      candidate, acknowledged: acked.includes('f1'),
    },
    ...(outcome === 'warnings' ? [{
      id: 'f2', kind: 'demographic_mismatch' as const, message: 'Age differs from the existing record',
      evidence: [{ label: 'Recorded age', value: '45 y' }], acknowledged: acked.includes('f2'),
    }] : []),
  ];
  const model: EmrIdentifierCheckModel = {
    identifier: { label: 'Project ID', display: '17-26-000123' }, outcome, findings,
    canConfirm: outcome === 'ok' || findings.every(f => f.acknowledged),
    // The demo plays controller: these are offered once warnings are acknowledged.
    canAddAsAdditional: outcome === 'warnings' && findings.every(f => f.acknowledged),
    canReplaceExisting: outcome === 'warnings' && findings.every(f => f.acknowledged),
  };
  return (
    <View style={{ gap: 4 }}>
      <EmrIdentifierCheckPrompt model={model} onIntent={i => {
        if (i.type === 'findingAcknowledged') setAcked(a => (a.includes(i.findingId) ? a.filter(x => x !== i.findingId) : [...a, i.findingId]));
        setLog(i.type);
      }} />
      {log ? <Text style={{ fontSize: 13 }}>Last intent: {log}</Text> : null}
    </View>
  );
};

// A self-framed custom renderer: the scan field draws its own label, so the form must not add a second one.
const OpdScan: EmrCustomRenderer = ({ definition, model, readOnly, onValueChange }: EmrCustomFieldProps) => (
  <EmrBarcodeScanField label={definition.label} value={String(model?.value ?? '')} readOnly={readOnly} error={model?.error}
    onValueChange={onValueChange} onIntent={() => undefined} />
);
OpdScan.framed = true;

function FormScan() {
  const [value, setValue] = useState('');
  const model: ClinicalFormViewModel = {
    schema: { id: 'opd-demo', label: 'Registration', sections: [{ id: 's', label: 'Identifiers', blocks: [
      { id: 'opd', label: 'Opd Number', type: 'custom', customRendererKey: 'opdScan', span: 12 },
    ] }] },
    fields: { opd: { value } }, repeatableGroups: {},
  };
  return <EmrClinicalForm model={model} customRenderers={{ opdScan: OpdScan }}
    onIntent={i => { if (i.type === 'fieldEditRequested') setValue(String(i.value ?? '')); }} />;
}

export const gallery: GallerySection[] = [
  { id: 'scan-plain', title: 'Barcode scan field', render: () => <Field variant="plain" /> },
  { id: 'scan-normalised', title: 'Barcode scan field · normalised', render: () => <Field variant="normalised" /> },
  { id: 'scan-error', title: 'Barcode scan field · error', render: () => <Field variant="error" /> },
  { id: 'scan-warning', title: 'Barcode scan field · warning', render: () => <Field variant="warning" /> },
  { id: 'scan-type', title: 'Barcode scan field · type picker', render: () => <Field variant="type" /> },
  { id: 'identity-full', title: 'Patient identity card · full', render: () => <Identity mode="full" /> },
  { id: 'identity-compact', title: 'Patient identity card · compact', render: () => <Identity mode="compact" /> },
  { id: 'check-blocked', title: 'Identifier check · blocked', render: () => <Check outcome="blocked" /> },
  { id: 'check-warnings', title: 'Identifier check · warnings', render: () => <Check outcome="warnings" /> },
  { id: 'scan-in-form', title: 'Barcode scan field as a framed custom renderer (one label)', render: () => <FormScan /> },
  { id: 'check-ok', title: 'Identifier check · ok', render: () => <Check outcome="ok" /> },
];
