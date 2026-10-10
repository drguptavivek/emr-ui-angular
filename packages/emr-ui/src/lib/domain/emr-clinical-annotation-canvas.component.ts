import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowsPointingIn, heroArrowsPointingOut, heroArrowUpTray, heroCheck, heroEye, heroEyeSlash, heroHashtag, heroLockClosed, heroLockOpen, heroPencilSquare, heroPhoto, heroSwatch, heroTag } from '@ng-icons/heroicons/outline';
import type {
  AnnotationCalloutRecord,
  AnnotationCircleRecord,
  AnnotationFillPattern,
  AnnotationLayerRecord,
  AnnotationLineRecord,
  AnnotationListIntent,
  AnnotationListViewModel,
  AnnotationPathRecord,
  AnnotationPoint,
  AnnotationStrokeStyle,
  AnnotationSymbolPreset,
  AnnotationTextRecord,
  AnnotationTool,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  EmrAnnotationLabel,
  EmrAnnotationSelectedTool,
  EmrClinicalAnnotationCanvasIntent,
  EmrClinicalAnnotationCanvasState,
  EmrClinicalImageTemplate,
} from '@drguptavivek/emr-controller';
import { EmrAnnotationListComponent } from '../structures/emr-annotation-list.component';
import { EmrAnnotationToolbarComponent } from '../structures/emr-annotation-toolbar.component';

interface EmrDrawingDraft {
  tool: AnnotationTool;
  points: AnnotationPoint[];
}

/**
 * A numbered label in a gutter beside the image, joined to its mark by a leader. Every figure is a percentage of the
 * figure box (gutters included), so labels and leaders stay aligned at every size and zoom with no measuring.
 */
interface EmrMarker {
  id: string;
  number: number;
  /** Label centre. */
  lx: number;
  ly: number;
  /** Leader start: the inner edge of the gutter, level with the label. */
  sx: number;
  /** Mark anchor, where the leader ends and a small dot sits. */
  ax: number;
  ay: number;
}

/** Background templates under one select heading (`label` undefined when the controller supplied no groups). */
interface EmrImageGroup {
  label?: string;
  images: readonly EmrClinicalImageTemplate[];
}

/** Each gutter is this fraction of the figure width (the image takes the rest). */
const GUTTER = 0.07;
/** A mark never draws thinner than this on screen, whatever width was stored with it. */
const MIN_STROKE = 2;

/** Arrowhead length as a fraction of the image width, so it scales with the image like every other mark. */
const HEAD = 0.03;
/** Fixed arc-length spacing and size of suture ticks and staples, as fractions of the image width. */
const TICK = { sutured: { step: 0.018, half: 0.011 }, stapled: { step: 0.032, half: 0.012 } } as const;
/** Pattern tile size as a fraction of the image width. */
const TILE = 0.02;

const TOOL_LABEL: Record<EmrAnnotationSelectedTool, string> = {
  pan: 'Pan', text: 'Text', line: 'Line', arrow: 'Arrow', callout: 'Callout', curve: 'Curve', circle: 'Circle', polygon: 'Polygon', freeform: 'Freehand',
};
/** The toolbar draws these inline glyphs (or a registered heroicon); the canvas only names them. */
const TOOL_GLYPH: Record<EmrAnnotationSelectedTool, string> = {
  pan: 'heroHandRaised', text: 'shape-text', line: 'shape-line', arrow: 'shape-arrow', callout: 'shape-callout', curve: 'shape-curve', circle: 'shape-ellipse', polygon: 'shape-polygon', freeform: 'shape-freehand',
};
/** Tools that are a press at the start and a release at the end. */
const TWO_POINT = new Set<AnnotationTool>(['line', 'arrow', 'callout', 'curve']);
const FILLABLE = new Set<AnnotationTool>(['polygon', 'circle', 'freeform']);
let nextCanvasUid = 0;
/** Zoom is a multiplier of the fitted width (100% = the image fitted to the height cap). */
const ZOOM_STEPS = [50, 75, 100, 150, 200, 300] as const;
/** View-only changes are not drawing history; entering draw mode or hiding numbers must not arm Undo. */
const UNTRACKED_REASONS = new Set(['layout-changed', 'marker-numbers-toggled']);
const ZOOM_INTENTS = new Set(['zoomInRequested', 'zoomOutRequested', 'zoomFitRequested', 'zoomResetRequested']);

/**
 * Print is a presentation context (`.emr-print` or `@media print`), never an input. Both set the
 * same custom properties on the host, and every rule below reads them with a screen fallback.
 */
const PRINT_CONTEXT = `
  --ac-hide: none;
  --ac-show: block;
  --ac-print-zoom: 1;
  --ac-print-cap: 140mm;
  --ac-print-ovf: visible;
  --ac-print-maxh: none;
`;

