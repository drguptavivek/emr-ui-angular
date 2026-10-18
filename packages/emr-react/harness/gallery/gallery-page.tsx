'use client';

import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmrThemeProvider, useEmrTheme, type EmrColorScheme } from '../../src';
import { galleryGroups } from './index';

function Section({ id, title, render: Render }: { id: string; title: string; render: () => React.ReactNode }) {
  const t = useEmrTheme();
  return (
    <View nativeID={`gallery-${id}`} style={{ gap: 12, padding: 16, borderWidth: 1, borderRadius: 12, borderColor: t.border, backgroundColor: t.surface }}>
      <Text role="heading" aria-level={3} style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: '700' }}>{title}</Text>
      <Render />
    </View>
  );
}

function Surface({ scheme, onScheme }: { scheme: EmrColorScheme; onScheme: (s: EmrColorScheme) => void }) {
  const t = useEmrTheme();
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.background }} contentContainerStyle={{ padding: 24, gap: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text role="heading" aria-level={1} style={{ color: t.text, fontSize: t.text2xl, fontWeight: '700' }}>emr-react gallery</Text>
        <Pressable role="button" onPress={() => onScheme(scheme === 'light' ? 'dark' : 'light')}
          style={{ minHeight: t.controlHeight, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: t.primaryBorder, backgroundColor: t.primarySoft }}>
          <Text style={{ color: t.primaryContrast }}>{scheme === 'light' ? 'Dark theme' : 'Light theme'}</Text>
        </Pressable>
      </View>
      {galleryGroups.map(group => (
        <View key={group.id} nativeID={`group-${group.id}`} style={{ gap: 12 }}>
          <Text role="heading" aria-level={2} style={{ color: t.text, fontSize: t.textXl, fontWeight: '700' }}>{group.title}</Text>
          {group.sections.length === 0 ? <Text style={{ color: t.textMuted }}>Nothing here yet.</Text> : null}
          {group.sections.map(section => <Section key={section.id} {...section} />)}
        </View>
      ))}
    </ScrollView>
  );
}

export function GalleryPage() {
  const [scheme, setScheme] = useState<EmrColorScheme>('light');
  return (
    <EmrThemeProvider scheme={scheme} overrides={{ controlHeight: 48 }}>
      <Surface scheme={scheme} onScheme={setScheme} />
    </EmrThemeProvider>
  );
}
