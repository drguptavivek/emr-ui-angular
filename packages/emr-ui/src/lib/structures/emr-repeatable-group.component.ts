import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import type { ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue, RepeatableGroupDefinition, RepeatableItemState, ClinicalFormIntent } from '@drguptavivek/emr-controller';
import { EmrCustomFieldContext, EmrTypedFieldComponent } from '../fields/emr-typed-field.component';

@Component({
  selector: 'emr-repeatable-group',
  standalone: true,
  imports: [EmrTypedFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-repeatable-group" [attr.aria-labelledby]="definition.id + '-heading'">
      <div class="emr-repeatable-group__heading"><div><h3 [id]="definition.id + '-heading'">{{ definition.label }}</h3>@if (definition.description) { <p>{{ definition.description }}</p> }</div><button class="emr-button emr-button--outline emr-button--small" type="button" [disabled]="readOnly" (click)="intent.emit({ type: 'repeatItemAddRequested', groupId: definition.id })">{{ definition.addLabel ?? 'Add' }}</button></div>
      @for (item of model; track item.id) {
        <article class="emr-repeatable-group__item"><header><span>{{ item.label ?? ('Entry ' + ($index + 1)) }}</span><button class="emr-button emr-button--ghost emr-button--small" type="button" [disabled]="readOnly || item.readOnly" (click)="intent.emit({ type: 'repeatItemRemoveRequested', groupId: definition.id, itemId: item.id })">Remove</button></header><div class="emr-repeatable-group__grid">@for (field of definition.fields; track field.id) { <emr-typed-field [definition]="field" [model]="item.fields[field.id]" [controlId]="controlId(item, field)" [readOnly]="readOnly || !!item.readOnly" [customTemplates]="customTemplates" (focused)="focused(item, field)" (valueChange)="changed(item, field, $event)" (statusChange)="statusChanged(item, field, $event)" /> }</div></article>
      } @empty { <p class="emr-repeatable-group__empty">No entries recorded.</p> }
    </section>
  `,
  styles: [`.emr-repeatable-group{border:1px solid var(--emr-border);border-radius:8px;padding:16px;background:var(--emr-surface-slate)}.emr-repeatable-group__heading,.emr-repeatable-group__item header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.emr-repeatable-group h3{margin:0;font-size:var(--emr-text-lg)}.emr-repeatable-group p{margin:4px 0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}.emr-repeatable-group__item{margin-top:12px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}.emr-repeatable-group__item header{margin-bottom:12px;font-weight:600}.emr-repeatable-group__grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.emr-repeatable-group__grid emr-typed-field{grid-column:span 6}.emr-repeatable-group__empty{color:var(--emr-text-muted)}@media(max-width:720px){.emr-repeatable-group__grid{grid-template-columns:1fr}.emr-repeatable-group__grid emr-typed-field{grid-column:span 1}}`]
})
export class EmrRepeatableGroupComponent {
  @Input({ required: true }) definition!: RepeatableGroupDefinition;
  @Input() model: readonly RepeatableItemState[] = [];
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly intent = new EventEmitter<ClinicalFormIntent>();
  controlId(item: RepeatableItemState, field: ClinicalFieldDefinition): string { return `${this.definition.id}-${item.id}-${field.id}`; }
  focused(item: RepeatableItemState, field: ClinicalFieldDefinition): void { this.intent.emit({ type: 'fieldFocused', fieldId: `${this.definition.id}.${item.id}.${field.id}` }); }
  changed(item: RepeatableItemState, field: ClinicalFieldDefinition, value: ClinicalFieldValue): void { this.intent.emit({ type: 'repeatItemEditRequested', groupId: this.definition.id, itemId: item.id, fieldId: field.id, value }); }
  statusChanged(item: RepeatableItemState, field: ClinicalFieldDefinition, status: ClinicalFieldState['assessmentStatus']): void { this.intent.emit({ type: 'repeatItemStatusEditRequested', groupId: this.definition.id, itemId: item.id, fieldId: field.id, status }); }
}
