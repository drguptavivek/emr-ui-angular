import { describe, expect, it } from 'vitest';
import { ClinicalFormController } from './clinical-form.controller';
import type { ClinicalFormViewModel } from './clinical-form.models';

const model: ClinicalFormViewModel = {
  schema: { id: 'history', label: 'History', sections: [{ id: 'main', label: 'Main', collapsible: true, blocks: [{ id: 'hpi', label: 'HPI', type: 'multiline' }, { kind: 'repeatable', id: 'conditions', label: 'Conditions', fields: [{ id: 'name', label: 'Name', type: 'text' }] }] }] },
  fields: { hpi: { value: 'Initial' } },
  repeatableGroups: { conditions: [] },
};

describe('ClinicalFormController', () => {
  it('edits fields and repeatable items without mutating the supplied model', () => {
    const original = model.fields.hpi;
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'hpi', value: 'Updated' });
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const item = controller.getSnapshot().repeatableGroups.conditions[0];
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'conditions', itemId: item.id, fieldId: 'name', value: 'Diabetes' });
    expect(model.fields.hpi).toBe(original);
    expect(model.fields.hpi.value).toBe('Initial');
    expect(controller.getSnapshot().fields.hpi.value).toBe('Updated');
    expect(controller.getSnapshot().repeatableGroups.conditions[0].fields.name.value).toBe('Diabetes');
  });

  it('toggles only collapsible sections and removes items immutably', () => {
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'sectionToggleRequested', sectionId: 'main' });
    expect(controller.getSnapshot().collapsedSectionIds).toEqual(['main']);
    controller.dispatch({ type: 'sectionToggleRequested', sectionId: 'hpi' });
    expect(controller.getSnapshot().collapsedSectionIds).toEqual(['main']);
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const itemId = controller.getSnapshot().repeatableGroups.conditions[0].id;
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'conditions', itemId });
    expect(controller.getSnapshot().repeatableGroups.conditions).toEqual([]);
  });

  it('does not edit a disabled or read-only state', () => {
    const disabled: ClinicalFormViewModel = { ...model, fields: { hpi: { value: 'fixed', disabled: true } } };
    const controller = new ClinicalFormController(disabled);
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'hpi', value: 'changed' });
    expect(controller.getSnapshot().fields.hpi.value).toBe('fixed');
  });

  it('keeps assessment status separate from the recorded value', () => {
    const controller = new ClinicalFormController(model);
    controller.dispatch({ type: 'fieldStatusEditRequested', fieldId: 'hpi', status: 'unable-to-assess' });
    expect(controller.getSnapshot().fields.hpi).toMatchObject({ value: 'Initial', assessmentStatus: 'unable-to-assess' });
    controller.dispatch({ type: 'fieldStatusEditRequested', fieldId: 'hpi', status: undefined });
    expect(controller.getSnapshot().fields.hpi.assessmentStatus).toBeUndefined();
  });
});
