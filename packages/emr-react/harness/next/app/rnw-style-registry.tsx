'use client';

import { useServerInsertedHTML } from 'next/navigation';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

/** Server-renders react-native-web's styles so the first paint is styled. */
export function RNWStyleRegistry({ children }: { children: ReactNode }) {
  useServerInsertedHTML(() => {
    const sheet = (StyleSheet as unknown as { getSheet(): { id: string; textContent: string } }).getSheet();
    return <style id={sheet.id} dangerouslySetInnerHTML={{ __html: sheet.textContent }} />;
  });
  return <>{children}</>;
}
