import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPhoto } from '@ng-icons/heroicons/outline';

export type EmrAnnotationTool = 'text' | 'line' | 'curve' | 'circle' | 'polygon' | 'freeform';

export interface EmrAnnotationPoint {
  x: number;
  y: number;
}

export interface EmrClinicalImageTemplate {
  id: string;
  label: string;
  imageUrl: string;
  altText?: string;
}

export interface EmrAnnotationLabel {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

export interface EmrAnnotationLayerBase {
  id: string;
  tool: EmrAnnotationTool;
  label: string;
  color: string;
  strokeWidth: number;
  visible: boolean;
  classIds?: string[];
}

export interface EmrAnnotationTextLayer extends EmrAnnotationLayerBase {
  tool: 'text';
  point: EmrAnnotationPoint;
  text: string;
  fontSize: number;
}

export interface EmrAnnotationLineLayer extends EmrAnnotationLayerBase {
  tool: 'line';
  points: [EmrAnnotationPoint, EmrAnnotationPoint];
}

export interface EmrAnnotationCurveLayer extends EmrAnnotationLayerBase {
  tool: 'curve';
  points: EmrAnnotationPoint[];
}

export interface EmrAnnotationCircleLayer extends EmrAnnotationLayerBase {
  tool: 'circle';
  center: EmrAnnotationPoint;
  radiusX: number;
  radiusY: number;
}

export interface EmrAnnotationPolygonLayer extends EmrAnnotationLayerBase {
  tool: 'polygon';
  points: EmrAnnotationPoint[];
}

export interface EmrAnnotationFreeformLayer extends EmrAnnotationLayerBase {
  tool: 'freeform';
  points: EmrAnnotationPoint[];
}

export type EmrAnnotationLayer =
  | EmrAnnotationTextLayer
  | EmrAnnotationLineLayer
  | EmrAnnotationCurveLayer
  | EmrAnnotationCircleLayer
  | EmrAnnotationPolygonLayer
  | EmrAnnotationFreeformLayer;

export interface EmrClinicalAnnotationCanvasState {
  instanceId: string;
  title: string;
  description?: string;
  imageTemplates: EmrClinicalImageTemplate[];
  availableLabels: EmrAnnotationLabel[];
  selectedImageId?: string;
  selectedLabelId?: string;
  selectedTool?: EmrAnnotationTool;
  brushColor?: string;
  brushWidth?: number;
  layers: EmrAnnotationLayer[];
  selectedLayerId?: string;
  textContent?: string;
  showLayerPanel?: boolean;
  photoUploadHint?: string;
  readOnly?: boolean;
  photoAccept?: string;
}

export interface EmrClinicalAnnotationCanvasIntent {
  type: 'stateChanged' | 'undoRequested' | 'redoRequested' | 'saveRequested';
  state: EmrClinicalAnnotationCanvasState;
  reason: string;
}

interface EmrDrawingDraft {
  tool: EmrAnnotationTool;
  points: EmrAnnotationPoint[];
}

const dataUriFromSvg = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const FALLBACK_TEMPLATES: EmrClinicalImageTemplate[] = [
  {
    id: 'abdominal-outline',
    label: 'Abdominal outline',
    altText: 'Abdominal anatomy outline',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' viewBox='0 0 1600 1000'><rect width='1600' height='1000' fill='#f8fafc'/><path d='M460 145 C420 210 400 290 430 360 C470 440 505 520 510 610 C510 720 560 760 620 840 C670 900 750 900 810 840 C880 760 920 720 920 610 C925 520 960 440 1000 360 C1030 290 1010 210 970 145 L830 170 L740 90 L620 150 L500 90 L460 145 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><circle cx='700' cy='930' r='110' fill='none' stroke='#94a3b8' stroke-width='12'/></svg>`)
  },
  {
    id: 'limb-outline',
    label: 'Limb outline',
    altText: 'Limb anatomy outline',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' viewBox='0 0 1200 1200'><rect width='1200' height='1200' fill='#f8fafc'/><path d='M600 40 L560 190 L540 270 L525 360 L610 620 L660 790 C665 815 675 845 690 870 L730 925 C745 950 760 980 760 1010 C760 1050 740 1090 700 1115 L760 1180 M600 40 L660 190 L680 270 L695 360 L690 620 L640 790 C635 815 625 845 610 870 L570 925 C555 950 540 980 540 1010 C540 1050 560 1090 600 1115 L540 1180 M600 620 L600 760 M580 760 L620 760 C640 760 660 790 650 815 L620 855 C603 870 580 875 560 865 L535 850 C515 840 500 815 510 780 L520 760 L580 760' fill='none' stroke='#94a3b8' stroke-width='10'/><path d='M520 760 L455 830 C445 840 430 835 435 820 L455 785 C465 760 470 740 450 735 C430 730 430 705 450 700 L585 665 C595 663 600 640 585 635 L455 560 C440 553 442 530 460 530 L580 530 C595 530 600 515 595 505 L560 430 C553 415 572 400 588 408 L655 450 C670 458 690 445 690 430 L690 360 C690 345 705 332 720 338 L770 355' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
  {
    id: 'scalp-outline',
    label: 'Scalp outline',
    altText: 'Scalp anatomy outline',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'><rect width='1200' height='900' fill='#f8fafc'/><path d='M360 300 C480 110 720 110 840 300 C920 420 930 610 820 700 C700 790 500 790 380 700 C270 610 280 420 360 300 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><path d='M390 340 C495 225 705 225 810 340' fill='none' stroke='#94a3b8' stroke-width='6'/><path d='M420 430 C510 455 690 455 780 430' fill='none' stroke='#94a3b8' stroke-width='6'/><path d='M430 520 C525 545 675 545 770 520' fill='none' stroke='#94a3b8' stroke-width='6'/><line x1='460' y1='250' x2='740' y2='250' stroke='#94a3b8' stroke-width='4'/></svg>`)
  },
  {
    id: 'body-outline',
    label: 'Whole body outline',
    altText: 'Human body outline',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1400' viewBox='0 0 1200 1400'><rect width='1200' height='1400' fill='#f8fafc'/><ellipse cx='600' cy='220' rx='115' ry='130' fill='none' stroke='#94a3b8' stroke-width='10'/><path d='M480 320 L430 530 L430 840 C420 920 370 1060 320 1120 C300 1150 250 1185 280 1220 C300 1240 325 1230 360 1215 C430 1180 520 1130 600 1130 C680 1130 770 1180 840 1215 C875 1230 900 1240 920 1220 C950 1185 900 1150 880 1120 C830 1060 780 920 770 840 L770 530 L720 320 C720 220 610 140 600 150 C590 140 480 220 480 320 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><path d='M600 150 C575 70 635 70 610 150' fill='none' stroke='#94a3b8' stroke-width='10'/></svg>`)
  },
  {
    id: 'retina-od',
    label: 'Retina OD',
    altText: 'Right eye retina schematic',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='900' viewBox='0 0 1000 900'><rect width='1000' height='900' fill='#f8fafc'/><circle cx='500' cy='420' r='250' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='500' cy='420' r='30' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='300' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><circle cx='700' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><path d='M500 180 C620 190 700 300 720 420 C700 540 620 650 500 660 C380 650 300 540 280 420 C300 300 380 190 500 180' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
  {
    id: 'retina-os',
    label: 'Retina OS',
    altText: 'Left eye retina schematic',
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='900' viewBox='0 0 1000 900'><rect width='1000' height='900' fill='#f8fafc'/><circle cx='500' cy='420' r='250' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='500' cy='420' r='30' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='300' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><circle cx='700' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><path d='M500 180 C380 190 300 300 280 420 C300 540 380 650 500 660 C620 650 700 540 720 420 C700 300 620 190 500 180' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
];

const FALLBACK_LABELS: EmrAnnotationLabel[] = [
  { id: 'lesion', label: 'Lesion' },
  { id: 'normal', label: 'Normal' },
  { id: 'scar', label: 'Scar' },
  { id: 'inflammation', label: 'Inflammation' },
];

@Component({
  selector: 'emr-clinical-annotation-canvas',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [...provideIcons({ heroPhoto })],
  host: { class: 'emr-clinical-annotation-canvas' },
  template: `
    <section [attr.aria-labelledby]="headingId">
      <header class="emr-annotation-canvas__header">
        <div>
          <ng-icon class="emr-card-header-icon" name="heroPhoto" aria-hidden="true" />
          <h2 class="emr-annotation-canvas__title" [id]="headingId">{{ state.title }}</h2>
          @if (state.description) { <p class="emr-annotation-canvas__description">{{ state.description }}</p> }
        </div>
        <div class="emr-annotation-canvas__header-actions">
          <button class="emr-button emr-button--ghost" type="button" (click)="toggleLayerPanel()" [disabled]="readOnly" aria-label="Open drawings panel">
            {{ layerPanelVisible ? 'Hide' : 'Show' }} drawings
          </button>
          <button class="emr-button" type="button" (click)="undo()" [disabled]="undoDisabled" aria-label="Undo last action">Undo</button>
          <button class="emr-button" type="button" (click)="redo()" [disabled]="redoDisabled" aria-label="Redo last action">Redo</button>
          <button class="emr-button emr-button--outline" type="button" (click)="save()" aria-label="Save annotations">Save</button>
        </div>
      </header>

      <div class="emr-annotation-canvas__toolbar">
        <div class="emr-annotation-canvas__upload">
          <label>
            <span>Upload photo</span>
            <input type="file" [disabled]="readOnly" accept="{{ state.photoAccept || 'image/*' }}" (change)="setPhoto($event)" />
            <small>{{ state.photoUploadHint || 'Upload a photo and start annotating immediately.' }}</small>
          </label>
        </div>
        <div class="emr-annotation-canvas__control">
          <label>
            <span>Background image</span>
            <select class="emr-select" [value]="state.selectedImageId" (change)="setBackground($event)" [disabled]="readOnly">
              @for (image of state.imageTemplates; track image.id) {
                <option [value]="image.id">{{ image.label }}</option>
              }
            </select>
          </label>
        </div>
        <div class="emr-annotation-canvas__label-control">
          <label>
            <span>Annotation class</span>
            <select class="emr-select" [value]="state.selectedLabelId || ''" (change)="setSelectedLabel($event)" [disabled]="readOnly">
              <option value="">No class</option>
              @for (label of state.availableLabels; track label.id) {
                <option [value]="label.id">{{ label.label }}</option>
              }
            </select>
          </label>
        </div>
        <div class="emr-annotation-canvas__tools" role="group" aria-label="Annotation tools">
          @for (tool of availableTools; track tool) {
            <button
              class="emr-button"
              type="button"
              [class.emr-button--secondary]="state.selectedTool === tool"
              [disabled]="readOnly"
              (click)="activateTool(tool)"
            >{{ toolLabel(tool) }}</button>
          }
        </div>
        <div class="emr-annotation-canvas__pen">
          <label>
            <span>Color</span>
            <input class="emr-annotation-color" type="color" [value]="state.brushColor" (input)="setBrushColor($event)" [disabled]="readOnly" />
          </label>
          <label>
            <span>Width</span>
            <input class="emr-annotation-range" type="range" min="1" max="12" step="1" [value]="state.brushWidth" (input)="setBrushWidth($event)" [disabled]="readOnly" />
          </label>
          <label class="emr-annotation-canvas__text-input">
            <span>Text value</span>
            <input
              class="emr-control"
              type="text"
              maxlength="120"
              [value]="state.textContent"
              placeholder="Type note and click on image"
              (input)="setTextContent($event)"
              [disabled]="readOnly"
            />
          </label>
        </div>
      </div>

      @if (state.selectedTool === 'polygon' && drawing?.tool === 'polygon') {
        <div class="emr-annotation-canvas__notice">
          Click to add polygon points. Click again near the first point or use Finish polygon to close.
          <button class="emr-button emr-button--outline" type="button" (click)="finishPolygon()" [disabled]="readOnly">Finish polygon</button>
        </div>
      }

      <div class="emr-annotation-canvas__workbench">
        <div
          class="emr-annotation-canvas__canvas"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (dblclick)="finishPolygon()"
          [attr.aria-label]="'Annotation canvas for ' + state.title"
        >
          <img class="emr-annotation-canvas__image" [src]="selectedImage().imageUrl" [alt]="selectedImage().altText ?? 'clinical image background'" />
          <svg class="emr-annotation-canvas__overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            @for (layer of state.layers; track layer.id) {
              @if (layer.visible) {
                <g [class.emr-annotation-canvas__hidden-layer]="!layer.visible">
                  @switch (layer.tool) {
                    @case ('text') {
                      <text
                        class="emr-annotation-canvas__text"
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
                        [attr.stroke-width]="layer.strokeWidth"
                      ></line>
                    }
                    @case ('curve') {
                      <path
                        [attr.d]="pathFromPoints(layer.points)"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        fill="none"
                      ></path>
                    }
                    @case ('freeform') {
                      <path
                        [attr.d]="pathFromPoints(layer.points)"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        fill="none"
                      ></path>
                    }
                    @case ('circle') {
                      <ellipse
                        [attr.cx]="pointToCanvasX(layer.center.x)"
                        [attr.cy]="pointToCanvasY(layer.center.y)"
                        [attr.rx]="layer.radiusX * 1000"
                        [attr.ry]="layer.radiusY * 1000"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                      ></ellipse>
                    }
                    @case ('polygon') {
                      <polygon [attr.points]="pointsToSvg(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="layer.strokeWidth" fill="none"></polygon>
                    }
                  }
                </g>
              } @else {
                <g [style.opacity]="0.35">
                  @switch (layer.tool) {
                    @case ('text') {
                      <text
                        class="emr-annotation-canvas__text"
                        [attr.x]="pointToCanvasX(layer.point.x)"
                        [attr.y]="pointToCanvasY(layer.point.y)"
                        [attr.fill]="layer.color"
                        [attr.font-size]="layer.fontSize"
                        [attr.fill-opacity]="0.35"
                      >{{ layer.text }}</text>
                    }
                    @case ('line') {
                      <line
                        [attr.x1]="pointToCanvasX(layer.points[0].x)"
                        [attr.y1]="pointToCanvasY(layer.points[0].y)"
                        [attr.x2]="pointToCanvasX(layer.points[1].x)"
                        [attr.y2]="pointToCanvasY(layer.points[1].y)"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        [attr.stroke-opacity]="0.35"
                      ></line>
                    }
                    @case ('curve') {
                      <path
                        [attr.d]="pathFromPoints(layer.points)"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        [attr.stroke-opacity]="0.35"
                        fill="none"
                      ></path>
                    }
                    @case ('freeform') {
                      <path
                        [attr.d]="pathFromPoints(layer.points)"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        [attr.stroke-opacity]="0.35"
                        fill="none"
                      ></path>
                    }
                    @case ('circle') {
                      <ellipse
                        [attr.cx]="pointToCanvasX(layer.center.x)"
                        [attr.cy]="pointToCanvasY(layer.center.y)"
                        [attr.rx]="layer.radiusX * 1000"
                        [attr.ry]="layer.radiusY * 1000"
                        [attr.stroke]="layer.color"
                        [attr.stroke-width]="layer.strokeWidth"
                        [attr.stroke-opacity]="0.35"
                      ></ellipse>
                    }
                    @case ('polygon') {
                      <polygon [attr.points]="pointsToSvg(layer.points)" [attr.stroke]="layer.color" [attr.stroke-width]="layer.strokeWidth" [attr.stroke-opacity]="0.35" fill="none"></polygon>
                    }
                  }
                </g>
              }
            }
            @if (drawing; as draft) {
              @if (draft.tool === 'line' || draft.tool === 'curve' || draft.tool === 'freeform') {
                <path [attr.d]="activePathFromDraft(draft)" [attr.stroke]="state.brushColor" [attr.stroke-width]="state.brushWidth" fill="none" stroke-dasharray="12 8"></path>
              }
              @if (draft.tool === 'circle' && draft.points.length === 2) {
                <ellipse
                  [attr.cx]="pointToCanvasX(draft.points[0].x)"
                  [attr.cy]="pointToCanvasY(draft.points[0].y)"
                  [attr.rx]="Math.abs(draft.points[0].x - draft.points[1].x) * 1000"
                  [attr.ry]="Math.abs(draft.points[0].y - draft.points[1].y) * 1000"
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
        </div>

        <aside class="emr-annotation-canvas__layers" [class.emr-annotation-canvas__layers--hidden]="!layerPanelVisible">
          <header class="emr-annotation-canvas__layers-header">
            <h3>Drawings ({{ state.layers.length }})</h3>
            <button class="emr-icon-button" type="button" [disabled]="readOnly" (click)="addTextLayerFromCurrentInput()">➕</button>
          </header>
          <ul class="emr-annotation-canvas__layer-list">
          @for (layer of state.layers; track layer.id; let index = $index) {
              <li class="emr-annotation-canvas__layer-row" [class.emr-annotation-canvas__layer-row--active]="state.selectedLayerId === layer.id">
                <button class="emr-icon-button" type="button" [attr.aria-pressed]="layer.visible" (click)="toggleLayerVisibility(layer.id)" [attr.aria-label]="layer.visible ? 'Hide drawing ' + layer.id : 'Show drawing ' + layer.id">
                  {{ layer.visible ? '👁' : '🙈' }}
                </button>
                <button class="emr-button emr-button--outline" type="button" (click)="selectLayer(layer.id)" [attr.aria-pressed]="state.selectedLayerId === layer.id">
                  {{ layer.label }}
                </button>
                <label class="emr-annotation-canvas__layer-class-label">
                  <span class="emr-sr-only">Annotation class</span>
                  <select
                    class="emr-annotation-canvas__layer-class-select"
                    [value]="layerLabel(layer)"
                    (change)="setLayerLabel(layer.id, $event)"
                    [disabled]="readOnly"
                  >
                    <option value="">No class</option>
                    @for (label of state.availableLabels; track label.id) {
                      <option [value]="label.id">{{ label.label }}</option>
                    }
                  </select>
                </label>
                <div class="emr-annotation-canvas__layer-actions">
                  <button class="emr-icon-button" type="button" (click)="moveLayer(layer.id, -1)" [disabled]="index === 0 || readOnly" aria-label="Move layer up">↑</button>
                  <button class="emr-icon-button" type="button" (click)="moveLayer(layer.id, 1)" [disabled]="index === state.layers.length - 1 || readOnly" aria-label="Move layer down">↓</button>
                  <button class="emr-icon-button" type="button" (click)="removeLayer(layer.id)" [disabled]="readOnly" aria-label="Delete layer">🗑</button>
                </div>
              </li>
            }
          </ul>
          <p class="emr-annotation-canvas__layer-hint">Tip: hide, reorder and delete each drawing independently.</p>
        </aside>
      </div>
    </section>
  `,
})
export class EmrClinicalAnnotationCanvasComponent implements OnChanges {
  @Input({ required: true }) model!: EmrClinicalAnnotationCanvasState;
  @Input() headingId = 'emr-clinical-annotation-canvas-heading';
  @Output() readonly intent = new EventEmitter<EmrClinicalAnnotationCanvasIntent>();
  @Output() readonly nativeFilesSelected = new EventEmitter<readonly File[]>();
  protected readonly Math = Math;
  protected readonly availableTools: EmrAnnotationTool[] = ['text', 'line', 'curve', 'circle', 'polygon', 'freeform'];

  protected state: EmrClinicalAnnotationCanvasState;
  protected drawing: EmrDrawingDraft | null = null;
  protected layerPanelVisible = true;
  protected drawingPointerDown = false;
  private nextLayerId = 0;
  private uploadedImageSequence = 0;
  private undoStack: EmrClinicalAnnotationCanvasState[] = [];
  private redoStack: EmrClinicalAnnotationCanvasState[] = [];
  private readonly maxHistory = 40;
  private readonly svgScale = 1000;

  constructor() {
    this.state = this.createEmptyState();
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
    this.drawing = null;
    this.undoStack = [];
    this.redoStack = [];
    this.layerPanelVisible = this.state.showLayerPanel ?? true;
  }

  protected toolLabel(tool: EmrAnnotationTool): string {
    if (tool === 'freeform') return 'Freeform';
    return `${tool[0].toUpperCase()}${tool.slice(1)}`;
  }

  protected layerLabel(layer: EmrAnnotationLayer): string {
    const current = layer.classIds?.[0] ?? '';
    return current;
  }

  protected labelDefinition(labelId: string): EmrAnnotationLabel | undefined {
    return this.state.availableLabels.find(candidate => candidate.id === labelId);
  }

  protected selectedImage(): EmrClinicalImageTemplate {
    return (
      this.state.imageTemplates.find(image => image.id === this.state.selectedImageId) ??
      FALLBACK_TEMPLATES[0]
    );
  }

  protected pointToCanvasX(value: number): number {
    return value * this.svgScale;
  }

  protected pointToCanvasY(value: number): number {
    return value * this.svgScale;
  }

  protected pointsToSvg(points: EmrAnnotationPoint[]): string {
    return points.map(point => `${this.pointToCanvasX(point.x)},${this.pointToCanvasY(point.y)}`).join(' ');
  }

  protected pathFromPoints(points: EmrAnnotationPoint[]): string {
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
    if (draft.tool === 'line' || draft.tool === 'freeform') {
      return this.pathFromPoints(draft.points);
    }
    if (draft.tool === 'curve') {
      return this.pathFromPoints(draft.points.length > 2 ? draft.points : [...draft.points, draft.points[0]]);
    }
    return '';
  }

  protected nextLayerClassIds(): string[] {
    const selectedLabelId = this.state.selectedLabelId;
    if (selectedLabelId && this.labelDefinition(selectedLabelId)) {
      return [selectedLabelId];
    }
    return [];
  }

  protected activateTool(tool: EmrAnnotationTool): void {
    if (this.readOnly) return;
    const next = this.cloneState(this.state);
    next.selectedTool = tool;
    this.applyState(next, `tool-changed:${tool}`);
    this.drawing = null;
  }

  protected toggleLayerPanel(): void {
    this.layerPanelVisible = !this.layerPanelVisible;
    const next = this.cloneState(this.state);
    next.showLayerPanel = this.layerPanelVisible;
    this.applyState(next, 'layer-panel-toggled');
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

  protected setLayerLabel(layerId: string, event: Event): void {
    const selectedLabelId = (event.target as HTMLSelectElement).value || undefined;
    const next = this.cloneState(this.state);
    const layer = next.layers.find(candidate => candidate.id === layerId);
    if (!layer) return;
    layer.classIds = selectedLabelId ? [selectedLabelId] : [];
    this.applyState(next, `layer-label:${layerId}:${selectedLabelId ?? 'unlabelled'}`);
  }

  protected setPhoto(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.nativeFilesSelected.emit(files);
    const file = files[0];
    if (!file || this.readOnly) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageUrl) return;
      const next = this.cloneState(this.state);
      const uploadedId = `upload-${this.uploadedImageSequence += 1}-${this.safeImageId(file.name)}`;
      const uploadedImage: EmrClinicalImageTemplate = {
        id: uploadedId,
        label: `Uploaded: ${file.name || uploadedId}`,
        imageUrl,
        altText: file.name || 'Uploaded clinical image',
      };
      next.imageTemplates = [uploadedImage, ...next.imageTemplates.filter(image => image.id !== uploadedId)];
      next.selectedImageId = uploadedId;
      this.applyState(next, `photo-uploaded:${uploadedId}`);
    };
    reader.readAsDataURL(file);
  }

  protected setBrushColor(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const next = this.cloneState(this.state);
    next.brushColor = value;
    this.applyState(next, `brush-color:${value}`);
  }

  protected setBrushWidth(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const next = this.cloneState(this.state);
    next.brushWidth = Math.max(1, Math.min(12, Number.isFinite(value) ? Math.round(value) : this.state.brushWidth ?? 2));
    this.applyState(next, `brush-width:${next.brushWidth}`);
  }

  protected setTextContent(event: Event): void {
    const textContent = (event.target as HTMLInputElement).value;
    const next = this.cloneState(this.state);
    next.textContent = textContent;
    this.applyState(next, 'text-content-changed');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.readOnly) return;
    if (event.button !== 0) return;
    event.preventDefault();
    const point = this.toRelativePoint(event);
    if (!point) return;
    if (!this.state.selectedTool) this.state.selectedTool = 'line';
    this.drawingPointerDown = true;

    if (this.state.selectedTool === 'text') {
      this.addLayerFromText(point);
      this.drawingPointerDown = false;
      return;
    }

    if (this.state.selectedTool === 'polygon') {
      this.extendPolygon(point);
      return;
    }

    this.drawing = { tool: this.state.selectedTool, points: [point] };
    if (this.state.selectedTool === 'line' || this.state.selectedTool === 'curve') {
      this.drawing.points = [point, point];
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drawingPointerDown || !this.drawing || this.readOnly) return;
    const point = this.toRelativePoint(event);
    if (!point) return;
    const tool = this.drawing.tool;
    if (tool === 'line' || tool === 'curve') {
      if (this.drawing.points.length === 1) this.drawing.points = [this.drawing.points[0], point];
      else this.drawing.points = [this.drawing.points[0], point];
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
    const brushColor = this.state.brushColor ?? '#0f766e';
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: EmrAnnotationPolygonLayer = {
      id: `annot-${this.nextLayerId += 1}`,
      tool: 'polygon',
      label: `Polygon ${this.nextLayerId}`,
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds: this.nextLayerClassIds(),
      points: polygonPoints,
    };
    const next = this.cloneState(this.state);
    next.layers = [...next.layers, layer];
    next.selectedLayerId = layer.id;
    this.applyState(next, 'polygon-added');
    this.drawing = null;
  }

  protected addTextLayerFromCurrentInput(): void {
    if (this.readOnly) return;
    const selectedPoint = this.defaultTextPoint();
    this.addLayerFromText(selectedPoint);
  }

  protected addLayerFromText(point: EmrAnnotationPoint): void {
    const draftText = (this.state.textContent ?? '').trim();
    const text = draftText.length ? draftText : 'Text';
    const brushColor = this.state.brushColor ?? '#0f766e';
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: EmrAnnotationTextLayer = {
      id: `annot-${this.nextLayerId += 1}`,
      tool: 'text',
      label: `Text ${this.nextLayerId}`,
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
    this.state = this.cloneState(snapshot);
    this.intent.emit({ type: 'undoRequested', state: this.cloneState(this.state), reason: 'undo' });
  }

  protected redo(): void {
    if (this.redoDisabled) return;
    const snapshot = this.redoStack[this.redoStack.length - 1];
    const current = this.cloneState(this.state);
    this.redoStack = this.redoStack.slice(0, -1);
    this.undoStack = [...this.undoStack, current];
    this.state = this.cloneState(snapshot);
    this.intent.emit({ type: 'redoRequested', state: this.cloneState(this.state), reason: 'redo' });
  }

  protected save(): void {
    this.intent.emit({ type: 'saveRequested', state: this.cloneState(this.state), reason: 'save' });
  }

  protected addTextFromToolbar(): void {
    const next = this.cloneState(this.state);
    next.selectedTool = 'text';
    this.applyState(next, 'tool-text');
  }

  private finalizeDrawing(point: EmrAnnotationPoint): void {
    const draft = this.drawing;
    if (!draft || this.readOnly) return;
    const brushColor = this.state.brushColor ?? '#0f766e';
    const brushWidth = this.state.brushWidth ?? 2;
    if (draft.tool === 'line') {
      const pointStart = draft.points[0];
      if (!pointStart) {
        this.drawing = null;
        return;
      }
      const line: EmrAnnotationLineLayer = {
        id: `annot-${this.nextLayerId += 1}`,
        tool: 'line' as const,
        label: `Line ${this.nextLayerId}`,
        color: brushColor,
        strokeWidth: brushWidth,
        visible: true,
        classIds: this.nextLayerClassIds(),
        points: [pointStart, point],
      };
      const next = this.cloneState(this.state);
      next.layers = [...next.layers, line];
      next.selectedLayerId = line.id;
      this.applyState(next, 'line-added');
    }
    if (draft.tool === 'curve') {
      const smoothed = this.resampleCurve(draft.points, point);
      const curve = {
        id: `annot-${this.nextLayerId += 1}`,
        tool: 'curve' as const,
        label: `Curve ${this.nextLayerId}`,
        color: brushColor,
        strokeWidth: brushWidth,
        visible: true,
        classIds: this.nextLayerClassIds(),
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
        const freeform = {
          id: `annot-${this.nextLayerId += 1}`,
          tool: 'freeform' as const,
          label: `Freeform ${this.nextLayerId}`,
          color: brushColor,
          strokeWidth: brushWidth,
          visible: true,
          classIds: this.nextLayerClassIds(),
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
        const circle = {
          id: `annot-${this.nextLayerId += 1}`,
          tool: 'circle' as const,
          label: `Circle ${this.nextLayerId}`,
          color: brushColor,
          strokeWidth: brushWidth,
          visible: true,
          classIds: this.nextLayerClassIds(),
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

  private extendPolygon(point: EmrAnnotationPoint): void {
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

  private toRelativePoint(event: PointerEvent): EmrAnnotationPoint | null {
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
    const previous = this.cloneState(this.state);
    this.undoStack = [...this.undoStack.slice(-this.maxHistory + 1), previous];
    this.redoStack = [];
    this.state = normalized;
    this.drawing = null;
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
    };
  }

  private cloneLayer(layer: EmrAnnotationLayer): EmrAnnotationLayer {
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
    const imageTemplates = raw.imageTemplates.length > 0 ? raw.imageTemplates : FALLBACK_TEMPLATES;
    const availableLabels = raw.availableLabels.length > 0 ? raw.availableLabels : FALLBACK_LABELS;
    const selectedImageId = raw.selectedImageId && imageTemplates.some(image => image.id === raw.selectedImageId) ? raw.selectedImageId : imageTemplates[0]?.id;
    const selectedLabelId = raw.selectedLabelId && availableLabels.some(label => label.id === raw.selectedLabelId) ? raw.selectedLabelId : availableLabels[0]?.id;
    const normalizedSelectedTool = raw.selectedTool ?? 'line';
    const brushColor = raw.brushColor ?? '#0f766e';
    const brushWidth = Number.isFinite(raw.brushWidth ?? 2) ? this.clamp(raw.brushWidth ?? 2) : 2;
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
    };
    return next;
  }

  private normalizeLayer(layer: EmrAnnotationLayer, availableLabelIds: string[]): EmrAnnotationLayer {
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
      imageTemplates: FALLBACK_TEMPLATES,
      availableLabels: FALLBACK_LABELS,
      selectedImageId: FALLBACK_TEMPLATES[0]?.id,
      selectedLabelId: FALLBACK_LABELS[0]?.id,
      selectedTool: 'line',
      brushColor: '#0f766e',
      brushWidth: 2,
      layers: [],
      showLayerPanel: true,
      readOnly: false,
      textContent: 'Annotation',
      photoUploadHint: 'Upload a clinical photo and apply class labels to each annotation.',
      photoAccept: 'image/*',
    });
  }

  private defaultTextPoint(): EmrAnnotationPoint {
    return { x: 0.42, y: 0.48 };
  }

  private distance(first: EmrAnnotationPoint, second: EmrAnnotationPoint): number {
    const deltaX = first.x - second.x;
    const deltaY = first.y - second.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private isDuplicatePoint(points: EmrAnnotationPoint[], candidate: EmrAnnotationPoint): boolean {
    return points.some(point => this.distance(point, candidate) < 0.005);
  }

  private normalizePolygonPoints(points: EmrAnnotationPoint[]): EmrAnnotationPoint[] {
    return points.length > 2 ? [...points] : [...points];
  }

  private resampleCurve(points: EmrAnnotationPoint[], point: EmrAnnotationPoint): EmrAnnotationPoint[] {
    const end = this.drawing?.tool === 'curve' ? point : points[1] ?? point;
    return [points[0], ...points.slice(1), end];
  }

  private closeLine(points: EmrAnnotationPoint[]): EmrAnnotationPoint[] {
    return points.length > 1 ? [...points] : [];
  }

  private safeImageId(fileName: string): string {
    if (!fileName) return `untitled-${Date.now()}`;
    return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private clamp(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }
}
