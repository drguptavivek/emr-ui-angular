import { describe, expect, it } from 'vitest';
import {
  ANNOTATION_SCHEMA_VERSION,
  AnnotationSchemaError,
  deserializeAnnotationDocument,
  serializeAnnotationDocument,
} from './annotation.models';
import type { AnnotationDocument } from './annotation.models';

const document: AnnotationDocument = {
  schemaVersion: ANNOTATION_SCHEMA_VERSION,
  instanceId: 'annotation-demo',
  title: 'Synthetic retina drawing',
  background: { imageId: 'retina-od', width: 1000, height: 900 },
  layers: [
    { id: 'l1', tool: 'line', label: 'Line', color: '#475f70', strokeWidth: 2, visible: true, points: [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.8 }] },
    { id: 'l2', tool: 'polygon', label: 'Area', color: '#dc2626', strokeWidth: 3, visible: false, classIds: ['hemorrhage'], points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.1 }, { x: 0.2, y: 0.2 }] },
    { id: 'l3', tool: 'circle', label: 'Disc', color: '#475f70', strokeWidth: 2, visible: true, center: { x: 0.5, y: 0.5 }, radiusX: 0.1, radiusY: 0.11 },
    { id: 'l4', tool: 'text', label: 'Note', color: '#334155', strokeWidth: 1, visible: true, point: { x: 0, y: 1 }, text: 'Edge', fontSize: 20 },
  ],
  updatedAt: '2026-10-09T10:00:00.000Z',
};

const withLayer = (layer: unknown): string => JSON.stringify({ ...document, layers: [layer] });

describe('annotation document serialization', () => {
  it('round-trips every layer kind, background identity and hidden layers', () => {
    expect(deserializeAnnotationDocument(serializeAnnotationDocument(document))).toEqual(document);
  });

  it('rejects version 1 payloads instead of guessing their coordinate space', () => {
    const v1 = JSON.stringify({ schemaVersion: 1, instanceId: 'old', title: 'Old', imageTemplateId: 'retina-od', layers: [] });
    expect(() => deserializeAnnotationDocument(v1)).toThrow(AnnotationSchemaError);
  });

  it('requires a background with positive intrinsic dimensions', () => {
    for (const background of [undefined, { imageId: 'x', width: 0, height: 900 }, { imageId: 'x', width: 1000 }, { width: 1, height: 1 }]) {
      expect(() => deserializeAnnotationDocument(JSON.stringify({ ...document, background }))).toThrow(AnnotationSchemaError);
    }
  });

  it('rejects layers with unknown tools or geometry outside the image', () => {
    const line = document.layers[0];
    expect(() => deserializeAnnotationDocument(withLayer({ ...line, tool: 'laser' }))).toThrow(/layer 0/);
    expect(() => deserializeAnnotationDocument(withLayer({ ...line, points: [{ x: 0.1, y: 0.2 }, { x: 1.4, y: 0.8 }] }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...line, points: [{ x: 0.1, y: 0.2 }] }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...document.layers[1], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...document.layers[2], radiusX: Number.NaN }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...line, visible: 'yes' }))).toThrow(AnnotationSchemaError);
  });

  it('rejects malformed JSON with a schema error, not a SyntaxError', () => {
    expect(() => deserializeAnnotationDocument('{')).toThrow(AnnotationSchemaError);
  });
});
