import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { FieldGeneratorIntent, FieldValidationRule } from '@drguptavivek/emr-controller';

type RuleKind = FieldValidationRule['kind'];
const ruleLabels: Record<RuleKind, string> = {
  'min-length': 'Minimum length', 'max-length': 'Maximum length', minimum: 'Minimum value', maximum: 'Maximum value', precision: 'Decimal precision', pattern: 'Pattern', 'earliest-date': 'Earliest date', 'latest-date': 'Latest date', 'allowed-values': 'Allowed values', custom: 'Custom validator',
};

@Component({
  selector: 'emr-validation-rule-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-authoring-card" [attr.aria-labelledby]="id('heading')">
      <div class="emr-authoring-card__heading"><div><p class="emr-eyebrow">Validation</p><h3 [id]="id('heading')">Rules for this field</h3></div><span class="emr-authoring-status">{{ rules.length }} {{ rules.length === 1 ? 'rule' : 'rules' }}</span></div>
      <div class="emr-authoring-grid emr-authoring-grid--rule">
        <label class="emr-field-frame__label" [for]="id('emr-rule-kind')">Rule type</label>
        <select class="emr-select" [id]="id('emr-rule-kind')" [value]="kind" [disabled]="readOnly" (change)="kindChanged($event)">@for (option of ruleKinds; track option) { <option [value]="option" [selected]="option === kind">{{ ruleLabels[option] }}</option> }</select>
        @if (kind === 'custom') { <label class="emr-field-frame__label" [for]="id('emr-rule-value')">Validator ID</label><input class="emr-control" [id]="id('emr-rule-value')" [value]="value" [disabled]="readOnly" placeholder="e.g. systolic-range" (input)="valueChanged($event)" /> }
        @else if (kind === 'pattern') { <label class="emr-field-frame__label" [for]="id('emr-rule-value')">Regular expression</label><input class="emr-control" [id]="id('emr-rule-value')" [value]="value" [disabled]="readOnly" placeholder="e.g. ^[A-Z0-9-]+$" (input)="valueChanged($event)" /> }
        @else if (kind === 'earliest-date' || kind === 'latest-date') { <label class="emr-field-frame__label" [for]="id('emr-rule-value')">Date</label><input class="emr-control" [id]="id('emr-rule-value')" type="date" [value]="value" [disabled]="readOnly" (input)="valueChanged($event)" /> }
        @else if (kind === 'allowed-values') { <label class="emr-field-frame__label" [for]="id('emr-rule-value')">Values</label><input class="emr-control" [id]="id('emr-rule-value')" [value]="value" [disabled]="readOnly" placeholder="Separate values with commas" (input)="valueChanged($event)" /> }
        @else { <label class="emr-field-frame__label" [for]="id('emr-rule-value')">Value</label><input class="emr-control" [id]="id('emr-rule-value')" type="number" min="0" [value]="value" [disabled]="readOnly" (input)="valueChanged($event)" /> }
        <label class="emr-field-frame__label" [for]="id('emr-rule-message')">Message <span class="emr-field__hint">optional</span></label><input class="emr-control" [id]="id('emr-rule-message')" [value]="message" [disabled]="readOnly" placeholder="Explain how to resolve the issue" (input)="messageChanged($event)" />
      </div>
      @if (kind === 'custom') { <p class="emr-authoring-message">The controller resolves this validator ID. The UI does not execute clinical validation.</p> }
      <button class="emr-button emr-button--secondary emr-validation-add" type="button" [disabled]="readOnly || !canAdd()" (click)="addRule()">Add validation rule</button>
      @if (rules.length) { <div class="emr-validation-rules" aria-label="Current validation rules">@for (rule of rules; track rule.id) { <div class="emr-validation-rule"><div><strong>{{ ruleLabels[rule.kind] }}</strong><span>{{ summary(rule) }}</span>@if (rule.message) { <small>{{ rule.message }}</small> }</div><button class="emr-button emr-button--ghost" type="button" [disabled]="readOnly" (click)="removeRule(rule.id)">Remove</button></div> }</div> }
    </section>
  `,
  styles: [`:host{display:block}.emr-authoring-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px}.emr-authoring-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.emr-authoring-card h3{margin:2px 0 0;color:var(--emr-text);font-size:var(--emr-text-lg)}.emr-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-authoring-status{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}.emr-authoring-grid{display:grid;grid-template-columns:minmax(110px,150px) minmax(0,1fr);gap:10px 12px;align-items:center}.emr-validation-add{margin-top:14px}.emr-authoring-message{margin:12px 0 0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}.emr-validation-rules{display:grid;gap:7px;margin-top:14px}.emr-validation-rule{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-raised)}.emr-validation-rule>div{display:grid;gap:2px}.emr-validation-rule span,.emr-validation-rule small{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}.emr-validation-rule small{font-style:italic}@media(max-width:640px){.emr-authoring-grid{grid-template-columns:1fr;gap:5px}.emr-validation-rule{align-items:flex-start}}
  `],
})
export class EmrValidationRuleEditorComponent {
  @Input() rules: readonly FieldValidationRule[] = [];
  @Input() readOnly = false;
  @Input() idPrefix = 'emr-validation';
  @Output() readonly intent = new EventEmitter<FieldGeneratorIntent>();
  readonly ruleKinds: readonly RuleKind[] = ['min-length', 'max-length', 'minimum', 'maximum', 'precision', 'pattern', 'earliest-date', 'latest-date', 'allowed-values', 'custom'];
  readonly ruleLabels = ruleLabels;
  kind: RuleKind = 'minimum';
  value = '';
  message = '';
  id(suffix: string): string { return `${this.idPrefix}-${suffix}`; }
  kindChanged(event: Event): void { this.kind = (event.target as HTMLSelectElement).value as RuleKind; this.value = ''; }
  valueChanged(event: Event): void { this.value = (event.target as HTMLInputElement).value; }
  messageChanged(event: Event): void { this.message = (event.target as HTMLInputElement).value; }
  canAdd(): boolean { return this.kind === 'custom' ? this.value.trim().length > 0 && this.message.trim().length > 0 : this.value.trim().length > 0; }
  addRule(): void {
    if (!this.canAdd()) return;
    const base = { id: '', message: this.message.trim() || undefined };
    let rule: FieldValidationRule;
    if (this.kind === 'pattern') rule = { ...base, kind: 'pattern', value: this.value.trim(), message: this.message.trim() || 'Value does not match the required pattern.' };
    else if (this.kind === 'custom') rule = { ...base, kind: 'custom', customValidatorId: this.value.trim(), message: this.message.trim() };
    else if (this.kind === 'allowed-values') rule = { ...base, kind: 'allowed-values', values: this.value.split(',').map(item => item.trim()).filter(Boolean) };
    else if (this.kind === 'earliest-date' || this.kind === 'latest-date') rule = { ...base, kind: this.kind, value: this.value };
    else rule = { ...base, kind: this.kind, value: Number(this.value) };
    this.intent.emit({ type: 'validationRuleAdded', rule });
  }
  removeRule(ruleId: string): void { this.intent.emit({ type: 'validationRuleRemoved', ruleId }); }
  summary(rule: FieldValidationRule): string { return 'values' in rule ? rule.values.join(', ') : 'customValidatorId' in rule ? rule.customValidatorId : String(rule.value); }
}
