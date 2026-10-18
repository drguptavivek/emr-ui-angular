'use client';

import type { CSSProperties } from 'react';
import { toneColors, useEmrTheme } from './theme';
import type { EmrConsentReceiptLabels, EmrConsentReceiptProps } from './consent-receipt.types';

export type * from './consent-receipt.types';

const DEFAULTS: EmrConsentReceiptLabels = { purpose: 'Purpose', decision: 'Decision', patient: 'Patient' };

/**
 * Rendered once with the receipt: prints only the receipt, black on white, nothing clipped.
 * Static CSS (no model data), so injecting it is safe.
 */
const PRINT_CSS = `@media print {
  body * { visibility: hidden; }
  .emr-consent-receipt, .emr-consent-receipt * { visibility: visible; }
  .emr-consent-receipt { position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; background: #fff !important; color: #000 !important; overflow: visible !important; }
  .emr-consent-receipt * { color: #000 !important; background: transparent !important; overflow: visible !important; max-height: none !important; }
  .emr-consent-receipt table { page-break-inside: auto; }
  .emr-consent-receipt tr { page-break-inside: avoid; }
}`;

/** Web receipt: semantic h1 / dl / table, inline token styles. Never calls window.print(); the app owns printing. */
export function EmrConsentReceipt({ model: m, labels }: EmrConsentReceiptProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const font: CSSProperties = { fontFamily: t.fontFamily, fontSize: t.textMd, color: t.text };
  const cell: CSSProperties = { padding: '6px 8px', textAlign: 'left', verticalAlign: 'top', borderBottom: `1px solid ${t.border}`, overflowWrap: 'anywhere' };
  return (
    <article className="emr-consent-receipt" aria-labelledby="emr-consent-receipt-title"
      style={{ ...font, boxSizing: 'border-box', maxWidth: '100%', padding: 16, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: 'grid', gap: 12 }}>
      <style>{PRINT_CSS}</style>
      <h1 id="emr-consent-receipt-title" style={{ margin: 0, fontSize: t.textXl, fontWeight: t.weightBold }}>{m.title}</h1>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 12, rowGap: 4 }}>
        <dt style={{ color: t.textMuted }}>{l.patient}</dt>
        <dd style={{ margin: 0, fontWeight: t.weightBold }}>{m.patientName}</dd>
        {m.identifiers.map((i, k) => [
          <dt key={`t${k}`} style={{ color: t.textMuted }}>{i.label}</dt>,
          <dd key={`d${k}`} style={{ margin: 0 }}>{i.display}</dd>,
        ])}
      </dl>
      <p style={{ margin: 0, fontSize: t.textSm, color: t.textMuted }}>{m.dateLabel} · {m.noticeVersionLabel}</p>
      {m.categories.map((c, ci) => (
        <table key={`${c.label}-${ci}`} style={{ width: '100%', borderCollapse: 'collapse', ...font }}>
          <caption style={{ textAlign: 'left', fontWeight: t.weightBold, padding: '6px 0' }}>{c.label}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ ...cell, fontWeight: t.weightBold }}>{l.purpose}</th>
              <th scope="col" style={{ ...cell, fontWeight: t.weightBold }}>{l.decision}</th>
            </tr>
          </thead>
          <tbody>
            {c.purposes.map((p, pi) => (
              <tr key={`${p.label}-${pi}`}>
                <th scope="row" style={{ ...cell, fontWeight: 'normal' }}>{p.label}</th>
                <td style={cell}>
                  {p.decisionLabel}
                  {p.statusBadge ? (
                    <span aria-label={p.statusBadge.assistiveText} style={{ ...toneColors(t, p.statusBadge.tone), marginLeft: 8, padding: '1px 8px', borderRadius: 999, fontSize: t.textXs, fontWeight: t.weightBold }}>
                      {p.statusBadge.label}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <p style={{ margin: 0 }}>{m.howToChange}</p>
      {m.footer ? <p style={{ margin: 0, fontSize: t.textSm, color: t.textMuted }}>{m.footer}</p> : null}
    </article>
  );
}
