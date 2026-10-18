'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  EmrBottomTabBar, EmrButton, EmrCard, EmrColumns, EmrLoginForm, EmrPinPad, EmrRadioGroup, EmrSelect, EmrStatTile, EmrSyncPill,
  EmrTabs, EmrToast, useEmrTheme,
  type EmrLoginFormModel, type EmrPinPadModel, type EmrStatTileModel, type EmrToastModel,
} from '../../src';
import type { GallerySection } from './types';

// All data is synthetic. The demos play the controller: they own the PIN, the lockout and the queue.

const PIN = '1234';

function PinFlow({ flow }: { flow: 'set' | 'unlock' }) {
  const [digits, setDigits] = useState('');
  const [first, setFirst] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState('');
  const locked = flow === 'unlock' && fails >= 3;
  const mode = flow === 'unlock' ? 'unlock' : first === null ? 'set' : 'confirm';
  const model: EmrPinPadModel = {
    mode, length: 4, digitsEntered: digits.length, error, locked,
    title: mode === 'unlock' ? 'Enter PIN' : mode === 'set' ? 'Choose a PIN' : 'Confirm your PIN',
    prompt: mode === 'unlock' ? 'Demo PIN is 1234' : undefined,
    lockoutMessage: locked ? 'Too many attempts. Try again in 30 seconds.' : undefined,
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrPinPad model={model} showForgot={flow === 'unlock'} onIntent={i => {
        if (i.type === 'digitPressed') { setError(undefined); setDigits(d => (d.length < 4 ? d + i.digit : d)); }
        else if (i.type === 'deleted') { setError(undefined); setDigits(d => d.slice(0, -1)); }
        else if (i.type === 'forgotRequested') setDone('Forgot PIN requested');
        else if (digits.length < 4) setError('Enter 4 digits');
        else if (flow === 'unlock') {
          if (digits === PIN) { setDone('Unlocked'); setFails(0); setError(undefined); }
          else { setFails(n => n + 1); setError('Incorrect PIN'); }
          setDigits('');
        } else if (first === null) { setFirst(digits); setDigits(''); }
        else if (first === digits) { setDone('PIN set'); setFirst(null); setDigits(''); }
        else { setError('PINs do not match. Start again.'); setFirst(null); setDigits(''); }
      }} />
      <Text style={{ textAlign: 'center' }}>{done || ' '}</Text>
      {locked ? <EmrButton variant="outline" label="Reset demo" onPress={() => { setFails(0); setError(undefined); }} /> : null}
    </View>
  );
}

function LoginDemo() {
  const [m, setM] = useState<EmrLoginFormModel>({ title: 'Sign in', username: 'test.user', usernameLabel: 'Username', passwordLabel: 'Password' });
  const [result, setResult] = useState('');
  return (
    <View style={{ gap: 12 }}>
      <EmrLoginForm model={m} onIntent={i => {
        if (i.type === 'usernameChanged') return setM({ ...m, username: i.value });
        setM({ ...m, busy: true, error: undefined });
        setResult(`Submitted for ${i.username} (${i.password.length} chars)`);
        setTimeout(() => setM(p => ({ ...p, busy: false, error: 'Username or password is incorrect.' })), 1200);
      }} />
      <Text>{result}</Text>
      <EmrButton variant="outline" label="Show busy" onPress={() => setM({ ...m, busy: true, error: undefined })} />
    </View>
  );
}

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'patients', label: 'Patients', badge: { label: '2', tone: 'info' as const, assistiveText: '2 new' } },
  { id: 'sync', label: 'Sync' },
  { id: 'more', label: 'More' },
];

function TabBarDemo() {
  const [active, setActive] = useState('today');
  const [scans, setScans] = useState(0);
  return (
    <View style={{ gap: 8 }}>
      <Text>Active: {active} · scans requested: {scans}</Text>
      <EmrBottomTabBar items={TABS} activeId={active} bottomInset={8}
        onIntent={i => (i.type === 'tabSelected' ? setActive(i.id) : setScans(n => n + 1))} />
    </View>
  );
}

function SyncDemo() {
  const [opened, setOpened] = useState(0);
  return (
    <View style={{ gap: 12 }}>
      <EmrSyncPill model={{ label: 'All synced', tone: 'success' }} onIntent={() => setOpened(n => n + 1)} />
      <EmrSyncPill model={{ label: '3 waiting', tone: 'warning', detail: 'Last sync 10 Oct 2026 08:50' }} onIntent={() => setOpened(n => n + 1)} />
      <EmrSyncPill model={{ label: 'Sync failed', tone: 'danger', detail: 'Server unreachable' }} onIntent={() => setOpened(n => n + 1)} />
      <EmrSyncPill model={{ label: 'Offline', tone: 'neutral' }} />
      <Text>Details opened: {opened}</Text>
    </View>
  );
}

