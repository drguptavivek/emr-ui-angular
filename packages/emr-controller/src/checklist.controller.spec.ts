import { describe, expect, it } from 'vitest';
import { StagedChecklistController } from './checklist.controller';
import type { StagedChecklistViewModel } from './checklist.models';

const fixture: StagedChecklistViewModel = {
  instanceId: 'checklist-encounter-1',
  schema: { id: 'safety', label: 'Safety', phases: [{ id: 'sign-in', label: 'Sign In', items: [
    { id: 'identity', label: 'Identity confirmed', type: 'checkbox', required: true },
    { id: 'note', label: 'Note', type: 'text', required: true, requiresNoteWhen: ['yes'] }
  ] }] },
  items: { identity: { value: false }, note: { value: 'yes' } }, activePhaseId: 'sign-in'
};

describe('StagedChecklistController', () => {
  it('updates values immutably and blocks incomplete phases', () => {
    const controller = new StagedChecklistController(fixture);
    const before = controller.getSnapshot();
    controller.dispatch({ type: 'phaseCompletionRequested', phaseId: 'sign-in' });
    expect(controller.getSnapshot().phaseStatuses?.['sign-in'].label).toBe('Blocked');
    expect(before.items.identity.value).toBe(false);
    controller.dispatch({ type: 'itemResponseRequested', itemId: 'identity', value: true });
    controller.dispatch({ type: 'itemNoteRequested', itemId: 'note', note: 'Reviewed with team' });
    controller.dispatch({ type: 'phaseCompletionRequested', phaseId: 'sign-in' });
    expect(controller.getSnapshot().phaseStatuses?.['sign-in'].label).toBe('Complete');
  });

  it('does not mutate or update read-only items', () => {
    const initial = { ...fixture, readOnly: true };
    const controller = new StagedChecklistController(initial);
    controller.dispatch({ type: 'itemResponseRequested', itemId: 'identity', value: true });
    expect(controller.getSnapshot().items.identity.value).toBe(false);
  });
});
