'use client';

import { Children, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrBadge, EmrStatusCellAction, EmrStatusCellAttribution, EmrStatusCellIntent, EmrTone } from '@drguptavivek/emr-controller';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

/** English fallbacks for built-in strings; every one is overridable by a prop. */
export const L1_DISPLAY_DEFAULTS = {
  emptyTitle: 'Nothing to show',
  loadingTitle: 'Loading…',
  errorTitle: 'Something went wrong',
} as const;

type PressState = PressableStateCallbackType & { focused?: boolean };

/** Glyph paired with the text so tone is never colour alone. Neutral carries none. */
const TONE_GLYPH: Record<EmrTone, string> = { neutral: '', info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };

/** L1. Small pill; the children are the meaning, tone only styles it. */
export function EmrChip({ tone = 'neutral', children }: { tone?: EmrTone; children: ReactNode }) {
  const t = useEmrTheme();
  const c = toneColors(t, tone);
  return (
    <View style={[styles.chip, { backgroundColor: c.backgroundColor, minHeight: t.compactHeight }]}>
      <Text style={{ color: c.color, fontSize: t.textXs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>{children}</Text>
    </View>
  );
}

/** L1. Tone-edged message block; role status as in Angular. `title` is the headline, children the body. */
export function EmrAlert({ tone = 'info', title = '', children }: { tone?: EmrTone; title?: string; children?: ReactNode }) {
  const t = useEmrTheme();
  const c = toneColors(t, tone);
  const glyph = TONE_GLYPH[tone];
  return (
    <View role="status" style={[styles.alert, { backgroundColor: c.backgroundColor, borderLeftColor: c.color }]}>
      {glyph ? <Text aria-hidden style={{ color: c.color, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>{glyph}</Text> : null}
      <View style={styles.flex}>
        {title ? <Text style={{ color: c.color, fontSize: t.textMd, fontWeight: fontWeight(750), fontFamily: fontFamily(t) }}>{title}</Text> : null}
        {children ? <View><TextOrNode color={t.textMuted} size={t.textMd} family={fontFamily(t)}>{children}</TextOrNode></View> : null}
      </View>
    </View>
  );
}

/** Plain strings get themed Text; elements pass through. */
function TextOrNode({ children, color, size, family }: { children: ReactNode; color: string; size: number; family: string | undefined }) {
  return typeof children === 'string' ? <Text style={{ color, fontSize: size, fontFamily: family }}>{children}</Text> : <>{children}</>;
}

/** L1. Empty / loading / error placeholder. Error announces as alert, others as status. */
export function EmrStateMessage({ kind = 'empty', title, message, children }: {
  kind?: 'empty' | 'loading' | 'error';
  title?: string;
  message?: string;
  children?: ReactNode;
}) {
  const t = useEmrTheme();
  const heading = title ?? (kind === 'loading' ? L1_DISPLAY_DEFAULTS.loadingTitle : kind === 'error' ? L1_DISPLAY_DEFAULTS.errorTitle : L1_DISPLAY_DEFAULTS.emptyTitle);
  const text = { color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t), textAlign: 'center' as const };
  return (
    <View role={kind === 'error' ? 'alert' : 'status'} style={styles.state}>
      {kind === 'loading' ? <ActivityIndicator color={t.primary} /> : null}
      {kind === 'error' ? <Text aria-hidden style={{ color: t.danger, fontSize: t.textLg }}>⚠</Text> : null}
      <Text style={[text, { fontWeight: fontWeight(t.weightBold) }]}>{heading}</Text>
      {message ? <Text style={text}>{message}</Text> : null}
      {children}
    </View>
  );
}

/** L1. Divider. A label (horizontal only) is centred between two rules. */
export function EmrSeparator({ orientation = 'horizontal', label }: { orientation?: 'horizontal' | 'vertical'; label?: string }) {
  const t = useEmrTheme();
  if (label) {
    return (
      <View role="separator" aria-orientation="horizontal" aria-label={label} style={styles.labelled}>
        <View aria-hidden style={[styles.line, { backgroundColor: t.border }]} />
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>{label}</Text>
        <View aria-hidden style={[styles.line, { backgroundColor: t.border }]} />
      </View>
    );
  }
  return (
    <View role="separator" aria-orientation={orientation}
      style={orientation === 'vertical'
        ? { width: 1, alignSelf: 'stretch', minHeight: 16, marginHorizontal: 12, backgroundColor: t.border }
        : { height: 1, alignSelf: 'stretch', marginVertical: 16, backgroundColor: t.border }} />
  );
}

/** L1. Card surface with optional heading. `padded={false}` removes body padding. */
export function EmrCard({ label, padded = true, children }: { label?: string; padded?: boolean; children?: ReactNode }) {
  const t = useEmrTheme();
  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      {label ? (
        <View style={[styles.cardTitle, { minHeight: t.controlHeight, backgroundColor: t.surfaceAccent, borderBottomColor: t.border }]}>
          <Text role="heading" style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{label}</Text>
        </View>
      ) : null}
      <View style={padded ? styles.cardBody : undefined}>{children}</View>
    </View>
  );
}

/** Track size: number = px, "2fr" = share of free space, "120px"/"30%" literal, anything else = 1fr. */
function track(width: number | string): object {
  if (typeof width === 'number') return { width, flexShrink: 1 };
  const fr = /^(\d*\.?\d+)fr$/.exec(width);
  if (fr) return { flexGrow: Number(fr[1]), flexBasis: 0, minWidth: 0 };
  const px = /^(\d*\.?\d+)px$/.exec(width);
  if (px) return { width: Number(px[1]), flexShrink: 1 };
  if (/^\d*\.?\d+%$/.test(width)) return { width, flexShrink: 1 };
  return { flexGrow: 1, flexBasis: 0, minWidth: 0 };
}

/**
 * L1. Equal-height columns. `widths` overrides `count`. Stacks to one column when the container
 * (not the window) is narrower than `collapseBelow`; until measured it renders as columns.
 */
export function EmrColumns({ count = 2, widths, gap = 16, collapseBelow = 480, children }: {
  count?: number;
  widths?: readonly (number | string)[];
  gap?: number;
  collapseBelow?: number;
  children?: ReactNode;
}) {
  const [width, setWidth] = useState<number | null>(null);
  const stacked = width !== null && width < collapseBelow;
  const items = Children.toArray(children);
  const tracks = widths && widths.length > 0 ? widths : Array.from({ length: Math.max(1, count) }, () => '1fr');
  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'stretch', gap }}>
      {items.map((child, i) => <View key={i} style={stacked ? undefined : track(tracks[i % tracks.length]!)}>{child}</View>)}
    </View>
  );
}

