import type { PageResult } from './contracts.js';

export type TerminologyKind = 'loinc' | 'snomed-ct' | 'icd-10' | 'icd-11' | 'ucum' | 'custom';
export type TerminologyBindingRole = 'question-meaning' | 'answer-value-set' | 'unit' | 'classification-mapping';
export type TerminologyBindingStrength = 'required' | 'extensible' | 'preferred' | 'example';
export type TerminologyMappingRelationship = 'equivalent' | 'wider' | 'narrower' | 'related-to';

export interface TerminologySource {
  id: string;
  kind: TerminologyKind;
  label: string;
  available: boolean;
  supportsPagination?: boolean;
  versionLabel?: string;
  language?: string;
  jurisdiction?: string;
}

export interface TerminologyConcept {
  sourceId: string;
  system: string;
  code: string;
  display: string;
  version?: string;
  canonicalUri?: string;
  releaseUri?: string;
  language?: string;
  designations?: readonly string[];
  active?: boolean;
  providerMetadata?: Readonly<Record<string, string>>;
}

export interface TerminologyBinding {
  id: string;
  role: TerminologyBindingRole;
  concept?: TerminologyConcept;
  valueSetCanonical?: string;
  strength?: TerminologyBindingStrength;
  mappingRelationship?: TerminologyMappingRelationship;
  note?: string;
}

export interface TerminologySearchRequest {
  sourceId: string;
  query: string;
  page: number;
  pageSize: number;
  signal: AbortSignal;
  language?: string;
  valueSetCanonical?: string;
}

export interface TerminologySearchPort {
  search(request: TerminologySearchRequest): Promise<PageResult<TerminologyConcept>>;
}

export interface TerminologySearchState {
  sourceId: string;
  role: TerminologyBindingRole;
  query: string;
  options: readonly TerminologyConcept[];
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  error?: string;
}
