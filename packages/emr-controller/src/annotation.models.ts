/**
 * Framework-neutral serialization contract for clinical annotation payloads.
 *
 * The `EmrClinicalAnnotationCanvasComponent` (UI package) owns only transient
 * drawing behaviour and emits a `saveRequested` intent carrying its view state.
 * Persistence, versioning, and wire mapping are controller responsibilities, so
 * the durable payload shape and (de)serialization live here.
 */

/**
 * v2 replaced the optional `imageTemplateId` with a required `background` carrying
 * intrinsic dimensions. v1 is rejected rather than migrated: the library is unreleased
 * and no v1 payload was ever persisted, and a v1 payload lacks the dimensions needed to
 * place its points.
 */
export const ANNOTATION_SCHEMA_VERSION = 2 as const;

export type AnnotationTool =
  | 'text'
  | 'line'
  | 'curve'
  | 'circle'
  | 'polygon'
  | 'freeform';

/**
 * Normalized to the background image's intrinsic pixel rectangle: (0,0) is its top-left
 * corner, (1,1) its bottom-right, independent of how large it is rendered. x and y scale
 * separately, so a radius of 0.1 is 10% of the image width (radiusX) or height (radiusY).
 */
export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationLayerCommon {
  id: string;
  label: string;
  color: string;
  strokeWidth: number;
  visible: boolean;
  /** Controller-defined classification identifiers (e.g. lesion classes). */
  classIds?: readonly string[];
}

export interface AnnotationTextRecord extends AnnotationLayerCommon {
  tool: 'text';
  point: AnnotationPoint;
  text: string;
  fontSize: number;
}

export interface AnnotationLineRecord extends AnnotationLayerCommon {
  tool: 'line';
  points: readonly [AnnotationPoint, AnnotationPoint];
}

export interface AnnotationPathRecord extends AnnotationLayerCommon {
  tool: 'curve' | 'polygon' | 'freeform';
  points: readonly AnnotationPoint[];
}

export interface AnnotationCircleRecord extends AnnotationLayerCommon {
  tool: 'circle';
  center: AnnotationPoint;
  radiusX: number;
  radiusY: number;
}

export type AnnotationLayerRecord =
  | AnnotationTextRecord
  | AnnotationLineRecord
  | AnnotationPathRecord
  | AnnotationCircleRecord;

/**
 * Stable identity of the image the layers were drawn on. Never a URL: URLs and upload
 * handles are transient display resources the controller resolves from `imageId`.
 * Intrinsic dimensions pin the coordinate space, so a different image cannot silently
 * reinterpret the same normalized points.
 */
export interface AnnotationBackgroundRef {
  imageId: string;
  /** Intrinsic pixel size of the source image, not its rendered size. */
  width: number;
  height: number;
}

/** Durable, versioned annotation payload — the source of truth for persistence. */
export interface AnnotationDocument {
  schemaVersion: typeof ANNOTATION_SCHEMA_VERSION;
  instanceId: string;
  title: string;
  background: AnnotationBackgroundRef;
  layers: readonly AnnotationLayerRecord[];
  /** Optional ISO-8601 timestamp; supplied by the controller, never a browser global. */
  updatedAt?: string;
}

/** Promise + `AbortSignal` port, consistent with other repository contracts. */
export interface AnnotationRepositoryPort {
  save(document: AnnotationDocument, signal: AbortSignal): Promise<void>;
  load(instanceId: string, signal: AbortSignal): Promise<AnnotationDocument | null>;
}

/**
 * A background the controller offers. `imageUrl` is a transient display resource;
 * `id` is the durable identity. `width`/`height` are the image's intrinsic pixels and
 * size the drawing surface so marks stay registered at every rendered size. They must be
 * the true intrinsic size: wrong values letterbox the image inside the surface and marks
 * misregister, with nothing to flag it.
 */