/** L1. Field / value / remarks / notes row. `heading` styles it as the column-title row and skips the placeholder. */
export function EmrFieldValueRow({ field = '', value = '', remarks = '', notes = '', heading, placeholder = '—' }: {
  field?: string;
  value?: string;
  remarks?: string;
  notes?: string;
  heading?: boolean;
  placeholder?: string;
}) {
  const t = useEmrTheme();
  const cell = (text: string, key: string, strong?: boolean) => (
    <View key={key} role="cell" style={styles.fvrCell}>
      <Text style={{ color: heading ? t.textMuted : t.text, fontSize: heading ? t.textSm : t.textMd, fontFamily: fontFamily(t), fontWeight: fontWeight(heading || strong ? t.weightBold : t.weightRegular) }}>{text}</Text>
    </View>
  );
  return (
    <View role="row" style={[styles.fvr, { borderBottomColor: t.border, backgroundColor: heading ? t.surfaceAccent : undefined }]}>
      {cell(field, 'f', true)}
      {cell(heading ? value : value || placeholder, 'v')}
      {cell(remarks, 'r')}
      {cell(notes, 'n')}
    </View>
  );
}

export type { EmrStatusCellAction, EmrStatusCellAttribution, EmrStatusCellIntent };

/**
 * L1. Caller-supplied badge, optional value, attribution, ONE action. `selectable` makes the body a
 * button (the action stays a sibling, never nested). `compact` hides detail visually; it stays in the label for AT.
 */
export function EmrStatusCell({ status, valueLabel, attribution, action, secondaryNote, readOnly, compact, selectable, onIntent }: {
  status: EmrBadge;
  valueLabel?: string;
  attribution?: EmrStatusCellAttribution;
  action?: EmrStatusCellAction;
  secondaryNote?: string;
  readOnly?: boolean;
  compact?: boolean;
  selectable?: boolean;
  onIntent?: (intent: EmrStatusCellIntent) => void;
}) {
  const t = useEmrTheme();
  const attributionText = attribution ? [attribution.nameLabel, attribution.roleLabel, attribution.timeLabel].filter(Boolean).join(' · ') : '';
  const meta = { color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) };
  const body = (
    <>
      <View style={styles.statusMain}>
        <EmrBadgeView badge={status} />
        {!compact && valueLabel ? <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>{valueLabel}</Text> : null}
      </View>
      {!compact && attributionText ? <Text style={meta}>{attributionText}</Text> : null}
      {!compact && secondaryNote ? <Text style={meta}>{secondaryNote}</Text> : null}
    </>
  );
  // Compact drops detail visually, so the full text moves into the accessible name.
  const hidden = compact ? [valueLabel, attributionText, secondaryNote].filter(Boolean).join('. ') : '';
  const label = hidden ? [status.label, status.assistiveText, hidden].filter(Boolean).join('. ') : undefined;
  return (
    <View style={styles.status}>
      {selectable ? (
        <Pressable role="button" aria-label={label} onPress={() => onIntent?.('selected')}
          style={({ focused }: PressState) => [styles.statusBody, focusRing(t, focused), { minHeight: t.controlHeight, minWidth: t.controlHeight, justifyContent: 'center' }]}>
          {body}
        </Pressable>
      ) : (
        <View aria-label={label} style={styles.statusBody}>{body}</View>
      )}
      {action && !readOnly && !compact
        ? <EmrButton variant="outline" label={action.icon ? `${action.icon} ${action.label}` : action.label} onPress={() => onIntent?.('action')} />
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  alert: { flexDirection: 'row', gap: 10, borderLeftWidth: 4, borderRadius: 8, padding: 12 },
  state: { alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 160, padding: 24 },
  labelled: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  line: { flex: 1, height: 1 },
  card: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  cardTitle: { justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  cardBody: { padding: 16 },
  // Four columns until a cell would drop under ~120dp (a phone card), then two per line: no mid-word breaks.
  fvr: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1 },
  fvrCell: { flexGrow: 1, flexBasis: 120, minWidth: 0 },
  status: { alignItems: 'flex-start', gap: 4, minWidth: 0 },
  statusBody: { gap: 2, minWidth: 0, maxWidth: '100%' },
  statusMain: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
