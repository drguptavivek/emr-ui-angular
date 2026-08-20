import type { ClinicalFieldType, ClinicalFieldValue } from './clinical-form.models.js';
import type { TerminologyBinding, TerminologyBindingRole, TerminologySearchState } from './terminology.models.js';

export type FieldValidationRule =
  | { id: string; kind: 'min-length'; value: number; message?: string }
  | { id: string; kind: 'max-length'; value: number; message?: string }
  | { id: string; kind: 'minimum'; value: number; message?: string }
  | { id: string; kind: 'maximum'; value: number; message?: string }
  | { id: string; kind: 'precision'; value: number; message?: string }
  | { id: string; kind: 'pattern'; value: string; message: string }
  | { id: string; kind: 'earliest-date'; value: string; message?: string }
  | { id: string; kind: 'latest-date'; value: string; message?: string }
  | { id: string; kind: 'allowed-values'; values: readonly string[]; message?: string }
  | { id: string; kind: 'custom'; customValidatorId: string; message: string };

export interface EmrGeneratedFieldDefinition {
  schemaVersion: '1.0';
  id: string;
  revision: number;
  label: string;
  description?: string;
  instructions?: string;
  type: ClinicalFieldType;
  required: boolean;
  repeats: boolean;
  readOnly?: boolean;
  defaultValue?: ClinicalFieldValue;
  placeholder?: string;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  rows?: number;
  precision?: number;
  unit?: string;
  unitSystem?: string;
  unitCode?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  validationRules: readonly FieldValidationRule[];
  terminologyBindings: readonly TerminologyBinding[];
  tags?: readonly string[];
}

export interface FieldGeneratorViewModel {
  draft: EmrGeneratedFieldDefinition;
  sources: readonly import('./terminology.models.js').TerminologySource[];
  terminologySearches: Readonly<Partial<Record<TerminologyBindingRole, TerminologySearchState>>>;
  validationErrors: Readonly<Record<string, string>>;
  saving: boolean;
  readOnly?: boolean;
  dirty?: boolean;
  error?: string;
  savedFieldId?: string;
}

export type FieldGeneratorIntent =
  | { type: 'draftPatched'; changes: Partial<EmrGeneratedFieldDefinition> }
  | { type: 'validationRuleAdded'; rule: FieldValidationRule }
  | { type: 'validationRuleRemoved'; ruleId: string }
  | { type: 'terminologySearchOpened'; role: TerminologyBindingRole; sourceId: string }
  | { type: 'terminologyQueryChanged'; role: TerminologyBindingRole; query: string }
  | { type: 'terminologySearchRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyPageChanged'; role: TerminologyBindingRole; page: number }
  | { type: 'terminologyRetryRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyConceptSelected'; role: TerminologyBindingRole; concept: import('./terminology.models.js').TerminologyConcept; strength?: import('./terminology.models.js').TerminologyBindingStrength; mappingRelationship?: import('./terminology.models.js').TerminologyMappingRelationship }
  | { type: 'terminologyBindingRemoved'; bindingId: string }
  | { type: 'saveRequested' }
  | { type: 'resetRequested'; draft: EmrGeneratedFieldDefinition };

export interface FieldDefinitionRepositoryPort {
  save(field: EmrGeneratedFieldDefinition, options: { signal: AbortSignal }): Promise<{ fieldId: string; revision: number }>;
}

export interface FieldGeneratorControllerOptions {
  terminology: import('./terminology.models.js').TerminologySearchPort;
  repository?: FieldDefinitionRepositoryPort;
}