@Component({
  selector: 'emr-clinical-annotation-canvas',
  standalone: true,
  imports: [NgIcon, EmrAnnotationListComponent, EmrAnnotationToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [...provideIcons({ heroArrowsPointingIn, heroArrowsPointingOut, heroArrowUpTray, heroCheck, heroEye, heroEyeSlash, heroHashtag, heroLockClosed, heroLockOpen, heroPencilSquare, heroPhoto, heroSwatch, heroTag })],
  host: {
    class: 'emr-clinical-annotation-canvas',
    '[class.emr-ac-full]': 'isFull',
    '[attr.tabindex]': 'isFull ? -1 : null',
    '(keydown.escape)': 'onEscape()',
  },
  template: `
    <section class="ac" [class.ac--draw]="drawMode" [class.ac--full]="isFull" [class.ac--fit]="fit" [attr.aria-labelledby]="headingId"
             [style.--ac-ratio]="ratio" [style.--ac-zoom-in]="zoom / 100">
      <header class="ac__head">
        <ng-icon class="ac__ico" name="heroPhoto" aria-hidden="true" />
        <h2 class="ac__title" [id]="headingId" [attr.title]="state.description || null">{{ state.title }}</h2>
        <span class="ac__count">{{ state.layers.length }}<span class="emr-sr-only"> {{ state.layers.length === 1 ? 'mark' : 'marks' }}</span></span>
        <span class="ac__hactions">
        <button type="button" class="emr-icon-button ac__hbtn" [attr.aria-pressed]="showNumbers"
                aria-label="Show numbers on image" [attr.title]="showNumbers ? 'Hide numbers on image' : 'Show numbers on image'" (click)="toggleNumbers()">
          <ng-icon name="heroHashtag" aria-hidden="true" />
        </button>
        <button type="button" class="emr-icon-button ac__hbtn" [attr.aria-pressed]="marksShown"
                aria-label="Show marks on image" [attr.title]="marksShown ? 'Hide marks on image' : 'Show marks on image'" (click)="marksShown = !marksShown">
          <ng-icon [name]="marksShown ? 'heroEye' : 'heroEyeSlash'" aria-hidden="true" />
        </button>
        @if (!drawMode) {
          @if (!readOnly) {
            <button type="button" class="emr-button emr-button--outline ac__hbtn" aria-label="Open drawing mode" title="Open drawing mode" (click)="setLayout('draw')">
              <ng-icon name="heroPencilSquare" aria-hidden="true" /><span class="ac__btext">Draw</span>
            </button>
          }
        } @else {
          <button type="button" class="emr-icon-button ac__hbtn" [attr.aria-pressed]="locked"
                  aria-label="Lock pan and zoom" [attr.title]="locked ? 'Unlock pan and zoom' : 'Lock pan and zoom'" (click)="toggleLock()">
            <ng-icon [name]="locked ? 'heroLockClosed' : 'heroLockOpen'" aria-hidden="true" />
          </button>
          <button #fsToggle type="button" class="emr-icon-button ac__hbtn" [attr.aria-pressed]="isFull"
                  [attr.aria-label]="isFull ? 'Exit full screen' : 'Full screen'" [attr.title]="isFull ? 'Exit full screen (Esc)' : 'Full screen'" (click)="toggleFullScreen()">
            <ng-icon [name]="isFull ? 'heroArrowsPointingIn' : 'heroArrowsPointingOut'" aria-hidden="true" />
          </button>
          <button type="button" class="emr-button emr-button--outline ac__hbtn" aria-label="Done drawing" title="Back to the compact view" (click)="setLayout('compact')">
            <ng-icon name="heroCheck" aria-hidden="true" /><span class="ac__btext">Done</span>
          </button>
        }
        </span>
      </header>

      @if (drawMode) {
        @if (state.description && !isFull) { <p class="ac__desc">{{ state.description }}</p> }
        <div class="ac__tools">
          <emr-annotation-toolbar class="ac__tb" [model]="toolbar" (intent)="onToolbar($event)" />
          @if (state.availableLabels.length) {
            <label class="ac__sel ac__sel--class" title="Class for new marks">
              <ng-icon name="heroTag" aria-hidden="true" />
              <span class="emr-sr-only">Annotation class for new marks</span>
              <select [value]="state.selectedLabelId || ''" (change)="setSelectedLabel($event)">
                <option value="" [selected]="!state.selectedLabelId">No class</option>
                @for (label of state.availableLabels; track label.id) {
                  <option [value]="label.id" [selected]="label.id === state.selectedLabelId">{{ label.label }}</option>
                }
              </select>
            </label>
          }
          @if (state.symbolPresets?.length) {
            <label class="ac__sel ac__sel--sym" title="Symbol for new marks">
              <ng-icon name="heroSwatch" aria-hidden="true" />
              <span class="emr-sr-only">Symbol for new marks</span>
              <select [value]="state.selectedSymbolId || ''" (change)="setSymbol($event)">
                <option value="" [selected]="!state.selectedSymbolId">No symbol</option>
                @for (preset of state.symbolPresets; track preset.id) {
                  <option [value]="preset.id" [selected]="preset.id === state.selectedSymbolId" [attr.title]="preset.description || null">{{ preset.label }}</option>
                }
              </select>
            </label>
          }
          @if (state.imageTemplates.length > 1) {
            <label class="ac__sel" title="Background image">
              <ng-icon name="heroPhoto" aria-hidden="true" />
              <span class="emr-sr-only">Background image</span>
              <select [value]="state.selectedImageId" (change)="setBackground($event)">
                @for (group of imageGroups; track $index) {
                  @if (group.label) {
                    <optgroup [label]="group.label">
                      @for (image of group.images; track image.id) {
                        <option [value]="image.id" [selected]="image.id === state.selectedImageId">{{ image.label }}</option>
                      }
                    </optgroup>
                  } @else {
                    @for (image of group.images; track image.id) {
                      <option [value]="image.id" [selected]="image.id === state.selectedImageId">{{ image.label }}</option>
                    }
                  }
                }
              </select>
            </label>
          }
          <label class="ac__file" [attr.title]="state.photoUploadHint || 'Add photo'">
            <input class="emr-sr-only" type="file" aria-label="Add photo" [attr.accept]="state.photoAccept || 'image/*'" (change)="setPhoto($event)" />
            <ng-icon name="heroArrowUpTray" aria-hidden="true" />
          </label>
          @if (state.selectedTool === 'text' || state.selectedTool === 'callout') {
            <label class="ac__text" [attr.title]="state.selectedTool === 'callout' ? 'Text for the next callout' : 'Text for the next text mark'">
              <span class="emr-sr-only">{{ state.selectedTool === 'callout' ? 'Text for the next callout' : 'Text for the next text mark' }}</span>
              <input type="text" maxlength="120" [value]="state.textContent"
                     [attr.placeholder]="state.selectedTool === 'callout' ? 'Text, then drag from the text to the area' : 'Text, then click the image'" (input)="setTextContent($event)" />
            </label>
          }
        </div>
        @if (state.selectedTool === 'polygon' && drawing?.tool === 'polygon') {
          <div class="ac__notice">
            <span>Click to add points; click the first point or double-click to close.</span>
            <button type="button" class="emr-button emr-button--outline" (click)="finishPolygon()">
              <ng-icon name="heroCheck" aria-hidden="true" /> Finish polygon
            </button>
          </div>
        }
      }

      <div class="ac__body">
        <div class="ac__stagecol">
          <div #viewport class="ac__viewport" [class.ac__viewport--locked]="locked" [attr.tabindex]="zoomed ? 0 : null" [attr.role]="zoomed ? 'region' : null"
               [attr.aria-label]="zoomed ? 'Zoomed image, scrollable' : null">
            <div class="ac__figure" [style.--ac-g]="gutter">
            <div
              class="ac__stage emr-annotation-canvas__canvas"
              role="group"
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointercancel)="endPan()"
              (dblclick)="finishPolygon()"
              (click)="onStageClick()"
              [class.ac__stage--open]="!drawMode && !readOnly"
              [class.ac__stage--pan]="drawMode && state.selectedTool === 'pan'"
              [class.ac__stage--panning]="panning"
              [attr.title]="!drawMode && !readOnly ? 'Open drawing mode' : null"
              [attr.aria-label]="'Annotation canvas for ' + state.title"
            >
              @if (selectedImage(); as image) {
                <img class="ac__img emr-annotation-canvas__image" [src]="image.imageUrl" [alt]="image.altText ?? 'clinical image background'" />
              } @else {
                <p class="ac__empty">{{ drawMode ? 'No background image. Add a photo or choose a template.' : 'No background image.' }}</p>
              }
              <svg class="ac__svg emr-annotation-canvas__overlay" [class.ac__off]="!marksShown" aria-hidden="true"
                   [attr.viewBox]="'0 0 ' + surfaceWidth() + ' ' + surfaceHeight()" preserveAspectRatio="none">
                <defs>
                  @for (layer of state.layers; track layer.id) {
                    @if (fillKind(layer); as kind) {
                      <pattern [attr.id]="patternId(layer)" patternUnits="userSpaceOnUse" [attr.width]="tile(kind).size" [attr.height]="tile(kind).size"
                               [attr.patternTransform]="tile(kind).transform" [style.color]="layer.color">
                        <path [attr.d]="tile(kind).d" [attr.stroke-width]="tile(kind).line" stroke="currentColor" fill="none" stroke-linecap="butt"></path>
                      </pattern>
                    }
                  }
                </defs>
                @for (layer of state.layers; track layer.id) {
                  @if (layer.visible) {
                    <g>
                      @switch (layer.tool) {
                        @case ('text') {
                          <text
                            class="ac__text-mark"
                            [attr.x]="pointToCanvasX(layer.point.x)"
                            [attr.y]="pointToCanvasY(layer.point.y)"
                            [attr.fill]="layer.color"
                            [attr.font-size]="layer.fontSize"
                          >{{ layer.text }}</text>
                        }
                        @case ('line') {
                          <line
                            [attr.x1]="pointToCanvasX(layer.points[0].x)"
                            [attr.y1]="pointToCanvasY(layer.points[0].y)"
                            [attr.x2]="pointToCanvasX(layer.points[1].x)"
                            [attr.y2]="pointToCanvasY(layer.points[1].y)"
                            [attr.stroke]="layer.color"
                            [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)"
                            [attr.stroke-dasharray]="dash(layer)"
                          ></line>
                        }
                        @case ('arrow') {
                          <path [attr.d]="shaft(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" [attr.stroke-dasharray]="dash(layer)" fill="none"></path>
                        }
                        @case ('callout') {
                          @let note = callout(layer);
                          <path [attr.d]="shaft(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" [attr.stroke-dasharray]="dash(layer)" fill="none"></path>
                          <text class="ac__callout" [attr.x]="note.x" [attr.y]="note.y" [attr.dy]="note.dy" [attr.text-anchor]="note.anchor" [attr.fill]="layer.color" [style.font-size.px]="layer.fontSize">{{ layer.text }}</text>
                        }
                        @case ('curve') {
                          <path [attr.d]="pathFromPoints(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" [attr.stroke-dasharray]="dash(layer)" fill="none"></path>
                        }
                        @case ('freeform') {
                          <path [attr.d]="pathFromPoints(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" [attr.stroke-dasharray]="dash(layer)" [attr.fill]="fillOf(layer)"></path>
                        }
                        @case ('circle') {
                          <ellipse
                            [attr.cx]="pointToCanvasX(layer.center.x)"
                            [attr.cy]="pointToCanvasY(layer.center.y)"
                            [attr.rx]="pointToCanvasX(layer.radiusX)"
                            [attr.ry]="pointToCanvasY(layer.radiusY)"
                            [attr.fill]="fillOf(layer)"
                            [attr.stroke]="layer.color"
                            [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)"
                            [attr.stroke-dasharray]="dash(layer)"
                          ></ellipse>
                        }
                        @case ('polygon') {
                          <polygon [attr.points]="pointsToSvg(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" [attr.stroke-dasharray]="dash(layer)" [attr.fill]="fillOf(layer)"></polygon>
                        }
                      }
                      @if (layer.tool === 'arrow' || layer.tool === 'callout') {
                        <polygon [attr.points]="headPoints(layer.points[0], layer.points[1])" [attr.fill]="layer.color" stroke="none"></polygon>
                      }
                      @if (decor(layer); as marks) {
                        <path [attr.d]="marks" [attr.stroke]="layer.color" [attr.stroke-width]="Math.max(minStroke, layer.strokeWidth)" fill="none"></path>
                      }
                    </g>
                  }
                }
                @if (drawing; as draft) {
                  @if (draft.tool === 'line' || draft.tool === 'arrow' || draft.tool === 'callout' || draft.tool === 'curve' || draft.tool === 'freeform') {
                    <path [attr.d]="activePathFromDraft(draft)" [attr.stroke]="state.brushColor" [attr.stroke-width]="state.brushWidth" fill="none" stroke-dasharray="12 8"></path>
                  }
                  @if ((draft.tool === 'arrow' || draft.tool === 'callout') && draft.points.length === 2) {
                    <polygon [attr.points]="headPoints(draft.points[0], draft.points[1])" [attr.fill]="state.brushColor" stroke="none"></polygon>
                  }
                  @if (draft.tool === 'circle' && draft.points.length === 2) {
                    <ellipse
                      [attr.cx]="pointToCanvasX(draft.points[0].x)"
                      [attr.cy]="pointToCanvasY(draft.points[0].y)"
                      [attr.rx]="pointToCanvasX(Math.abs(draft.points[0].x - draft.points[1].x))"
                      [attr.ry]="pointToCanvasY(Math.abs(draft.points[0].y - draft.points[1].y))"
                      [attr.stroke]="state.brushColor"
                      [attr.stroke-width]="state.brushWidth"
                      fill="none"
                      stroke-dasharray="12 8"
                    ></ellipse>
                  }
                  @if (draft.tool === 'polygon' && draft.points.length > 0) {
                    <polyline [attr.points]="pointsToSvg(draft.points)" [attr.stroke]="state.brushColor" [attr.stroke-width]="state.brushWidth" fill="none" stroke-dasharray="12 8"></polyline>
                    @if (draft.points.length > 1) {
                      <line
                        [attr.x1]="pointToCanvasX(draft.points[draft.points.length - 1].x)"
                        [attr.y1]="pointToCanvasY(draft.points[draft.points.length - 1].y)"
                        [attr.x2]="pointToCanvasX(draft.points[0].x)"
                        [attr.y2]="pointToCanvasY(draft.points[0].y)"
                        [attr.stroke]="state.brushColor"
                        [attr.stroke-width]="state.brushWidth"
                        fill="none"
                        stroke-dasharray="6 5"
                      ></line>
                    }
                  }
                }
              </svg>
              @if (!drawMode && !readOnly) {
                <span class="ac__open" aria-hidden="true"><ng-icon name="heroPencilSquare" /></span>
              }
            </div>
              <div class="ac__notes" [class.ac__off]="!marksShown || !showNumbers" aria-hidden="true">
                <svg class="ac__leaders" viewBox="0 0 100 100" preserveAspectRatio="none">
                  @for (marker of markers; track marker.id) {
                    <line [attr.x1]="marker.sx" [attr.y1]="marker.ly" [attr.x2]="marker.ax" [attr.y2]="marker.ay"></line>
                  }
                </svg>
                @for (marker of markers; track marker.id) {
                  <span class="ac__dot" [style.left.%]="marker.ax" [style.top.%]="marker.ay"></span>
                  <span class="ac__badge" [style.left.%]="marker.lx" [style.top.%]="marker.ly">{{ marker.number }}</span>
                }
              </div>
            </div>
          </div>
        </div>

        @if (drawMode || state.showLayerPanel !== false) {
          <aside class="ac__aside">
            @if (drawMode) {
              <h3 class="ac__aside-h" [id]="headingId + '-marks'">Marks <span class="ac__count">{{ state.layers.length }}</span></h3>
            }
            <div class="ac__aside-body">
              <emr-annotation-list [model]="list" [headingId]="drawMode ? headingId + '-marks' : undefined" (intent)="onList($event)" />
            </div>
          </aside>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;container-type:inline-size;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);color:var(--emr-text)}
    @media print{:host{${PRINT_CONTEXT}}}
    :host-context(.emr-print){${PRINT_CONTEXT}}
    /* Full screen is a CSS overlay on the host itself: the host's own containment would trap a fixed child. */
    :host(.emr-ac-full){position:fixed;inset:0;z-index:1000;overflow:auto;overscroll-behavior:contain;border:0;border-radius:0;outline:none;background:var(--emr-surface)}
    @media print{:host(.emr-ac-full){position:static;overflow:visible}}

    .ac{--ac-cap:var(--ac-print-cap,560px);--ac-zoom:1;--ac-br:8px;--ac-chrome:150px;display:grid;gap:10px;padding:10px 12px 12px}
    .ac--draw{--ac-cap:var(--ac-print-cap,72vh);--ac-zoom:var(--ac-print-zoom,var(--ac-zoom-in,1))}
    /* Fit grows the cap from 72vh to the visible height; full screen already has that cap, so Fit there only undoes a zoom. */
    .ac--fit{--ac-cap:var(--ac-print-cap,max(72vh,calc(100dvh - var(--ac-chrome))))}
    .ac--full{--ac-cap:var(--ac-print-cap,calc(100dvh - var(--ac-chrome)));min-height:100%;align-content:start}
    @container (max-width: 1100px){.ac{--ac-chrome:210px}}
    @container (max-width: 720px){.ac{--ac-chrome:300px}}

    .ac__head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-height:var(--emr-control-height);min-width:0}
    .ac__ico{flex:none;--ng-icon__size:20px;color:var(--emr-text-muted)}
    .ac__title{margin:0;flex:0 1 auto;min-width:120px;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .ac__count{flex:none;min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--emr-border);border-radius:11px;background:var(--emr-surface-soft);font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold)}
    .ac__hactions{display:inline-flex;gap:8px;margin-left:auto}
    .ac__hbtn{display:var(--ac-hide,inline-flex);flex:none;--ng-icon__size:20px}
    .ac__hbtn[aria-pressed="true"]{background:var(--emr-primary-soft);border-color:var(--emr-primary-border);color:var(--emr-primary-contrast)}
    .ac__desc{margin:-4px 0 0;color:var(--emr-text-muted);font-size:var(--emr-text-sm);line-height:var(--emr-leading-normal);display:var(--ac-hide,block)}

    .ac__tools{display:var(--ac-hide,flex);flex-wrap:wrap;align-items:center;gap:8px;position:relative;z-index:2}
    .ac__tb{flex:none;max-width:100%}
    .ac__sel,.ac__file{position:relative;flex:0 1 auto;display:inline-flex;align-items:center;height:var(--emr-control-height);--ng-icon__size:18px;color:var(--emr-text)}
    .ac__sel{max-width:min(240px,100%);min-width:140px}
    .ac__sel--class{max-width:min(170px,100%)}
    .ac__sel--sym{max-width:min(200px,100%)}
    .ac__sel ng-icon{position:absolute;left:10px;pointer-events:none;color:var(--emr-text-muted)}
    .ac__sel select{height:var(--emr-control-height);width:100%;min-width:0;box-sizing:border-box;padding:0 32px 0 34px;border:1px solid var(--emr-border);border-radius:8px;color:var(--emr-text);font:inherit;font-size:var(--emr-text-md);text-overflow:ellipsis;
      /* WebKit ignores padding on a native select, so the arrow is drawn here in currentColor instead. */
      -webkit-appearance:none;appearance:none;background-color:var(--emr-surface);
      background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);
      background-position:calc(100% - 18px) 55%,calc(100% - 13px) 55%;background-size:5px 5px;background-repeat:no-repeat}
    .ac__file{width:var(--emr-control-height);justify-content:center;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);cursor:pointer}
    .ac__file:hover{background:var(--emr-surface-soft)}
    .ac__sel select:focus-visible,.ac__text input:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .ac__file:focus-within{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .ac__text{flex:1 1 180px;min-width:160px;display:flex}
    .ac__text input{width:100%;height:var(--emr-control-height);box-sizing:border-box;padding:0 12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-md)}
    .ac__text input::placeholder{color:var(--emr-text-muted)}
    .ac__notice{display:var(--ac-hide,flex);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:6px 12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-accent);font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .ac__notice .emr-button{--ng-icon__size:18px}

    /* Compact: the drawing takes all the room the legend does not; the legend is a fixed side column. */
    .ac__body{display:grid;grid-template-columns:minmax(0,1fr) 300px;align-items:start;gap:12px}
    .ac__stagecol{min-width:0}
    .ac__aside{min-width:0;display:grid;gap:6px}
    .ac__aside-h{margin:0;display:flex;align-items:center;gap:8px;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .ac__aside-body{min-width:0;overflow-x:hidden}
    .ac--draw .ac__body{grid-template-columns:minmax(0,1fr)}
    @container (max-width: 720px){.ac__body{grid-template-columns:minmax(0,1fr)}}
    @container (min-width: 900px){
      .ac--draw .ac__body{grid-template-columns:minmax(0,1fr) 280px}
      .ac--draw .ac__aside-body{max-height:var(--ac-cap);overflow-y:auto}
    }
    /* Wide enough for one-line rows: number, swatch, text, tool icon and four 44px actions. */
    @container (min-width: 1100px){
      .ac--draw .ac__body{grid-template-columns:minmax(0,1fr) 360px}
    }

    /* The zoom viewport scrolls; the stage inside it only ever changes WIDTH. Height follows from aspect-ratio, so the
       box is always the image rectangle (no letterbox) and pointer maths on its bounding rect stays exact. */
    .ac__viewport{box-sizing:border-box;padding:6px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);overflow:var(--ac-print-ovf,auto);max-height:var(--ac-print-maxh,calc(var(--ac-cap) + 16px))}
    .ac__viewport--locked{overflow:var(--ac-print-ovf,hidden)}
    .ac__viewport:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    /* The figure holds the percentage gutters; its width carries the height cap and the zoom, and the stage fills the middle column. */
    .ac__figure{position:relative;display:grid;grid-template-columns:calc(var(--ac-g) * 100%) minmax(0,1fr) calc(var(--ac-g) * 100%);width:calc(min(100%, var(--ac-cap) * var(--ac-ratio) / (1 - 2 * var(--ac-g))) * var(--ac-zoom));margin-inline:auto}
    .ac__stage{grid-column:2;align-self:start;position:relative;aspect-ratio:var(--ac-ratio);border-radius:6px;box-shadow:0 0 0 1px var(--emr-border);background:var(--emr-surface)}
    .ac--draw .ac__stage{touch-action:none;cursor:crosshair}
    .ac--draw .ac__stage--pan{cursor:grab}
    .ac--draw .ac__stage--panning{cursor:grabbing}
    .ac__img,.ac__svg{display:block;width:100%;height:100%}
    .ac__img{object-fit:contain;border-radius:inherit}
    .ac__svg{position:absolute;inset:0;stroke-linecap:round;stroke-linejoin:round}
    /* Strokes keep their on-screen width however the image is scaled or zoomed. */
    .ac__svg *{vector-effect:non-scaling-stroke}
    /* Pattern lines are image-sized texture, so they scale with the image instead. */
    .ac__svg pattern *{vector-effect:none}
    .ac__callout{font-weight:var(--emr-weight-bold)}
    /* SVG units are image pixels; fontSize on the record is advisory. */
    .ac__text-mark{font-size:48px}
    .ac__empty{position:absolute;inset:0;display:grid;place-items:center;margin:0;padding:16px;text-align:center;color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .ac__off{display:var(--ac-show,none)}
    .ac__stage--open{cursor:pointer}
    .ac__open{position:absolute;right:6px;bottom:6px;width:28px;height:28px;display:var(--ac-hide,inline-flex);align-items:center;justify-content:center;border:1px solid var(--emr-border);border-radius:50%;background:var(--emr-surface);color:var(--emr-text);--ng-icon__size:16px;box-shadow:var(--emr-shadow);pointer-events:none;opacity:.85}
    .ac__stage--open:hover .ac__open{opacity:1;background:var(--emr-primary-soft)}

    /* Labels are HTML so they keep their size and legibility; leaders are one SVG over the figure in 0-100 units. */
    .ac__notes{position:absolute;inset:0;pointer-events:none}
    .ac__leaders{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .ac__leaders line{stroke:var(--emr-text-muted);stroke-opacity:.55;stroke-width:1;vector-effect:non-scaling-stroke}
    .ac__dot{position:absolute;width:5px;height:5px;transform:translate(-50%,-50%);border-radius:50%;background:var(--emr-text-muted);opacity:.7}
    .ac__badge{position:absolute;min-width:calc(var(--ac-br) * 2);height:calc(var(--ac-br) * 2);padding:0 2px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);border:1px solid var(--emr-border);border-radius:var(--ac-br);background:color-mix(in srgb,var(--emr-surface-raised) 88%,transparent);color:var(--emr-text-muted);font-family:var(--emr-font-mono);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);line-height:1;-webkit-print-color-adjust:exact;print-color-adjust:exact}

    /* Narrow: the header buttons keep their icon and aria-label and drop the word, so the title keeps its room. */
    @container (max-width: 460px){.ac__btext{display:none}.ac__hbtn.emr-button{padding:0;width:var(--emr-control-height)}}
    @media (max-width:520px){.ac{padding:8px}}
  `],
})
export class EmrClinicalAnnotationCanvasComponent implements OnChanges {
  @Input({ required: true }) model!: EmrClinicalAnnotationCanvasState;
  @Input() headingId = 'emr-clinical-annotation-canvas-heading';
  @Output() readonly intent = new EventEmitter<EmrClinicalAnnotationCanvasIntent>();
  @Output() readonly nativeFilesSelected = new EventEmitter<readonly File[]>();
  protected readonly Math = Math;
  protected readonly minStroke = MIN_STROKE;
  protected readonly availableTools: EmrAnnotationSelectedTool[] = ['pan', 'text', 'line', 'arrow', 'callout', 'curve', 'circle', 'polygon', 'freeform'];
  protected readonly uid = `ac${nextCanvasUid++}`;
  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLElement>;
  @ViewChild('fsToggle') private fsToggleRef?: ElementRef<HTMLElement>;

