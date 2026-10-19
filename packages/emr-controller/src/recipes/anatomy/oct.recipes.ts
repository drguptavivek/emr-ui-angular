import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const scan = { width: 1600, height: 1000 } as const;
const grid = { width: 1200, height: 1200 } as const;

/** OCT schematics: horizontal B-scans (nasal on the viewer's right for OD, left for OS) and the ETDRS grid in fundus orientation. */
export const OCT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'oct-macula-bscan-od', version: 1, group: 'oct', label: 'OCT macula B-scan — right eye (OD)', region: 'right eye, macula', view: 'horizontal B-scan',
    laterality: 'right', asset: 'oct/oct-macula-bscan-od.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the fovea of the right eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'oct-macula-bscan-os', version: 1, group: 'oct', label: 'OCT macula B-scan — left eye (OS)', region: 'left eye, macula', view: 'horizontal B-scan',
    laterality: 'left', asset: 'oct/oct-macula-bscan-os.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the fovea of the left eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'oct-disc-bscan-od', version: 1, group: 'oct', label: 'OCT optic disc B-scan — right eye (OD)', region: 'right eye, optic nerve head', view: 'horizontal B-scan',
    laterality: 'right', asset: 'oct/oct-disc-bscan-od.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the optic nerve head of the right eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch\'s membrane opening and lamina cribrosa; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'oct-disc-bscan-os', version: 1, group: 'oct', label: 'OCT optic disc B-scan — left eye (OS)', region: 'left eye, optic nerve head', view: 'horizontal B-scan',
    laterality: 'left', asset: 'oct/oct-disc-bscan-os.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the optic nerve head of the left eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch\'s membrane opening and lamina cribrosa; nasal on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'oct-etdrs-grid-od', version: 1, group: 'oct', label: 'OCT ETDRS grid — right eye (OD)', region: 'right eye, macula', view: 'ETDRS grid',
    laterality: 'right', asset: 'oct/oct-etdrs-grid-od.svg', ...grid, provenance,
    description: 'ETDRS macular grid of the right eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer\'s right, labelled OD.',
  },
  {
    id: 'oct-etdrs-grid-os', version: 1, group: 'oct', label: 'OCT ETDRS grid — left eye (OS)', region: 'left eye, macula', view: 'ETDRS grid',
    laterality: 'left', asset: 'oct/oct-etdrs-grid-os.svg', ...grid, provenance,
    description: 'ETDRS macular grid of the left eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer\'s left, labelled OS.',
  },
];
