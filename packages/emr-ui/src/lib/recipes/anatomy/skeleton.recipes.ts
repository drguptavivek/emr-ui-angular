import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 800, height: 1600 } as const;

/** Whole adult skeleton in anatomical position. Anterior view: patient's right is on the viewer's left; posterior view: the reverse. Each view is drawn for its own aspect. */
export const SKELETON_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'skeleton-anterior', version: 1, group: 'skeleton', label: 'Skeleton — anterior', region: 'whole skeleton', view: 'anterior',
    laterality: 'bilateral', asset: 'skeleton/skeleton-anterior.svg', ...size, provenance,
    description: 'Whole adult skeleton from the front in anatomical position: skull and mandible, sternum and ribs, lumbar spine, pelvis, long bones of both limbs, and simplified hands and feet. Patient\'s right is on the viewer\'s left (R and L marked).',
  },
  {
    id: 'skeleton-posterior', version: 1, group: 'skeleton', label: 'Skeleton — posterior', region: 'whole skeleton', view: 'posterior',
    laterality: 'bilateral', asset: 'skeleton/skeleton-posterior.svg', ...size, provenance,
    description: 'Whole adult skeleton from behind in anatomical position: occiput, vertebral column, ribs, scapulae, sacrum and pelvis, long bones of both limbs, and simplified hands and heels. Patient\'s right is on the viewer\'s right (L and R marked).',
  },
];
