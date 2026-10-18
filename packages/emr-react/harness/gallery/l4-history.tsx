'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  EmrCataractEpisodeCard, EmrPatientHistoryTimeline,
  type EmrCataractEpisode, type EmrPatientHistoryIntent, type EmrPatientHistoryModel,
} from '../../src';
import type { GallerySection } from './types';

const patient = {
  name: 'Test Patient A', ageLabel: '54 y', sexLabel: 'Female', centreName: 'Test Centre',
  identifiers: [{ system: 'uhid', label: 'UHID', display: '900000001' }, { system: 'project', label: 'Project ID', display: '17-26-000123' }],
};
const stages = {
  stages: [
    { id: 'booked', label: 'Booked', status: { label: 'Done', tone: 'success' as const } },
    { id: 'admitted', label: 'Admitted' },
    { id: 'operated', label: 'Operated' },
    { id: 'followup', label: 'Follow-up' },
  ],
  activeId: 'admitted',
};
const admitted: EmrCataractEpisode = {
  id: 'ep-1', eye: 'Right eye', status: 'admitted', statusBadge: { label: 'Admitted', tone: 'info' }, canCompleteSurgery: true,
  admissionDate: '12-10-2026', stages, followups: [],
};
const operated: EmrCataractEpisode = {
  id: 'ep-2', eye: 'Left eye', status: 'operated', statusBadge: { label: 'Operated', tone: 'success' }, canAddFollowup: true,
  admissionDate: '01-09-2026', sxDate: '02-09-2026', stages: { ...stages, activeId: 'followup' },
  followups: [
    { label: 'Day 1', due: '03-09-2026', done: true, statusBadge: { label: 'Seen', tone: 'success' } },
    { label: 'Week 4', due: '30-09-2026', statusBadge: { label: 'Overdue', tone: 'danger' } },
  ],
};
const rxEye = { sph: '+1.25', cyl: '-0.50', axis: '90°', add: '+2.00' };
const full: EmrPatientHistoryModel = {
  patient,
  summary: {
    lastSpectacleRx: { date: '10-10-2026', re: rxEye, le: { sph: '+1.00', cyl: '-0.75', axis: '85°', add: '+2.00' }, type: 'Bifocal', statusBadge: { label: 'Delivered', tone: 'success' } },
    lastGlaucomaScreen: { date: '10-10-2026', iopRe: '16 mmHg', iopLe: '18 mmHg', cdrRe: '0.60', cdrLe: '0.50', decision: 'Review in 6 months' },
    lastDrScreen: { date: '10-10-2026', gradeRe: 'R1', gradeLe: 'R0', maculopathyRe: 'M0', decision: 'Routine recall' },
    openReferrals: [{ id: 'rf-1', date: '10-10-2026', centreName: 'Test Hospital', purpose: 'Cataract surgery', flags: ['Diabetic', 'Hypertensive'], statusBadge: { label: 'Pending', tone: 'warning' } }],
    openBookings: [{ id: 'bk-1', date: '05-10-2026', type: 'Spectacles', paidBadge: { label: 'Paid', tone: 'success' }, daysOpenLabel: '13 days open', overdueBadge: { label: 'Overdue', tone: 'danger' } }],
    openEpisodes: [admitted, operated],
  },
  visits: [
    { id: 'v-2', date: '10-10-2026', centreName: 'Test Centre', teamName: 'Team 1', pvaRe: '6/12', pvaLe: '6/9', diagnosis: 'Immature cataract', advice: 'Surgery advised' },
    { id: 'v-1', date: '01-04-2026', centreName: 'RPC', teamName: 'Outreach', pvaRe: '6/18' },
  ],
};
const newPatient: EmrPatientHistoryModel = {
  patient, summary: { openReferrals: [], openBookings: [], openEpisodes: [] }, visits: [],
};

function Last({ last }: { last: string }) {
  return <Text accessibilityLabel="Last intent" style={{ marginTop: 8 }}>{`Last intent: ${last}`}</Text>;
}

const History = ({ model }: { model: EmrPatientHistoryModel }) => {
  const [last, setLast] = useState('none');
  return (
    <View style={{ gap: 8 }}>
      <EmrPatientHistoryTimeline model={model} onIntent={(i: EmrPatientHistoryIntent) => setLast(JSON.stringify(i))} />
      <Last last={last} />
    </View>
  );
};

const Episode = ({ episode }: { episode: EmrCataractEpisode }) => {
  const [last, setLast] = useState('none');
  return (
    <View style={{ gap: 8 }}>
      <EmrCataractEpisodeCard episode={episode} onIntent={i => setLast(JSON.stringify(i))} />
      <Last last={last} />
    </View>
  );
};

export const gallery: GallerySection[] = [
  { id: 'history-full', title: 'Patient history · full snapshot', render: () => <History model={full} /> },
  { id: 'history-loading', title: 'Patient history · loading', render: () => <History model={{ ...full, loading: true }} /> },
  { id: 'history-new', title: 'Patient history · new patient', render: () => <History model={newPatient} /> },
  { id: 'episode-admitted', title: 'Cataract episode · admitted', render: () => <Episode episode={admitted} /> },
  { id: 'episode-operated', title: 'Cataract episode · operated', render: () => <Episode episode={operated} /> },
];
