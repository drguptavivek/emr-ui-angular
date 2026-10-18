'use client';

import { EmrStateMessage } from './l1-display';
import type { EmrDataTableLabels, EmrDataTableProps } from './data-table.types';

export type * from './data-table.types';

const DEFAULTS: Pick<EmrDataTableLabels, 'nativeUnavailable'> = {
  nativeUnavailable: 'This table is available on the web app.',
};

/** Native fallback: the dense table is web-only (`data-table.web.tsx`); Metro resolves this notice instead. */
export function EmrDataTable({ labels }: EmrDataTableProps) {
  return <EmrStateMessage kind="empty" message={labels?.nativeUnavailable ?? DEFAULTS.nativeUnavailable} />;
}