function ToastDemo() {
  const [queue, setQueue] = useState<EmrToastModel[]>([]);
  const [log, setLog] = useState('');
  const add = (tone: EmrToastModel['tone'], message: string, actionLabel?: string) =>
    setQueue(q => [...q, { id: String(q.length + Math.random()), message, tone, actionLabel }]);
  const shift = () => setQueue(q => q.slice(1));
  return (
    <View style={{ gap: 8, minHeight: 200 }}>
      <EmrButton variant="outline" label="Queue success" onPress={() => add('success', 'Visit saved.')} />
      <EmrButton variant="outline" label="Queue warning with action" onPress={() => add('warning', '3 records waiting to sync.', 'View')} />
      <EmrButton variant="outline" label="Queue error" onPress={() => add('danger', 'Could not save draft.')} />
      <Text>Queued: {queue.length} {log}</Text>
      <EmrToast model={queue[0] ?? null} onIntent={i => { setLog(i.type); if (i.type === 'dismissed') shift(); }} />
    </View>
  );
}

// ---- composition demos --------------------------------------------------------------------

const STATS: Record<string, EmrStatTileModel[]> = {
  device: [
    { key: 'seen', label: 'Patients seen', value: '18' },
    { key: 'referred', label: 'Referred', value: '4', status: { label: '2 not synced', tone: 'warning' } },
  ],
  centre: [
    { key: 'seen', label: 'Patients seen', value: '41', sub: '3 devices' },
    { key: 'referred', label: 'Referred', value: '9' },
  ],
};

function StatsPanel() {
  const [scope, setScope] = useState('device');
  return (
    <View style={{ gap: 12 }}>
      <EmrTabs tabs={[{ value: 'device', label: 'This device' }, { value: 'centre', label: 'This centre' }]} active={scope} onTabChange={setScope} />
      <EmrColumns count={2} gap={12} collapseBelow={280}>
        {STATS[scope]!.map(s => <EmrStatTile key={s.key} model={s} />)}
      </EmrColumns>
    </View>
  );
}

const CENTRES = [{ value: 'c1', label: 'Test Centre A' }, { value: 'c2', label: 'Test Centre B' }];
const TEAMS = [{ value: 't1', label: 'Team 1' }, { value: 't2', label: 'Team 2' }];

function PecHome() {
  const [centre, setCentre] = useState<string | null>('c1');
  const [team, setTeam] = useState<string | null>('t1');
  const [tab, setTab] = useState('today');
  return (
    <View style={{ gap: 16 }}>
      <EmrSyncPill model={{ label: '3 waiting', tone: 'warning', detail: 'Last sync 08:50' }} onIntent={() => undefined} />
      <EmrCard label="Start of day">
        <View style={{ gap: 12 }}>
          <EmrSelect label="Centre" options={CENTRES} value={centre} onChange={setCentre} />
          <EmrRadioGroup label="Team" options={TEAMS} value={team} onValueChange={setTeam} />
        </View>
      </EmrCard>
      <StatsPanel />
      <EmrBottomTabBar items={TABS} activeId={tab} onIntent={i => i.type === 'tabSelected' && setTab(i.id)} />
    </View>
  );
}

const REFERRED = [
  { id: 'r1', name: 'Test Patient A', meta: 'UHID T-0001 · 54 y F' },
  { id: 'r2', name: 'Test Patient B', meta: 'UHID T-0002 · 61 y M' },
  { id: 'r3', name: 'Test Patient C', meta: 'UHID T-0003 · 47 y F' },
];

function ReferredHome() {
  const t = useEmrTheme();
  const [last, setLast] = useState('');
  return (
    <View style={{ gap: 12 }}>
      <EmrButton label="Scan PEC card" onPress={() => setLast('Scan PEC card')} />
      <EmrButton label="RPC patient (UHID)" onPress={() => setLast('RPC patient')} />
      <View role="list" style={{ gap: 8 }}>
        {REFERRED.map(r => (
          <View key={r.id} role="listitem" style={{ borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 12, backgroundColor: t.surface }}>
            <Text style={{ color: t.text, fontSize: t.textMd }}>{r.name}</Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm }}>{r.meta}</Text>
          </View>
        ))}
      </View>
      <Text>{last}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'pin-set', title: 'PinPad: set then confirm (mismatch shows error)', render: () => <PinFlow flow="set" /> },
  { id: 'pin-unlock', title: 'PinPad: unlock with lockout after 3 wrong', render: () => <PinFlow flow="unlock" /> },
  { id: 'login', title: 'LoginForm: error and busy', render: () => <LoginDemo /> },
  { id: 'tab-bar', title: 'BottomTabBar', render: () => <TabBarDemo /> },
  { id: 'sync-pill', title: 'SyncPill', render: () => <SyncDemo /> },
  { id: 'toast', title: 'Toast queue', render: () => <ToastDemo /> },
  { id: 'today-stats', title: "Today's statistics (composition)", render: () => <StatsPanel /> },
  { id: 'pec-home', title: 'PEC Today home (composition)', render: () => <PecHome /> },
  { id: 'referred-home', title: 'Referred patients home (composition)', render: () => <ReferredHome /> },
];
