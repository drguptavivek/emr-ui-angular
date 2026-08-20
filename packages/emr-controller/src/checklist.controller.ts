import { StateController } from './contracts.js';
import type {
  ChecklistItemState,
  ChecklistPhaseDefinition,
  StagedChecklistIntent,
  StagedChecklistViewModel
} from './checklist.models.js';

export interface StagedChecklistControllerState extends StagedChecklistViewModel {}

/**
 * Presentation-only checklist state. It deliberately does not create sign-offs,
 * timestamps, or clinical values; those remain the responsibility of an adapter.
 */
export class StagedChecklistController extends StateController<
  StagedChecklistControllerState,
  StagedChecklistIntent
> {
  constructor(initial: StagedChecklistViewModel) {
    super({
      ...initial,
      items: { ...initial.items },
      phaseStatuses: initial.phaseStatuses ? { ...initial.phaseStatuses } : undefined,
      signoffs: initial.signoffs ? { ...initial.signoffs } : undefined
    });
  }

  dispatch(intent: StagedChecklistIntent): void {
    if (intent.type === 'phaseSelected') {
      this.setState(state => state.schema.phases.some(phase => phase.id === intent.phaseId)
        ? { ...state, activePhaseId: intent.phaseId }
        : state);
      return;
    }

    if (intent.type === 'itemResponseRequested') {
      this.setState(state => {
        const item = this.findItem(state, intent.itemId);
        const previous = state.items[intent.itemId];
        if (!item || !previous || state.readOnly || previous.readOnly || previous.disabled) return state;
        return { ...state, items: { ...state.items, [intent.itemId]: { ...previous, value: intent.value, error: undefined } } };
      });
      return;
    }

    if (intent.type === 'itemNoteRequested') {
      this.setState(state => {
        const previous = state.items[intent.itemId];
        if (!previous || state.readOnly || previous.readOnly || previous.disabled) return state;
        return { ...state, items: { ...state.items, [intent.itemId]: { ...previous, note: intent.note, error: undefined } } };
      });
      return;
    }

    if (intent.type === 'phaseCompletionRequested') {
      this.completePhase(intent.phaseId);
      return;
    }

    if (intent.type === 'phaseSignoffRequested') {
      // A sign-off can only be reflected when supplied by the controller/adaptor.
      // The component never fabricates a person, time, or clinical attestation.
      this.setState(state => state.signoffs?.[intent.phaseId]
        ? { ...state, phaseStatuses: { ...state.phaseStatuses, [intent.phaseId]: { label: 'Signed off', tone: 'success' } } }
        : state);
    }
  }

  private completePhase(phaseId: string): void {
    this.setState(state => {
      const phase = state.schema.phases.find(candidate => candidate.id === phaseId);
      if (!phase || state.readOnly) return state;
      const missing = this.requiredItems(phase, state.items);
      const items = { ...state.items };
      for (const item of phase.items) {
        const issue = missing[item.id];
        if (issue) items[item.id] = { ...items[item.id], error: issue };
      }
      if (Object.keys(missing).length) {
        return {
          ...state,
          items,
          error: `Complete the required items in ${phase.label} before continuing.`,
          phaseStatuses: { ...state.phaseStatuses, [phaseId]: { label: 'Blocked', tone: 'danger', assistiveText: 'Required items are incomplete.' } }
        };
      }
      return {
        ...state,
        items,
        error: undefined,
        phaseStatuses: { ...state.phaseStatuses, [phaseId]: { label: 'Complete', tone: 'success' } }
      };
    });
  }

  private findItem(state: StagedChecklistControllerState, itemId: string) {
    for (const phase of state.schema.phases) if (phase.items.some(item => item.id === itemId)) {
      return phase.items.find(item => item.id === itemId);
    }
    return undefined;
  }

  private requiredItems(phase: ChecklistPhaseDefinition, items: Readonly<Record<string, ChecklistItemState>>): Record<string, string> {
    const missing: Record<string, string> = {};
    for (const definition of phase.items) {
      if (!definition.required) continue;
      const state = items[definition.id];
      const empty = !state || state.value === null || state.value === '' || (state.value === false && definition.type === 'checkbox');
      const needsNote = definition.requiresNoteWhen?.includes(String(state?.value)) && !state?.note?.trim();
      if (empty) missing[definition.id] = 'Required response';
      else if (needsNote) missing[definition.id] = 'Add the required note';
    }
    return missing;
  }
}
