import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLongRight, heroArrowsPointingIn, heroArrowsPointingOut, heroArrowTrendingUp, heroArrowUturnLeft, heroArrowUturnRight,
  heroArrowDownTray, heroBackspace, heroBars3BottomLeft, heroCheck, heroCircleStack, heroCursorArrowRays, heroHandRaised,
  heroMagnifyingGlassMinus, heroMagnifyingGlassPlus, heroMinus, heroPencil, heroPencilSquare, heroSquare2Stack, heroStop
} from '@ng-icons/heroicons/outline';
import type { AnnotationToolbarIntent, AnnotationToolbarViewModel, ToolbarTool } from '@drguptavivek/emr-controller';

/** Registered heroicons. A tool icon that is neither a `shape-*` glyph nor one of these shows its label initial. */
const KNOWN = new Set([
  'heroCursorArrowRays', 'heroArrowsPointingOut', 'heroHandRaised', 'heroBackspace', 'heroPencil', 'heroPencilSquare', 'heroMinus',
  'heroArrowLongRight', 'heroArrowTrendingUp', 'heroSquare2Stack', 'heroStop', 'heroCircleStack', 'heroBars3BottomLeft'
]);
/** Purpose-drawn inline glyphs for geometric tools, selected by `tool.icon`. */
const GLYPHS = new Set([
  'shape-line', 'shape-arrow', 'shape-curve', 'shape-rect', 'shape-ellipse', 'shape-polygon', 'shape-freehand', 'shape-text', 'shape-eraser'
]);
let nextPenId = 0;
const NAV = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

