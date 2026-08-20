import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroShieldCheck } from '@ng-icons/heroicons/outline';
import type { ClinicalFormIntent, PacChecklistAction, PacChecklistIntent, PacChecklistViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalFormComponent } from '../clinical/emr-clinical-form.component';

@Component({
  selector: 'emr-pac-checklist',
  standalone: true,
  imports: [EmrClinicalFormComponent, NgIcon],
  providers: [...provideIcons({ heroShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-pac" [attr.aria-labelledby]="headingId()">
      <header class="emr-pac__header"><div><ng-icon class="emr-card-header-icon" name="heroShieldCheck" aria-hidden="true" /><p class="emr-pac__eyebrow">Pre-operative assessment</p><h2 [id]="headingId()">{{ view.title }}</h2>@if (view.description) { <p>{{ view.description }}</p> }</div><div class="emr-pac__status">@if (view.overallStatus; as status) { <span [class]="'emr-tone-' + status.tone">{{ status.label }}@if (status.assistiveText) { <span class="emr-sr-only">{{ status.assistiveText }}</span> }</span> }@if (view.readOnly || readOnly) { <span>Read only</span> }</div></header>
      @if (view.context.length) { <dl class="emr-pac__context" [attr.aria-label]="'Assessment context for ' + view.instanceId">@for (item of view.context; track item.id) { <div><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div> }</dl> }
      @if (view.errors?.length) { <div class="emr-pac__errors" role="alert" [attr.aria-label]="'PAC assessment issues for ' + view.instanceId"><strong>Review assessment issues</strong><ul>@for (error of view.errors; track error.id) { <li><span>{{ error.severity ?? 'error' }}</span> · {{ error.message }}</li> }</ul></div> }
      <div class="emr-pac__form"><emr-clinical-form [model]="scopedForm()" (intent)="formIntent($event)" /></div>
      @if (view.actions.length) { <footer class="emr-pac__actions" [attr.aria-label]="'PAC assessment actions for ' + view.instanceId">@for (action of view.actions; track action.id) { <button type="button" [class]="buttonClass(action)" [id]="actionId(action)" [disabled]="isDisabled(action)" [attr.aria-busy]="action.loading || null" [attr.aria-label]="action.assistiveText ? action.label + '. ' + action.assistiveText : action.label" (click)="actionRequested(action)">@if (action.loading) { <span aria-hidden="true">•••</span> }{{ action.label }}</button> }</footer> }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}.emr-pac{display:grid;gap:16px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px}.emr-pac__header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.emr-pac h2{margin:2px 0 6px;font-size:1.25rem}.emr-pac__header p:not(.emr-pac__eyebrow){margin:0;color:var(--emr-text-muted);line-height:1.45}.emr-pac__eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-pac__status{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.emr-pac__status>span{height:var(--emr-compact-height);display:inline-flex;align-items:center;border:1px solid var(--emr-border);border-radius:999px;padding:5px 9px;font-size:.78rem;white-space:nowrap}.emr-pac__status>span:not([class]){color:var(--emr-text-muted);background:var(--emr-surface-raised)}.emr-pac__context{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0;padding:12px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised)}.emr-pac__context div{min-width:0}.emr-pac__context dt{color:var(--emr-text-muted);font-size:.75rem;font-weight:650}.emr-pac__context dd{margin:3px 0 0;font-weight:600;overflow-wrap:anywhere}.emr-pac__errors{padding:11px 13px;border-radius:9px;background:var(--emr-danger-soft);color:var(--emr-danger);font-size:.85rem}.emr-pac__errors ul{margin:6px 0 0;padding-left:20px}.emr-pac__errors li span{text-transform:capitalize;font-weight:700}.emr-pac__form{padding:2px}.emr-pac__actions{display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--emr-border)}.emr-pac__actions .emr-button{min-width:120px;min-height:44px}@media(max-width:640px){.emr-pac{padding:14px}.emr-pac__header{display:grid;gap:9px}.emr-pac__status{justify-content:flex-start}.emr-pac__context{grid-template-columns:1fr}.emr-pac__actions{display:grid;grid-template-columns:1fr}.emr-pac__actions .emr-button{width:100%}}
  `],
})
export class EmrPacChecklistComponent {
  @Input({ required: true }) view!: PacChecklistViewModel;
  @Input() readOnly = false;
  @Output() readonly intent = new EventEmitter<PacChecklistIntent>();
  headingId(): string { return `emr-pac-${this.view.instanceId}-heading`; }
  actionId(action: PacChecklistAction): string { return `emr-pac-${this.view.instanceId}-action-${action.id}`; }
  buttonClass(action: PacChecklistAction): string { return action.tone && action.tone !== 'primary' ? `emr-button emr-button--${action.tone}` : 'emr-button'; }
  isDisabled(action: PacChecklistAction): boolean { return this.readOnly || !!this.view.readOnly || !!action.disabled || !!action.loading; }
  scopedForm(): PacChecklistViewModel['form'] { return { ...this.view.form, readOnly: this.readOnly || !!this.view.readOnly || !!this.view.form.readOnly, schema: { ...this.view.form.schema, id: `emr-pac-${this.view.instanceId}-${this.view.form.schema.id}` } }; }
  formIntent(intent: ClinicalFormIntent): void { if (!this.readOnly && !this.view.readOnly) this.intent.emit({ type: 'formIntent', intent }); }
  actionRequested(action: PacChecklistAction): void { if (!this.isDisabled(action)) this.intent.emit({ type: 'actionRequested', actionId: action.id }); }
}
