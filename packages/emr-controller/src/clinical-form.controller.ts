import { StateController } from './contracts.js';
import type {
  ClinicalFieldDefinition,
  ClinicalFormIntent,
  ClinicalFormViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
  ClinicalFieldState,
} from './clinical-form.models.js';

/** Pure state adapter for the schema-driven clinical form presentation. */
export class ClinicalFormController extends StateController<ClinicalFormViewModel, ClinicalFormIntent> {
  private sequence = 0;

  constructor(initial: ClinicalFormViewModel) {
    super({
      ...initial,
      fields: { ...initial.fields },
      repeatableGroups: Object.fromEntries(Object.entries(initial.repeatableGroups).map(([key, value]) => [key, [...value]])),
      collapsedSectionIds: [...(initial.collapsedSectionIds ?? [])],
    });
  }

  dispatch(intent: ClinicalFormIntent): void {
    switch (intent.type) {
      case 'fieldEditRequested':
        this.editField(intent.fieldId, intent.value);
        return;
      case 'fieldStatusEditRequested':
        this.editFieldStatus(intent.fieldId, intent.status);
        return;
      case 'fieldFocused':
        return;
      case 'repeatItemAddRequested':
        this.addItem(intent.groupId);
        return;
      case 'repeatItemEditRequested':
        this.editItem(intent.groupId, intent.itemId, intent.fieldId, intent.value);
        return;
      case 'repeatItemStatusEditRequested':
        this.editItemStatus(intent.groupId, intent.itemId, intent.fieldId, intent.status);
        return;
      case 'repeatItemRemoveRequested':
        this.removeItem(intent.groupId, intent.itemId);
        return;
      case 'sectionToggleRequested':
        this.toggleSection(intent.sectionId);
        return;
      case 'correctionRequested':
        return; // the app files the correction request; the form state does not change
    }
  }

  private fieldDefinition(fieldId: string): ClinicalFieldDefinition | undefined {
    for (const section of this.getSnapshot().schema.sections) {
      for (const block of section.blocks) {
        if (block.kind === 'repeatable') continue;
        if (block.kind === 'matrix') {
          for (const row of block.rows) {
            const cell = Object.values(row.cells).find(candidate => candidate.id === fieldId);
            if (cell) return cell;
          }
          continue;
        }
        if (block.id === fieldId) return block;
      }
    }
    return undefined;
  }

  private groupDefinition(groupId: string): RepeatableGroupDefinition | undefined {
    for (const section of this.getSnapshot().schema.sections) {
      const block = section.blocks.find(candidate => candidate.kind === 'repeatable' && candidate.id === groupId);
      if (block?.kind === 'repeatable') return block;
    }
    return undefined;
  }

  private editField(fieldId: string, value: ClinicalFieldState['value']): void {
    if (!this.fieldDefinition(fieldId)) return;
    this.setState(state => {
      const current = state.fields[fieldId];
      if (!current || state.readOnly || current.readOnly || current.disabled) return state;
      return { ...state, fields: { ...state.fields, [fieldId]: { ...current, value } } };
    });
  }

  private editFieldStatus(fieldId: string, status: ClinicalFieldState['assessmentStatus']): void {
    if (!this.fieldDefinition(fieldId)) return;
    this.setState(state => {
      const current = state.fields[fieldId];
      if (!current || state.readOnly || current.readOnly || current.disabled) return state;
      return { ...state, fields: { ...state.fields, [fieldId]: { ...current, assessmentStatus: status } } };
    });
  }

  private addItem(groupId: string): void {
    const definition = this.groupDefinition(groupId);
    if (!definition) return;
    this.setState(state => {
      if (state.readOnly) return state;
      // Rehydrated models may already hold ids from a prior session; never reuse one —
      // a duplicate id makes editItem/removeItem hit every matching row.
      const taken = new Set((state.repeatableGroups[groupId] ?? []).map(item => item.id));
      let id = `${groupId}-${++this.sequence}`;
      while (taken.has(id)) id = `${groupId}-${++this.sequence}`;
      const fields: Readonly<Record<string, ClinicalFieldState>> = Object.fromEntries(
        definition.fields.map(field => [field.id, { value: null }])
      );
      const item: RepeatableItemState = { id, fields };
      return {
        ...state,
        repeatableGroups: { ...state.repeatableGroups, [groupId]: [...(state.repeatableGroups[groupId] ?? []), item] },
      };
    });
  }

  private editItem(groupId: string, itemId: string, fieldId: string, value: ClinicalFieldState['value']): void {
    const definition = this.groupDefinition(groupId);
    if (!definition || !definition.fields.some(field => field.id === fieldId)) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const item = state.repeatableGroups[groupId]?.find(candidate => candidate.id === itemId);
      const current = item?.fields[fieldId];
      if (!item || !current || item.readOnly || current.readOnly || current.disabled) return state;
      const items = state.repeatableGroups[groupId].map(candidate => candidate.id === itemId
        ? { ...candidate, fields: { ...candidate.fields, [fieldId]: { ...current, value } } }
        : candidate);
      return { ...state, repeatableGroups: { ...state.repeatableGroups, [groupId]: items } };
    });
  }

  private editItemStatus(groupId: string, itemId: string, fieldId: string, status: ClinicalFieldState['assessmentStatus']): void {
    const definition = this.groupDefinition(groupId);
    if (!definition || !definition.fields.some(field => field.id === fieldId)) return;
    this.setState(state => {
      if (state.readOnly) return state;
      const item = state.repeatableGroups[groupId]?.find(candidate => candidate.id === itemId);
      const current = item?.fields[fieldId];
      if (!item || !current || item.readOnly || current.readOnly || current.disabled) return state;
      const items = state.repeatableGroups[groupId].map(candidate => candidate.id === itemId
        ? { ...candidate, fields: { ...candidate.fields, [fieldId]: { ...current, assessmentStatus: status } } }
        : candidate);
      return { ...state, repeatableGroups: { ...state.repeatableGroups, [groupId]: items } };
    });
  }

  private removeItem(groupId: string, itemId: string): void {
    if (!this.groupDefinition(groupId)) return;
    this.setState(state => state.readOnly ? state : {
      ...state,
      repeatableGroups: { ...state.repeatableGroups, [groupId]: (state.repeatableGroups[groupId] ?? []).filter(item => item.id !== itemId) },
    });
  }

  private toggleSection(sectionId: string): void {
    if (!this.getSnapshot().schema.sections.some(section => section.id === sectionId && section.collapsible)) return;
    this.setState(state => {
      const collapsed = new Set(state.collapsedSectionIds ?? []);
      if (collapsed.has(sectionId)) collapsed.delete(sectionId); else collapsed.add(sectionId);
      return { ...state, collapsedSectionIds: [...collapsed] };
    });
  }
}
