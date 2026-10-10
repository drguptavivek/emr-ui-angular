import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroChevronDown, heroChevronUp, heroEye, heroEyeSlash, heroLockClosed, heroLockOpen, heroTrash
} from '@ng-icons/heroicons/outline';
import type { AnnotationLayerRecord, AnnotationListIntent, AnnotationListItem, AnnotationListViewModel } from '@drguptavivek/emr-controller';

/** Tool -> the same `shape-*` glyph id the toolbar draws, so a row and its tool button read as one. */
const TOOL_GLYPH: Record<AnnotationLayerRecord['tool'], string> = {
  text: 'shape-text', line: 'shape-line', arrow: 'shape-arrow', callout: 'shape-callout', curve: 'shape-curve', circle: 'shape-ellipse', polygon: 'shape-polygon', freeform: 'shape-freehand'
};
/** Accessible name and tooltip for the icon-only tool marker; never shown as visible words. */
const TOOL_NAME: Record<AnnotationLayerRecord['tool'], string> = {
  text: 'Text', line: 'Line', arrow: 'Arrow', callout: 'Callout', curve: 'Curve', circle: 'Circle', polygon: 'Polygon', freeform: 'Freehand'
};
const NAV = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

@Component({
  selector: 'emr-annotation-list',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroChevronDown, heroChevronUp, heroEye, heroEyeSlash, heroLockClosed, heroLockOpen, heroTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (model.items.length) {
      <ol class="al" [attr.aria-label]="headingId ? null : 'Annotations'" [attr.aria-labelledby]="headingId ?? null" (keydown)="onKey($event)" (focusin)="onFocus($event)">
        @for (it of model.items; track it.layer.id; let first = $first; let last = $last) {
          <li class="al__row" [class.al__row--on]="it.layer.id === model.selectedLayerId" [class.al__row--off]="!it.layer.visible"
              [attr.aria-current]="it.layer.id === model.selectedLayerId ? 'true' : null" [attr.data-id]="it.layer.id">
            <button #sel type="button" class="al__main" [attr.data-id]="it.layer.id" [attr.tabindex]="tab(it.layer.id)" [attr.title]="full(it)"
                    (click)="intent.emit({ type: 'layerSelected', layerId: it.layer.id })">
              <span class="al__no" aria-hidden="true">{{ it.number }}</span>
              <span class="al__sw" aria-hidden="true" [style.background]="it.layer.color"></span>
              <span class="al__txt">
                <span class="al__name">{{ primary(it) }}@if (secondary(it); as extra) { <span class="al__cls"> · {{ extra }}</span> }</span>
                @if (it.description) { <span class="al__desc">{{ it.description }}</span> }
              </span>
              <span class="al__tool" role="img" [attr.aria-label]="toolName(it.layer)" [attr.title]="toolName(it.layer)">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">@switch (glyph(it.layer)) {
                  @case ('shape-line') { <path d="M5 19 19 5" /> }
                  @case ('shape-arrow') { <path d="M5 19 19 5M11 5h8v8" /> }
                  @case ('shape-callout') { <path d="M19 5 9 15M9 15h5M9 15v-5M3 21h7" /> }
                  @case ('shape-curve') { <path d="M6 19C6 9 18 15 18 5" /> }
                  @case ('shape-ellipse') { <ellipse cx="12" cy="12" rx="8" ry="6" /> }
                  @case ('shape-polygon') { <path d="m12 4 8 6-3 10H7L4 10z" /> }
                  @case ('shape-freehand') { <path d="M4 14c2-6 4-6 5-2s3 4 5-1 4-3 6 1" /> }
                  @case ('shape-text') { <path d="M6 6h12M12 6v13M9.5 19h5" /> }
                }</svg>
              </span>
              @if (it.locked) { <ng-icon class="al__tool" name="heroLockClosed" role="img" aria-label="Locked" title="Locked" /> }
              @if (model.readOnly && !it.layer.visible) { <ng-icon class="al__tool" name="heroEyeSlash" role="img" aria-label="Hidden" title="Hidden" /> }
              <span class="emr-sr-only">Drawing {{ it.number }}@if (it.locked) {, locked}@if (!it.layer.visible) {, hidden}</span>
            </button>
            @if (!model.readOnly) {
              <span class="al__acts">
                <button type="button" class="al__b al__b--eye" [attr.tabindex]="tab(it.layer.id)" [attr.aria-pressed]="it.layer.visible"
                        [attr.aria-label]="'Show drawing ' + it.number + ', ' + primary(it)" [attr.title]="it.layer.visible ? 'Hide drawing' : 'Show drawing'"
                        (click)="intent.emit({ type: 'layerVisibilityToggleRequested', layerId: it.layer.id })">
                  <span class="al__f"><ng-icon [name]="it.layer.visible ? 'heroEye' : 'heroEyeSlash'" aria-hidden="true" /></span>
                </button>
                @if (model.canLock) {
                  <button type="button" class="al__b" [attr.tabindex]="tab(it.layer.id)" [attr.aria-pressed]="!!it.locked"
                          [attr.aria-label]="'Lock drawing ' + it.number + ', ' + primary(it)" [attr.title]="it.locked ? 'Unlock drawing' : 'Lock drawing'"
                          (click)="intent.emit({ type: 'layerLockToggleRequested', layerId: it.layer.id })">
                    <span class="al__f"><ng-icon [name]="it.locked ? 'heroLockClosed' : 'heroLockOpen'" aria-hidden="true" /></span>
                  </button>
                }
                @if (it.layer.id === model.selectedLayerId) {
                  <button type="button" class="al__b" [attr.tabindex]="tab(it.layer.id)" [disabled]="first"
                          [attr.aria-label]="'Move drawing ' + it.number + ' up, ' + primary(it)" title="Move up"
                          (click)="intent.emit({ type: 'layerMoveRequested', layerId: it.layer.id, direction: 'up' })">
                    <span class="al__f"><ng-icon name="heroChevronUp" aria-hidden="true" /></span>
                  </button>
                  <button type="button" class="al__b" [attr.tabindex]="tab(it.layer.id)" [disabled]="last"
                          [attr.aria-label]="'Move drawing ' + it.number + ' down, ' + primary(it)" title="Move down"
                          (click)="intent.emit({ type: 'layerMoveRequested', layerId: it.layer.id, direction: 'down' })">
                    <span class="al__f"><ng-icon name="heroChevronDown" aria-hidden="true" /></span>
                  </button>
                }
                <button type="button" class="al__b al__b--danger" [attr.tabindex]="tab(it.layer.id)"
                        [attr.aria-label]="'Delete drawing ' + it.number + ', ' + primary(it)" title="Delete drawing"
                        (click)="intent.emit({ type: 'layerRemoveRequested', layerId: it.layer.id })">
                  <span class="al__f"><ng-icon name="heroTrash" aria-hidden="true" /></span>
                </button>
              </span>
            }
          </li>
        }
      </ol>
    } @else {
      <p class="emr-empty al__empty">{{ model.emptyMessage }}</p>
    }
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .al{list-style:none;margin:0;padding:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);overflow:hidden}
    .al__row{display:flex;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--emr-border);break-inside:avoid}
    .al__row:last-child{border-bottom:0}
    .al__row--on{background:var(--emr-primary-soft);box-shadow:inset 4px 0 0 var(--emr-primary)}
    .al__main{flex:1 1 150px;min-width:0;min-height:var(--emr-control-height);display:flex;align-items:center;gap:8px;padding:2px 8px 2px 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;--ng-icon__size:16px}
    .al__no{flex:none;min-width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--emr-border);border-radius:6px;background:var(--emr-surface);font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold)}
    .al__sw{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid var(--emr-text-muted)}
    .al__txt{flex:1;min-width:0;display:grid;grid-template-columns:minmax(0,1fr)}
    .al__name{font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium);line-height:var(--emr-leading-tight);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .al__cls{font-weight:var(--emr-weight-regular)}
    .al__desc{font-size:var(--emr-text-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .al__tool{flex:none;display:inline-flex;color:var(--emr-text-muted)}
    .al__tool svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .al__row--on .al__name{font-weight:var(--emr-weight-bold)}
    .al__row--off .al__name{font-style:italic}
    .al__row--off .al__sw{border-style:dashed}
    .al__acts{display:flex;margin-left:auto;padding-right:4px}
    .al__b{width:44px;height:var(--emr-control-height);padding:0;border:0;background:transparent;color:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .al__f{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid transparent;border-radius:8px;--ng-icon__size:18px}
    .al__b:hover:not(:disabled) .al__f{background:var(--emr-surface-soft);border-color:var(--emr-border)}
    .al__b--danger{color:var(--emr-danger)}
    .al__b--danger:hover:not(:disabled) .al__f{background:var(--emr-danger-soft);border-color:var(--emr-danger)}
    .al__b[aria-pressed="true"]:not(.al__b--eye) .al__f{background:var(--emr-primary-soft);border-color:var(--emr-primary-border)}
    .al__b:disabled{cursor:not-allowed;opacity:.52}
    .al__main:focus-visible,.al__b:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:-3px;border-radius:8px}
    .al__empty{margin:0;min-height:0;padding:16px;border:1px dashed var(--emr-border);border-radius:8px;font-size:var(--emr-text-md)}
    @media print{.al__acts{display:none}.al__name{white-space:normal;overflow:visible}.al__desc{white-space:normal;overflow:visible}.al__row--on{box-shadow:none}}
  `],
})
export class EmrAnnotationListComponent implements OnChanges {
  @Input({ required: true }) model!: AnnotationListViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<AnnotationListIntent>();

  @ViewChildren('sel') private selects!: QueryList<ElementRef<HTMLButtonElement>>;
  /** Roving stop: only this row's buttons are in the Tab order, so 50 rows are not 300 tab stops. */
  private active?: string;

  ngOnChanges(): void {
    const ids = this.model.items.map((i: AnnotationListItem) => i.layer.id);
    if (this.model.selectedLayerId && ids.includes(this.model.selectedLayerId)) this.active = this.model.selectedLayerId;
    else if (!this.active || !ids.includes(this.active)) this.active = ids[0];
  }

  glyph(l: AnnotationLayerRecord): string { return TOOL_GLYPH[l.tool]; }
  toolName(l: AnnotationLayerRecord): string { return TOOL_NAME[l.tool]; }
  /** The annotation itself: its class when it has one, otherwise the mark's own label or typed text. */
  primary(it: AnnotationListItem): string { return it.classLabel || it.layer.label; }
  /** The mark's own label or text, shown after the class only when it says something the class does not. */
  secondary(it: AnnotationListItem): string { return it.classLabel && it.layer.label && it.layer.label !== it.classLabel ? it.layer.label : ''; }
  full(it: AnnotationListItem): string { return [this.primary(it), this.secondary(it), it.description].filter(Boolean).join(' · '); }
  tab(id: string): number { return id === this.active ? 0 : -1; }

  protected onFocus(e: FocusEvent): void { this.active = (e.target as HTMLElement).closest('li')?.dataset['id'] ?? this.active; }

  protected onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (!NAV.includes(e.key) || !target.classList.contains('al__main')) return;
    const els = this.selects.toArray().map((r) => r.nativeElement);
    const i = els.indexOf(target as HTMLButtonElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : Math.min(els.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
    e.preventDefault();
    els[next].focus();
  }
}
