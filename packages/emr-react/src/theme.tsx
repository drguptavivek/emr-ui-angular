'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform, type TextStyle } from 'react-native';
import type { EmrTone } from '@drguptavivek/emr-controller';
import { emrDarkTokens, emrLightTokens, type EmrTokens } from './tokens';

export type EmrColorScheme = 'light' | 'dark';

const EmrThemeContext = createContext<EmrTokens>(emrLightTokens);

/**
 * Theming is a context, like `.emr-theme-dark` on the web. `overrides` re-brands any token
 * (a hospital palette, high contrast) on top of the chosen scheme.
 */
export function EmrThemeProvider({ scheme = 'light', overrides, children }: {
  scheme?: EmrColorScheme;
  overrides?: Partial<EmrTokens>;
  children: ReactNode;
}) {
  const tokens = useMemo(
    () => ({ ...(scheme === 'dark' ? emrDarkTokens : emrLightTokens), ...overrides }),
    [scheme, overrides],
  );
  return <EmrThemeContext.Provider value={tokens}>{children}</EmrThemeContext.Provider>;
}

export function useEmrTheme(): EmrTokens {
  return useContext(EmrThemeContext);
}

/** RN only accepts weights in hundreds; the CSS scale uses 550/650. */
export function fontWeight(weight: number): TextStyle['fontWeight'] {
  return String(Math.min(900, Math.max(100, Math.round(weight / 100) * 100))) as TextStyle['fontWeight'];
}

/** The CSS font stack only means something on web; native falls back to the system font. */
export function fontFamily(t: EmrTokens): string | undefined {
  return Platform.OS === 'web' ? t.fontFamily : undefined;
}

/** Visible focus on web (RNW reports `focused` to Pressable/inputs). Native platforms draw their own focus. */
export function focusRing(t: EmrTokens, focused: boolean | undefined): object | null {
  return Platform.OS === 'web' && focused ? { outlineStyle: 'solid', outlineWidth: 3, outlineColor: t.focus, outlineOffset: 2 } : null;
}

export function toneColors(t: EmrTokens, tone: EmrTone): { color: string; backgroundColor: string } {
  switch (tone) {
    case 'info': return { color: t.info, backgroundColor: t.infoSoft };
    case 'success': return { color: t.success, backgroundColor: t.successSoft };
    case 'warning': return { color: t.warning, backgroundColor: t.warningSoft };
    case 'danger': return { color: t.danger, backgroundColor: t.dangerSoft };
    default: return { color: t.text, backgroundColor: t.neutralSoft };
  }
}
