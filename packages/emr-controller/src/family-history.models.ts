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
  /** Display text for vital status; the UI never infers meaning from it. */
  lifeStatusLabel?: string;
  /** Structured vital status. Absent (and `deceased` absent) renders as "not recorded", never as alive. */
  lifeStatus?: 'alive' | 'deceased' | 'unknown';
  proband?: boolean;
  /** @deprecated Use `lifeStatus`. `true` → deceased, `false` → alive, absent → unknown. */
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
