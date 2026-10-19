import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Colposcopic cervix clock face and a frontal uterus and adnexa schematic. */
export const GYNAECOLOGY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'cervix-clock-face', version: 1, group: 'gynaecology', label: 'Cervix — clock face', region: 'cervix', view: 'colposcopic',
    laterality: 'midline', asset: 'gynaecology/cervix-clock-face.svg', width: 1200, height: 1200, provenance,
    description: 'Colposcopic view of the cervix with the external os at the centre, a dashed ring for the transformation zone, and clock hours marked: 12 anterior at the top, 6 posterior, 9 on the viewer\'s left (patient\'s right) and 3 on the viewer\'s right.',
  },
  {
    id: 'uterus-adnexa', version: 1, group: 'gynaecology', label: 'Uterus and adnexa — frontal', region: 'uterus', view: 'anterior',
    laterality: 'bilateral', asset: 'gynaecology/uterus-adnexa.svg', width: 1200, height: 1200, provenance,
    description: 'Frontal schematic of the uterus showing fundus, body with cavity, cervix and canal, both fallopian tubes with fimbriae, both ovaries and the vagina. The patient\'s right is on the viewer\'s left, marked R.',
  },
];
