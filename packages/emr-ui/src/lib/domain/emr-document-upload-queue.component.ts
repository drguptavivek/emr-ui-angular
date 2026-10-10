import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowUpTray } from '@ng-icons/heroicons/outline';
import type { DocumentCandidate, DocumentUploadIntent, DocumentUploadQueueViewModel, SelectedDocumentSource } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-document-upload-queue', standalone: true, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [...provideIcons({ heroArrowUpTray })],
  template: `
    <section class="emr-document-queue" [attr.aria-labelledby]="headingId">
      <header class="emr-document-queue__header"><ng-icon class="emr-card-header-icon" name="heroArrowUpTray" aria-hidden="true" /><div><h2 [id]="headingId">{{ model.label }}</h2>@if (model.acceptDescription) { <p>{{ model.acceptDescription }}</p> }</div></header>
      <label class="emr-document-queue__dropzone" [class.emr-document-queue__dropzone--disabled]="model.disabled">
        <span class="emr-document-queue__dropzone-title">Choose document{{ model.multiple ? 's' : '' }}</span>
        <span class="emr-document-queue__dropzone-hint">Standard file selection · no files are uploaded by this component</span>
        <input type="file" [multiple]="model.multiple" [disabled]="model.disabled" (change)="filesChanged($event)" />
      </label>
      @if (model.error) { <p class="emr-document-queue__error" role="alert">{{ model.error }}</p> }
      <div class="emr-document-queue__announcement" aria-live="polite">{{ announcement() }}</div>
      @if (model.candidates.length) { <ul class="emr-document-queue__list" aria-label="Selected documents">@for (candidate of model.candidates; track candidate.id) { <li class="emr-document-queue__item"><div><strong>{{ candidate.fileName }}</strong><span>{{ candidate.mediaTypeLabel }} · {{ candidate.sizeLabel }}</span></div><div class="emr-document-queue__item-status" [attr.data-status]="candidate.status">{{ candidate.statusLabel }}@if (candidate.progress !== undefined) { · {{ candidate.progress }}% }</div><div class="emr-document-queue__actions">@if (candidate.status === 'error') { <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="emit({ type: 'candidateRetryRequested', candidateId: candidate.id })">Retry</button> } @if (candidate.status === 'processing') { <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="emit({ type: 'candidateCancelRequested', candidateId: candidate.id })">Cancel</button> } @if (candidate.status !== 'processing') { <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="emit({ type: 'candidateRemoveRequested', candidateId: candidate.id })">Remove</button> }</div>@if (candidate.error) { <p class="emr-document-queue__error">{{ candidate.error }}</p> }</li> }</ul> } @else { <p class="emr-document-queue__empty">No documents selected.</p> }
    </section>
  `,
  styles: [`
    :host { display:block; color:var(--emr-text); } .emr-document-queue { background:var(--emr-surface); border:1px solid var(--emr-border); border-radius:12px; padding:20px; } h2,p { margin:0; } p { color:var(--emr-text-muted); margin-top:4px; } .emr-document-queue__header { display:flex; gap:12px; align-items:flex-start; } .emr-document-queue__dropzone { display:grid; gap:4px; margin-top:18px; padding:18px; border:1px dashed var(--emr-primary-border); border-radius:10px; background:var(--emr-surface-accent); cursor:pointer; } .emr-document-queue__dropzone-title { color:var(--emr-primary); font-weight:700; } .emr-document-queue__dropzone-hint { color:var(--emr-text-muted); font-size:var(--emr-text-md); } .emr-document-queue__dropzone input { margin-top:8px; min-height:44px; } .emr-document-queue__dropzone--disabled { opacity:.6; cursor:not-allowed; } .emr-document-queue__list { list-style:none; padding:0; margin:16px 0 0; } .emr-document-queue__item { display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; padding:12px 0; border-top:1px solid var(--emr-border); } .emr-document-queue__item span { display:block; color:var(--emr-text-muted); font-size:var(--emr-text-md); } .emr-document-queue__item-status[data-status=error] { color:var(--emr-danger); } .emr-document-queue__actions { display:flex; gap:6px; } .emr-document-queue__error { color:var(--emr-danger); font-size:var(--emr-text-md); } .emr-document-queue__announcement { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); } .emr-document-queue__empty { margin-top:16px; } @media(max-width:640px){ .emr-document-queue__item { grid-template-columns:1fr; } .emr-document-queue__actions { flex-wrap:wrap; } }
  `]
})
export class EmrDocumentUploadQueueComponent {
  @Input({ required: true }) model!: DocumentUploadQueueViewModel;
  @Input() headingId = 'emr-document-upload-heading';
  @Input() sourceTokenFactory?: (file: File) => string;
  @Output() readonly intent = new EventEmitter<DocumentUploadIntent>();
  @Output() readonly nativeFilesSelected = new EventEmitter<readonly File[]>();
  filesChanged(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.nativeFilesSelected.emit(files);
    if (!this.sourceTokenFactory) return;
    const selected: SelectedDocumentSource[] = files.map(file => ({
      fileName: file.name,
      size: file.size,
      mediaType: file.type,
      sourceToken: this.sourceTokenFactory!(file)
    }));
    this.emit({ type: 'filesSelected', files: selected });
  }
  emit(next: DocumentUploadIntent): void { if (!this.model.disabled) this.intent.emit(next); }
  announcement(): string { const latest = this.model.candidates[this.model.candidates.length - 1]; return latest ? `${latest.fileName}: ${latest.statusLabel}` : ''; }
}
