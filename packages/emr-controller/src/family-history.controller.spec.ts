import { describe, expect, it, vi } from 'vitest';
import { FamilyHistoryController } from './family-history.controller';
import type { FamilyPedigreeViewModel } from './family-history.models';

const model: FamilyPedigreeViewModel = {
  label: 'Family history',
  people: [
    { id: 'p1', displayName: 'Asha', relationshipLabel: 'Proband', generation: 0, order: 0, proband: true },
    { id: 'p2', displayName: 'Unknown relative', relationshipLabel: 'Relationship not recorded', generation: -1, order: 0 }
  ],
  relationships: [{ id: 'r1', fromPersonId: 'p2', toPersonId: 'p1', relationshipLabel: 'Parent', kind: 'parent-child' }],
  selectedPersonId: 'p1'
};

describe('FamilyHistoryController', () => {
  it('copies the supplied view model and updates selection immutably', () => {
    const controller = new FamilyHistoryController(model);
    controller.dispatch({ type: 'personSelected', personId: 'p2' });

    expect(controller.getSnapshot().selectedPersonId).toBe('p2');
    expect(controller.getSnapshot().people).not.toBe(model.people);
    expect(controller.getSnapshot().relationships).not.toBe(model.relationships);
    expect(model.selectedPersonId).toBe('p1');
  });

  it('removes a person and connected relationships without inferring clinical meaning', () => {
    const controller = new FamilyHistoryController(model);
    controller.dispatch({ type: 'personRemoveRequested', personId: 'p2' });

    expect(controller.getSnapshot().people.map(person => person.id)).toEqual(['p1']);
    expect(controller.getSnapshot().relationships).toEqual([]);
    expect(controller.getSnapshot().selectedPersonId).toBe('p1');
  });

  it('forwards structural requests to the owning workflow', () => {
    const onIntent = vi.fn();
    const controller = new FamilyHistoryController(model, { onIntent });
    const intent = { type: 'personEditRequested', personId: 'p1' } as const;
    controller.dispatch(intent);
    expect(onIntent).toHaveBeenCalledWith(intent);
  });

  it('does not remove records from a read-only model', () => {
    const controller = new FamilyHistoryController({ ...model, readOnly: true });
    controller.dispatch({ type: 'personRemoveRequested', personId: 'p2' });
    expect(controller.getSnapshot().people).toHaveLength(2);
  });
});