export interface EmrClinicalImageTemplate {
  id: string;
  label: string;
  imageUrl: string;
  width: number;
  height: number;
  altText?: string;
}

/** A controller-defined annotation class (e.g. lesion type). */
export interface EmrAnnotationLabel {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

/** View model for `emr-clinical-annotation-canvas`. */
export interface EmrClinicalAnnotationCanvasState {
  instanceId: string;
  title: string;
  description?: string;
  imageTemplates: readonly EmrClinicalImageTemplate[];
  availableLabels: readonly EmrAnnotationLabel[];
  selectedImageId?: string;
  selectedLabelId?: string;
  selectedTool?: AnnotationTool;
  /**
   * Hex colour for new marks. Required: a mark's colour is saved with it, so the
   * controller chooses it; the component never invents one.
   */
  brushColor: string;
  brushWidth?: number;
  layers: readonly AnnotationLayerRecord[];
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

export class AnnotationSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnnotationSchemaError';
  }
}

/** Serialize a document to a stable JSON string for transport or storage. */
export function serializeAnnotationDocument(document: AnnotationDocument): string {
  return JSON.stringify({ ...document, schemaVersion: ANNOTATION_SCHEMA_VERSION });
}

/** Parse and validate a persisted payload. Throws `AnnotationSchemaError` on mismatch. */
export function deserializeAnnotationDocument(payload: string): AnnotationDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (cause) {
    throw new AnnotationSchemaError('Annotation payload is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new AnnotationSchemaError('Annotation payload must be an object.');
  }
  const candidate = parsed as Partial<AnnotationDocument>;
  if (candidate.schemaVersion !== ANNOTATION_SCHEMA_VERSION) {
    throw new AnnotationSchemaError(
      `Unsupported annotation schema version: ${String(candidate.schemaVersion)}.`
    );
  }
  if (typeof candidate.instanceId !== 'string' || !Array.isArray(candidate.layers)) {
    throw new AnnotationSchemaError('Annotation payload is missing required fields.');
  }
  const background = candidate.background as Partial<AnnotationBackgroundRef> | undefined;
  if (!background || typeof background.imageId !== 'string' || !isPositive(background.width) || !isPositive(background.height)) {
    throw new AnnotationSchemaError('Annotation background needs an imageId and positive intrinsic width and height.');
  }
  candidate.layers.forEach((layer, index) => {
    if (!isValidLayer(layer)) throw new AnnotationSchemaError(`Annotation layer ${index} has an invalid shape or geometry.`);
  });
  return candidate as AnnotationDocument;
}

const isPositive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

const isUnit = (value: unknown): boolean => typeof value === 'number' && value >= 0 && value <= 1;

const isPoint = (value: unknown): value is AnnotationPoint =>
  !!value && typeof value === 'object' && isUnit((value as AnnotationPoint).x) && isUnit((value as AnnotationPoint).y);

const isPointList = (value: unknown, min: number, max = Infinity): boolean =>
  Array.isArray(value) && value.length >= min && value.length <= max && value.every(isPoint);

function isValidLayer(value: unknown): value is AnnotationLayerRecord {
  if (!value || typeof value !== 'object') return false;
  const layer = value as Partial<AnnotationLayerRecord> & Record<string, unknown>;
  if (typeof layer.id !== 'string' || typeof layer.label !== 'string' || typeof layer.color !== 'string') return false;
  if (typeof layer.visible !== 'boolean' || !isPositive(layer.strokeWidth)) return false;
  switch (layer.tool) {
    case 'text': return isPoint(layer['point']) && typeof layer['text'] === 'string' && isPositive(layer['fontSize']);
    case 'line': return isPointList(layer['points'], 2, 2);
    case 'curve':
    case 'freeform': return isPointList(layer['points'], 2);
    case 'polygon': return isPointList(layer['points'], 3);
    case 'circle': return isPoint(layer['center']) && isUnit(layer['radiusX']) && isUnit(layer['radiusY']);
    default: return false;
  }
}
