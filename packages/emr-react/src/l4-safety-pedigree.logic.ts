import type {
  ChecklistItemDefinition,
  ChecklistItemState,
  ChecklistPhaseDefinition,
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  FamilyPersonNode,
  PacChecklistAction,
  PacChecklistError,
  PacChecklistViewModel,
  StagedChecklistIntent,
  StagedChecklistViewModel,
} from '@drguptavivek/emr-controller';
import type { EmrStage } from './l1-interactive';
import type { EmrButtonVariant } from './primitives';

// ---- Staged Safety Checklist -------------------------------------------------------------------

export const STAGED_CHECKLIST_DEFAULTS = {
  phasesAria: 'Checklist phases',
  readOnly: 'Read only',
  completePhase: 'Mark phase complete',
  signoffPhase: 'Sign off phase',
  signedBy: (name: string, role: string, time: string) => `Signed by ${name}, ${role} · ${time}`,
  yes: 'Yes',
  no: 'No',
  notApplicable: 'Not applicable',
  selectPlaceholder: 'Select an option',
  note: 'Note',
  required: 'Required',
};
export type EmrStagedChecklistLabels = typeof STAGED_CHECKLIST_DEFAULTS;

export const YES_NO_CHOICES = ['yes', 'no'] as const;
export const YES_NO_NA_CHOICES = ['yes', 'no', 'na'] as const;
export type ChecklistChoice = (typeof YES_NO_NA_CHOICES)[number];

export function checklistHeadingId(model: StagedChecklistViewModel, headingId?: string): string {
  return headingId || `emr-staged-checklist-${model.schema.id}-heading`;
}

export function checklistStages(model: StagedChecklistViewModel): EmrStage[] {
  return model.schema.phases.map(phase => ({
    id: phase.id,
    label: phase.label,
    description: phase.description,
    status: model.phaseStatuses?.[phase.id],
  }));
}

export function activeChecklistPhase(model: StagedChecklistViewModel): ChecklistPhaseDefinition | undefined {
  return model.schema.phases.find(phase => phase.id === model.activePhaseId);
}

export function checklistItemState(model: StagedChecklistViewModel, item: ChecklistItemDefinition): ChecklistItemState {
  return model.items[item.id] ?? { value: null };
}

export function isChecklistItemDisabled(model: StagedChecklistViewModel, item: ChecklistItemDefinition): boolean {
  const state = checklistItemState(model, item);
  return Boolean(model.readOnly || state.disabled || state.readOnly);
}

export function isChecklistItemReadOnly(model: StagedChecklistViewModel, item: ChecklistItemDefinition): boolean {
  const state = checklistItemState(model, item);
  return Boolean(model.readOnly || state.readOnly);
}

export function checklistChoiceLabel(
  choice: ChecklistChoice,
  labels: Pick<EmrStagedChecklistLabels, 'yes' | 'no' | 'notApplicable'> = STAGED_CHECKLIST_DEFAULTS,
): string {
  return choice === 'na' ? labels.notApplicable : choice === 'yes' ? labels.yes : labels.no;
}

export function needsChecklistNote(item: ChecklistItemDefinition, state: ChecklistItemState): boolean {
  return Boolean(item.requiresNoteWhen?.includes(String(state.value)));
}

export function canEmitChecklistIntent(model: StagedChecklistViewModel, intent: StagedChecklistIntent): boolean {
  return !model.readOnly || intent.type === 'phaseSelected';
}

