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

  it('never reuses a repeat-item id already present in a rehydrated model', () => {
    const rehydrated: ClinicalFormViewModel = {
      ...model,
      repeatableGroups: { conditions: [{ id: 'conditions-1', fields: { name: { value: 'Asthma' } } }, { id: 'conditions-2', fields: { name: { value: 'Gout' } } }] },
    };
    const controller = new ClinicalFormController(rehydrated);
    controller.dispatch({ type: 'repeatItemAddRequested', groupId: 'conditions' });
    const ids = controller.getSnapshot().repeatableGroups.conditions.map(item => item.id);
    expect(new Set(ids).size).toBe(3);
    const added = ids[2];
    controller.dispatch({ type: 'repeatItemEditRequested', groupId: 'conditions', itemId: added, fieldId: 'name', value: 'New' });
    expect(controller.getSnapshot().repeatableGroups.conditions[0].fields.name.value).toBe('Asthma');
    controller.dispatch({ type: 'repeatItemRemoveRequested', groupId: 'conditions', itemId: added });
    expect(controller.getSnapshot().repeatableGroups.conditions.map(item => item.id)).toEqual(['conditions-1', 'conditions-2']);
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

  it('edits matrix cells as ordinary fields keyed by the cell field id', () => {
    const controller = new ClinicalFormController({
      schema: { id: 'gl', label: 'Glaucoma', sections: [{ id: 's', label: 'Eyes', blocks: [
        { kind: 'matrix', id: 'eyes', label: 'Per eye', columns: [{ id: 'OD', label: 'OD' }, { id: 'OS', label: 'OS' }], rows: [
          { id: 'iop', label: 'IOP', cells: { OD: { id: 'IOP_RE', label: 'IOP right eye', type: 'integer' }, OS: { id: 'IOP_LE', label: 'IOP left eye', type: 'integer' } } },
        ] },
      ] }] },
      fields: { IOP_RE: { value: null }, IOP_LE: { value: 14 } },
      repeatableGroups: {},
    });
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'IOP_RE', value: 18 });
    controller.dispatch({ type: 'fieldEditRequested', fieldId: 'eyes', value: 99 }); // the block id is not a field
    expect(controller.getSnapshot().fields).toEqual({ IOP_RE: { value: 18 }, IOP_LE: { value: 14 } });
  });
});
