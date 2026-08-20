/**
 * Framework-neutral serialization contract for clinical annotation payloads.
 *
 * The `EmrClinicalAnnotationCanvasComponent` (UI package) owns only transient
 * drawing behaviour and emits a `saveRequested` intent carrying its view state.
 * Persistence, versioning, and wire mapping are controller responsibilities, so
 * the durable payload shape and (de)serialization live here.
 */

export const ANNOTATION_SCHEMA_VERSION = 1 as const;

export type AnnotationTool =
  | 'text'
  | 'line'
  | 'curve'
  | 'circle'
  | 'polygon'
  | 'freeform';

/** Coordinates are normalized to the background image (0..1) for browser independence. */
export interface AnnotationPoint {
  x: number;
  y: number;
}

interface AnnotationLayerCommon {
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

/** Durable, versioned annotation payload — the source of truth for persistence. */
export interface AnnotationDocument {
  schemaVersion: typeof ANNOTATION_SCHEMA_VERSION;
  instanceId: string;
  title: string;
  /** Selected background template/image reference; the controller resolves the URL. */
  imageTemplateId?: string;
  layers: readonly AnnotationLayerRecord[];
  /** Optional ISO-8601 timestamp; supplied by the controller, never a browser global. */
  updatedAt?: string;
}

/** Promise + `AbortSignal` port, consistent with other repository contracts. */
export interface AnnotationRepositoryPort {
  save(document: AnnotationDocument, signal: AbortSignal): Promise<void>;
  load(instanceId: string, signal: AbortSignal): Promise<AnnotationDocument | null>;
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
  return candidate as AnnotationDocument;
}
