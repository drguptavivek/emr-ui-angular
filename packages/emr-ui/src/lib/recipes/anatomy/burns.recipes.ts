import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Lund and Browder burn charts: anterior and posterior figures side by side, divided into the standard regions. Region percentages are controller data, not drawing. */
export const BURNS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lund-browder-adult', version: 1, group: 'burns', label: 'Lund and Browder chart — adult', region: 'whole body', view: 'burn chart',
    laterality: 'bilateral', asset: 'burns/lund-browder-adult.svg', width: 1600, height: 1100, provenance,
    description: 'Adult anterior figure (left) and posterior figure (right) divided by dashed lines into head, neck, trunk, genitalia or buttocks, upper arms, forearms, hands, thighs, legs and feet. On the anterior figure the patient\'s right is on the viewer\'s left; on the posterior figure it is on the viewer\'s right. Each is marked R and L.',
  },
  {
    id: 'lund-browder-child', version: 1, group: 'burns', label: 'Lund and Browder chart — child', region: 'whole body', view: 'burn chart',
    laterality: 'bilateral', asset: 'burns/lund-browder-child.svg', width: 1600, height: 1100, provenance,
    description: 'Child anterior figure (left) and posterior figure (right) with a larger head and shorter legs, divided by dashed lines into the standard Lund and Browder regions. On the anterior figure the patient\'s right is on the viewer\'s left; on the posterior figure it is on the viewer\'s right. Each is marked R and L.',
  },
];