  protected state: EmrClinicalAnnotationCanvasState;
  protected drawing: EmrDrawingDraft | null = null;
  /** Transient presentation state (like scroll): never part of the model or the history. */
  protected zoom = 100;
  protected marksShown = true;
  /** Transient like zoom: neither is model state nor drawing history. */
  protected fullScreen = false;
  protected fit = false;
  /** Locked = the view cannot move, so a drawing gesture can never scroll the page under the pen. Drawing tools lock it; Pan unlocks it. */
  protected locked = true;
  protected panning = false;
  private pan: { x: number; y: number; left: number; top: number } | null = null;
  protected ratio = '1';
  protected toolbar!: AnnotationToolbarViewModel;
  protected list!: AnnotationListViewModel;
  protected markers: EmrMarker[] = [];
  protected gutter = '0';
  protected imageGroups: EmrImageGroup[] = [];
  protected drawingPointerDown = false;
  private nextLayerId = 0;
  private undoStack: EmrClinicalAnnotationCanvasState[] = [];
  private redoStack: EmrClinicalAnnotationCanvasState[] = [];
  private readonly maxHistory = 40;
  private readonly fallbackSurface = 1000;

  constructor() {
    this.state = this.createEmptyState();
    this.refresh();
  }

  /** Print is always compact, so only a screen with editing allowed ever shows the large surface. */
  get drawMode(): boolean {
    return this.state.layout === 'draw' && !this.readOnly;
  }

