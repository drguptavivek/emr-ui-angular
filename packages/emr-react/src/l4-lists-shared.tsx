'use client';

import { useState } from 'react';
import { Platform, type LayoutChangeEvent } from 'react-native';

/** Container (not window) width via onLayout; null until measured, so first paint is the wide layout like EmrColumns. */
export function useContainerWidth(): { width: number | null; onLayout: (e: LayoutChangeEvent) => void } {
  const [width, setWidth] = useState<number | null>(null);
  return { width, onLayout: e => setWidth(e.nativeEvent.layout.width) };
}

/** Toggle-button state. `aria-pressed` is web-only in RN types; native reads selected state. */
export function pressedProps(pressed: boolean): object {
  return Platform.OS === 'web' ? { 'aria-pressed': pressed } : { 'aria-selected': pressed };
}
