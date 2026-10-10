import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Globe, lids, lacrimal system and orbit. Surgical and lid views are the examiner's front view (nasal on the
 * viewer's right for OD, on the viewer's left for OS; clock hours as the examiner faces the patient). The orbit
 * views follow the radiological convention: the patient's right is on the viewer's left.
 */
export const GLOBE_ORBIT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'globe-cross-section', version: 1, group: 'globe-orbit', label: 'Globe — horizontal cross-section', region: 'globe', view: 'cross-section',
    laterality: 'not-applicable', asset: 'globe-orbit/globe-cross-section.svg', width: 1400, height: 1000, provenance,
    description: 'Horizontal cross-section of the whole eye with anterior at the left: cornea, anterior chamber, iris, lens, zonules, ciliary body, vitreous cavity, and sclera, choroid and retina as concentric layers at the posterior wall, with the macula and fovea on the visual axis and the optic disc, optic nerve and nerve sheath offset to one side.',
  },
  {
    id: 'globe-surgical-od', version: 1, group: 'globe-orbit', label: 'Globe for vitreoretinal surgery — right eye (OD)', region: 'right eye', view: 'surgical',
    laterality: 'right', asset: 'globe-orbit/globe-surgical-od.svg', width: 1400, height: 1400, provenance,
    description: 'Front view of the right globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 10, 2 and 8 o\'clock; nasal side on the viewer\'s right, labelled OD, N, T and clock hours.',
  },
  {
    id: 'globe-surgical-os', version: 1, group: 'globe-orbit', label: 'Globe for vitreoretinal surgery — left eye (OS)', region: 'left eye', view: 'surgical',
    laterality: 'left', asset: 'globe-orbit/globe-surgical-os.svg', width: 1400, height: 1400, provenance,
    description: 'Front view of the left globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 2, 10 and 4 o\'clock; nasal side on the viewer\'s left, labelled OS, N, T and clock hours.',
  },
  {
    id: 'eyelids-od', version: 1, group: 'globe-orbit', label: 'Eyelids — right eye (OD)', region: 'right eyelids', view: 'eyelid detail',
    laterality: 'right', asset: 'globe-orbit/eyelids-od.svg', width: 1400, height: 1000, provenance,
    description: 'Oculoplastic detail of the right eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'eyelids-os', version: 1, group: 'globe-orbit', label: 'Eyelids — left eye (OS)', region: 'left eyelids', view: 'eyelid detail',
    laterality: 'left', asset: 'globe-orbit/eyelids-os.svg', width: 1400, height: 1000, provenance,
    description: 'Oculoplastic detail of the left eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'lacrimal-system-right', version: 1, group: 'globe-orbit', label: 'Lacrimal drainage system — right', region: 'right lacrimal system', view: 'schematic',
    laterality: 'right', asset: 'globe-orbit/lacrimal-system-right.svg', width: 1100, height: 1150, provenance,
    description: 'Schematic of the right lacrimal drainage system seen from the front, patient\'s right on the viewer\'s left: lacrimal gland above the lateral lids, upper and lower puncta, upper, lower and common canaliculi, lacrimal sac, nasolacrimal duct and its outlet in the inferior meatus beneath the inferior turbinate, labelled R and L.',
  },
  {
    id: 'orbit-coronal', version: 1, group: 'globe-orbit', label: 'Orbit — coronal (right orbit)', region: 'right orbit', view: 'coronal',
    laterality: 'right', asset: 'globe-orbit/orbit-coronal.svg', width: 1200, height: 1200, provenance,
    description: 'Coronal view of the right orbit in the radiological convention, patient\'s right on the viewer\'s left so the lateral wall is at the left and the medial wall at the right: orbital roof, floor and walls around the centred globe, the superior, inferior, medial and lateral recti, the superior and inferior obliques and the optic nerve at the centre, labelled R and L.',
  },
  {
    id: 'orbit-axial', version: 1, group: 'globe-orbit', label: 'Orbits — axial', region: 'both orbits', view: 'axial',
    laterality: 'bilateral', asset: 'globe-orbit/orbit-axial.svg', width: 1400, height: 1000, provenance,
    description: 'Axial view of both orbits with anterior at the top and the patient\'s right on the viewer\'s left (radiological convention): the globes, medial and lateral recti, medial and lateral orbital walls, ethmoid sinuses between the orbits, and the optic nerves converging to the optic chiasm, labelled R, L and Anterior.',
  },
];