/** Pure state transition mirroring StagedChecklistController for interactive harnesses. */
export function reduceStagedChecklistIntent(
  model: StagedChecklistViewModel,
  intent: StagedChecklistIntent,
): StagedChecklistViewModel {
  if (intent.type === 'phaseSelected') {
    return model.schema.phases.some(phase => phase.id === intent.phaseId)
      ? { ...model, activePhaseId: intent.phaseId }
      : model;
  }
  if (model.readOnly) return model;

  if (intent.type === 'itemResponseRequested') {
    const item = model.schema.phases.flatMap(p => p.items).find(i => i.id === intent.itemId);
    const prev = model.items[intent.itemId];
    if (!item || !prev || prev.readOnly || prev.disabled) return model;
    return {
      ...model,
      items: { ...model.items, [intent.itemId]: { ...prev, value: intent.value, error: undefined } },
    };
  }

  if (intent.type === 'itemNoteRequested') {
    const prev = model.items[intent.itemId];
    if (!prev || prev.readOnly || prev.disabled) return model;
    return {
      ...model,
      items: { ...model.items, [intent.itemId]: { ...prev, note: intent.note, error: undefined } },
    };
  }

  if (intent.type === 'phaseCompletionRequested') {
    const phase = model.schema.phases.find(candidate => candidate.id === intent.phaseId);
    if (!phase) return model;
    const missing: Record<string, string> = {};
    for (const def of phase.items) {
      if (!def.required) continue;
      const state = model.items[def.id];
      const empty = !state || state.value === null || state.value === '' || (state.value === false && def.type === 'checkbox');
      const noteMissing = def.requiresNoteWhen?.includes(String(state?.value)) && !state?.note?.trim();
      if (empty) missing[def.id] = 'Required response';
      else if (noteMissing) missing[def.id] = 'Add the required note';
    }
    const items = { ...model.items };
    for (const item of phase.items) {
      const issue = missing[item.id];
      if (issue) items[item.id] = { ...(items[item.id] ?? { value: null }), error: issue };
    }
    if (Object.keys(missing).length > 0) {
      return {
        ...model,
        items,
        error: `Complete the required items in ${phase.label} before continuing.`,
        phaseStatuses: {
          ...model.phaseStatuses,
          [intent.phaseId]: { label: 'Blocked', tone: 'danger', assistiveText: 'Required items are incomplete.' },
        },
      };
    }
    return {
      ...model,
      items,
      error: undefined,
      phaseStatuses: {
        ...model.phaseStatuses,
        [intent.phaseId]: { label: 'Complete', tone: 'success' },
      },
    };
  }

  if (intent.type === 'phaseSignoffRequested') {
    return model.signoffs?.[intent.phaseId]
      ? {
          ...model,
          phaseStatuses: {
            ...model.phaseStatuses,
            [intent.phaseId]: { label: 'Signed off', tone: 'success' },
          },
        }
      : model;
  }

  return model;
}

// ---- Pre-Anaesthesia (PAC) Checklist -----------------------------------------------------------

export const PAC_CHECKLIST_DEFAULTS = {
  eyebrow: 'Pre-operative assessment',
  readOnly: 'Read only',
  contextAria: (instanceId: string) => `Assessment context for ${instanceId}`,
  errorsAria: (instanceId: string) => `PAC assessment issues for ${instanceId}`,
  errorsTitle: 'Review assessment issues',
  actionsAria: (instanceId: string) => `PAC assessment actions for ${instanceId}`,
  loadingPrefix: '••• ',
  severityError: 'Error',
  severityWarning: 'Warning',
  severityInformation: 'Information',
};
export type EmrPacChecklistLabels = typeof PAC_CHECKLIST_DEFAULTS;

export function pacHeadingId(model: PacChecklistViewModel, headingId?: string): string {
  return headingId || `emr-pac-${model.instanceId}-heading`;
}

export function pacActionId(model: PacChecklistViewModel, action: PacChecklistAction): string {
  return `emr-pac-${model.instanceId}-action-${action.id}`;
}

export function isPacActionDisabled(model: PacChecklistViewModel, action: PacChecklistAction): boolean {
  return Boolean(model.readOnly || action.disabled || action.loading);
}

export function pacActionVariant(tone: PacChecklistAction['tone']): EmrButtonVariant {
  if (tone === 'ghost') return 'ghost';
  if (tone && tone !== 'primary') return 'outline';
  return 'primary';
}

export function pacActionAriaLabel(action: PacChecklistAction): string {
  return action.assistiveText ? `${action.label}. ${action.assistiveText}` : action.label;
}

