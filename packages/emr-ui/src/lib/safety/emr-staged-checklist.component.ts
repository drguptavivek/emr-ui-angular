import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheckCircle } from '@ng-icons/heroicons/outline';
import type { ChecklistItemDefinition, ChecklistItemState, StagedChecklistIntent, StagedChecklistViewModel } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-staged-checklist',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroCheckCircle })],
  template: `
    <section class="emr-staged-checklist" [attr.aria-labelledby]="headingId()">
      <header class="emr-staged-checklist__header">
        <ng-icon class="emr-card-header-icon" name="heroCheckCircle" aria-hidden="true" />
        <div>
          <h2 [id]="headingId()">{{ view.schema.label }}</h2>
          @if (view.schema.description) { <p>{{ view.schema.description }}</p> }
        </div>
        @if (view.readOnly) { <span class="emr-staged-checklist__state">Read only</span> }
      </header>

      <nav class="emr-staged-checklist__phases" aria-label="Checklist phases">
        @for (phase of view.schema.phases; track phase.id; let index = $index) {
          <button type="button" class="emr-staged-checklist__phase"
            [class.emr-staged-checklist__phase--active]="phase.id === view.activePhaseId"
            [attr.aria-current]="phase.id === view.activePhaseId ? 'step' : null"
            (click)="emit({ type: 'phaseSelected', phaseId: phase.id })">
            <span class="emr-staged-checklist__phase-number">{{ index + 1 }}</span>
            <span>{{ phase.label }}</span>
            @if (view.phaseStatuses?.[phase.id]; as status) { <span class="emr-staged-checklist__status" [attr.data-tone]="status.tone">{{ status.label }}</span> }
          </button>
        }
      </nav>

      @if (activePhase(); as phase) {
        <div class="emr-staged-checklist__body">
          <div class="emr-staged-checklist__phase-heading">
            <div><h3>{{ phase.label }}</h3>@if (phase.description) { <p>{{ phase.description }}</p> }</div>
            <button type="button" class="emr-button emr-button--secondary" [disabled]="view.readOnly" (click)="emit({ type: 'phaseCompletionRequested', phaseId: phase.id })">Mark phase complete</button>
          </div>
          @if (view.signoffs?.[phase.id]; as signoff) {
            <p class="emr-staged-checklist__signoff">
              Signed by <strong>{{ signoff.displayName }}</strong>, {{ signoff.roleLabel }} · {{ signoff.signedAtLabel }}
            </p>
          }
          @for (item of phase.items; track item.id) { <div class="emr-staged-checklist__item" [class.emr-staged-checklist__item--disabled]="isDisabled(item)">
            @switch (item.type) {
              @case ('checkbox') { <label class="emr-staged-checklist__control"><input type="checkbox" [checked]="itemState(item).value === true" [disabled]="isDisabled(item)" (change)="emit({ type: 'itemResponseRequested', itemId: item.id, value: $any($event.target).checked })" /><span>{{ item.label }}</span></label> }
              @case ('yes-no') { <fieldset><legend>{{ item.label }}</legend><label><input type="radio" [name]="radioName(item)" value="yes" [checked]="itemState(item).value === 'yes'" [disabled]="isDisabled(item)" (change)="emit({ type: 'itemResponseRequested', itemId: item.id, value: 'yes' })" /> Yes</label><label><input type="radio" [name]="radioName(item)" value="no" [checked]="itemState(item).value === 'no'" [disabled]="isDisabled(item)" (change)="emit({ type: 'itemResponseRequested', itemId: item.id, value: 'no' })" /> No</label></fieldset> }
              @case ('yes-no-na') { <fieldset><legend>{{ item.label }}</legend>@for (choice of yesNoNa; track choice) { <label><input type="radio" [name]="radioName(item)" [value]="choice" [checked]="itemState(item).value === choice" [disabled]="isDisabled(item)" (change)="emit({ type: 'itemResponseRequested', itemId: item.id, value: choice })" /> {{ choiceLabel(choice) }}</label> }</fieldset> }
              @case ('select') { <label class="emr-staged-checklist__field"><span>{{ item.label }}</span><select [value]="$any(itemState(item).value ?? '')" [disabled]="isDisabled(item)" (change)="emit({ type: 'itemResponseRequested', itemId: item.id, value: $any($event.target).value || null })"><option value="">Select an option</option>@for (option of item.options ?? []; track option.value) { <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option> }</select></label> }
              @default { <label class="emr-staged-checklist__field"><span>{{ item.label }}</span><input [type]="item.type === 'text' ? 'text' : 'text'" [value]="$any(itemState(item).value ?? '')" [disabled]="isDisabled(item)" (input)="emit({ type: 'itemResponseRequested', itemId: item.id, value: $any($event.target).value })" /></label> }
            }
            @if (item.description) { <p class="emr-staged-checklist__description">{{ item.description }}</p> }
            @if (itemState(item).error) { <p class="emr-staged-checklist__error" role="alert">{{ itemState(item).error }}</p> }
            @if (needsNote(item)) { <label class="emr-staged-checklist__field"><span>Note</span><textarea [value]="itemState(item).note ?? ''" [disabled]="isDisabled(item)" (input)="emit({ type: 'itemNoteRequested', itemId: item.id, note: $any($event.target).value })"></textarea></label> }
          </div> }
          @if (view.error) { <p class="emr-staged-checklist__error" role="alert">{{ view.error }}</p> }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text, #334155); }
    .emr-staged-checklist { background: var(--emr-surface, #fff); border: 1px solid var(--emr-border, #dbe4ec); border-radius: 12px; overflow: hidden; }
    .emr-staged-checklist__header, .emr-staged-checklist__phase-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 20px 24px; }
    h2, h3, p { margin: 0; } h2, h3 { color: var(--emr-text, #334155); } p { color: var(--emr-text-muted, #64748b); margin-top: 4px; }
    .emr-staged-checklist__state, .emr-staged-checklist__status { border-radius: 999px; padding: 4px 9px; font-size: .78rem; background: var(--emr-surface-soft); color: var(--emr-text); }
    .emr-staged-checklist__phases { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-block: 1px solid var(--emr-border, #dbe4ec); background: var(--emr-surface-slate); }
    .emr-staged-checklist__phase { min-height: 56px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; border: 0; border-inline-end: 1px solid var(--emr-border, #dbe4ec); background: transparent; color: var(--emr-text, #334155); font: inherit; text-align: start; cursor: pointer; }
    .emr-staged-checklist__phase:last-child { border-inline-end: 0; } .emr-staged-checklist__phase--active { background: var(--emr-surface-accent); color: var(--emr-primary); box-shadow: inset 0 -3px var(--emr-primary); }
    .emr-staged-checklist__phase-number { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--emr-neutral-soft); font-weight: 700; }
    .emr-staged-checklist__status { margin-inline-start: auto; } .emr-staged-checklist__status[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-staged-checklist__body { padding-bottom: 20px; } .emr-staged-checklist__item { margin: 0 24px; padding: 16px 0; border-bottom: 1px solid var(--emr-border); } .emr-staged-checklist__item--disabled { opacity: .65; }
    .emr-staged-checklist__signoff { margin: 0 24px 8px; padding: 10px 12px; border-radius: 8px; background: var(--emr-success-soft, #eef7ef); color: var(--emr-text, #334155); }
    .emr-staged-checklist__control, fieldset, .emr-staged-checklist__field { display: flex; gap: 10px; align-items: center; } fieldset { border: 0; padding: 0; margin: 0; flex-wrap: wrap; } legend { font-weight: 650; flex-basis: 100%; margin-bottom: 8px; }
    .emr-staged-checklist__field { align-items: stretch; flex-direction: column; } .emr-staged-checklist__field span { font-weight: 650; } input, select, textarea { min-height: 44px; border: 1px solid var(--emr-border); border-radius: 8px; padding: 9px 11px; font: inherit; color: inherit; background: var(--emr-surface, #fff); } textarea { min-height: 72px; resize: vertical; }
    .emr-staged-checklist__description { font-size: .9rem; margin-inline-start: 28px; } .emr-staged-checklist__error { color: var(--emr-danger); font-size: .9rem; } :focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    @media (max-width: 640px) { .emr-staged-checklist__header, .emr-staged-checklist__phase-heading { flex-direction: column; } .emr-staged-checklist__phases { grid-template-columns: 1fr; } .emr-staged-checklist__phase { border-inline-end: 0; border-bottom: 1px solid var(--emr-border, #dbe4ec); } .emr-button { width: 100%; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrStagedChecklistComponent {
  @Input({ required: true }) view!: StagedChecklistViewModel;
  @Output() readonly intent = new EventEmitter<StagedChecklistIntent>();
  readonly yesNoNa = ['yes', 'no', 'na'];
  headingId(): string { return `emr-staged-checklist-${this.view.schema.id}-heading`; }
  activePhase() { return this.view?.schema.phases.find(phase => phase.id === this.view.activePhaseId); }
  itemState(item: ChecklistItemDefinition): ChecklistItemState { return this.view.items[item.id] ?? { value: null }; }
  radioName(item: ChecklistItemDefinition): string { return `${this.view.instanceId}-${item.id}`; }
  isDisabled(item: ChecklistItemDefinition): boolean { const state = this.itemState(item); return Boolean(this.view.readOnly || state.disabled || state.readOnly); }
  choiceLabel(choice: string): string { return choice === 'na' ? 'Not applicable' : choice === 'yes' ? 'Yes' : 'No'; }
  needsNote(item: ChecklistItemDefinition): boolean { return Boolean(item.requiresNoteWhen?.includes(String(this.itemState(item).value))); }
  emit(next: StagedChecklistIntent): void { if (!this.view.readOnly || next.type === 'phaseSelected') this.intent.emit(next); }
}
