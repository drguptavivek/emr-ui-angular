import type { EmrBadge } from './models.js';

export interface FamilyPersonNode {
  id: string;
  displayName: string;
  relationshipLabel: string;
  generation: number;
  order: number;
  age?: string | number;
  sexLabel?: string;
  sex?: 'male' | 'female' | 'other' | 'unknown';
  lifeStatusLabel?: string;
  proband?: boolean;
  deceased?: boolean;
  phenotype?: 'affected' | 'unaffected' | 'unknown';
  conditions?: readonly EmrBadge[];
  summary?: string;
  readOnly?: boolean;
}

export interface FamilyRelationship {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipLabel: string;
  kind: 'partner' | 'parent-child' | 'sibling' | 'other';
}

export interface FamilyPedigreeViewModel {
  label: string;
  people: readonly FamilyPersonNode[];
  relationships: readonly FamilyRelationship[];
  selectedPersonId?: string;
  readOnly?: boolean;
  emptyMessage?: string;
}

export type FamilyPedigreeIntent =
  | { type: 'personSelected'; personId: string }
  | { type: 'personAddRequested'; relatedPersonId?: string }
  | { type: 'personEditRequested'; personId: string }
  | { type: 'personRemoveRequested'; personId: string }
  | { type: 'relationshipAddRequested'; personId: string }
  | { type: 'relationshipEditRequested'; relationshipId: string };
