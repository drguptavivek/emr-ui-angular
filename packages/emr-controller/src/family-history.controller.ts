import { StateController } from './contracts.js';
import {
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  FamilyPersonNode,
  FamilyRelationship
} from './family-history.models.js';

export interface FamilyHistoryControllerOptions {
  /** Structural requests are forwarded to the owning workflow/controller. */
  onIntent?: (intent: FamilyPedigreeIntent) => void;
}

const copyPerson = (person: FamilyPersonNode): FamilyPersonNode => ({
  ...person,
  conditions: person.conditions ? [...person.conditions] : undefined
});

const copyRelationship = (relationship: FamilyRelationship): FamilyRelationship => ({ ...relationship });

const copyModel = (model: FamilyPedigreeViewModel): FamilyPedigreeViewModel => ({
  ...model,
  people: model.people.map(copyPerson),
  relationships: model.relationships.map(copyRelationship)
});

/**
 * Keeps pedigree presentation state immutable and deliberately does not infer
 * sex, risk, inheritance, or clinical meaning from the supplied records.
 */
export class FamilyHistoryController extends StateController<
  FamilyPedigreeViewModel,
  FamilyPedigreeIntent
> {
  private readonly onIntent?: (intent: FamilyPedigreeIntent) => void;

  constructor(model: FamilyPedigreeViewModel, options?: FamilyHistoryControllerOptions) {
    super(copyModel(model));
    this.onIntent = options?.onIntent;
  }

  dispatch(intent: FamilyPedigreeIntent): void {
    if (intent.type === 'personSelected') {
      const person = this.getSnapshot().people.find(item => item.id === intent.personId);
      if (person) this.setState(state => ({ ...state, selectedPersonId: person.id }));
      return;
    }

    if (intent.type === 'personRemoveRequested') {
      const state = this.getSnapshot();
      const person = state.people.find(item => item.id === intent.personId);
      if (!person || state.readOnly || person.readOnly) return;
      this.setState(current => ({
        ...current,
        selectedPersonId: current.selectedPersonId === intent.personId ? undefined : current.selectedPersonId,
        people: current.people.filter(item => item.id !== intent.personId),
        relationships: current.relationships.filter(
          relationship => relationship.fromPersonId !== intent.personId && relationship.toPersonId !== intent.personId
        )
      }));
      return;
    }

    this.onIntent?.(intent);
  }
}