  get showNumbers(): boolean {
    return this.state.showMarkerNumbers !== false;
  }

  /** Full screen only exists in draw mode (print and compact never show it). */
  get isFull(): boolean {
    return this.fullScreen && this.drawMode;
  }

  get zoomed(): boolean {
    return this.drawMode && this.zoom > 100;
  }

  get readOnly(): boolean {
    return this.state.readOnly === true;
  }

  get undoDisabled(): boolean {
    return this.undoStack.length === 0;
  }

  get redoDisabled(): boolean {
    return this.redoStack.length === 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['model']) return;
    const nextState = this.normalizeState(this.model);
    this.state = this.cloneState(nextState);
    if (changes['model'].firstChange) this.locked = nextState.selectedTool !== 'pan';
    this.drawing = null;
    this.undoStack = [];
    this.redoStack = [];
    this.refresh();
  }

  /** Derived view models are rebuilt when the state changes, not on every change-detection pass. */
  private refresh(): void {
    const state = this.state;
    this.ratio = String(this.surfaceWidth() / this.surfaceHeight());
    const colours = state.colourOptions ?? [];
    const widths = state.widthOptions ?? [];
    this.toolbar = {
      tools: this.availableTools.map(tool => ({ id: tool, label: TOOL_LABEL[tool], icon: TOOL_GLYPH[tool] })),
      selectedToolId: state.selectedTool,
      colours,
      selectedColourId: colours.find(colour => colour.hex.toLowerCase() === state.brushColor?.toLowerCase())?.id,
      widths,
      selectedWidthId: widths.find(width => width.px === state.brushWidth)?.id,
      canUndo: !this.undoDisabled,
      canRedo: !this.redoDisabled,
      zoomLabel: `${this.zoom}%`,
      canSave: true,
      readOnly: this.readOnly,
      zoomLocked: this.locked,
    };
    this.list = {
      items: state.layers.map((layer, index) => ({
        layer,
        number: index + 1,
        classLabel: this.labelDefinition(layer.classIds?.[0] ?? '')?.label,
      })),
      selectedLayerId: state.selectedLayerId,
      emptyMessage: this.drawMode ? 'No marks yet. Choose a tool and draw on the image.' : 'No marks drawn on this image.',
      readOnly: !this.drawMode,
      canLock: false,
    };
    this.markers = this.layoutMarkers();
    this.gutter = this.markers.length ? String(GUTTER) : '0';
    const grouped = state.imageTemplates.some(image => image.group);
    this.imageGroups = grouped
      ? [...new Set(state.imageTemplates.map(image => image.group ?? ''))].map(group => ({ label: group || undefined, images: state.imageTemplates.filter(image => (image.group ?? '') === group) }))
      : [{ images: state.imageTemplates }];
  }

  /**
   * Numbers live in the gutters, never on the image. Each visible mark goes to the left gutter when its anchor is in
   * the left half (text marks always go left, so a leader meets the start of the text, not its body), then each gutter
   * is sorted by height and spread to a minimum gap, so labels never overlap and each leader stays short.
   */
  private layoutMarkers(): EmrMarker[] {
    const inner = 1 - 2 * GUTTER;
    const ratio = this.surfaceWidth() / this.surfaceHeight();
    // Short, wide images leave less height per label, so they need a bigger gap.
    const baseGap = 0.05 + 0.06 * Math.min(1, Math.max(0, ratio - 0.5));
    const items = this.state.layers.flatMap((layer, index) => {
      if (!layer.visible) return [];
      // An arrow or callout is numbered at its head, the body area it points at.
      const centre = layer.tool === 'circle' ? layer.center : layer.tool === 'text' ? layer.point : layer.tool === 'arrow' || layer.tool === 'callout' ? layer.points[1] : layer.points[0];
      const left = layer.tool === 'text' || centre.x < 0.5;
      // A circle's leader meets the edge nearest its gutter, not the centre.
      const anchor = layer.tool === 'circle' ? { x: layer.center.x + (left ? -layer.radiusX : layer.radiusX), y: layer.center.y } : centre;
      return [{ id: layer.id, number: index + 1, left, anchor, y: anchor.y }];
    });
    const markers: EmrMarker[] = [];
    for (const left of [true, false]) {
      const side = items.filter(item => item.left === left).sort((a, b) => a.y - b.y);
      if (!side.length) continue;
      const gap = Math.min(baseGap, 0.94 / Math.max(1, side.length));
      const edge = Math.min(0.03, gap / 2);
      const ys = side.map(item => Math.min(1 - edge, Math.max(edge, item.y)));
      for (let i = 1; i < ys.length; i += 1) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
      if (ys[ys.length - 1] > 1 - edge) {
        ys[ys.length - 1] = 1 - edge;
        for (let i = ys.length - 2; i >= 0; i -= 1) ys[i] = Math.min(ys[i], ys[i + 1] - gap);
      }
      side.forEach((item, i) => markers.push({
        id: item.id,
        number: item.number,
        lx: (left ? GUTTER / 2 : 1 - GUTTER / 2) * 100,
        ly: ys[i] * 100,
        sx: (left ? GUTTER : 1 - GUTTER) * 100,
        ax: (GUTTER + item.anchor.x * inner) * 100,
        ay: item.anchor.y * 100,
      }));
    }
    return markers.sort((a, b) => a.number - b.number);
  }

  protected toggleNumbers(): void {
    const next = this.cloneState(this.state);
    next.showMarkerNumbers = !this.showNumbers;
    this.applyState(next, 'marker-numbers-toggled');
  }

  protected setLayout(layout: 'compact' | 'draw'): void {
    const next = this.cloneState(this.state);
    next.layout = layout;
    this.zoom = 100;
    this.fit = false;
    this.fullScreen = false;
    this.applyState(next, 'layout-changed');
  }

  /** Clicking the compact image is a shortcut for the Draw button, which stays the keyboard route. */
  protected onStageClick(): void {
    if (!this.drawMode && !this.readOnly) this.setLayout('draw');
  }

  protected onToolbar(intent: AnnotationToolbarIntent): void {
    if (this.locked && ZOOM_INTENTS.has(intent.type)) return;
    switch (intent.type) {
      case 'toolSelected': {
        const tool = this.availableTools.find(candidate => candidate === intent.toolId);
        if (tool) this.activateTool(tool);
        break;
      }
      case 'colourSelected': {
        const colour = this.state.colourOptions?.find(candidate => candidate.id === intent.colourId);
        if (colour) this.setBrushColor(colour.hex);
        break;
      }
      case 'widthSelected': {
        const width = this.state.widthOptions?.find(candidate => candidate.id === intent.widthId);
        if (width) this.setBrushWidth(width.px);
        break;
      }
      case 'undoRequested': this.undo(); break;
      case 'redoRequested': this.redo(); break;
      case 'saveRequested': this.save(); break;
      case 'zoomInRequested': this.setZoom(ZOOM_STEPS.find(step => step > this.zoom) ?? this.zoom); break;
      case 'zoomOutRequested': this.setZoom([...ZOOM_STEPS].reverse().find(step => step < this.zoom) ?? this.zoom); break;
      case 'zoomFitRequested': this.setZoom(100, true); break;
      case 'zoomResetRequested': this.setZoom(100); break;
    }
  }

  protected onList(intent: AnnotationListIntent): void {
    switch (intent.type) {
      case 'layerSelected': this.selectLayer(intent.layerId); break;
      case 'layerVisibilityToggleRequested': this.toggleLayerVisibility(intent.layerId); break;
      case 'layerMoveRequested': this.moveLayer(intent.layerId, intent.direction === 'up' ? -1 : 1); break;
      case 'layerRemoveRequested': this.removeLayer(intent.layerId); break;
      // Lock is hidden (canLock false) until marks can be moved; rename has no control yet.
      default: break;
    }
  }

  /**
   * Zoom steps multiply the fitted size. Reset returns to 100%. Fit also returns to 100% but sizes the image to
   * the whole visible height (taller than the 72vh default, and already the case in full screen) and scrolls to its corner.
   */
  private setZoom(zoom: number, fit = false): void {
    this.zoom = zoom;
    this.fit = fit;
    if (fit) {
      const viewport = this.viewportRef?.nativeElement;
      if (viewport) { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
    }
    this.refresh();
  }

  protected toggleLock(): void {
    this.locked = !this.locked;
    this.refresh();
  }

  protected toggleFullScreen(): void {
    this.fullScreen = !this.fullScreen;
  }

  protected onEscape(): void {
    if (!this.isFull) return;
    this.fullScreen = false;
    this.fsToggleRef?.nativeElement.focus();
  }

  protected endPan(): void {
    this.pan = null;
    this.panning = false;
  }

  /** Default label for a new mark: the chosen class, else a neutral word. Never the tool name. */
  private defaultLabel(): string {
    const id = this.state.selectedLabelId;
    const symbol = this.state.symbolPresets?.find(preset => preset.id === this.state.selectedSymbolId);
    return (id ? this.labelDefinition(id)?.label : undefined) || symbol?.label || 'Annotation';
  }

  /** The active stroke style and fill, copied onto a new mark. Fill only goes on marks that can hold one. */
  private appearance(tool: AnnotationTool): { strokeStyle?: AnnotationStrokeStyle; fillPattern?: AnnotationFillPattern } {
    const { brushStrokeStyle, brushFillPattern } = this.state;
    return {
      ...(brushStrokeStyle && tool !== 'text' ? { strokeStyle: brushStrokeStyle } : {}),
      ...(brushFillPattern && FILLABLE.has(tool) ? { fillPattern: brushFillPattern } : {}),
    };
  }

  protected labelDefinition(labelId: string): EmrAnnotationLabel | undefined {
    return this.state.availableLabels.find(candidate => candidate.id === labelId);
  }

  protected selectedImage(): EmrClinicalImageTemplate | undefined {
    return this.state.imageTemplates.find(image => image.id === this.state.selectedImageId);
  }

  /** Drawing surface in the image's intrinsic pixels, so overlay units match the image exactly. */
  protected surfaceWidth(): number {
    return this.selectedImage()?.width || this.fallbackSurface;
  }

  protected surfaceHeight(): number {
    return this.selectedImage()?.height || this.fallbackSurface;
  }

  protected pointToCanvasX(value: number): number {
    return value * this.surfaceWidth();
  }

  protected pointToCanvasY(value: number): number {
    return value * this.surfaceHeight();
  }

  protected pointsToSvg(points: readonly AnnotationPoint[]): string {
    return points.map(point => `${this.pointToCanvasX(point.x)},${this.pointToCanvasY(point.y)}`).join(' ');
  }

  protected pathFromPoints(points: readonly AnnotationPoint[]): string {
    if (points.length < 2) return '';
    if (points.length === 2) return `M ${this.pointToCanvasX(points[0].x)} ${this.pointToCanvasY(points[0].y)} L ${this.pointToCanvasX(points[1].x)} ${this.pointToCanvasY(points[1].y)}`;
    let path = `M ${this.pointToCanvasX(points[0].x)} ${this.pointToCanvasY(points[0].y)}`;
    for (let index = 1; index < points.length - 2; index += 1) {
      const midX = this.pointToCanvasX((points[index].x + points[index + 1].x) / 2);
      const midY = this.pointToCanvasY((points[index].y + points[index + 1].y) / 2);
      const controlX = this.pointToCanvasX(points[index].x);
      const controlY = this.pointToCanvasY(points[index].y);
      path = `${path} Q ${controlX} ${controlY} ${midX} ${midY}`;
    }
    const penultimate = points[points.length - 2];
    const finalPoint = points[points.length - 1];
    return `${path} T ${this.pointToCanvasX(finalPoint.x)} ${this.pointToCanvasY(finalPoint.y)}`;
  }

  protected activePathFromDraft(draft: EmrDrawingDraft): string {
    if (draft.tool === 'line' || draft.tool === 'arrow' || draft.tool === 'callout' || draft.tool === 'freeform') {
      return this.pathFromPoints(draft.points);
    }
    if (draft.tool === 'curve') {
      return this.pathFromPoints(draft.points.length > 2 ? draft.points : [...draft.points, draft.points[0]]);
    }
    return '';
  }

  protected dash(layer: AnnotationLayerRecord): string | null {
    return layer.strokeStyle === 'dashed' ? '10 7' : null;
  }

  /** The pattern a mark is filled with; empty when it has none, cannot hold one, or names one this canvas does not know. */
  protected fillKind(layer: AnnotationLayerRecord): AnnotationFillPattern | '' {
    const kind = layer.fillPattern;
    return FILLABLE.has(layer.tool) && (kind === 'hatch' || kind === 'crosshatch' || kind === 'lattice') ? kind : '';
  }

  protected patternId(layer: AnnotationLayerRecord): string {
    return `${this.uid}-pattern-${layer.id.replace(/[^A-Za-z0-9_-]/g, '_')}`;
  }

  protected fillOf(layer: AnnotationLayerRecord): string {
    return this.fillKind(layer) ? `url(#${this.patternId(layer)})` : 'none';
  }

  /** One tile of a fill pattern, in image units. Lines carry no colour: they take `currentColor` from the pattern element. */
  protected tile(kind: AnnotationFillPattern): { size: number; transform: string | null; d: string; line: number } {
    const s = Math.max(8, this.surfaceWidth() * TILE);
    const h = s / 2;
    if (kind === 'lattice') {
      const t = s * 1.6;
      const a = t / 3;
      const b = (2 * t) / 3;
      return { size: t, transform: null, d: `M${a} 0V${t}M${b} 0V${t}M0 ${a}H${t}M0 ${b}H${t}`, line: s * 0.1 };
    }
    return {
      size: s,
      transform: 'rotate(45)',
      d: kind === 'crosshatch' ? `M${h} 0V${s}M0 ${h}H${s}` : `M${h} 0V${s}`,
      line: s * (kind === 'crosshatch' ? 0.1 : 0.12),
    };
  }

  private headLength(): number {
    return Math.max(10, this.surfaceWidth() * HEAD);
  }

  /** A filled triangle at `head`, from the direction of the last segment. Empty when the segment has no length. */
  protected headPoints(tail: AnnotationPoint, head: AnnotationPoint): string {
    const [ax, ay, bx, by] = [this.pointToCanvasX(tail.x), this.pointToCanvasY(tail.y), this.pointToCanvasX(head.x), this.pointToCanvasY(head.y)];
    const length = Math.hypot(bx - ax, by - ay);
    if (length < 1e-6) return '';
    const [ux, uy] = [(bx - ax) / length, (by - ay) / length];
    const size = Math.min(this.headLength(), length);
    const [cx, cy] = [bx - ux * size, by - uy * size];
    const half = size * 0.45;
    return `${bx},${by} ${cx - uy * half},${cy + ux * half} ${cx + uy * half},${cy - ux * half}`;
  }

  /** The shaft stops inside the arrowhead, so a thick round-capped line never blunts the tip. */
  protected shaft(points: readonly [AnnotationPoint, AnnotationPoint]): string {
    const [ax, ay, bx, by] = [this.pointToCanvasX(points[0].x), this.pointToCanvasY(points[0].y), this.pointToCanvasX(points[1].x), this.pointToCanvasY(points[1].y)];
    const length = Math.hypot(bx - ax, by - ay);
    if (length < 1e-6) return '';
    const back = Math.min(this.headLength(), length) * 0.85;
    return `M ${ax} ${ay} L ${bx - ((bx - ax) / length) * back} ${by - ((by - ay) / length) * back}`;
  }

  /** The text sits at the tail, on the side away from the head, so the arrow leaves the text toward the area. */
  protected callout(layer: AnnotationCalloutRecord): { x: number; y: number; dy: string; anchor: string } {
    const [tx, ty] = [this.pointToCanvasX(layer.points[0].x), this.pointToCanvasY(layer.points[0].y)];
    const dx = this.pointToCanvasX(layer.points[1].x) - tx;
    const dy = this.pointToCanvasY(layer.points[1].y) - ty;
    const gap = layer.fontSize * 0.35;
    if (Math.abs(dx) >= Math.abs(dy) * 0.6) return { x: tx + (dx >= 0 ? -gap : gap), y: ty, dy: '0.35em', anchor: dx >= 0 ? 'end' : 'start' };
    return dy >= 0 ? { x: tx, y: ty - gap, dy: '0em', anchor: 'middle' } : { x: tx, y: ty + gap, dy: '0.8em', anchor: 'middle' };
  }

  /**
   * Suture ticks and staples at fixed arc-length steps along the mark's points, drawn over its stroke. Presentation
   * maths only: nothing here is stored, and the points stay the record.
   */
  protected decor(layer: AnnotationLayerRecord): string {
    const style = layer.strokeStyle;
    if ((style !== 'sutured' && style !== 'stapled') || layer.tool === 'text' || layer.tool === 'circle') return '';
    const path = layer.points.map(point => [this.pointToCanvasX(point.x), this.pointToCanvasY(point.y)] as const);
    if (layer.tool === 'polygon') path.push(path[0]);
    const width = this.surfaceWidth();
    const step = width * TICK[style].step;
    const half = width * TICK[style].half;
    const leg = width * 0.009;
    let marks = '';
    let walked = 0;
    let at = step / 2;
    let count = 0;
    for (let i = 1; i < path.length && count < 400; i += 1) {
      const [x0, y0] = path[i - 1];
      const [x1, y1] = path[i];
      const length = Math.hypot(x1 - x0, y1 - y0);
      if (length < 1e-6) continue;
      const [dx, dy] = [(x1 - x0) / length, (y1 - y0) / length];
      while (walked + length >= at && count < 400) {
        const t = at - walked;
        const [cx, cy] = [x0 + dx * t, y0 + dy * t];
        const [ax, ay, bx, by] = [cx - dy * half, cy + dx * half, cx + dy * half, cy - dx * half];
        marks += style === 'sutured'
          ? `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`
          : `M${(ax - dx * leg).toFixed(1)} ${(ay - dy * leg).toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}L${(bx - dx * leg).toFixed(1)} ${(by - dy * leg).toFixed(1)}`;
        at += step;
        count += 1;
      }
      walked += length;
    }
    return marks;
  }

  protected nextLayerClassIds(): string[] {
    const selectedLabelId = this.state.selectedLabelId;
    if (selectedLabelId && this.labelDefinition(selectedLabelId)) {
      return [selectedLabelId];
    }
    return [];
  }

  protected activateTool(tool: EmrAnnotationSelectedTool): void {
    if (this.readOnly) return;
    const next = this.cloneState(this.state);
    if (tool !== next.selectedTool) {
      // A symbol was a starting point for its own tool; another tool draws plain.
      next.selectedSymbolId = undefined;
      next.brushStrokeStyle = undefined;
      next.brushFillPattern = undefined;
    }
    next.selectedTool = tool;
    this.locked = tool !== 'pan';
    this.applyState(next, `tool-changed:${tool}`);
    this.drawing = null;
  }

  /** One step: tool, style, fill, colour, width and class all change together, so one Undo reverses a symbol choice. */
  protected setSymbol(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const preset: AnnotationSymbolPreset | undefined = this.state.symbolPresets?.find(candidate => candidate.id === id);
    const next = this.cloneState(this.state);
    next.selectedSymbolId = preset?.id;
    next.brushStrokeStyle = preset?.strokeStyle;
    next.brushFillPattern = preset?.fillPattern;
    if (preset) {
      next.selectedTool = preset.tool;
      this.locked = true;
      if (preset.colour) next.brushColor = preset.colour;
      if (preset.width) next.brushWidth = preset.width;
      if (preset.classId && this.labelDefinition(preset.classId)) next.selectedLabelId = preset.classId;
    }
    this.applyState(next, 'symbol-selected');
  }

  protected setBackground(event: Event): void {
    const selectedImageId = (event.target as HTMLSelectElement).value;
    const next = this.cloneState(this.state);
    next.selectedImageId = selectedImageId;
    this.applyState(next, `background-changed:${selectedImageId}`);
  }

  protected setSelectedLabel(event: Event): void {
    const selectedLabelId = (event.target as HTMLSelectElement).value;
    const next = this.cloneState(this.state);
    next.selectedLabelId = selectedLabelId || undefined;
    this.applyState(next, `selected-label:${selectedLabelId}`);
  }

  protected setPhoto(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    // Reading, storing and registering the image is controller work: it answers with a new
    // template (stable id, URL, intrinsic size) in the next model.
    if (!this.readOnly) this.nativeFilesSelected.emit(files);
  }

  private setBrushColor(value: string): void {
    const next = this.cloneState(this.state);
    next.brushColor = value;
    this.applyState(next, `brush-color:${value}`);
  }

  private setBrushWidth(value: number): void {
    const next = this.cloneState(this.state);
    next.brushWidth = this.clampBrushWidth(value);
    this.applyState(next, `brush-width:${next.brushWidth}`);
  }

  protected setTextContent(event: Event): void {
    const textContent = (event.target as HTMLInputElement).value;
    const next = this.cloneState(this.state);
    next.textContent = textContent;
    this.applyState(next, 'text-content-changed');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.drawMode) return;
    if (event.button !== 0) return;
    event.preventDefault();
    if (this.state.selectedTool === 'pan') {
      // Pan scrolls the zoomed view by the drag; it never makes a mark, and a locked view does not move.
      const viewport = this.viewportRef?.nativeElement;
      if (viewport && !this.locked) {
        this.pan = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
        this.panning = true;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
      }
      return;
    }
    const point = this.toRelativePoint(event);
    if (!point) return;
    const tool: AnnotationTool = this.state.selectedTool ?? 'line';
    this.state.selectedTool = tool;
    this.drawingPointerDown = true;

    if (tool === 'text') {
      this.addLayerFromText(point);
      this.drawingPointerDown = false;
      return;
    }

    if (tool === 'polygon') {
      this.extendPolygon(point);
      return;
    }

    this.drawing = { tool, points: TWO_POINT.has(tool) ? [point, point] : [point] };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.pan) {
      const viewport = this.viewportRef?.nativeElement;
      if (viewport) {
        viewport.scrollLeft = this.pan.left - (event.clientX - this.pan.x);
        viewport.scrollTop = this.pan.top - (event.clientY - this.pan.y);
      }
      return;
    }
    if (!this.drawingPointerDown || !this.drawing || !this.drawMode) return;
    const point = this.toRelativePoint(event);
    if (!point) return;
    const tool = this.drawing.tool;
    if (TWO_POINT.has(tool)) {
      this.drawing.points = [this.drawing.points[0], point];
    }
    if (tool === 'circle') {
      this.drawing.points = [this.drawing.points[0], point];
    }
    if (tool === 'freeform') {
      const tail = this.drawing.points[this.drawing.points.length - 1];
      if (!tail || this.distance(tail, point) > 0.004) {
        this.drawing.points = [...this.drawing.points, point];
      }
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pan) { this.endPan(); return; }
    if (!this.drawingPointerDown) return;
    if (!this.drawing) {
      this.drawingPointerDown = false;
      return;
    }
    const point = this.toRelativePoint(event) ?? this.drawing.points[0];
    this.drawingPointerDown = false;
    this.finalizeDrawing(point);
  }

  protected finishPolygon(): void {
    if (!this.drawing || this.drawing.tool !== 'polygon' || this.drawing.points.length < 3 || this.readOnly) return;
    const polygonPoints = this.normalizePolygonPoints(this.drawing.points);
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: AnnotationPathRecord = {
      id: this.newLayerId(),
      tool: 'polygon',
      label: this.defaultLabel(),
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds: this.nextLayerClassIds(),
      ...this.appearance('polygon'),
      points: polygonPoints,
    };
    const next = this.cloneState(this.state);
    next.layers = [...next.layers, layer];
    next.selectedLayerId = layer.id;
    this.applyState(next, 'polygon-added');
    this.drawing = null;
  }

  protected addLayerFromText(point: AnnotationPoint): void {
    const draftText = (this.state.textContent ?? '').trim();
    const text = draftText.length ? draftText : 'Text';
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: AnnotationTextRecord = {
      id: this.newLayerId(),
      tool: 'text',
      label: text,
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds: this.nextLayerClassIds(),
      point,
      text,
      fontSize: 24,
    };
    const next = this.cloneState(this.state);
    next.layers = [...next.layers, layer];
    next.selectedLayerId = layer.id;
    this.applyState(next, 'text-added');
  }

  protected selectLayer(layerId: string): void {
    const next = this.cloneState(this.state);
    next.selectedLayerId = layerId;
    this.applyState(next, `layer-selected:${layerId}`);
  }

  protected toggleLayerVisibility(layerId: string): void {
    const next = this.cloneState(this.state);
    const layer = next.layers.find(candidate => candidate.id === layerId);
    if (!layer) return;
    layer.visible = !layer.visible;
    this.applyState(next, `layer-visibility:${layerId}:${layer.visible}`);
  }

  protected moveLayer(layerId: string, direction: -1 | 1): void {
    if (this.readOnly) return;
    const next = this.cloneState(this.state);
    const sourceIndex = next.layers.findIndex(candidate => candidate.id === layerId);
    if (sourceIndex < 0) return;
    const targetIndex = sourceIndex + direction;
    if (targetIndex < 0 || targetIndex >= next.layers.length) return;
    const selected = next.layers[sourceIndex];
    const reordered = [
      ...next.layers.slice(0, sourceIndex),
      ...next.layers.slice(sourceIndex + 1),
    ];
    const insertedAt = direction > 0 ? targetIndex : targetIndex;
    next.layers = [...reordered.slice(0, insertedAt), selected, ...reordered.slice(insertedAt)];
    this.applyState(next, `layer-reordered:${layerId}`);
  }

  protected removeLayer(layerId: string): void {
    if (this.readOnly) return;
    const next = this.cloneState(this.state);
    next.layers = next.layers.filter(candidate => candidate.id !== layerId);
    if (next.selectedLayerId === layerId) {
      next.selectedLayerId = undefined;
    }
    this.applyState(next, `layer-removed:${layerId}`);
  }

  protected undo(): void {
    if (this.undoDisabled) return;
    const snapshot = this.undoStack[this.undoStack.length - 1];
    const current = this.cloneState(this.state);
    this.undoStack = this.undoStack.slice(0, -1);
    this.redoStack = [...this.redoStack, current];
    this.state = { ...this.cloneState(snapshot), layout: current.layout, showMarkerNumbers: current.showMarkerNumbers };
    this.refresh();
    this.intent.emit({ type: 'undoRequested', state: this.cloneState(this.state), reason: 'undo' });
  }

  protected redo(): void {
    if (this.redoDisabled) return;
    const snapshot = this.redoStack[this.redoStack.length - 1];
    const current = this.cloneState(this.state);
    this.redoStack = this.redoStack.slice(0, -1);
    this.undoStack = [...this.undoStack, current];
    this.state = { ...this.cloneState(snapshot), layout: current.layout, showMarkerNumbers: current.showMarkerNumbers };
    this.refresh();
    this.intent.emit({ type: 'redoRequested', state: this.cloneState(this.state), reason: 'redo' });
  }

  protected save(): void {
    this.intent.emit({ type: 'saveRequested', state: this.cloneState(this.state), reason: 'save' });
  }

  private finalizeDrawing(point: AnnotationPoint): void {
    const draft = this.drawing;
    if (!draft || this.readOnly) return;
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    if (draft.tool === 'line' || draft.tool === 'arrow' || draft.tool === 'callout') {
      const pointStart = draft.points[0];
      // An arrow or callout needs a direction, so a click without a drag draws nothing.
      if (!pointStart || (draft.tool !== 'line' && this.distance(pointStart, point) < 0.005)) {
        this.drawing = null;
        return;
      }
      const common = {
        id: this.newLayerId(),
        color: brushColor,
        strokeWidth: brushWidth,
        visible: true,
        classIds: this.nextLayerClassIds(),
        ...this.appearance(draft.tool),
      };
      const points: [AnnotationPoint, AnnotationPoint] = [pointStart, point];
      let layer: AnnotationLineRecord | AnnotationCalloutRecord;
      if (draft.tool === 'callout') {
        const text = (this.state.textContent ?? '').trim() || 'Text';
        layer = { ...common, tool: 'callout', label: text, points, text, fontSize: Math.round(this.surfaceWidth() * 0.03) };
      } else {
        layer = { ...common, tool: draft.tool, label: this.defaultLabel(), points };
      }
      const next = this.cloneState(this.state);
      next.layers = [...next.layers, layer];
      next.selectedLayerId = layer.id;
      this.applyState(next, `${draft.tool}-added`);
    }
    if (draft.tool === 'curve') {
      const smoothed = this.resampleCurve(draft.points, point);
      const curve: AnnotationPathRecord = {
        id: this.newLayerId(),
        tool: 'curve' as const,
        label: this.defaultLabel(),
        color: brushColor,
        strokeWidth: brushWidth,
        visible: true,
        classIds: this.nextLayerClassIds(),
        ...this.appearance('curve'),
        points: smoothed,
      };
      const next = this.cloneState(this.state);
      next.layers = [...next.layers, curve];
      next.selectedLayerId = curve.id;
      this.applyState(next, 'curve-added');
    }
    if (draft.tool === 'freeform') {
      const points = this.closeLine(draft.points);
      if (points.length >= 2) {
        const freeform: AnnotationPathRecord = {
          id: this.newLayerId(),
          tool: 'freeform' as const,
          label: this.defaultLabel(),
          color: brushColor,
          strokeWidth: brushWidth,
          visible: true,
          classIds: this.nextLayerClassIds(),
          ...this.appearance('freeform'),
          points,
        };
        const next = this.cloneState(this.state);
        next.layers = [...next.layers, freeform];
        next.selectedLayerId = freeform.id;
        this.applyState(next, 'freeform-added');
      }
    }
    if (draft.tool === 'circle') {
      const center = draft.points[0];
      const radiusX = Math.abs(center.x - point.x);
      const radiusY = Math.abs(center.y - point.y);
      if (radiusX > 0.005 || radiusY > 0.005) {
        const circle: AnnotationCircleRecord = {
          id: this.newLayerId(),
          tool: 'circle' as const,
          label: this.defaultLabel(),
          color: brushColor,
          strokeWidth: brushWidth,
          visible: true,
          classIds: this.nextLayerClassIds(),
          ...this.appearance('circle'),
          center,
          radiusX,
          radiusY,
        };
        const next = this.cloneState(this.state);
        next.layers = [...next.layers, circle];
        next.selectedLayerId = circle.id;
        this.applyState(next, 'circle-added');
      }
    }
    this.drawing = null;
  }

  private extendPolygon(point: AnnotationPoint): void {
    if (!this.state.selectedTool) this.state.selectedTool = 'polygon';
    if (!this.drawing || this.drawing.tool !== 'polygon') {
      this.drawing = { tool: 'polygon', points: [point] };
      return;
    }
    const existing = this.drawing.points;
    const first = existing[0];
    if (existing.length > 2 && first && this.distance(first, point) < 0.018) {
      this.finishPolygon();
      return;
    }
    if (!this.isDuplicatePoint(existing, point)) {
      this.drawing = { tool: 'polygon', points: [...existing, point] };
    }
  }

  private toRelativePoint(event: PointerEvent): AnnotationPoint | null {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = this.clamp((event.clientX - rect.left) / rect.width);
    const y = this.clamp((event.clientY - rect.top) / rect.height);
    return { x, y };
  }

  private applyState(next: EmrClinicalAnnotationCanvasState, reason: string): void {
    const normalized = this.normalizeState(next);
    if (!UNTRACKED_REASONS.has(reason)) {
      const previous = this.cloneState(this.state);
      this.undoStack = [...this.undoStack.slice(-this.maxHistory + 1), previous];
      this.redoStack = [];
    }
    this.state = normalized;
    this.drawing = null;
    if (reason.endsWith('-added')) this.marksShown = true;
    this.refresh();
    this.intent.emit({ type: 'stateChanged', state: this.cloneState(this.state), reason });
  }

  private cloneState(raw: EmrClinicalAnnotationCanvasState): EmrClinicalAnnotationCanvasState {
    return {
      instanceId: raw.instanceId,
      title: raw.title,
      description: raw.description,
      imageTemplates: raw.imageTemplates?.map(template => ({ ...template })) ?? [],
      availableLabels: raw.availableLabels?.map(label => ({ ...label })) ?? [],
      selectedImageId: raw.selectedImageId,
      selectedLabelId: raw.selectedLabelId,
      selectedTool: raw.selectedTool,
      brushColor: raw.brushColor,
      brushWidth: raw.brushWidth,
      layers: raw.layers?.map(layer => this.cloneLayer(layer)) ?? [],
      selectedLayerId: raw.selectedLayerId,
      textContent: raw.textContent,
      showLayerPanel: raw.showLayerPanel,
      readOnly: raw.readOnly,
      photoUploadHint: raw.photoUploadHint,
      photoAccept: raw.photoAccept,
      layout: raw.layout,
      showMarkerNumbers: raw.showMarkerNumbers,
      colourOptions: raw.colourOptions?.map(option => ({ ...option })),
      widthOptions: raw.widthOptions?.map(option => ({ ...option })),
      symbolPresets: raw.symbolPresets?.map(preset => ({ ...preset })),
      selectedSymbolId: raw.selectedSymbolId,
      brushStrokeStyle: raw.brushStrokeStyle,
      brushFillPattern: raw.brushFillPattern,
    };
  }

  private cloneLayer(layer: AnnotationLayerRecord): AnnotationLayerRecord {
    switch (layer.tool) {
      case 'text':
        return {
          ...layer,
          classIds: [...(layer.classIds ?? [])],
          point: { ...layer.point },
          text: layer.text,
          fontSize: layer.fontSize,
        };
      case 'line':
      case 'arrow':
      case 'callout':
        return {
          ...layer,
          classIds: [...(layer.classIds ?? [])],
          points: [{ ...layer.points[0] }, { ...layer.points[1] }],
        };
      case 'circle':
        return {
          ...layer,
          classIds: [...(layer.classIds ?? [])],
          center: { ...layer.center },
        };
      case 'curve':
      case 'polygon':
      case 'freeform':
        return {
          ...layer,
          classIds: [...(layer.classIds ?? [])],
          points: layer.points.map(point => ({ ...point })),
        };
      default:
        return layer;
    }
  }

  private normalizeState(raw: EmrClinicalAnnotationCanvasState): EmrClinicalAnnotationCanvasState {
    const imageTemplates = raw.imageTemplates ?? [];
    const availableLabels = raw.availableLabels ?? [];
    const selectedImageId = raw.selectedImageId && imageTemplates.some(image => image.id === raw.selectedImageId) ? raw.selectedImageId : imageTemplates[0]?.id;
    const selectedLabelId = raw.selectedLabelId && availableLabels.some(label => label.id === raw.selectedLabelId) ? raw.selectedLabelId : availableLabels[0]?.id;
    const normalizedSelectedTool = raw.selectedTool ?? 'line';
    const brushColor = raw.brushColor;
    const brushWidth = this.clampBrushWidth(raw.brushWidth);
    const next: EmrClinicalAnnotationCanvasState = {
      instanceId: raw.instanceId,
      title: raw.title ?? 'Clinical annotation card',
      description: raw.description,
      imageTemplates: imageTemplates.map(template => ({ ...template })),
      availableLabels: availableLabels.map(label => ({ ...label })),
      selectedImageId,
      selectedLabelId,
      selectedTool: normalizedSelectedTool,
      brushColor,
      brushWidth,
      layers: raw.layers.map(layer => this.normalizeLayer(layer, availableLabels.map(label => label.id))),
      selectedLayerId: raw.selectedLayerId ?? undefined,
      textContent: raw.textContent ?? '',
      showLayerPanel: raw.showLayerPanel ?? true,
      readOnly: raw.readOnly,
      photoUploadHint: raw.photoUploadHint,
      photoAccept: raw.photoAccept,
      layout: raw.layout ?? 'compact',
      showMarkerNumbers: raw.showMarkerNumbers ?? true,
      colourOptions: raw.colourOptions?.map(option => ({ ...option })),
      widthOptions: raw.widthOptions?.map(option => ({ ...option })),
      symbolPresets: raw.symbolPresets?.map(preset => ({ ...preset })),
      selectedSymbolId: raw.selectedSymbolId && raw.symbolPresets?.some(preset => preset.id === raw.selectedSymbolId) ? raw.selectedSymbolId : undefined,
      brushStrokeStyle: raw.brushStrokeStyle,
      brushFillPattern: raw.brushFillPattern,
    };
    return next;
  }

  private normalizeLayer(layer: AnnotationLayerRecord, availableLabelIds: string[]): AnnotationLayerRecord {
    const validClassIds = (layer.classIds ?? []).filter(classId => availableLabelIds.includes(classId));
    return {
      ...this.cloneLayer(layer),
      classIds: validClassIds,
    };
  }

  private createEmptyState(): EmrClinicalAnnotationCanvasState {
    return this.normalizeState({
      instanceId: 'emr-clinical-annotation-canvas',
      title: 'Clinical annotation',
      description: 'Choose an anatomy image and capture annotations as independent layers.',
      imageTemplates: [],
      availableLabels: [],
      selectedTool: 'line',
      brushColor: '',
      brushWidth: 2,
      layers: [],
      showLayerPanel: true,
      readOnly: false,
      textContent: 'Annotation',
      photoUploadHint: 'Upload a clinical photo and apply class labels to each annotation.',
      photoAccept: 'image/*',
    });
  }

  private distance(first: AnnotationPoint, second: AnnotationPoint): number {
    const deltaX = first.x - second.x;
    const deltaY = first.y - second.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private isDuplicatePoint(points: AnnotationPoint[], candidate: AnnotationPoint): boolean {
    return points.some(point => this.distance(point, candidate) < 0.005);
  }

  private normalizePolygonPoints(points: AnnotationPoint[]): AnnotationPoint[] {
    return points.length > 2 ? [...points] : [...points];
  }

  private resampleCurve(points: AnnotationPoint[], point: AnnotationPoint): AnnotationPoint[] {
    const end = this.drawing?.tool === 'curve' ? point : points[1] ?? point;
    return [points[0], ...points.slice(1), end];
  }

  private closeLine(points: AnnotationPoint[]): AnnotationPoint[] {
    return points.length > 1 ? [...points] : [];
  }

  /** Coordinate clamp (0–1 normalised space). Not for brush width — see `clampBrushWidth`. */
  private clamp(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  private clampBrushWidth(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value)) return 2;
    return Math.max(1, Math.min(12, Math.round(value)));
  }

  /**
   * Layer ids must be unique against layers already in the model — a rehydrated model
   * can carry `annot-1…n` from a prior session, and a duplicate id breaks `track`,
   * selection, visibility and removal (which would hit every matching layer).
   */
  private newLayerId(): string {
    const taken = new Set(this.state.layers.map(layer => layer.id));
    let id = `annot-${this.nextLayerId += 1}`;
    while (taken.has(id)) id = `annot-${this.nextLayerId += 1}`;
    return id;
  }
}
