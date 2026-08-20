import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { EhrTemplateIntent, EhrTemplateViewModel, TemplateArtifactFormat } from '@drguptavivek/emr-controller';
import { EmrClinicalFormComponent } from '../clinical/emr-clinical-form.component';

const formats: readonly TemplateArtifactFormat[] = ['internal-json', 'fhir-r4-questionnaire', 'fhir-r4-bundle', 'fhir-r4b-questionnaire', 'fhir-r5-questionnaire'];

@Component({
  selector: 'emr-template-preview',
  standalone: true,
  imports: [EmrClinicalFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-template-preview" [attr.aria-labelledby]="headingId">
      <header class="emr-template-preview__header"><div><p class="emr-template-eyebrow">Reusable form</p><h2 [id]="headingId">{{ model.template.title || 'Untitled template' }}</h2><p>{{ model.template.description || 'A live, value-empty preview of the current template.' }}</p></div><span class="emr-template-status">{{ model.template.status }}</span></header>
      <div class="emr-template-preview__surface"><emr-clinical-form [model]="model.preview" [idPrefix]="headingId" /></div>
      <section class="emr-template-card emr-template-artifacts" [attr.aria-labelledby]="artifactHeadingId()">
        <div class="emr-template-card__heading"><div><p class="emr-template-eyebrow">Interoperability</p><h3 [id]="artifactHeadingId()">Import or export template artifacts</h3><p>Serialization and FHIR mapping are delegated to the configured artifact controller.</p></div>@if (model.loading) { <span class="emr-template-status" role="status">Working…</span> }</div>
        <div class="emr-template-artifacts__controls"><label class="emr-template-label" [for]="formatId()">Format</label><select class="emr-select" [id]="formatId()" [value]="format" [disabled]="readOnly || model.loading" (change)="formatChanged($event)">@for (option of formats; track option) { <option [value]="option">{{ formatLabel(option) }}</option> }</select><button class="emr-button emr-button--outline" type="button" [disabled]="readOnly || model.loading" (click)="exportRequested()">Export</button></div>
        <label class="emr-template-label" [for]="serializedId()">Serialized preview or import payload</label><textarea class="emr-control emr-template-artifacts__text" [id]="serializedId()" rows="7" [value]="serialized" [readonly]="readOnly || model.loading" placeholder="Paste a JSON or FHIR artifact to import" (input)="serialized = text($event)"></textarea>
        <div class="emr-template-artifacts__actions"><button class="emr-button emr-button--secondary" type="button" [disabled]="readOnly || model.loading || !serialized.trim()" (click)="importRequested()">Import</button>@if (canAcceptImport()) { <button class="emr-button emr-button--outline" type="button" [disabled]="readOnly || model.loading" (click)="emit({ type: 'importAccepted' })">Accept import</button> }</div>
        @if (model.artifact) { <div class="emr-template-artifacts__result" role="status"><strong>{{ formatLabel(model.artifact.format) }}{{ model.artifact.fhirVersion ? ' · FHIR ' + model.artifact.fhirVersion : '' }}</strong><span>{{ model.artifact.serialized.length }} characters · {{ model.artifact.issues.length }} issue(s)</span><pre>{{ model.artifact.serialized }}</pre></div> }
        @if (model.importIssues?.length) { <div class="emr-template-artifacts__issues" role="alert"><strong>Review import issues</strong><ul>@for (issue of model.importIssues; track issue.code + issue.path) { <li><b>{{ issue.severity }}</b> · {{ issue.message }}{{ issue.path ? ' · ' + issue.path : '' }}</li> }</ul></div> }
        @if (model.error) { <p class="emr-template-note emr-template-note--error" role="alert">{{ model.error }}</p> }
      </section>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}.emr-template-preview{display:grid;gap:16px}.emr-template-preview__header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.emr-template-preview h2{margin:2px 0 6px;font-size:1.35rem}.emr-template-preview__header p:not(.emr-template-eyebrow){margin:0;color:var(--emr-text-muted);line-height:1.45}.emr-template-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-template-status{padding:5px 9px;border:1px solid var(--emr-border);border-radius:999px;color:var(--emr-text-muted);font-size:.78rem;white-space:nowrap}.emr-template-preview__surface{padding:18px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface-raised)}.emr-template-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px}.emr-template-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.emr-template-card h3{margin:2px 0 6px;font-size:1.02rem}.emr-template-card__heading p:not(.emr-template-eyebrow){margin:0;color:var(--emr-text-muted);font-size:.875rem;line-height:1.4}.emr-template-artifacts{display:grid;gap:12px}.emr-template-label{display:block;color:var(--emr-text-muted);font-size:.8rem;font-weight:600}.emr-template-artifacts__controls{display:flex;align-items:end;gap:10px}.emr-template-artifacts__controls .emr-template-label{margin-right:-4px}.emr-template-artifacts__controls .emr-select{min-width:220px}.emr-template-artifacts__text{width:100%;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem}.emr-template-artifacts__actions{display:flex;gap:8px;flex-wrap:wrap}.emr-template-artifacts__result,.emr-template-artifacts__issues{display:grid;gap:6px;padding:12px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised)}.emr-template-artifacts__result span{font-size:.8rem;color:var(--emr-text-muted)}.emr-template-artifacts__result pre{max-height:220px;margin:4px 0 0;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:.75rem}.emr-template-artifacts__issues{border-color:var(--emr-warning);background:var(--emr-warning-soft);color:var(--emr-warning)}.emr-template-artifacts__issues ul{margin:0;padding-left:20px;font-size:.8rem;line-height:1.5}.emr-template-note{margin:0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:.84rem}.emr-template-note--error{background:var(--emr-danger-soft);color:var(--emr-danger)}@media(max-width:640px){.emr-template-preview__header,.emr-template-card__heading{display:grid;gap:9px}.emr-template-preview__surface,.emr-template-card{padding:14px}.emr-template-artifacts__controls{display:grid;align-items:stretch}.emr-template-artifacts__controls .emr-template-label{margin:0}.emr-template-artifacts__controls .emr-select{min-width:0}}
  `],
})
export class EmrTemplatePreviewComponent {
  @Input({ required: true }) model!: EhrTemplateViewModel;
  private explicitReadOnly = false;
  @Input() set readOnly(value: boolean) { this.explicitReadOnly = value; }
  get readOnly(): boolean { return this.explicitReadOnly || !!this.model?.readOnly; }
  @Input() headingId = 'emr-template-preview-heading';
  @Output() readonly intent = new EventEmitter<EhrTemplateIntent>();
  readonly formats = formats;
  format: TemplateArtifactFormat = 'fhir-r4-questionnaire';
  serialized = '';
  artifactHeadingId(): string { return `${this.headingId}-artifact`; }
  formatId(): string { return `${this.headingId}-format`; }
  serializedId(): string { return `${this.headingId}-serialized`; }
  text(event: Event): string { return (event.target as HTMLTextAreaElement).value; }
  formatChanged(event: Event): void { this.format = (event.target as HTMLSelectElement).value as TemplateArtifactFormat; }
  exportRequested(): void { this.emit({ type: 'artifactExportRequested', format: this.format }); }
  importRequested(): void { if (this.serialized.trim()) this.emit({ type: 'artifactImportRequested', format: this.format, serialized: this.serialized }); }
  emit(intent: EhrTemplateIntent): void { if (!this.readOnly) this.intent.emit(intent); }
  canAcceptImport(): boolean { return !!this.model.importIssues?.length && !this.model.importIssues.some(issue => issue.severity === 'error'); }
  formatLabel(format: TemplateArtifactFormat): string { return ({ 'internal-json': 'Internal JSON', 'fhir-r4-questionnaire': 'FHIR R4 Questionnaire', 'fhir-r4-bundle': 'FHIR R4 Bundle', 'fhir-r4b-questionnaire': 'FHIR R4B Questionnaire', 'fhir-r5-questionnaire': 'FHIR R5 Questionnaire' } as Record<TemplateArtifactFormat, string>)[format]; }
}
