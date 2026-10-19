import type { AnnotationSymbolSet } from '../../annotation-symbol.models.js';

/**
 * The conventional retinal-drawing colour code: red for attached retina, arterioles, haemorrhage and breaks;
 * blue for detached retina and veins; green for vitreous opacity; yellow for exudate; brown or black for pigment.
 * Colours are data; a retina specialist reviews them before production use.
 */
export const RETINA_SYMBOLS: AnnotationSymbolSet = {
  id: 'retina',
  label: 'Retina',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Conventional retinal-drawing colour code; drafted for this library, not yet reviewed by a retina specialist.',
  labels: [
    { id: 'retina-attached', label: 'Attached retina', color: '#dc2626' },
    { id: 'retina-detached', label: 'Detached retina', color: '#2563eb' },
    { id: 'lattice-degeneration', label: 'Lattice degeneration', color: '#2563eb' },
    { id: 'retinal-break', label: 'Retinal break', color: '#dc2626' },
    { id: 'retinal-arteriole', label: 'Arteriole', color: '#dc2626' },
    { id: 'retinal-vein', label: 'Vein', color: '#2563eb' },
    { id: 'retinal-haemorrhage', label: 'Haemorrhage', color: '#b91c1c' },
    { id: 'vitreous-opacity', label: 'Vitreous opacity', color: '#15803d' },
    { id: 'retinal-exudate', label: 'Exudate', color: '#ca8a04' },
    { id: 'retinal-pigment', label: 'Pigment', color: '#78350f' },
    { id: 'retina-note', label: 'Note', color: '#334155' },
  ],
  presets: [
    { id: 'retina-attached', label: 'Attached retina', tool: 'polygon', colour: '#dc2626', width: 3, classId: 'retina-attached' },
    { id: 'retina-detached', label: 'Detached retina', description: 'Blue hatching', tool: 'polygon', fillPattern: 'hatch', colour: '#2563eb', width: 3, classId: 'retina-detached' },
    { id: 'retina-lattice', label: 'Lattice degeneration', description: 'Blue lattice (#) pattern', tool: 'polygon', fillPattern: 'lattice', colour: '#2563eb', width: 3, classId: 'lattice-degeneration' },
    { id: 'retina-break', label: 'Retinal break', description: 'Red outline', tool: 'polygon', colour: '#dc2626', width: 3, classId: 'retinal-break' },
    { id: 'retina-arteriole', label: 'Arteriole', tool: 'curve', colour: '#dc2626', width: 2, classId: 'retinal-arteriole' },
    { id: 'retina-vein', label: 'Vein', tool: 'curve', colour: '#2563eb', width: 3, classId: 'retinal-vein' },
    { id: 'retina-haemorrhage', label: 'Haemorrhage', tool: 'freeform', colour: '#b91c1c', width: 3, classId: 'retinal-haemorrhage' },
    { id: 'retina-vitreous-opacity', label: 'Vitreous opacity', tool: 'freeform', colour: '#15803d', width: 3, classId: 'vitreous-opacity' },
    { id: 'retina-exudate', label: 'Exudate', tool: 'polygon', colour: '#ca8a04', width: 3, classId: 'retinal-exudate' },
    { id: 'retina-pigment', label: 'Pigment', tool: 'polygon', colour: '#78350f', width: 3, classId: 'retinal-pigment' },
    { id: 'retina-callout', label: 'Callout note', description: 'Text with an arrow to the area', tool: 'callout', colour: '#334155', width: 3, classId: 'retina-note' },
  ],
};
