'use client';

import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { ClinicalFormController, type ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalForm, EmrThemeProvider, useControllerState, useEmrTheme, type EmrColorScheme } from '../src';
import { opdFormFixture } from './fixtures/opd-form';

// ponytail: stands in for the logic engine (relevant: SpecPres = Yes) until emr-controller has one.
function withRelevance(model: ClinicalFormViewModel): ClinicalFormViewModel {
  const specType = model.fields['SpecType'];
  return { ...model, fields: { ...model.fields, SpecType: { ...(specType ?? { value: null }), hidden: model.fields['SpecPres']?.value !== '1' } } };
}

function Surface({ title, scheme, onScheme }: { title: string; scheme: EmrColorScheme; onScheme: (s: EmrColorScheme) => void }) {
  const t = useEmrTheme();
  const controller = useMemo(() => new ClinicalFormController(opdFormFixture), []);
  const model = useControllerState(controller);
  const [last, setLast] = useState('none yet');
  return (
    // Edge-to-edge (SDK 54+) no longer resizes the window for the keyboard: pad it away ourselves.
    // ponytail: Android status-bar inset only; use safe-area-context when iOS matters.
    <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={{ flex: 1, backgroundColor: t.background }}>
    <ScrollView keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, paddingTop: 24 + (StatusBar.currentHeight ?? 0), gap: 16, maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text role="heading" aria-level={1} style={{ color: t.text, fontSize: t.text2xl, fontWeight: '700' }}>{title}</Text>
        <Pressable role="button" onPress={() => onScheme(scheme === 'light' ? 'dark' : 'light')}
          style={{ minHeight: t.controlHeight, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: t.primaryBorder, backgroundColor: t.primarySoft }}>
          <Text style={{ color: t.primaryContrast }}>{scheme === 'light' ? 'Dark theme' : 'Light theme'}</Text>
        </Pressable>
      </View>
      <Text testID="last-intent" style={{ color: t.textMuted, fontSize: t.textSm }}>Last intent: {last}</Text>
      <EmrClinicalForm model={withRelevance(model)} onIntent={intent => { setLast(JSON.stringify(intent)); controller.dispatch(intent); }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Shared by the Next and Expo harnesses so both render the same synthetic OPD form. */
export function HarnessForm({ title }: { title: string }) {
  const [scheme, setScheme] = useState<EmrColorScheme>('light');
  return (
    <EmrThemeProvider scheme={scheme} overrides={OVERRIDES}>
      <Surface title={title} scheme={scheme} onScheme={setScheme} />
    </EmrThemeProvider>
  );
}

// VCMS clinic target: 48dp touch targets via a token override, no fork.
const OVERRIDES = { controlHeight: 48 };
