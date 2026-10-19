import type {
  EmrPickedFile,
  EmrUploadQueueIntent,
  EmrUploadQueueItem,
  EmrUploadQueueModel,
  EmrUploadStatus,
} from '@drguptavivek/emr-controller';

export type {
  EmrPickedFile,
  EmrUploadQueueIntent,
  EmrUploadQueueItem,
  EmrUploadQueueModel,
  EmrUploadStatus,
};

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
