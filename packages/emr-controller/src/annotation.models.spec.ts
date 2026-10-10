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
    { id: 'l5', tool: 'arrow', label: 'Drain site', color: '#475f70', strokeWidth: 3, visible: true, points: [{ x: 0.2, y: 0.3 }, { x: 0.4, y: 0.5 }] },
    { id: 'l6', tool: 'callout', label: 'Tender here', color: '#dc2626', strokeWidth: 3, visible: true, points: [{ x: 0.7, y: 0.2 }, { x: 0.5, y: 0.4 }], text: 'Tender here', fontSize: 30 },
    { id: 'l7', tool: 'curve', label: 'Incision', color: '#7c3aed', strokeWidth: 3, visible: true, strokeStyle: 'sutured', points: [{ x: 0.1, y: 0.5 }, { x: 0.3, y: 0.6 }, { x: 0.5, y: 0.5 }] },
    { id: 'l8', tool: 'line', label: 'Staples', color: '#475f70', strokeWidth: 3, visible: true, strokeStyle: 'stapled', points: [{ x: 0.1, y: 0.7 }, { x: 0.6, y: 0.7 }] },
    { id: 'l9', tool: 'polygon', label: 'Lattice', color: '#2563eb', strokeWidth: 2, visible: true, strokeStyle: 'dashed', fillPattern: 'lattice', points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.1 }, { x: 0.2, y: 0.2 }] },
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

  it('rejects unknown stroke styles and fill patterns, and malformed arrows and callouts', () => {
    const polygon = document.layers[1];
    const callout = document.layers[4];
    expect(() => deserializeAnnotationDocument(withLayer({ ...polygon, fillPattern: 'dots' }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...polygon, strokeStyle: 'wavy' }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...polygon, fillPattern: null }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...callout, text: undefined }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...callout, fontSize: 0 }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...callout, points: [callout.points[0]] }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ ...document.layers[3], points: [{ x: 0, y: 0 }, { x: 2, y: 0 }] }))).toThrow(AnnotationSchemaError);
    expect(() => deserializeAnnotationDocument(withLayer({ id: 'p', tool: 'pan', label: 'x', color: '#000000', strokeWidth: 1, visible: true }))).toThrow(AnnotationSchemaError);
  });

  it('rejects malformed JSON with a schema error, not a SyntaxError', () => {
    expect(() => deserializeAnnotationDocument('{')).toThrow(AnnotationSchemaError);
  });
});
