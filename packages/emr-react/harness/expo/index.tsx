import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { HarnessForm } from '../harness-form';
import { GalleryPage } from '../gallery/gallery-page';
import { EmrDateInput, EmrNumberInput, EmrThemeProvider } from '../../src';

const PAGES = { form: 'OPD form', gallery: 'Gallery', entry: 'Entry' } as const;

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
      {page === 'form' ? <HarnessForm title="emr-react · Expo harness" /> : page === 'gallery' ? <GalleryPage /> : <EntryProbe />}
    </KeyboardAvoidingView>
  );
}

registerRootComponent(App);
