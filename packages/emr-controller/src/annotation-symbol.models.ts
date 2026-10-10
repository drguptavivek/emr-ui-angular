import type { EmrAnnotationLabel, AnnotationFillPattern, AnnotationStrokeStyle, AnnotationTool } from './annotation.models.js';

/**
 * One choice in the canvas Symbol select: a tool plus the style, fill, colour, width and class it
 * draws with. The canvas applies all of it in one step and knows no clinical meaning; what a symbol
 * stands for (a suture line, a retinal break) is this data.
 */
export interface AnnotationSymbolPreset {
  id: string;
  label: string;
  description?: string;
  tool: AnnotationTool;
  strokeStyle?: AnnotationStrokeStyle;
  fillPattern?: AnnotationFillPattern;
  /** Hex mark colour. Data, so it may be a literal here; components never invent one. */
  colour?: string;
  /** Pen width in px, stored with each new mark. */
  width?: number;
  /** An `EmrAnnotationLabel.id` the controller also supplies; ignored when it is not among the available labels. */
  classId?: string;
}

/** An L5 set of symbol presets (data only). Starts `unreviewed`; a clinician signs off before production use. */
export interface AnnotationSymbolSet {
  id: string;
  label: string;
  version: number;
  reviewStatus: 'unreviewed';
  provenance: string;
  presets: readonly AnnotationSymbolPreset[];
  /** The classes the presets name through `classId`, so a host can pass both to the canvas together. */
  labels: readonly EmrAnnotationLabel[];
}
