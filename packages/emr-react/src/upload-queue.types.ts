import type { EmrBadge } from '@drguptavivek/emr-controller';

export interface EmrUploadQueueItem {
  id: string;
  name: string;
  /** Pre-formatted, e.g. "1.2 MB". */
  sizeLabel: string;
  status: EmrBadge;
  /** 0–100, supplied by the controller. Omit when not uploading. */
  progress?: number;
  error?: string;
}

export interface EmrUploadQueueModel {
  label: string;
  /** Comma-separated MIME types / extensions for the input's `accept`. */
  accept?: string;
  /** Human-readable form of `accept`, e.g. "PDF or JPEG, up to 10 MB". */
  acceptDescription?: string;
  multiple?: boolean;
  items: readonly EmrUploadQueueItem[];
  /** Publish is available only when the controller says so. */
  canPublish: boolean;
}

export interface EmrPickedFile { name: string; size: number; type: string; file: File }

export type EmrUploadQueueIntent =
  | { type: 'filesPicked'; files: EmrPickedFile[] }
  | { type: 'removeRequested'; id: string }
  | { type: 'retryRequested'; id: string }
  | { type: 'publishRequested' };

export interface EmrUploadQueueLabels {
  dropHint: string;
  browse: string;
  queue: string;
  empty: string;
  remove: string;
  retry: string;
  publish: string;
  progress: string;
  progressValue: string;
  nativeUnavailable: string;
}

export interface EmrUploadQueueProps {
  model: EmrUploadQueueModel;
  onIntent?: (intent: EmrUploadQueueIntent) => void;
  labels?: Partial<EmrUploadQueueLabels>;
}
