'use client';

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ClinicalFormController, type ClinicalFormViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalForm, EmrThemeProvider, useControllerState, useEmrTheme, type EmrColorScheme } from '../../../src';
import { opdFormFixture } from '../../fixtures/opd-form';

// ponytail: stands in for the logic engine (relevant: SpecPres = Yes) until emr-controller has one.
function withRelevance(model: ClinicalFormViewModel): ClinicalFormViewModel {
  const specType = model.fields['SpecType'];
  return { ...model, fields: { ...model.fields, SpecType: { ...(specType ?? { value: null }), hidden: model.fields['SpecPres']?.value !== '1' } } };
}

function Surface({ scheme, onScheme }: { scheme: EmrColorScheme; onScheme: (s: EmrColorScheme) => void }) {
  const t = useEmrTheme();
  const controller = useMemo(() => new ClinicalFormController(opdFormFixture), []);
  const model = useControllerState(controller);
  const [last, setLast] = useState('none yet');
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text role="heading" aria-level={1} style={{ color: t.text, fontSize: t.text2xl, fontWeight: '700' }}>emr-react · Next.js harness</Text>
        <Pressable role="button" onPress={() => onScheme(scheme === 'light' ? 'dark' : 'light')}
          style={{ minHeight: t.controlHeight, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: t.primaryBorder, backgroundColor: t.primarySoft }}>
          <Text style={{ color: t.primaryContrast }}>{scheme === 'light' ? 'Dark theme' : 'Light theme'}</Text>
        </Pressable>
      </View>
      <Text testID="last-intent" style={{ color: t.textMuted, fontSize: t.textSm }}>Last intent: {last}</Text>
      <EmrClinicalForm model={withRelevance(model)} onIntent={intent => { setLast(JSON.stringify(intent)); controller.dispatch(intent); }} />
    </ScrollView>
  );
}

export function HarnessForm() {
  const [scheme, setScheme] = useState<EmrColorScheme>('light');
  return (
    <EmrThemeProvider scheme={scheme} overrides={OVERRIDES}>
      <Surface scheme={scheme} onScheme={setScheme} />
    </EmrThemeProvider>
  );
}

// VCMS clinic target: 48dp touch targets via a token override, no fork.
const OVERRIDES = { controlHeight: 48 };
