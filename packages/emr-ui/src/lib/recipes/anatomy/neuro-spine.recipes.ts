import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Spine, cord and brachial plexus outlines for marking disc, stenosis, fusion, cord and root levels. */
export const NEURO_SPINE_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'spine-sagittal-neuro', version: 1, group: 'neuro-spine', label: 'Spine — sagittal (C2 to S1)', region: 'spine', view: 'sagittal',
    laterality: 'midline', asset: 'neuro-spine/spine-sagittal-neuro.svg', width: 1000, height: 2000, provenance,
    description: 'Sagittal spine from C2 to S1, anterior to the left of the drawing, with vertebral bodies, intervertebral discs, spinal canal, cord ending at L1-L2 and cauda equina below, each level labelled.',
  },
  {
    id: 'spinal-cord-cross-section', version: 1, group: 'neuro-spine', label: 'Spinal cord — cross-section', region: 'spinal cord', view: 'axial cross-section',
    laterality: 'midline', asset: 'neuro-spine/spinal-cord-cross-section.svg', width: 1200, height: 1000, provenance,
    description: 'Spinal cord cross-section with anterior at the top and patient right on the left of the drawing: grey matter dorsal and ventral horns, dorsal columns, lateral corticospinal and spinothalamic tracts, dorsal and ventral roots.',
  },
  {
    id: 'brachial-plexus-right', version: 1, group: 'neuro-spine', label: 'Brachial plexus — right', region: 'brachial plexus', view: 'schematic anterior',
    laterality: 'right', asset: 'neuro-spine/brachial-plexus-right.svg', width: 1400, height: 1000, provenance,
    description: 'Schematic right brachial plexus in anterior view with the spine at the right of the drawing: roots C5 to T1, trunks, divisions, cords and the musculocutaneous, axillary, radial, median and ulnar nerves.',
  },
];