export function pacSeverityLabel(
  severity: PacChecklistError['severity'],
  labels: Pick<EmrPacChecklistLabels, 'severityError' | 'severityWarning' | 'severityInformation'> = PAC_CHECKLIST_DEFAULTS,
): string {
  if (severity === 'warning') return labels.severityWarning;
  if (severity === 'information') return labels.severityInformation;
  return labels.severityError;
}

export function scopedPacForm(model: PacChecklistViewModel): PacChecklistViewModel['form'] {
  return {
    ...model.form,
    readOnly: Boolean(model.readOnly || model.form.readOnly),
    schema: {
      ...model.form.schema,
      id: `emr-pac-${model.instanceId}-${model.form.schema.id}`,
    },
  };
}

// ---- Family Pedigree ---------------------------------------------------------------------------

export const FAMILY_PEDIGREE_DEFAULTS = {
  eyebrow: 'Family history',
  addPerson: 'Add person',
  emptyMessage: 'No family history recorded.',
  legendAria: 'Family history guidance',
  legendTitle: 'Family pedigree symbols',
  male: 'Male',
  female: 'Female',
  otherSex: 'Other',
  deceased: 'Deceased',
  alive: 'Alive',
  notRecorded: 'Not recorded',
  affected: 'Affected',
  unaffected: 'Unaffected',
  statusUnknown: 'Status unknown',
  legendNote: 'The patient is labelled explicitly and relationships are shown as supplied.',
  generationsAria: 'Family members by generation',
  patientGeneration: 'Patient generation',
  generationsAbove: (count: number) => `${count} generation${count > 1 ? 's' : ''} above`,
  generationsBelow: (count: number) => `${count} generation${count > 1 ? 's' : ''} below`,
  patientBadge: 'Patient',
  conditionsAria: 'Recorded conditions',
  edit: 'Edit',
  remove: 'Remove',
  editPerson: (name: string) => `Edit ${name}`,
  removePerson: (name: string) => `Remove ${name}`,
  relationshipsTitle: 'Relationships',
  noRelationships: 'No relationships recorded.',
  unknownPerson: 'Unknown person',
  relationshipPair: (fromName: string, toName: string) => `${fromName} and ${toName}`,
  editRelationship: (fromName: string, toName: string) => `Edit relationship between ${fromName} and ${toName}`,
  ageYears: (years: string | number) => `${years} y`,
};
export type EmrFamilyPedigreeLabels = typeof FAMILY_PEDIGREE_DEFAULTS;

export function pedigreeGenerations(people: readonly FamilyPersonNode[]): number[] {
  return [...new Set(people.map(person => person.generation))].sort((a, b) => a - b);
}

export function peopleInGeneration(people: readonly FamilyPersonNode[], generation: number): FamilyPersonNode[] {
  return people.filter(person => person.generation === generation).sort((a, b) => a.order - b.order);
}

export function generationLabel(
  generation: number,
  labels: Pick<EmrFamilyPedigreeLabels, 'patientGeneration' | 'generationsAbove' | 'generationsBelow'> = FAMILY_PEDIGREE_DEFAULTS,
): string {
  if (generation === 0) return labels.patientGeneration;
  return generation < 0 ? labels.generationsAbove(Math.abs(generation)) : labels.generationsBelow(generation);
}

export function personName(
  people: readonly FamilyPersonNode[],
  personId: string,
  fallback = FAMILY_PEDIGREE_DEFAULTS.unknownPerson,
): string {
  return people.find(person => person.id === personId)?.displayName || fallback;
}

export function formatPersonAge(
  age: FamilyPersonNode['age'],
  formatYears: (years: string | number) => string = FAMILY_PEDIGREE_DEFAULTS.ageYears,
): string | null {
  if (age === undefined || age === null) return null;
  if (typeof age === 'number') return formatYears(age);
  const normalized = String(age).trim();
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) return formatYears(normalized);
  return normalized;
}

