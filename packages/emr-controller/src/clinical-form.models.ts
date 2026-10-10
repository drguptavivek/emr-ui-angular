import type { ClinicalAssessmentStatus, ClinicalOption, ClinicalQuantityValue, EmrBadge } from './models.js';
import type { EmrCodedValue, EmrPartialDate } from './field-contract.models.js';

export type ClinicalFieldType =
  | 'text'
  | 'multiline'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'quantity'
  | 'custom';

export type ClinicalFieldValue =
  | string
  | number
  | boolean
  | readonly string[]
  | ClinicalQuantityValue
  | EmrPartialDate
  | EmrCodedValue
  | null;

export interface ClinicalFieldDefinition {
  kind?: 'field';
  id: string;
  label: string;
  type: ClinicalFieldType;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  unit?: string;
  precision?: number;
  rows?: number;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  customRendererKey?: string;
}

export interface RepeatableGroupDefinition {
  kind: 'repeatable';
  id: string;
  label: string;
  description?: string;
  addLabel?: string;
  fields: readonly ClinicalFieldDefinition[];
}

export type ClinicalFormBlock =
  | ClinicalFieldDefinition
  | RepeatableGroupDefinition;

export interface ClinicalFormSection {
  id: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  blocks: readonly ClinicalFormBlock[];
}

export interface ClinicalFormSchema {
  id: string;
  label: string;
  description?: string;
  sections: readonly ClinicalFormSection[];
}

export interface ClinicalFieldState {
  value: ClinicalFieldValue;
  assessmentStatus?: ClinicalAssessmentStatus;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

/** Controller-supplied status used when a clinical finding is not represented by a value. */
export interface ClinicalAssessmentStatusOption {
  value: ClinicalAssessmentStatus;
  label: string;
  tone?: EmrBadge['tone'];
}

export interface RepeatableItemState {
  id: string;
  label?: string;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  readOnly?: boolean;
}

export interface ClinicalFormViewModel {
  schema: ClinicalFormSchema;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  repeatableGroups: Readonly<Record<string, readonly RepeatableItemState[]>>;
  collapsedSectionIds?: readonly string[];
  sectionStatuses?: Readonly<Record<string, EmrBadge>>;
  readOnly?: boolean;
}

export type ClinicalFormIntent =
  | { type: 'fieldEditRequested'; fieldId: string; value: ClinicalFieldValue }
  | { type: 'fieldStatusEditRequested'; fieldId: string; status: ClinicalAssessmentStatus | undefined }
  | { type: 'fieldFocused'; fieldId: string }
  | { type: 'repeatItemAddRequested'; groupId: string }
  | {
      type: 'repeatItemEditRequested';
      groupId: string;
      itemId: string;
      fieldId: string;
      value: ClinicalFieldValue;
    }
  | {
      type: 'repeatItemStatusEditRequested';
      groupId: string;
      itemId: string;
      fieldId: string;
      status: ClinicalAssessmentStatus | undefined;
    }
  | { type: 'repeatItemRemoveRequested'; groupId: string; itemId: string }
  | { type: 'sectionToggleRequested'; sectionId: string };
