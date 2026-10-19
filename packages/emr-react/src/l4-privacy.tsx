'use client';

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type {
  EmrPrivacyCentreIntent,
  EmrPrivacyCentreModel,
  PrivacyCentreIntent,
  PrivacyCentreViewModel,
} from '@drguptavivek/emr-controller';
import { EmrTabs } from './l1-interactive';
import { PRIVACY_DEFAULTS, privacyStyles as s, usePrivacyText, type EmrPrivacyLabels } from './l4-privacy-shared';
import { EmrStatTile } from './stat-tile';

export * from './l4-privacy-grants';
export * from './l4-privacy-log';
export * from './l4-privacy-rights';
export type { EmrPrivacyLabels } from './l4-privacy-shared';
export type { EmrPrivacyCentreIntent, EmrPrivacyCentreModel };

/** L4. Self-service home: summary tiles, section tabs and contact text. The app passes the active section as children. */
export function EmrPrivacyCentre({ model: m, labels, onIntent, children }: {
  model: PrivacyCentreViewModel;
  labels?: Partial<EmrPrivacyLabels>;
  onIntent: (intent: PrivacyCentreIntent) => void;
  children?: ReactNode;
}) {
  const l = { ...PRIVACY_DEFAULTS, ...labels };
  const { t, bold, small } = usePrivacyText();
  return (
    <View role="region" aria-label={m.title} style={{ gap: 16 }}>
      <Text role="heading" style={[bold, { fontSize: t.textXl }]}>{m.title}</Text>
      <View style={s.wrap}>
        {m.tiles.map(tile => (
          <View key={tile.key} style={{ flexGrow: 1, flexBasis: 140, minWidth: 0 }}>
            <EmrStatTile model={tile} onIntent={i => onIntent({ type: 'tileSelected', key: i.key })} />
          </View>
        ))}
      </View>
      <EmrTabs ariaLabel={l.sections} active={m.activeSection} tabs={m.sections.map(x => ({ value: x.id, label: x.label }))}
        onTabChange={id => onIntent({ type: 'sectionSelected', id: id as PrivacyCentreViewModel['activeSection'] })} />
      {children}
      {m.contactText ? <Text style={small}>{m.contactText}</Text> : null}
    </View>
  );
}
