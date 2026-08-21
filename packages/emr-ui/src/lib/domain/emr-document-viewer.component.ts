import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, inject, Input, OnChanges, Output, EventEmitter, PLATFORM_ID, SimpleChanges } from '@angular/core';
import type { DocumentViewerIntent, DocumentViewerViewModel } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-document-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (model.open) {
      <section class="emr-document-viewer" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId()" tabindex="-1" (keydown)="keyDown($event)">
        <header class="emr-document-viewer__header"><div class="emr-document-viewer__heading"><p class="emr-document-viewer__eyebrow">Document viewer</p><h2 [id]="titleId()">{{ model.currentDocument?.title || 'Document preview' }}</h2>@if (model.currentDocument) { <p>{{ model.currentDocument.fileName }} · {{ model.currentDocument.kind }}</p> }</div><div class="emr-document-viewer__header-actions"><span class="emr-document-viewer__position" role="status">Document {{ model.documentIndex + 1 }} of {{ model.documentCount }}</span><button class="emr-button emr-button--ghost" type="button" [attr.aria-label]="'Close document viewer'" (click)="close()">Close</button></div></header>
        @if (model.currentDocument) { <dl class="emr-document-viewer__metadata"><div><dt>Category</dt><dd>{{ model.currentDocument.categoryLabel }}</dd></div><div><dt>Folder</dt><dd>{{ model.currentDocument.folderLabel }}</dd></div><div><dt>Date</dt><dd>{{ model.currentDocument.createdAtLabel }}</dd></div><div><dt>Position</dt><dd>{{ model.documentIndex + 1 }} / {{ model.documentCount }}</dd></div></dl> }
        <div class="emr-document-viewer__toolbar" aria-label="Document navigation and view controls"><button class="emr-button emr-button--outline" type="button" [disabled]="!model.canPreviousDocument" (click)="emit({ type: 'previousDocumentRequested' })">Previous document</button><button class="emr-button emr-button--outline" type="button" [disabled]="!model.canNextDocument" (click)="emit({ type: 'nextDocumentRequested' })">Next document</button>@if (model.currentDocument?.kind === 'pdf') { <label class="emr-document-viewer__page-select">Page <select [value]="model.pageIndex" [disabled]="model.loading" (change)="pageChanged($event)">@for (page of pages(); track page) { <option [value]="page">{{ page + 1 }}</option> }</select></label><button class="emr-button emr-button--outline" type="button" [disabled]="!model.canPreviousPage" (click)="emit({ type: 'previousPageRequested' })">Previous page</button><button class="emr-button emr-button--outline" type="button" [disabled]="!model.canNextPage" (click)="emit({ type: 'nextPageRequested' })">Next page</button> }<span class="emr-document-viewer__toolbar-spacer"></span><button class="emr-button emr-button--outline" type="button" aria-label="Zoom out" (click)="zoomOut()">−</button><span class="emr-document-viewer__zoom" aria-live="polite">{{ zoomPercent() }}%</span><button class="emr-button emr-button--outline" type="button" aria-label="Zoom in" (click)="zoomIn()">+</button><button class="emr-button emr-button--ghost" type="button" (click)="resetView()">Reset</button><button class="emr-button emr-button--ghost" type="button" (click)="rotate(-90)" aria-label="Rotate counter-clockwise">↶</button><button class="emr-button emr-button--ghost" type="button" (click)="rotate(90)" aria-label="Rotate clockwise">↷</button></div>
        <main class="emr-document-viewer__surface" aria-live="polite"><div class="emr-document-viewer__viewport" (pointerdown)="pointerDown($event)" (pointermove)="pointerMove($event)" (pointerup)="pointerUp($event)" (pointercancel)="pointerUp($event)">@if (model.loading) { <p class="emr-document-viewer__state" role="status">Loading document page…</p> } @else if (model.error) { <div class="emr-document-viewer__state emr-document-viewer__state--error" role="alert"><strong>Unable to load this page</strong><p>{{ model.error }}</p><button class="emr-button emr-button--outline" type="button" (click)="emit({ type: 'retryRequested' })">Retry</button></div> } @else if (model.page) { <img class="emr-document-viewer__image" [src]="model.page.rasterUrl" [alt]="model.page.altText" [attr.data-asset-id]="model.page.assetId" [style.transform]="transform()" draggable="false" referrerpolicy="no-referrer" (error)="rasterFailed($event)" /> } @else { <p class="emr-document-viewer__state" role="status">No page is available.</p> }</div></main>
        <p class="emr-document-viewer__hint">Use arrow keys for documents, Page Up/Down for PDF pages, +/−/0 for zoom and R/Shift+R to rotate. Drag the page while zoomed.</p>
      </section>
    }
  `,
  styles: [`
    :host{display:block}.emr-document-viewer{position:fixed;inset:0;z-index:1000;display:grid;grid-template-rows:auto auto auto minmax(0,1fr) auto;gap:12px;padding:18px 22px;background:var(--emr-background,#f6f8f9);color:var(--emr-text,#263847);overflow:auto}.emr-document-viewer__header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.emr-document-viewer__heading h2{margin:2px 0 4px;font-size:var(--emr-text-xl)}.emr-document-viewer__heading p:not(.emr-document-viewer__eyebrow){margin:0;color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-sm)}.emr-document-viewer__eyebrow{margin:0;color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emr-document-viewer__header-actions{display:flex;align-items:center;gap:10px}.emr-document-viewer__position,.emr-document-viewer__zoom{color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-sm);white-space:nowrap}.emr-document-viewer__metadata{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0;padding:10px 12px;border:1px solid var(--emr-border,#c7d3da);border-radius:9px;background:var(--emr-surface,#fffefa)}.emr-document-viewer__metadata dt{color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-2xs);font-weight:650}.emr-document-viewer__metadata dd{margin:3px 0 0;font-size:var(--emr-text-sm);font-weight:600;overflow-wrap:anywhere}.emr-document-viewer__toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.emr-document-viewer__toolbar-spacer{flex:1}.emr-document-viewer__toolbar .emr-button{min-height:44px}.emr-document-viewer__page-select{display:flex;align-items:center;gap:6px;color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-sm)}.emr-document-viewer__page-select select{min-height:44px;padding:7px 9px;border:1px solid var(--emr-border,#c7d3da);border-radius:8px;background:var(--emr-surface,#fffefa);color:var(--emr-text,#263847);font:inherit}.emr-document-viewer__surface{min-height:260px;display:flex;align-items:stretch;justify-content:center;border:1px solid var(--emr-border,#c7d3da);border-radius:10px;background:var(--emr-surface-raised,#eff3f5);overflow:hidden}.emr-document-viewer__viewport{width:100%;height:100%;min-height:260px;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;cursor:grab}.emr-document-viewer__viewport:active{cursor:grabbing}.emr-document-viewer__image{max-width:100%;max-height:100%;object-fit:contain;user-select:none;transform-origin:center;will-change:transform}.emr-document-viewer__state{display:grid;gap:10px;place-items:center;align-content:center;min-height:180px;margin:0;padding:24px;color:var(--emr-text-muted,#5c6c78);text-align:center}.emr-document-viewer__state p{margin:0}.emr-document-viewer__state--error{color:var(--emr-danger,#a44949)}.emr-document-viewer__hint{margin:0;color:var(--emr-text-muted,#5c6c78);font-size:var(--emr-text-xs);text-align:center}.emr-document-viewer :focus-visible{outline:3px solid var(--emr-focus,#5f7f92);outline-offset:2px}@media(max-width:720px){.emr-document-viewer{padding:12px;gap:10px}.emr-document-viewer__header{display:grid;gap:8px}.emr-document-viewer__header-actions{justify-content:space-between}.emr-document-viewer__metadata{grid-template-columns:repeat(2,minmax(0,1fr))}.emr-document-viewer__toolbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.emr-document-viewer__toolbar-spacer{display:none}.emr-document-viewer__toolbar .emr-button,.emr-document-viewer__page-select{width:100%}.emr-document-viewer__page-select{justify-content:space-between}.emr-document-viewer__page-select select{flex:1}.emr-document-viewer__zoom{display:flex;align-items:center;justify-content:center}.emr-document-viewer__surface,.emr-document-viewer__viewport{min-height:220px}}
  `],
})
export class EmrDocumentViewerComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) model!: DocumentViewerViewModel;
  @Input() headingId = 'emr-document-viewer-heading';
  @Input() returnFocusTo?: HTMLElement;
  @Output() readonly intent = new EventEmitter<DocumentViewerIntent>();
  private zoom = 1;
  private rotation = 0;
  private panX = 0;
  private panY = 0;
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private previousFocus: HTMLElement | null = null;
  private lastAssetId?: string;
  private focusPending = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dom = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      const wasOpen = changes['model'].previousValue?.open ?? false;
      if (this.model?.page?.assetId !== this.lastAssetId) { this.lastAssetId = this.model?.page?.assetId; this.resetView(); }
      if (this.model?.open && !wasOpen) { this.previousFocus = this.returnFocusTo ?? (this.isBrowser() ? (this.dom.activeElement as HTMLElement | null) : null); this.focusPending = true; }
      if (!this.model?.open && wasOpen) this.restoreFocus();
    }
  }
  ngAfterViewChecked(): void { if (this.focusPending) { this.focusPending = false; this.focusViewer(); } }
  titleId(): string { return `${this.headingId}-${this.model.instanceId}`; }
  pages(): number[] { return Array.from({ length: this.model.currentDocument?.pageCount ?? 0 }, (_, index) => index); }
  zoomPercent(): number { return Math.round(this.zoom * 100); }
  transform(): string { return `translate(${this.panX}px, ${this.panY}px) rotate(${this.rotation}deg) scale(${this.zoom})`; }
  isBrowser(): boolean { return isPlatformBrowser(this.platformId); }
  focusViewer(): void { if (!this.isBrowser()) return; const element = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"]'); element?.focus(); }
  restoreFocus(): void { if (!this.isBrowser()) return; this.previousFocus?.focus?.(); this.previousFocus = null; }
  emit(next: DocumentViewerIntent): void { this.intent.emit(next); }
  close(): void { this.emit({ type: 'closeRequested' }); }
  pageChanged(event: Event): void { this.emit({ type: 'pageRequested', pageIndex: Number((event.target as HTMLSelectElement).value) }); }
  rasterFailed(event: Event): void {
    const assetId = (event.currentTarget as HTMLElement | null)?.dataset['assetId'];
    if (assetId) this.emit({ type: 'rasterLoadFailed', assetId });
  }
  zoomIn(): void { this.zoom = Math.min(4, this.zoom + .25); }
  zoomOut(): void { this.zoom = Math.max(.5, this.zoom - .25); if (this.zoom === 1) this.resetPan(); }
  resetPan(): void { this.panX = 0; this.panY = 0; }
  resetView(): void { this.zoom = 1; this.rotation = 0; this.resetPan(); }
  rotate(degrees: number): void { this.rotation = (this.rotation + degrees + 360) % 360; }
  pointerDown(event: PointerEvent): void { if (this.zoom <= 1) return; this.dragging = true; this.dragStartX = event.clientX - this.panX; this.dragStartY = event.clientY - this.panY; (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId); }
  pointerMove(event: PointerEvent): void { if (!this.dragging) return; this.panX = event.clientX - this.dragStartX; this.panY = event.clientY - this.dragStartY; }
  pointerUp(event: PointerEvent): void { if (!this.dragging) return; this.dragging = false; (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId); }
  keyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key === 'ArrowLeft' && this.model.canPreviousDocument) { event.preventDefault(); this.emit({ type: 'previousDocumentRequested' }); return; }
    if (event.key === 'ArrowRight' && this.model.canNextDocument) { event.preventDefault(); this.emit({ type: 'nextDocumentRequested' }); return; }
    if (event.key === 'PageUp' && this.model.canPreviousPage) { event.preventDefault(); this.emit({ type: 'previousPageRequested' }); return; }
    if (event.key === 'PageDown' && this.model.canNextPage) { event.preventDefault(); this.emit({ type: 'nextPageRequested' }); return; }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); this.zoomIn(); return; }
    if (event.key === '-' || event.key === '_') { event.preventDefault(); this.zoomOut(); return; }
    if (event.key === '0') { event.preventDefault(); this.resetView(); return; }
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); this.rotate(event.shiftKey ? -90 : 90); return; }
    if (event.key === 'Tab') this.trapFocus(event);
  }
  trapFocus(event: KeyboardEvent): void {
    const dialog = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && (this.dom.activeElement === first || this.dom.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.dom.activeElement === dialog) { event.preventDefault(); first.focus(); }
    else if (!event.shiftKey && this.dom.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}
