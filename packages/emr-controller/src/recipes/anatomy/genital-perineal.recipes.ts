import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Respectful clinical schematics. Perianal and anal-canal views are in lithotomy orientation, 12 o'clock anterior, patient's right on the viewer's left. */
export const GENITAL_PERINEAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'genital-male-external', version: 1, group: 'genital-perineal', label: 'Male external genitalia', region: 'male external genitalia', view: 'anterior',
    laterality: 'midline', asset: 'genital-perineal/genital-male-external.svg', width: 1000, height: 1200, provenance,
    description: 'Schematic anterior outline of the penis with glans, scrotum with median raphe and testes, inguinal folds and medial thighs; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'genital-female-external', version: 1, group: 'genital-perineal', label: 'Female external genitalia', region: 'female external genitalia', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/genital-female-external.svg', width: 1000, height: 1200, provenance,
    description: 'Schematic lithotomy outline of the vulva with mons pubis, labia majora and minora, clitoris, urethral meatus, vaginal introitus, perineum and anus; anterior at the top.',
  },
  {
    id: 'perineum', version: 1, group: 'genital-perineal', label: 'Perineum', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/perineum.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy perineum diamond from pubic symphysis to coccyx between the ischial tuberosities, divided into urogenital and anal triangles with perineal body and anus; anterior at the top.',
  },
  {
    id: 'perianal', version: 1, group: 'genital-perineal', label: 'Perianal region', region: 'perianal', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/perianal.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy perianal outline with the anus and radial skin folds at the centre, two concentric perianal rings, anterior raphe and natal cleft; anterior at the top, labelled.',
  },
  {
    id: 'anal-canal-clock-face', version: 1, group: 'genital-perineal', label: 'Anal canal — clock face', region: 'anal canal', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/anal-canal-clock-face.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy clock face of the anal canal with all twelve hours marked, 12 o\'clock anterior and 3 o\'clock on the patient\'s left, with concentric perianal skin and anal canal rings.',
  },
];
