'use client';

import { EmrStateMessage } from './l1-display';
import type { EmrUploadQueueProps } from './upload-queue.types';

export type * from './upload-queue.types';

const DEFAULTS = { nativeUnavailable: 'File upload is available on the web app.' };

/** Native fallback: the picker is web-only (`upload-queue.web.tsx`); Metro resolves this notice instead. */
export function EmrUploadQueue({ labels }: EmrUploadQueueProps) {
  return <EmrStateMessage kind="empty" message={labels?.nativeUnavailable ?? DEFAULTS.nativeUnavailable} />;
}
