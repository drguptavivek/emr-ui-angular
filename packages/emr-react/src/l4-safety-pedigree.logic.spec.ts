import { describe, expect, it } from 'vitest';
import type {
  FamilyPedigreeViewModel,
  FamilyPersonNode,
  PacChecklistViewModel,
  StagedChecklistViewModel,
} from '@drguptavivek/emr-controller';
import {
  activeChecklistPhase,
  canEmitChecklistIntent,
  checklistChoiceLabel,
  checklistHeadingId,
  checklistItemState,
  checklistStages,
  formatPersonAge,
  generationLabel,
  isChecklistItemDisabled,
  isChecklistItemReadOnly,
  isPacActionDisabled,
  isPersonDeceased,
  lifeIcon,
  lifeLabel,
  lifeState,
  needsChecklistNote,
  pacActionAriaLabel,
  pacActionId,
  pacActionVariant,
  pacHeadingId,
  pacSeverityLabel,
  pedigreeGenerations,
  pedigreeGlyph,
  peopleInGeneration,
  personAriaLabel,
  personName,
  phenotypeIcon,
  phenotypeLabel,
  phenotypeState,
  reduceFamilyPedigreeIntent,
  reduceStagedChecklistIntent,
  scopedPacForm,
  sexKind,
} from './l4-safety-pedigree.logic';

const checklistFixture: StagedChecklistViewModel = {
  instanceId: 'chk-001',
  schema: {
    id: 'surgical-safety',
    label: 'Surgical safety checklist',
    phases: [
      {
        id: 'sign-in',
        label: 'Sign In',
        description: 'Before induction',
        items: [
          { id: 'identity', label: 'Identity confirmed', type: 'checkbox', required: true },
          { id: 'events', label: 'Critical events', type: 'yes-no', required: true, requiresNoteWhen: ['yes'] },
        ],
      },
      {
        id: 'time-out',
        label: 'Time Out',
        items: [{ id: 'team', label: 'Team introduced', type: 'checkbox', required: true }],
      },
    ],
  },
  items: {
    identity: { value: false },
    events: { value: 'yes' },
    team: { value: true, readOnly: true },
  },
  activePhaseId: 'sign-in',
  phaseStatuses: { 'sign-in': { label: 'In progress', tone: 'info' } },
  signoffs: {
    'sign-in': { displayName: 'Synthetic Reviewer', roleLabel: 'Reviewer', signedAtLabel: '19 Aug 2026, 09:30' },
  },
};

const pacFixture: PacChecklistViewModel = {
  instanceId: 'pac-001',
  title: 'Pre-anaesthesia checklist',
  context: [{ id: 'patient', label: 'Patient', value: 'Ananya Rao · MRN-204881' }],
  form: {
    schema: { id: 'pac-form', label: 'Pre-operative assessment', sections: [] },
    fields: {},
    repeatableGroups: {},
  },
  actions: [
    { id: 'save', label: 'Save draft', tone: 'secondary' },
    { id: 'submit', label: 'Request review', tone: 'primary', assistiveText: 'Submits for review' },
    { id: 'busy', label: 'Saving', loading: true },
  ],
};

const pedigreeFixture: FamilyPedigreeViewModel = {
  label: 'Family history',
  selectedPersonId: 'patient',
  people: [
    {
      id: 'grandparent',
      displayName: 'Unknown relative',
      relationshipLabel: 'Grandparent',
      generation: -2,
      order: 0,
      age: '68',
      sex: 'male',
      lifeStatus: 'deceased',
      phenotype: 'unaffected',
    },
    {
      id: 'mother',
      displayName: 'Meena Rao',
      relationshipLabel: 'Parent',
      generation: -1,
      order: 1,
      age: 60,
      sex: 'female',
      lifeStatus: 'alive',
      phenotype: 'unaffected',
    },
    {
      id: 'father',
      displayName: 'Ravi Rao',
      relationshipLabel: 'Parent',
      generation: -1,
      order: 0,
      age: 64,
      sex: 'male',
      lifeStatus: 'alive',
      phenotype: 'affected',
    },
    {
      id: 'patient',
      displayName: 'Ananya Rao',
      relationshipLabel: 'Patient',
      generation: 0,
      order: 0,
      age: 58,
      sex: 'female',
      lifeStatus: 'alive',
      proband: true,
      readOnly: true,
      phenotype: 'affected',
    },
    {
      id: 'child',
      displayName: 'Child',
      relationshipLabel: 'Child',
      generation: 1,
      order: 0,
      age: 'Newborn',
      sex: 'other',
    },
  ],
  relationships: [
    { id: 'r1', fromPersonId: 'father', toPersonId: 'patient', relationshipLabel: 'Parent-child', kind: 'parent-child' },
  ],
};

