import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { EhrTemplateIntent, EmrGeneratedFieldDefinition } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-field-library-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-template-card" [attr.aria-labelledby]="headingId">
      <header class="emr-template-card__heading"><div><p class="emr-template-eyebrow">Field library</p><h2 [id]="headingId">Add reusable fields</h2><p>Search the controller-supplied field catalogue, then add a field to the selected section.</p></div><span class="emr-template-count" role="status">{{ fields.length }} available</span></header>
      <label class="emr-template-label" [for]="queryId()">Search fields</label>
      <input class="emr-control" [id]="queryId()" type="search" [value]="query" [disabled]="readOnly" placeholder="Search by label, type or terminology" (input)="queryChanged($event)" />
      @if (!selectedSectionId) { <p class="emr-template-note" role="status">Select a template section before adding a field.</p> }
      <div class="emr-template-library" role="list" aria-label="Available reusable fields">
        @for (field of fields; track field.id) {
          <article class="emr-template-library__item" role="listitem">
            <div><strong>{{ field.label }}</strong><span>{{ field.type }}{{ field.required ? ' · Required' : '' }}{{ field.repeats ? ' · Repeatable' : '' }}</span>@if (field.description) { <small>{{ field.description }}</small> }@if (field.terminologyBindings.length) { <small>{{ terminologySummary(field) }}</small> }</div>
            <button class="emr-button emr-button--outline emr-button--small" type="button" [disabled]="readOnly || !selectedSectionId" (click)="add(field)">Add</button>
          </article>
        } @empty { <p class="emr-template-note" role="status">No reusable fields match this search.</p> }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}.emr-template-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;color:var(--emr-text)}.emr-template-card__heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}.emr-template-card h2{margin:2px 0 6px;font-size:var(--emr-text-lg)}.emr-template-card p{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md);line-height:1.45}.emr-template-eyebrow{margin:0 0 4px!important;color:var(--emr-text-muted)!important;font-size:var(--emr-text-2xs)!important;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-template-count{color:var(--emr-text-muted);font-size:var(--emr-text-sm);white-space:nowrap}.emr-template-label{display:block;margin-bottom:6px;color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:600}.emr-template-note{margin-top:12px!important;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised)}.emr-template-library{display:grid;gap:8px;margin-top:14px;max-height:430px;overflow:auto}.emr-template-library__item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised)}.emr-template-library__item>div{display:grid;gap:3px;min-width:0}.emr-template-library__item span,.emr-template-library__item small{color:var(--emr-text-muted);font-size:var(--emr-text-xs)}.emr-template-library__item small{line-height:1.35}@media(max-width:640px){.emr-template-card{padding:14px}.emr-template-card__heading{display:grid;gap:8px}.emr-template-library__item{grid-template-columns:1fr}.emr-template-library__item button{justify-self:start}}
  `],
})
export class EmrFieldLibraryPickerComponent {
  @Input() fields: readonly EmrGeneratedFieldDefinition[] = [];
  @Input() query = '';
  @Input() selectedSectionId?: string;
  @Input() readOnly = false;
  @Input() headingId = 'emr-field-library-heading';
  @Output() readonly intent = new EventEmitter<EhrTemplateIntent>();
  queryId(): string { return `${this.headingId}-search`; }
  queryChanged(event: Event): void { this.intent.emit({ type: 'fieldLibraryQueryChanged', query: (event.target as HTMLInputElement).value }); }
  add(field: EmrGeneratedFieldDefinition): void {
    if (this.readOnly || !this.selectedSectionId) return;
    this.intent.emit({ type: 'fieldAdded', sectionId: this.selectedSectionId, field, placementId: '' });
  }
  terminologySummary(field: EmrGeneratedFieldDefinition): string { return field.terminologyBindings.map(binding => binding.concept?.code ?? binding.role).join(' · '); }
}
