import type { ClinicalFormIntent, ClinicalFormViewModel } from './clinical-form.models.js';
import type { EmrBadge } from './models.js';

export interface PacContextItem {
  id: string;
  label: string;
  value: string;
}

export interface PacChecklistAction {
  id: string;
  label: string;
  tone?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  assistiveText?: string;
}

export interface PacChecklistError {
  id: string;
  message: string;
  severity?: 'error' | 'warning' | 'information';
  fieldId?: string;
}

export interface PacChecklistViewModel {
  instanceId: string;
  title: string;
  description?: string;
  context: readonly PacContextItem[];
  form: ClinicalFormViewModel;
  actions: readonly PacChecklistAction[];
  errors?: readonly PacChecklistError[];
  overallStatus?: EmrBadge;
  readOnly?: boolean;
}

export type PacChecklistIntent =
  | { type: 'formIntent'; intent: ClinicalFormIntent }
  | { type: 'actionRequested'; actionId: string };
