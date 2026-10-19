import type { AnnotationSymbolSet } from '../../annotation-symbol.models.js';
import { GENERAL_FINDINGS_SYMBOLS } from './general-findings.js';
import { RETINA_SYMBOLS } from './retina.js';
import { SURGERY_SYMBOLS } from './surgery.js';

export { GENERAL_FINDINGS_SYMBOLS } from './general-findings.js';
export { RETINA_SYMBOLS } from './retina.js';
export { SURGERY_SYMBOLS } from './surgery.js';

export const ANNOTATION_SYMBOL_SETS: readonly AnnotationSymbolSet[] = [
  GENERAL_FINDINGS_SYMBOLS,
  RETINA_SYMBOLS,
  SURGERY_SYMBOLS,
];
