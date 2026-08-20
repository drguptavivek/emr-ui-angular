import type { EmrBadge, EmrOption } from './models.js';

export type ChecklistItemType =
  | 'checkbox'
  | 'yes-no'
  | 'yes-no-na'
  | 'text'
  | 'select';

export interface ChecklistItemDefinition {
  id: string;
  label: string;
  description?: string;
  type: ChecklistItemType;
  options?: readonly EmrOption[];
  required?: boolean;
  requiresNoteWhen?: readonly string[];
}

export interface ChecklistPhaseDefinition {
  id: string;
  label: string;
  description?: string;
  items: readonly ChecklistItemDefinition[];
}

export interface StagedChecklistSchema {
  id: string;
  label: string;
  description?: string;
  phases: readonly ChecklistPhaseDefinition[];
}

export interface ChecklistItemState {
  value: string | boolean | null;
  note?: string;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
}

export interface ChecklistSignoff {
  displayName: string;
  roleLabel: string;
  signedAtLabel: string;
}

export interface StagedChecklistViewModel {
  /** Stable, controller-supplied identifier used to namespace native form controls. */
  instanceId: string;
  schema: StagedChecklistSchema;
  items: Readonly<Record<string, ChecklistItemState>>;
  activePhaseId: string;
  phaseStatuses?: Readonly<Record<string, EmrBadge>>;
  signoffs?: Readonly<Record<string, ChecklistSignoff>>;
  readOnly?: boolean;
  error?: string;
}

export type StagedChecklistIntent =
  | { type: 'phaseSelected'; phaseId: string }
  | { type: 'itemResponseRequested'; itemId: string; value: string | boolean | null }
  | { type: 'itemNoteRequested'; itemId: string; note: string }
  | { type: 'phaseCompletionRequested'; phaseId: string }
  | { type: 'phaseSignoffRequested'; phaseId: string };
