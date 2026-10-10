import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Hands and fingernails. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const HANDS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'hand-right-palmar', version: 1, group: 'hands', label: 'Hand — right palmar', region: 'right hand', view: 'palmar',
    laterality: 'right', asset: 'hands/hand-right-palmar.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand palmar view with the fingers pointing up and the thumb on the viewer\'s right; palmar and finger flexion creases and the wrist creases are marked.',
  },
  {
    id: 'hand-right-dorsal', version: 1, group: 'hands', label: 'Hand — right dorsal', region: 'right hand', view: 'dorsal',
    laterality: 'right', asset: 'hands/hand-right-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand dorsal view with the fingers pointing up and the thumb on the viewer\'s left; knuckle creases, tendon lines and fingernails are marked.',
  },
  {
    id: 'hand-left-palmar', version: 1, group: 'hands', label: 'Hand — left palmar', region: 'left hand', view: 'palmar',
    laterality: 'left', asset: 'hands/hand-left-palmar.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand palmar view with the fingers pointing up and the thumb on the viewer\'s left; palmar and finger flexion creases and the wrist creases are marked.',
  },
  {
    id: 'hand-left-dorsal', version: 1, group: 'hands', label: 'Hand — left dorsal', region: 'left hand', view: 'dorsal',
    laterality: 'left', asset: 'hands/hand-left-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand dorsal view with the fingers pointing up and the thumb on the viewer\'s right; knuckle creases, tendon lines and fingernails are marked.',
  },
  {
    id: 'fingernails', version: 1, group: 'hands', label: 'Fingernails — both hands', region: 'fingernails', view: 'dorsal',
    laterality: 'bilateral', asset: 'hands/fingernails.svg', width: 1400, height: 1000, provenance,
    description: 'Dorsal view of the fingers and nails of both hands, fingers up, thumbs pointing toward the middle; the left hand is on the viewer\'s left. Each of the ten nails is shaded.',
  },
];
