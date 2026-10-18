import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { HarnessForm } from '../harness-form';
import { galleryGroups } from '../gallery';
import { EmrDateInput, EmrNumberInput, EmrThemeProvider, useEmrTheme, type EmrColorScheme } from '../../src';

const PAGES = { form: 'OPD form', gallery: 'Gallery', entry: 'Entry' } as const;

/** The web gallery, one group at a time: 16 groups in one scroll is unusable on a phone. */
function GroupGallery({ scheme, onScheme }: { scheme: EmrColorScheme; onScheme: (s: EmrColorScheme) => void }) {
  const t = useEmrTheme();
  const [groupId, setGroupId] = useState(galleryGroups[0].id);
  const group = galleryGroups.find(g => g.id === groupId) ?? galleryGroups[0];
  const chip = (key: string, label: string, on: boolean, onPress: () => void) => (
    <Pressable key={key} role="tab" aria-selected={on} onPress={onPress}
      style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primarySoft : t.surface }}>
      <Text style={{ color: t.text, fontWeight: on ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, padding: 8 }}>
        {chip('scheme', scheme === 'light' ? 'Dark' : 'Light', false, () => onScheme(scheme === 'light' ? 'dark' : 'light'))}
        {galleryGroups.map(g => chip(g.id, g.title, g.id === groupId, () => setGroupId(g.id)))}
      </ScrollView>
      <ScrollView key={groupId} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {group.sections.map(({ id, title, render: Render }) => (
          <View key={id} style={{ gap: 12, padding: 16, borderWidth: 1, borderRadius: 12, borderColor: t.border, backgroundColor: t.surface }}>
            <Text role="heading" style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: '700' }}>{title}</Text>
            <Render />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Gallery() {
  const [scheme, setScheme] = useState<EmrColorScheme>('light');
  return <EmrThemeProvider scheme={scheme} overrides={{ controlHeight: 48 }}><GroupGallery scheme={scheme} onScheme={setScheme} /></EmrThemeProvider>;
}

/** Date and number entry with the emitted values on screen: the gallery doesn't show them. */
function EntryProbe() {
  const [date, setDate] = useState<string | null>(null);
  const [num, setNum] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const emit = (name: string) => (v: unknown) => setLog(l => [`${name} → ${JSON.stringify(v)}`, ...l].slice(0, 6));
  return (
    <EmrThemeProvider overrides={{ controlHeight: 48 }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, gap: 16 }}>
        <EmrDateInput label="Probe date" value={date} onValueChange={v => { setDate(v); emit('date')(v); }} />
        <EmrNumberInput label="Probe integer" mode="integer" value={num} onValueChange={v => { setNum(v); emit('integer')(v); }} />
        <Text testID="emitted">{log.join('\n') || 'Nothing emitted yet'}</Text>
      </ScrollView>
    </EmrThemeProvider>
  );
}

function App() {
  const [page, setPage] = useState<keyof typeof PAGES>('form');
  return (
    // Edge-to-edge (SDK 54+) no longer resizes the window for the keyboard, so pad it away here.
    // ponytail: Android status-bar inset only; use safe-area-context when iOS matters.
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, paddingTop: StatusBar.currentHeight ?? 0, backgroundColor: '#1f2937' }}>
      <View role="tablist" style={{ flexDirection: 'row' }}>
        {(Object.keys(PAGES) as (keyof typeof PAGES)[]).map(key => (
          <Pressable key={key} role="tab" aria-selected={page === key} onPress={() => setPage(key)}
            style={{ flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: page === key ? '#93c5fd' : 'transparent' }}>
            <Text style={{ color: '#f9fafb', fontWeight: page === key ? '700' : '400' }}>{PAGES[key]}</Text>
          </Pressable>
        ))}
      </View>
      {page === 'form' ? <HarnessForm title="emr-react · Expo harness" /> : page === 'gallery' ? <Gallery /> : <EntryProbe />}
    </KeyboardAvoidingView>
  );
}

registerRootComponent(App);
