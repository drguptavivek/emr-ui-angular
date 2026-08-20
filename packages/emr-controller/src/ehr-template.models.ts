import type { ClinicalFormViewModel } from './clinical-form.models.js';
import type { EmrGeneratedFieldDefinition } from './field-generator.models.js';

export type EhrTemplateStatus = 'draft' | 'active' | 'retired';
export type TemplateArtifactFormat = 'internal-json' | 'fhir-r4-questionnaire' | 'fhir-r4-bundle' | 'fhir-r4b-questionnaire' | 'fhir-r5-questionnaire';

export interface EhrTemplateFieldPlacement {
  id: string;
  sourceFieldId: string;
  sourceFieldRevision: number;
  field: EmrGeneratedFieldDefinition;
}

export interface EhrTemplateSection {
  id: string;
  label: string;
  description?: string;
  fields: readonly EhrTemplateFieldPlacement[];
}

export interface EhrTemplateDefinition {
  schemaVersion: '1.0';
  id: string;
  revision: number;
  title: string;
  description?: string;
  locale: string;
  status: EhrTemplateStatus;
  sections: readonly EhrTemplateSection[];
}

export interface TemplateArtifactIssue {
  severity: 'information' | 'warning' | 'error';
  code: string;
  message: string;
  path?: string;
}

export interface TemplateArtifactResult {
  format: TemplateArtifactFormat;
  fhirVersion?: '4.0.1' | '4.3.0' | '5.0.0';
  serialized: string;
  issues: readonly TemplateArtifactIssue[];
}

export interface TemplateArtifactPort {
  exportTemplate(template: EhrTemplateDefinition, format: Exclude<TemplateArtifactFormat, 'internal-json'>, options: { signal: AbortSignal }): Promise<TemplateArtifactResult>;
  importTemplate(serialized: string, format: TemplateArtifactFormat, options: { signal: AbortSignal }): Promise<{ template?: EhrTemplateDefinition; issues: readonly TemplateArtifactIssue[] }>;
}

export interface EhrTemplateRepositoryPort {
  save(template: EhrTemplateDefinition, options: { signal: AbortSignal; concurrencyToken?: string }): Promise<{ revision: number; concurrencyToken?: string }>;
}

export interface EhrTemplateViewModel {
  template: EhrTemplateDefinition;
  fieldLibrary: readonly EmrGeneratedFieldDefinition[];
  fieldLibraryQuery: string;
  selectedSectionId?: string;
  selectedPlacementId?: string;
  preview: ClinicalFormViewModel;
  artifact?: TemplateArtifactResult;
  importIssues?: readonly TemplateArtifactIssue[];
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  readOnly?: boolean;
  error?: string;
  concurrencyToken?: string;
}

export type EhrTemplateIntent =
  | { type: 'templatePatched'; changes: Pick<Partial<EhrTemplateDefinition>, 'title' | 'description' | 'locale' | 'status'> }
  | { type: 'fieldLibraryQueryChanged'; query: string }
  | { type: 'sectionSelected'; sectionId: string }
  | { type: 'sectionAdded'; section: EhrTemplateSection }
  | { type: 'sectionPatched'; sectionId: string; changes: Pick<Partial<EhrTemplateSection>, 'label' | 'description'> }
  | { type: 'sectionMoved'; sectionId: string; direction: 'up' | 'down' }
  | { type: 'sectionRemoved'; sectionId: string }
  | { type: 'fieldAdded'; sectionId: string; field: EmrGeneratedFieldDefinition; placementId: string }
  | { type: 'fieldMoved'; sectionId: string; placementId: string; direction: 'up' | 'down' }
  | { type: 'fieldRemoved'; sectionId: string; placementId: string }
  | { type: 'artifactExportRequested'; format: TemplateArtifactFormat }
  | { type: 'artifactImportRequested'; format: TemplateArtifactFormat; serialized: string }
  | { type: 'importAccepted' }
  | { type: 'saveRequested' };

export interface EhrTemplateControllerOptions {
  artifactPort?: TemplateArtifactPort;
  repository?: EhrTemplateRepositoryPort;
}
