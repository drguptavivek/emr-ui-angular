import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type {
  FieldGeneratorIntent,
  TerminologyBinding,
  TerminologyBindingRole,
  TerminologyBindingStrength,
  TerminologyConcept,
  TerminologyMappingRelationship,
  TerminologySearchState,
  TerminologySource,
} from '@drguptavivek/emr-controller';

const roleLabels: Record<TerminologyBindingRole, string> = {
  'question-meaning': 'Clinical meaning',
  'answer-value-set': 'Answer value set',
  unit: 'Unit / UCUM',
  'classification-mapping': 'Classification mapping',
};

@Component({
  selector: 'emr-terminology-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-authoring-card emr-terminology-search" [attr.aria-labelledby]="headingId">
      <div class="emr-authoring-card__heading">
        <div>
          <p class="emr-eyebrow">Terminology binding</p>
          <h3 [id]="headingId">{{ roleLabel() }}</h3>
        </div>
        @if (model?.loading) { <span class="emr-authoring-status" role="status">Searching…</span> }
      </div>
      <div class="emr-authoring-grid emr-authoring-grid--search">
        <label class="emr-field-frame__label" [for]="sourceControlId()">Source</label>
        <select class="emr-select" [id]="sourceControlId()" [value]="model?.sourceId ?? ''" [disabled]="readOnly" (change)="sourceChanged($event)">
          <option value="">Choose terminology</option>
          @for (source of sources; track source.id) {
            <option [value]="source.id" [disabled]="!source.available">{{ source.label }}{{ source.versionLabel ? ' · ' + source.versionLabel : '' }}</option>
          }
        </select>
        <label class="emr-field-frame__label" [for]="queryControlId()">Search</label>
        <div class="emr-search-row">
          <input class="emr-control" [id]="queryControlId()" type="search" [value]="model?.query ?? ''" [placeholder]="placeholder()" [disabled]="readOnly || !model?.sourceId" (input)="queryChanged($event)" (keydown.enter)="searchRequested()" />
          <button class="emr-button emr-button--secondary" type="button" [disabled]="readOnly || !model?.sourceId || model.loading" (click)="searchRequested()">Search</button>
        </div>
      </div>
      @if (model?.error) {
        <div class="emr-authoring-message emr-authoring-message--error" role="alert">{{ model.error }} <button class="emr-button emr-button--ghost" type="button" [disabled]="readOnly" (click)="retry()">Retry</button></div>
      } @else if (model && !model.loading && model.sourceId && model.query && model.options.length === 0) {
        <p class="emr-authoring-message" role="status">No concepts found for this search.</p>
      }
      @if (model && model.options.length) {
        <div class="emr-terminology-results" role="group" [attr.aria-label]="roleLabel() + ' search results'">
          @for (concept of model.options; track concept.sourceId + ':' + concept.code) {
            <button class="emr-terminology-result" type="button" [disabled]="readOnly || concept.active === false" (click)="selectConcept(concept)">
              <span class="emr-terminology-result__main"><strong>{{ concept.display }}</strong><span>{{ concept.code }}</span></span>
              <span class="emr-terminology-result__meta">{{ concept.system }}{{ concept.version ? ' · ' + concept.version : '' }}{{ concept.active === false ? ' · Inactive' : '' }}</span>
            </button>
          }
        </div>
        @if (model && model.total > model.pageSize) {
          <div class="emr-authoring-pagination"><span>Page {{ model.page }} · {{ model.total }} results</span><button class="emr-button emr-button--ghost" type="button" [disabled]="readOnly || model.page <= 1" (click)="pageChanged(model.page - 1)">Previous</button><button class="emr-button emr-button--ghost" type="button" [disabled]="readOnly || model.page * model.pageSize >= model.total" (click)="pageChanged(model.page + 1)">Next</button></div>
        }
      }
      @for (binding of bindings; track binding.id) {
        <div class="emr-terminology-binding">
          <div><span class="emr-eyebrow">Selected concept</span><strong>{{ binding.concept?.display }}</strong><span>{{ binding.concept?.code }} · {{ binding.concept?.system }}{{ binding.valueSetCanonical ? ' · ' + binding.valueSetCanonical : '' }}</span></div>
          <div class="emr-terminology-binding__controls">
            <label>Binding strength<select class="emr-select" [value]="binding.strength ?? 'preferred'" [disabled]="readOnly" (change)="strengthChanged(binding, $event)"><option value="required">Required</option><option value="extensible">Extensible</option><option value="preferred">Preferred</option><option value="example">Example</option></select></label>
            @if (role === 'classification-mapping') { <label>Relationship<select class="emr-select" [value]="binding.mappingRelationship ?? 'related-to'" [disabled]="readOnly" (change)="relationshipChanged(binding, $event)"><option value="equivalent">Equivalent</option><option value="wider">Wider</option><option value="narrower">Narrower</option><option value="related-to">Related</option></select></label> }
            <button class="emr-button emr-button--ghost" type="button" [disabled]="readOnly" (click)="removeBinding(binding)">Remove</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block}.emr-authoring-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px}.emr-authoring-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.emr-authoring-card h3{margin:2px 0 0;color:var(--emr-text);font-size:var(--emr-text-lg)}.emr-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-authoring-grid{display:grid;grid-template-columns:minmax(110px,150px) minmax(0,1fr);gap:10px 12px;align-items:center}.emr-search-row{display:flex;gap:8px}.emr-search-row .emr-control{min-width:0;flex:1}.emr-authoring-status{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}.emr-authoring-message{margin:14px 0 0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted)}.emr-authoring-message--error{background:var(--emr-danger-soft);color:var(--emr-danger);display:flex;align-items:center;justify-content:space-between;gap:8px}.emr-terminology-results{display:grid;gap:6px;margin-top:14px;max-height:270px;overflow:auto}.emr-terminology-result{width:100%;min-height:54px;padding:9px 11px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);text-align:left;cursor:pointer;display:flex;justify-content:space-between;gap:14px}.emr-terminology-result:hover,.emr-terminology-result:focus-visible{border-color:var(--emr-primary);background:var(--emr-surface-raised)}.emr-terminology-result:disabled{cursor:not-allowed;opacity:.6}.emr-terminology-result__main{display:grid;gap:2px}.emr-terminology-result__main span,.emr-terminology-result__meta{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}.emr-terminology-result__meta{text-align:right}.emr-authoring-pagination{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}.emr-authoring-pagination span{margin-right:auto}.emr-terminology-binding{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;padding:12px;border-radius:8px;background:var(--emr-surface-raised);border:1px solid var(--emr-border)}.emr-terminology-binding>div:first-child{display:grid;gap:3px}.emr-terminology-binding>div:first-child>span:last-child{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}.emr-terminology-binding__controls{display:flex;align-items:end;gap:10px}.emr-terminology-binding__controls label{display:grid;gap:4px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}.emr-terminology-binding__controls .emr-select{min-height:44px}@media(max-width:640px){.emr-authoring-grid{grid-template-columns:1fr;gap:5px}.emr-search-row{display:grid;grid-template-columns:1fr auto}.emr-terminology-result{display:grid;gap:4px}.emr-terminology-result__meta{text-align:left}.emr-terminology-binding{align-items:stretch;display:grid}.emr-terminology-binding__controls{justify-content:space-between}}
  `],
})
export class EmrTerminologySearchComponent {
  @Input({ required: true }) role!: TerminologyBindingRole;
  @Input() sources: readonly TerminologySource[] = [];
  @Input() model?: TerminologySearchState;
  @Input() bindings: readonly TerminologyBinding[] = [];
  @Input() readOnly = false;
  @Input() headingId = 'emr-terminology-heading';
  @Output() readonly intent = new EventEmitter<FieldGeneratorIntent>();

  sourceControlId(): string { return `${this.headingId}-source`; }
  queryControlId(): string { return `${this.headingId}-query`; }
  roleLabel(): string { return roleLabels[this.role] ?? this.role; }
  placeholder(): string { return this.role === 'unit' ? 'Search UCUM units' : `Search ${this.roleLabel().toLowerCase()}`; }
  sourceChanged(event: Event): void { const sourceId = (event.target as HTMLSelectElement).value; if (sourceId) this.intent.emit({ type: 'terminologySearchOpened', role: this.role, sourceId }); }
  queryChanged(event: Event): void { this.intent.emit({ type: 'terminologyQueryChanged', role: this.role, query: (event.target as HTMLInputElement).value }); }
  searchRequested(): void { this.intent.emit({ type: 'terminologySearchRequested', role: this.role }); }
  retry(): void { this.intent.emit({ type: 'terminologyRetryRequested', role: this.role }); }
  pageChanged(page: number): void { this.intent.emit({ type: 'terminologyPageChanged', role: this.role, page }); }
  selectConcept(concept: TerminologyConcept): void { this.intent.emit({ type: 'terminologyConceptSelected', role: this.role, concept, strength: 'preferred', mappingRelationship: this.role === 'classification-mapping' ? 'related-to' : undefined }); }
  strengthChanged(binding: TerminologyBinding, event: Event): void { const strength = (event.target as HTMLSelectElement).value as TerminologyBindingStrength; if (binding.concept) this.intent.emit({ type: 'terminologyConceptSelected', role: this.role, concept: binding.concept, strength, mappingRelationship: binding.mappingRelationship }); }
  relationshipChanged(binding: TerminologyBinding, event: Event): void { const mappingRelationship = (event.target as HTMLSelectElement).value as TerminologyMappingRelationship; if (binding.concept) this.intent.emit({ type: 'terminologyConceptSelected', role: this.role, concept: binding.concept, strength: binding.strength, mappingRelationship }); }
  removeBinding(binding: TerminologyBinding): void { this.intent.emit({ type: 'terminologyBindingRemoved', bindingId: binding.id }); }
}
