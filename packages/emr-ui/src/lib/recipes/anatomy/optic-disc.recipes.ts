import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1200, height: 1200 } as const;

/** Enlarged optic disc with cup, rim, exiting vessels and ISNT sectors; nasal on the viewer's right for OD, left for OS. */
export const OPTIC_DISC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'optic-disc-od', version: 1, group: 'optic-disc', label: 'Optic disc — right eye (OD)', region: 'right eye', view: 'enlarged disc',
    laterality: 'right', asset: 'optic-disc/optic-disc-od.svg', ...size, provenance,
    description: 'Enlarged optic disc of the right eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer\'s right, labelled OD.',
  },
  {
    id: 'optic-disc-os', version: 1, group: 'optic-disc', label: 'Optic disc — left eye (OS)', region: 'left eye', view: 'enlarged disc',
    laterality: 'left', asset: 'optic-disc/optic-disc-os.svg', ...size, provenance,
    description: 'Enlarged optic disc of the left eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer\'s left, labelled OS.',
  },
];
