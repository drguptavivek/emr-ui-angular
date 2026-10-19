'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { EmrSheetIntent } from '@drguptavivek/emr-controller';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

const DEFAULTS = { back: 'Back', close: 'Close', closeAria: 'Close panel', panel: 'Panel' };

export type { EmrSheetIntent };

/**
 * L4. Port of EmrRightFlyout (also the confirm dialog). Side panel at or above `wideBreakpoint`,
 * bottom sheet below it; window width is fine here because a sheet is an overlay.
 * On web focus moves into the sheet on open and Escape closes it.
 */
export function EmrSheet({ open, title, showBack, footer, wideBreakpoint = 720, labels, onIntent, children }: {
  open: boolean;
  title?: string;
  showBack?: boolean;
  footer?: ReactNode;
  wideBreakpoint?: number;
  labels?: Partial<typeof DEFAULTS>;
  onIntent: (intent: EmrSheetIntent) => void;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const { width, height } = useWindowDimensions();
  const wide = width >= wideBreakpoint;
  const ref = useRef<{ focus?: () => void } | null>(null);
  const close = () => onIntent({ type: 'closeRequested' });
  // react-native-web's Modal portals into document.body, which does not exist during Next.js SSR; rendering it
  // there breaks hydration ("removeChild … not a child"). Mount the modal only after the first client render.
  const [mounted, setMounted] = useState(Platform.OS !== 'web');
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open && Platform.OS === 'web') ref.current?.focus?.();
  }, [open]);

  const webKeys = Platform.OS === 'web'
    ? { onKeyDown: (e: object) => { if ((e as { key?: string }).key === 'Escape') close(); } }
    : null;

  if (!mounted) return null;
  return (
    <Modal visible={open} transparent statusBarTranslucent animationType={wide ? 'fade' : 'slide'} onRequestClose={close}>
      <View style={[styles.root, wide ? styles.rootWide : styles.rootNarrow]}>
        <Pressable aria-hidden accessible={false} style={[StyleSheet.absoluteFill, { backgroundColor: t.shadow, opacity: 0.45 }]} onPress={close} />
        <View
          ref={(el) => { ref.current = el; }}
          role="dialog"
          aria-modal
          aria-label={title || l.panel}
          tabIndex={-1}
          {...webKeys}
          style={[
            styles.sheet,
            { backgroundColor: t.surface, borderColor: t.border },
            wide ? { width: Math.min(480, width), height: '100%' } : { width: '100%', maxHeight: height * 0.9, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: t.border, minHeight: t.controlHeight }]}>
            {showBack ? <EmrButton small variant="ghost" label={l.back} onPress={() => onIntent({ type: 'backRequested' })} /> : null}
            <Text role="heading" style={[styles.title, { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }]}>{title ?? ''}</Text>
            <EmrButton small variant="ghost" label={l.close} accessibilityLabel={l.closeAria} onPress={close} />
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>{children}</ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: t.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootWide: { flexDirection: 'row', justifyContent: 'flex-end' },
  rootNarrow: { justifyContent: 'flex-end' },
  sheet: { borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  title: { flex: 1, minWidth: 0 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { padding: 12, gap: 8 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, borderTopWidth: 1 },
});