/** Symbol kind comes only from the structured `sex` field — never inferred from display text. */
export function sexKind(person: FamilyPersonNode): 'male' | 'female' | 'other' | 'unknown' {
  return person.sex ?? 'unknown';
}

export function phenotypeState(person: FamilyPersonNode): 'affected' | 'unaffected' | 'unknown' {
  if (person.phenotype === 'affected' || person.phenotype === 'unaffected' || person.phenotype === 'unknown') {
    return person.phenotype;
  }
  return 'unknown';
}

export function phenotypeLabel(
  person: FamilyPersonNode,
  labels: Pick<EmrFamilyPedigreeLabels, 'affected' | 'unaffected' | 'statusUnknown'> = FAMILY_PEDIGREE_DEFAULTS,
): string {
  switch (phenotypeState(person)) {
    case 'affected':
      return labels.affected;
    case 'unaffected':
      return labels.unaffected;
    default:
      return labels.statusUnknown;
  }
}

export function phenotypeIcon(person: FamilyPersonNode): string {
  switch (phenotypeState(person)) {
    case 'affected':
      return '⚠';
    case 'unaffected':
      return '✓';
    default:
      return '○';
  }
}

export function pedigreeGlyph(person: FamilyPersonNode): string {
  switch (sexKind(person)) {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    case 'other':
      return '⚬';
    default:
      return '⌖';
  }
}

/**
 * Vital status comes only from structured fields. A person with nothing recorded is
 * `unknown` — never silently promoted to alive.
 */
export function lifeState(person: FamilyPersonNode): 'alive' | 'deceased' | 'unknown' {
  if (person.lifeStatus) return person.lifeStatus;
  if (person.deceased === true) return 'deceased';
  if (person.deceased === false) return 'alive';
  return 'unknown';
}

export function lifeLabel(
  person: FamilyPersonNode,
  labels: Pick<EmrFamilyPedigreeLabels, 'deceased' | 'alive' | 'notRecorded'> = FAMILY_PEDIGREE_DEFAULTS,
): string {
  if (person.lifeStatusLabel) return person.lifeStatusLabel;
  switch (lifeState(person)) {
    case 'deceased':
      return labels.deceased;
    case 'alive':
      return labels.alive;
    default:
      return labels.notRecorded;
  }
}

export function lifeIcon(person: FamilyPersonNode): string {
  switch (lifeState(person)) {
    case 'deceased':
      return '✝';
    case 'alive':
      return '●';
    default:
      return '○';
  }
}

export function isPersonDeceased(person: FamilyPersonNode): boolean {
  return lifeState(person) === 'deceased';
}

export function personAriaLabel(
  person: FamilyPersonNode,
  labels: EmrFamilyPedigreeLabels = FAMILY_PEDIGREE_DEFAULTS,
): string {
  return [
    person.displayName,
    formatPersonAge(person.age, labels.ageYears),
    person.relationshipLabel,
    person.sexLabel,
    lifeLabel(person, labels),
    phenotypeLabel(person, labels),
  ]
    .filter(Boolean)
    .join(', ');
}

/** Pure state transition mirroring FamilyHistoryController for interactive harnesses. */
export function reduceFamilyPedigreeIntent(
  model: FamilyPedigreeViewModel,
  intent: FamilyPedigreeIntent,
): FamilyPedigreeViewModel {
  if (intent.type === 'personSelected') {
    const exists = model.people.some(item => item.id === intent.personId);
    return exists ? { ...model, selectedPersonId: intent.personId } : model;
  }
  if (intent.type === 'personRemoveRequested') {
    const person = model.people.find(item => item.id === intent.personId);
    if (!person || model.readOnly || person.readOnly) return model;
    return {
      ...model,
      selectedPersonId: model.selectedPersonId === intent.personId ? undefined : model.selectedPersonId,
      people: model.people.filter(item => item.id !== intent.personId),
      relationships: model.relationships.filter(
        rel => rel.fromPersonId !== intent.personId && rel.toPersonId !== intent.personId,
      ),
    };
  }
  return model;
}
