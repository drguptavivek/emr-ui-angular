import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPhoto } from '@ng-icons/heroicons/outline';
import type {
  AnnotationCircleRecord,
  AnnotationLayerRecord,
  AnnotationLineRecord,
  AnnotationPathRecord,
  AnnotationPoint,
  AnnotationTextRecord,
  AnnotationTool,
  EmrAnnotationLabel,
  EmrClinicalAnnotationCanvasIntent,
  EmrClinicalAnnotationCanvasState,
  EmrClinicalImageTemplate,
} from '@drguptavivek/emr-controller';

interface EmrDrawingDraft {
  tool: AnnotationTool;
  points: AnnotationPoint[];
}

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
                <option [value]="image.id" [selected]="image.id === state.selectedImageId">{{ image.label }}</option>
              }
            </select>
          </label>
        </div>
        <div class="emr-annotation-canvas__label-control">
          <label>
            <span>Annotation class</span>
            <select class="emr-select" [value]="state.selectedLabelId || ''" (change)="setSelectedLabel($event)" [disabled]="readOnly">
              <option value="" [selected]="!state.selectedLabelId">No class</option>
              @for (label of state.availableLabels; track label.id) {
                <option [value]="label.id" [selected]="label.id === state.selectedLabelId">{{ label.label }}</option>
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
          [style.aspect-ratio]="surfaceWidth() + ' / ' + surfaceHeight()"
        >
          @if (selectedImage(); as image) {
            <img class="emr-annotation-canvas__image" [src]="image.imageUrl" [alt]="image.altText ?? 'clinical image background'" />
          } @else {
            <p class="emr-annotation-canvas__empty">No background image. Upload a photo or ask for a template to be added.</p>
          }
          <svg class="emr-annotation-canvas__overlay" [attr.viewBox]="'0 0 ' + surfaceWidth() + ' ' + surfaceHeight()" preserveAspectRatio="none">
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
                        [attr.rx]="pointToCanvasX(layer.radiusX)"
                        [attr.ry]="pointToCanvasY(layer.radiusY)"
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
                        [attr.rx]="pointToCanvasX(layer.radiusX)"
                        [attr.ry]="pointToCanvasY(layer.radiusY)"
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
        </div>

        <aside class="emr-annotation-canvas__layers" [class.emr-annotation-canvas__layers--hidden]="!layerPanelVisible">
          <header class="emr-annotation-canvas__layers-header">
            <h3>Drawings ({{ state.layers.length }})</h3>
            <button class="emr-icon-button" type="button" [disabled]="readOnly" (click)="addTextLayerFromCurrentInput()" aria-label="Add text annotation">➕</button>
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
                    <option value="" [selected]="!layerLabel(layer)">No class</option>
                    @for (label of state.availableLabels; track label.id) {
                      <option [value]="label.id" [selected]="label.id === layerLabel(layer)">{{ label.label }}</option>
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
  protected readonly availableTools: AnnotationTool[] = ['text', 'line', 'curve', 'circle', 'polygon', 'freeform'];

  protected state: EmrClinicalAnnotationCanvasState;
  protected drawing: EmrDrawingDraft | null = null;
  protected layerPanelVisible = true;
  protected drawingPointerDown = false;
  private nextLayerId = 0;
  private undoStack: EmrClinicalAnnotationCanvasState[] = [];
  private redoStack: EmrClinicalAnnotationCanvasState[] = [];
  private readonly maxHistory = 40;
  private readonly fallbackSurface = 1000;

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

  protected toolLabel(tool: AnnotationTool): string {
    if (tool === 'freeform') return 'Freeform';
    return `${tool[0].toUpperCase()}${tool.slice(1)}`;
  }

  protected layerLabel(layer: AnnotationLayerRecord): string {
    const current = layer.classIds?.[0] ?? '';
    return current;
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

  protected activateTool(tool: AnnotationTool): void {
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
    // Reading, storing and registering the image is controller work: it answers with a new
    // template (stable id, URL, intrinsic size) in the next model.
    if (!this.readOnly) this.nativeFilesSelected.emit(files);
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
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: AnnotationPathRecord = {
      id: this.newLayerId(),
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

  protected addLayerFromText(point: AnnotationPoint): void {
    const draftText = (this.state.textContent ?? '').trim();
    const text = draftText.length ? draftText : 'Text';
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    const layer: AnnotationTextRecord = {
      id: this.newLayerId(),
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

  private finalizeDrawing(point: AnnotationPoint): void {
    const draft = this.drawing;
    if (!draft || this.readOnly) return;
    const brushColor = this.state.brushColor;
    const brushWidth = this.state.brushWidth ?? 2;
    if (draft.tool === 'line') {
      const pointStart = draft.points[0];
      if (!pointStart) {
        this.drawing = null;
        return;
      }
      const line: AnnotationLineRecord = {
        id: this.newLayerId(),
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
      const curve: AnnotationPathRecord = {
        id: this.newLayerId(),
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
        const freeform: AnnotationPathRecord = {
          id: this.newLayerId(),
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
        const circle: AnnotationCircleRecord = {
          id: this.newLayerId(),
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

  private defaultTextPoint(): AnnotationPoint {
    return { x: 0.42, y: 0.48 };
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
