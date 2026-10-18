import type { EmrBadge } from './models.js';

export interface DiagnosticMetric {
  id: string;
  label: string;
  valueLabel: string;
  referenceLabel?: string;
  status?: EmrBadge;
  helpText?: string;
}

export interface DiagnosticAttachmentAction {
  id: string;
  label: string;
  kind: 'report' | 'plot' | 'image' | 'data';
  assistiveDescription?: string;
  disabled?: boolean;
}

export interface DiagnosticResultViewModel {
  id: string;
  title: string;
  subtitle?: string;
  status?: EmrBadge;
  metadata: readonly { label: string; value: string }[];
  metrics: readonly DiagnosticMetric[];
  interpretation?: string;
  trendSummary?: string;
  attachments?: readonly DiagnosticAttachmentAction[];
  loading?: boolean;
  error?: string;
}

export type DiagnosticResultIntent =
  | { type: 'attachmentRequested'; resultId: string; attachmentId: string }
  | { type: 'resultSelected'; resultId: string }
  | { type: 'retryRequested'; resultId: string };

export type DiagnosticResultSummaryViewModel = DiagnosticResultViewModel;
export type DiagnosticResultSummaryIntent = DiagnosticResultIntent;