@Component({
  selector: 'emr-annotation-toolbar',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({
    heroArrowLongRight, heroArrowsPointingIn, heroArrowsPointingOut, heroArrowTrendingUp, heroArrowUturnLeft, heroArrowUturnRight,
    heroArrowDownTray, heroBackspace, heroBars3BottomLeft, heroCheck, heroCircleStack, heroCursorArrowRays, heroHandRaised,
    heroMagnifyingGlassMinus, heroMagnifyingGlassPlus, heroMinus, heroPencil, heroPencilSquare, heroSquare2Stack, heroStop
  })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tbw" (keydown.escape)="closePen(true)" (focusout)="onFocusOut($event)">
    <div class="tb" role="toolbar" aria-orientation="horizontal"
         [attr.aria-label]="headingId ? null : 'Annotation tools'" [attr.aria-labelledby]="headingId ?? null"
         (keydown)="onKey($event)" (focusin)="onFocus($event)">
      @if (model.tools.length) {
        <div class="tb__g" role="group" aria-label="Tools">
          @for (t of model.tools; track t.id) {
            <button #b type="button" class="tb__b" [attr.data-key]="'t:' + t.id" [attr.tabindex]="tab('t:' + t.id)"
                    [attr.aria-label]="t.label" [attr.title]="toolTitle(t)" [attr.aria-pressed]="t.id === model.selectedToolId"
                    [disabled]="locked || !!t.disabled" (click)="intent.emit({ type: 'toolSelected', toolId: t.id })">
              <span class="tb__f">
                @if (glyph(t.icon)) {
                  <svg class="tb__svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">@switch (t.icon) {
                    @case ('shape-line') { <path d="M5 19 19 5" /> }
                    @case ('shape-arrow') { <path d="M5 19 19 5M11 5h8v8" /> }
                    @case ('shape-curve') { <path d="M6 19C6 9 18 15 18 5" /> }
                    @case ('shape-rect') { <rect x="5" y="6" width="14" height="12" rx="1" /> }
                    @case ('shape-ellipse') { <ellipse cx="12" cy="12" rx="8" ry="6" /> }
                    @case ('shape-polygon') { <path d="m12 4 8 6-3 10H7L4 10z" /> }
                    @case ('shape-freehand') { <path d="M4 14c2-6 4-6 5-2s3 4 5-1 4-3 6 1" /> }
                    @case ('shape-text') { <path d="M6 6h12M12 6v13M9.5 19h5" /> }
                    @case ('shape-eraser') { <path d="m4 15 9-9 7 7-6 6H8zM9 10l7 7" /> }
                  }</svg>
                } @else if (known(t.icon)) { <ng-icon [name]="t.icon" aria-hidden="true" /> } @else { <span class="tb__init" aria-hidden="true">{{ t.label.slice(0, 1) }}</span> }
              </span>
            </button>
          }
        </div>
      }
      @if (hasPen) {
        <div class="tb__g" role="group" aria-label="Pen">
          <button #b #pen type="button" class="tb__b tb__b--pen" data-key="pen" [attr.tabindex]="tab('pen')"
                  [attr.aria-label]="penLabel()" [attr.title]="penLabel()" [attr.aria-expanded]="open" [attr.aria-controls]="panelId"
                  [disabled]="locked" (click)="open = !open">
            <span class="tb__f tb__f--pen">
              <span class="tb__dot" aria-hidden="true" [style.background]="colour?.hex"></span>
              <span class="tb__bar" aria-hidden="true" [style.height.px]="width?.px"></span>
            </span>
          </button>
        </div>
      }
      <div class="tb__g" role="group" aria-label="History">
        <button #b type="button" class="tb__b" data-key="undo" [attr.tabindex]="tab('undo')" aria-label="Undo" title="Undo"
                [disabled]="locked || !model.canUndo" (click)="intent.emit({ type: 'undoRequested' })">
          <span class="tb__f"><ng-icon name="heroArrowUturnLeft" aria-hidden="true" /></span>
        </button>
        <button #b type="button" class="tb__b" data-key="redo" [attr.tabindex]="tab('redo')" aria-label="Redo" title="Redo"
                [disabled]="locked || !model.canRedo" (click)="intent.emit({ type: 'redoRequested' })">
          <span class="tb__f"><ng-icon name="heroArrowUturnRight" aria-hidden="true" /></span>
        </button>
      </div>
      <div class="tb__g" role="group" aria-label="Zoom">
        <button #b type="button" class="tb__b" data-key="zoomOut" [attr.tabindex]="tab('zoomOut')" aria-label="Zoom out" title="Zoom out"
                (click)="intent.emit({ type: 'zoomOutRequested' })"><span class="tb__f"><ng-icon name="heroMagnifyingGlassMinus" aria-hidden="true" /></span></button>
        <button #b type="button" class="tb__b" data-key="zoomReset" [attr.tabindex]="tab('zoomReset')"
                [attr.aria-label]="'Reset zoom, currently ' + model.zoomLabel" title="Reset zoom"
                (click)="intent.emit({ type: 'zoomResetRequested' })"><span class="tb__f tb__f--text">{{ model.zoomLabel }}</span></button>
        <button #b type="button" class="tb__b" data-key="zoomIn" [attr.tabindex]="tab('zoomIn')" aria-label="Zoom in" title="Zoom in"
                (click)="intent.emit({ type: 'zoomInRequested' })"><span class="tb__f"><ng-icon name="heroMagnifyingGlassPlus" aria-hidden="true" /></span></button>
        <button #b type="button" class="tb__b" data-key="zoomFit" [attr.tabindex]="tab('zoomFit')" aria-label="Fit to view" title="Fit to view"
                (click)="intent.emit({ type: 'zoomFitRequested' })"><span class="tb__f"><ng-icon name="heroArrowsPointingIn" aria-hidden="true" /></span></button>
      </div>
      <div class="tb__g" role="group" aria-label="Save">
        <button #b type="button" class="tb__b" data-key="save" [attr.tabindex]="tab('save')"
                [attr.aria-label]="model.saveLabel ?? 'Save annotations'" [attr.title]="model.saveLabel ?? 'Save annotations'"
                [disabled]="locked || !model.canSave" (click)="intent.emit({ type: 'saveRequested' })">
          <span class="tb__f"><ng-icon name="heroArrowDownTray" aria-hidden="true" /></span>
        </button>
      </div>
    </div>
    @if (open && hasPen) {
      <div class="tb__panel" role="group" aria-label="Pen colour and width" tabindex="-1" [id]="panelId">
        @if (model.colours.length) {
          <div class="tb__g" role="group" aria-label="Colour">
            @for (c of model.colours; track c.id) {
              <button type="button" class="tb__b" [attr.title]="c.label" [attr.aria-pressed]="c.id === model.selectedColourId"
                      (click)="pick({ type: 'colourSelected', colourId: c.id })">
                <span class="tb__f tb__f--swatch">
                  <span class="tb__sw" [style.background]="c.hex">@if (c.id === model.selectedColourId) { <ng-icon class="tb__tick" name="heroCheck" aria-hidden="true" /> }</span>
                </span>
                <span class="emr-sr-only">{{ c.label }}</span>
              </button>
            }
          </div>
        }
        @if (model.widths.length) {
          <div class="tb__g" role="group" aria-label="Line width">
            @for (w of model.widths; track w.id) {
              <button type="button" class="tb__b" [attr.title]="w.label" [attr.aria-pressed]="w.id === model.selectedWidthId"
                      (click)="pick({ type: 'widthSelected', widthId: w.id })">
                <span class="tb__f"><span class="tb__bar tb__bar--wide" aria-hidden="true" [style.height.px]="w.px"></span></span>
                <span class="emr-sr-only">{{ w.label }}</span>
              </button>
            }
          </div>
        }
      </div>
    }
    </div>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .tbw{position:relative}
    .tb{display:flex;flex-wrap:wrap;align-items:center;gap:0 6px;padding:0 2px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .tb__g{display:flex;flex-wrap:wrap;align-items:center}
    .tb__b{position:relative;width:44px;height:var(--emr-control-height);min-width:44px;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .tb__f{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 4px;border:1px solid transparent;border-radius:8px;--ng-icon__size:20px;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);font-family:var(--emr-font-mono)}
    .tb__f--text{padding:0}
    .tb__f--swatch{border-radius:50%}
    .tb__f--pen{flex-direction:column;gap:3px}
    .tb__svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .tb__init{font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .tb__b:hover:not(:disabled) .tb__f{background:var(--emr-surface-soft);border-color:var(--emr-border)}
    .tb__b:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:-3px;border-radius:8px}
    .tb__b:disabled{cursor:not-allowed;opacity:.52}
    .tb__b[aria-pressed="true"] .tb__f,.tb__b[aria-expanded="true"] .tb__f{background:var(--emr-primary-soft);border-color:var(--emr-primary);color:var(--emr-primary-contrast)}
    .tb__b[aria-pressed="true"]::after,.tb__b[aria-expanded="true"]::after{content:"";position:absolute;left:12px;right:12px;bottom:1px;height:3px;border-radius:2px;background:var(--emr-primary)}
    .tb__dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--emr-text-muted);box-sizing:border-box}
    .tb__sw{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;border:2px solid var(--emr-text-muted)}
    .tb__b[aria-pressed="true"] .tb__f--swatch{background:transparent;border-color:var(--emr-primary)}
    .tb__tick{width:14px;height:14px;--ng-icon__size:12px;border-radius:50%;background:var(--emr-surface);color:var(--emr-text);display:inline-flex;align-items:center;justify-content:center}
    .tb__bar{display:block;width:16px;max-height:8px;min-height:1px;border-radius:2px;background:currentColor}
    .tb__bar--wide{width:18px;max-height:10px}
    .tb__panel{position:absolute;z-index:10;top:calc(100% + 4px);left:0;width:max-content;max-width:100%;display:flex;flex-wrap:wrap;gap:0 8px;padding:2px 4px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);box-shadow:var(--emr-shadow)}
    @media print{:host{display:none}}
  `],
})
export class EmrAnnotationToolbarComponent implements OnChanges {
  @Input({ required: true }) model!: AnnotationToolbarViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<AnnotationToolbarIntent>();

  @ViewChildren('b') private buttons!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('pen') private penButton?: ElementRef<HTMLButtonElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private stop?: string;

  /** Transient UI state: whether the pen options panel is showing. */
  protected open = false;
  protected readonly panelId = `emr-tb-pen-${++nextPenId}`;

  protected get hasPen(): boolean { return this.model.colours.length > 0 || this.model.widths.length > 0; }
  protected get colour() { return this.model.colours.find((c) => c.id === this.model.selectedColourId); }
  protected get width() { return this.model.widths.find((w) => w.id === this.model.selectedWidthId); }

  protected penLabel(): string {
    const parts = [this.colour?.label, this.width?.label].filter(Boolean);
    return parts.length ? `Pen: ${parts.join(', ')}` : 'Pen colour and width';
  }

  protected closePen(refocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (refocus) this.penButton?.nativeElement.focus();
  }

  protected pick(i: AnnotationToolbarIntent): void { this.intent.emit(i); this.closePen(true); }

  protected onFocusOut(e: FocusEvent): void {
    if (this.open && !this.host.nativeElement.contains(e.relatedTarget as Node | null)) this.open = false;
  }

  protected get locked(): boolean { return !!this.model.readOnly; }

  ngOnChanges(): void {
    if (this.model.readOnly) this.open = false;
    const keys = this.enabledKeys();
    if (!this.stop || !keys.includes(this.stop)) {
      const sel = this.model.selectedToolId ? `t:${this.model.selectedToolId}` : '';
      this.stop = keys.includes(sel) ? sel : keys[0];
    }
  }

  known(icon: string): boolean { return KNOWN.has(icon); }
  glyph(icon: string): boolean { return GLYPHS.has(icon); }
  toolTitle(t: ToolbarTool): string { return t.shortcutLabel ? `${t.label} (${t.shortcutLabel})` : t.label; }
  tab(key: string): number { return key === this.stop ? 0 : -1; }

  /** Roving tabindex: the toolbar is one Tab stop, arrows move between its enabled buttons. */
  protected onKey(e: KeyboardEvent): void {
    if (!NAV.includes(e.key)) return;
    const els = this.buttons.toArray().map((r) => r.nativeElement).filter((b) => !b.disabled);
    const i = els.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : (i + step + els.length) % els.length;
    e.preventDefault();
    els[next].focus();
  }

  protected onFocus(e: FocusEvent): void { this.stop = (e.target as HTMLElement).dataset['key'] ?? this.stop; }

  private enabledKeys(): string[] {
    const m = this.model, off = !!m.readOnly;
    return [
      ...m.tools.filter((t) => !off && !t.disabled).map((t) => `t:${t.id}`),
      ...(!off && (m.colours.length || m.widths.length) ? ['pen'] : []),
      ...(!off && m.canUndo ? ['undo'] : []), ...(!off && m.canRedo ? ['redo'] : []),
      'zoomOut', 'zoomReset', 'zoomIn', 'zoomFit',
      ...(!off && m.canSave ? ['save'] : []),
    ];
  }
}
