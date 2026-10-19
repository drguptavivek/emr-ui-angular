import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Posterior views: patient's right is on the viewer's right (marked R). */
export const BACK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'back-whole', version: 1, group: 'back', label: 'Back — whole', region: 'back', view: 'posterior',
    laterality: 'bilateral', asset: 'back/back-whole.svg', width: 1000, height: 1400, provenance,
    description: 'Whole posterior trunk from neck to upper buttocks with scapulae, spinous-process midline from C7 to L5, iliac crests, posterior superior iliac spine dimples and gluteal cleft.',
  },
  {
    id: 'spine-cervical', version: 1, group: 'back', label: 'Spine — cervical', region: 'cervical spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-cervical.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior neck and lower occiput outline with the cervical spinous processes C2 to C7 and T1 along the midline and the superior nuchal line.',
  },
  {
    id: 'spine-thoracic', version: 1, group: 'back', label: 'Spine — thoracic', region: 'thoracic spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-thoracic.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior upper and mid back with spinous processes C7 and T1 to T12 along the midline and both scapulae as landmarks.',
  },
  {
    id: 'spine-lumbar', version: 1, group: 'back', label: 'Spine — lumbar', region: 'lumbar spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-lumbar.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior lumbar back with spinous processes T12 to S1 along the midline, paraspinal lines, twelfth ribs, iliac crests and posterior superior iliac spine dimples.',
  },
  {
    id: 'spine-sacral', version: 1, group: 'back', label: 'Spine — sacral', region: 'sacral spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-sacral.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior sacral region with the sacrum, median crest levels S1 to S5, coccyx, iliac crests, posterior superior iliac spine dimples and the upper gluteal cleft.',
  },
];
