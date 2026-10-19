import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Labour-ward delivery-record outlines. Perineal views are lithotomy, 12 o'clock anterior, patient's right on the viewer's left.
 * Dashed lines are reference guides only: clinicians draw the actual incision or findings over them.
 */
export const OBSTETRIC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'episiotomy-perineum', version: 1, group: 'obstetric', label: 'Episiotomy — perineum (lithotomy)', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/episiotomy-perineum.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy perineum with vulva, introitus, posterior fourchette, perineal body, anus and ischial tuberosities; dashed reference lines from the fourchette for midline, mediolateral 60 degrees (right and left, with angle arcs) and lateral incisions. 12 o\'clock anterior, patient\'s right on the viewer\'s left.',
  },
  {
    id: 'perineal-tear-degrees', version: 1, group: 'obstetric', label: 'Perineal tear — degrees', region: 'perineum and anal sphincter', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/perineal-tear-degrees.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy schematic of the perineum with concentric zones around the anus for classifying obstetric perineal tears: skin and vaginal epithelium (1st), perineal muscles (2nd), external anal sphincter split into 3a and 3b, internal anal sphincter (3c) and anorectal mucosa (4th degree). Anterior at the top.',
  },
  {
    id: 'perineal-repair', version: 1, group: 'obstetric', label: 'Perineal repair', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/perineal-repair.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy perineum with vaginal apex, hymenal remnant and introitus, posterior fourchette, perineal body, perineal skin and anus, with a dashed midline repair line for drawing continuous and interrupted sutures. Anterior at the top, patient\'s right on the viewer\'s left.',
  },
  {
    id: 'cervix-dilatation', version: 1, group: 'obstetric', label: 'Cervical dilatation 1–10 cm', region: 'cervix', view: 'row of circles',
    laterality: 'not-applicable', asset: 'obstetric/cervix-dilatation.svg', width: 1400, height: 700, provenance,
    description: 'A row of ten circles representing cervical dilatation from 1 to 10 cm, drawn in proportion to one another and labelled 1 to 10, for partogram-style marking.',
  },
  {
    id: 'fetal-head-position', version: 1, group: 'obstetric', label: 'Fetal head position in the pelvis', region: 'fetal head', view: 'vertex in pelvis',
    laterality: 'midline', asset: 'obstetric/fetal-head-position.svg', width: 1800, height: 1200, provenance,
    description: 'Fetal skull seen from the vertex inside a circle representing the maternal pelvis, with anterior and posterior fontanelles and sagittal, coronal and lambdoid sutures; symphysis at the top, sacrum at the bottom, maternal right on the viewer\'s left, for drawing OA, OP and OT positions.',
  },
  {
    id: 'placenta-surfaces', version: 1, group: 'obstetric', label: 'Placenta — maternal and fetal surfaces', region: 'placenta', view: 'both surfaces',
    laterality: 'not-applicable', asset: 'obstetric/placenta-surfaces.svg', width: 1900, height: 1000, provenance,
    description: 'Two placental discs side by side: the maternal surface divided into cotyledons and the fetal surface with chorionic vessels radiating from the cord insertion, for recording completeness, cord insertion and infarcts.',
  },
  {
    id: 'abdomen-pregnant-leopold', version: 1, group: 'obstetric', label: 'Pregnant abdomen — fetal lie and fundal height', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'obstetric/abdomen-pregnant-leopold.svg', width: 1200, height: 1400, provenance,
    description: 'Term-pregnant abdomen in anterior view with the gravid outline, fundus, umbilicus and pubic symphysis, and dashed level guides at the symphysis, umbilicus and xiphisternum, for marking fetal lie, presentation and fundal height. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'caesarean-incisions', version: 1, group: 'obstetric', label: 'Caesarean section — incisions', region: 'lower abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'obstetric/caesarean-incisions.svg', width: 1400, height: 1200, provenance,
    description: 'Pregnant lower abdomen in anterior view with umbilicus, symphysis, iliac spines and groin folds, and dashed reference incisions labelled Pfannenstiel (transverse lower) and midline (vertical). Patient\'s right on the viewer\'s left.',
  },
];
