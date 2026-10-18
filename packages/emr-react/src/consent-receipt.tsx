'use client';

import { StyleSheet, Text, View } from 'react-native';
import { EmrBadgeView } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrConsentReceiptLabels, EmrConsentReceiptProps } from './consent-receipt.types';

export type * from './consent-receipt.types';

const DEFAULTS: EmrConsentReceiptLabels = { purpose: 'Purpose', decision: 'Decision', patient: 'Patient' };

/** Native receipt: the same content as the web table, as plain Views. Printing is web-only and the app's call. */
export function EmrConsentReceipt({ model: m, labels }: EmrConsentReceiptProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const base = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd, lineHeight: t.textMd * t.leadingNormal };
  const bold = { ...base, fontWeight: fontWeight(t.weightBold) };
  const muted = { ...base, fontSize: t.textSm, color: t.textMuted };
  return (
    <View role="article" aria-label={m.title} style={[styles.root, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text role="heading" aria-level={1} style={[bold, { fontSize: t.textXl, lineHeight: t.textXl * t.leadingNormal }]}>{m.title}</Text>
      <View style={styles.tight}>
        <Text style={bold}>{l.patient}: {m.patientName}</Text>
        {m.identifiers.map((i, k) => <Text key={`${i.label}-${k}`} style={base}>{i.label}: {i.display}</Text>)}
        <Text style={muted}>{m.dateLabel}</Text>
        <Text style={muted}>{m.noticeVersionLabel}</Text>
      </View>
      {m.categories.map((c, ci) => (
        <View key={`${c.label}-${ci}`} style={styles.tight}>
          <Text role="heading" aria-level={2} style={bold}>{c.label}</Text>
          {c.purposes.map((p, pi) => (
            <View key={`${p.label}-${pi}`} style={[styles.row, { borderTopColor: t.border }]}>
              <Text style={[base, styles.shrink]}>{p.label}</Text>
              <Text style={[bold, styles.shrink]}>{p.decisionLabel}</Text>
              {p.statusBadge ? <EmrBadgeView badge={p.statusBadge} /> : null}
            </View>
          ))}
        </View>
      ))}
      <Text style={base}>{m.howToChange}</Text>
      {m.footer ? <Text style={muted}>{m.footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, padding: 12, borderWidth: 1, borderRadius: 8 },
  tight: { gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  shrink: { flexShrink: 1, minWidth: 0 },
});