describe('l4-safety-pedigree logic — StagedChecklist', () => {
  it('resolves heading id, stages, active phase, and item state', () => {
    expect(checklistHeadingId(checklistFixture)).toBe('emr-staged-checklist-surgical-safety-heading');
    expect(checklistHeadingId(checklistFixture, 'custom-id')).toBe('custom-id');
    const stages = checklistStages(checklistFixture);
    expect(stages).toHaveLength(2);
    expect(stages[0]?.status?.label).toBe('In progress');
    expect(activeChecklistPhase(checklistFixture)?.id).toBe('sign-in');
    const item = checklistFixture.schema.phases[0]!.items[1]!;
    const state = checklistItemState(checklistFixture, item);
    expect(state.value).toBe('yes');
    expect(needsChecklistNote(item, state)).toBe(true);
  });

  it('computes disabled, readOnly, choice labels, and intent permission', () => {
    const firstItem = checklistFixture.schema.phases[0]!.items[0]!;
    const teamItem = checklistFixture.schema.phases[1]!.items[0]!;
    expect(isChecklistItemDisabled(checklistFixture, firstItem)).toBe(false);
    expect(isChecklistItemDisabled(checklistFixture, teamItem)).toBe(true);
    expect(isChecklistItemReadOnly(checklistFixture, teamItem)).toBe(true);
    expect(checklistChoiceLabel('yes')).toBe('Yes');
    expect(checklistChoiceLabel('no')).toBe('No');
    expect(checklistChoiceLabel('na')).toBe('Not applicable');
    const roModel = { ...checklistFixture, readOnly: true };
    expect(canEmitChecklistIntent(roModel, { type: 'phaseSelected', phaseId: 'time-out' })).toBe(true);
    expect(canEmitChecklistIntent(roModel, { type: 'phaseCompletionRequested', phaseId: 'sign-in' })).toBe(false);
  });

  it('reduces staged checklist intents immutably', () => {
    const blocked = reduceStagedChecklistIntent(checklistFixture, {
      type: 'phaseCompletionRequested',
      phaseId: 'sign-in',
    });
    expect(blocked.phaseStatuses?.['sign-in']?.label).toBe('Blocked');
    expect(blocked.items.identity?.error).toBe('Required response');
    expect(blocked.items.events?.error).toBe('Add the required note');

    const withId = reduceStagedChecklistIntent(blocked, {
      type: 'itemResponseRequested',
      itemId: 'identity',
      value: true,
    });
    const withNote = reduceStagedChecklistIntent(withId, {
      type: 'itemNoteRequested',
      itemId: 'events',
      note: 'Reviewed with anaesthesia team',
    });
    const complete = reduceStagedChecklistIntent(withNote, {
      type: 'phaseCompletionRequested',
      phaseId: 'sign-in',
    });
    expect(complete.phaseStatuses?.['sign-in']?.label).toBe('Complete');
    expect(complete.error).toBeUndefined();

    const signedOff = reduceStagedChecklistIntent(complete, {
      type: 'phaseSignoffRequested',
      phaseId: 'sign-in',
    });
    expect(signedOff.phaseStatuses?.['sign-in']?.label).toBe('Signed off');
  });
});

