import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1000, height: 1200 } as const;

/** Abdomen, anterior view. Patient's right is on the viewer's left (marked R). */
export const ABDOMEN_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'abdomen-plain', version: 1, group: 'abdomen', label: 'Abdomen — plain', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-plain.svg', ...size, provenance,
    description: 'Anterior abdominal wall outline from costal margins to inguinal ligaments, with the umbilicus marked.',
  },
  {
    id: 'abdomen-quadrants', version: 1, group: 'abdomen', label: 'Abdomen — four quadrants', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-quadrants.svg', ...size, provenance,
    description: 'Anterior abdomen divided into four quadrants by vertical and horizontal lines through the umbilicus.',
  },
  {
    id: 'abdomen-nine-regions', version: 1, group: 'abdomen', label: 'Abdomen — nine regions', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-nine-regions.svg', ...size, provenance,
    description: 'Anterior abdomen divided into nine regions by the midclavicular, subcostal and intertubercular planes.',
  },
];