describe('l4-safety-pedigree logic — PacChecklist', () => {
  it('scopes form schema id and propagates readOnly state', () => {
    expect(pacHeadingId(pacFixture)).toBe('emr-pac-pac-001-heading');
    const scoped = scopedPacForm({ ...pacFixture, readOnly: true });
    expect(scoped.readOnly).toBe(true);
    expect(scoped.schema.id).toBe('emr-pac-pac-001-pac-form');
  });

  it('maps action ids, variants, aria labels, disabled state, and error severity', () => {
    const [save, submit, busy] = pacFixture.actions;
    expect(pacActionId(pacFixture, save!)).toBe('emr-pac-pac-001-action-save');
    expect(pacActionVariant('primary')).toBe('primary');
    expect(pacActionVariant('secondary')).toBe('outline');
    expect(pacActionVariant('ghost')).toBe('ghost');
    expect(pacActionAriaLabel(submit!)).toBe('Request review. Submits for review');
    expect(isPacActionDisabled(pacFixture, save!)).toBe(false);
    expect(isPacActionDisabled(pacFixture, busy!)).toBe(true);
    expect(pacSeverityLabel('warning')).toBe('Warning');
    expect(pacSeverityLabel('information')).toBe('Information');
    expect(pacSeverityLabel(undefined)).toBe('Error');
  });
});

describe('l4-safety-pedigree logic — FamilyPedigree', () => {
  it('sorts generations and people within each generation without mutating input', () => {
    expect(pedigreeGenerations(pedigreeFixture.people)).toEqual([-2, -1, 0, 1]);
    expect(peopleInGeneration(pedigreeFixture.people, -1).map(p => p.id)).toEqual(['father', 'mother']);
    expect(generationLabel(-2)).toBe('2 generations above');
    expect(generationLabel(-1)).toBe('1 generation above');
    expect(generationLabel(0)).toBe('Patient generation');
    expect(generationLabel(1)).toBe('1 generation below');
    expect(generationLabel(2)).toBe('2 generations below');
  });

  it('formats age, resolves names, and never infers vital or phenotype state when unrecorded', () => {
    expect(formatPersonAge(64)).toBe('64 y');
    expect(formatPersonAge('68')).toBe('68 y');
    expect(formatPersonAge('Newborn')).toBe('Newborn');
    expect(formatPersonAge('')).toBeNull();
    expect(formatPersonAge(undefined)).toBeNull();
    expect(personName(pedigreeFixture.people, 'father')).toBe('Ravi Rao');
    expect(personName(pedigreeFixture.people, 'missing')).toBe('Unknown person');

    const child = pedigreeFixture.people.find(p => p.id === 'child')!;
    expect(sexKind(child)).toBe('other');
    expect(pedigreeGlyph(child)).toBe('⚬');
    expect(lifeState(child)).toBe('unknown');
    expect(lifeLabel(child)).toBe('Not recorded');
    expect(lifeIcon(child)).toBe('○');
    expect(isPersonDeceased(child)).toBe(false);
    expect(phenotypeState(child)).toBe('unknown');
    expect(phenotypeLabel(child)).toBe('Status unknown');
    expect(phenotypeIcon(child)).toBe('○');

    const legacyDeceased: FamilyPersonNode = { ...child, deceased: true };
    expect(lifeState(legacyDeceased)).toBe('deceased');
    expect(isPersonDeceased(legacyDeceased)).toBe(true);
    expect(lifeIcon(legacyDeceased)).toBe('✝');
    expect(personAriaLabel(pedigreeFixture.people[2]!)).toContain('Ravi Rao, 64 y, Parent');
  });

  it('reduces selection and removal intents while respecting readOnly', () => {
    const selected = reduceFamilyPedigreeIntent(pedigreeFixture, {
      type: 'personSelected',
      personId: 'father',
    });
    expect(selected.selectedPersonId).toBe('father');

    const cantRemoveReadOnlyPerson = reduceFamilyPedigreeIntent(pedigreeFixture, {
      type: 'personRemoveRequested',
      personId: 'patient',
    });
    expect(cantRemoveReadOnlyPerson.people).toHaveLength(5);

    const removed = reduceFamilyPedigreeIntent(selected, {
      type: 'personRemoveRequested',
      personId: 'father',
    });
    expect(removed.people.some(p => p.id === 'father')).toBe(false);
    expect(removed.relationships).toHaveLength(0);
    expect(removed.selectedPersonId).toBeUndefined();
  });
});
