# L5 — Recipes

L5 is **data only, zero Angular**: exported definitions that components at L2–L4 render. Nothing here runs, renders or decides; a controller picks a recipe and turns it into a view model.

Source: `packages/emr-ui/src/lib/recipes/`. Fitness test: `recipes/recipes.spec.ts`.

## Anatomy outline sets

Each anatomical view is **one standalone SVG** (`recipes/anatomy/assets/<group>/<id>.svg`) paired with one `AnatomyTemplateRecipe` in `recipes/anatomy/<group>.recipes.ts`. The recipe type and `anatomyTemplateToImage(recipe, assetBaseUrl)` live in `@drguptavivek/emr-controller` (`anatomy-template.models.ts`). The controller decides where assets are served and passes the result to `emr-clinical-annotation-canvas` as a background.

The package ships the SVGs at `dist/emr-ui/assets/anatomy/`, and Storybook serves them at `/assets/anatomy/`.

**Drawing standard** (enforced by `recipes.spec.ts`):

- Root `<svg xmlns width height viewBox="0 0 W H" role="img">` with a `<title>`. W and H are 600–2000px and equal the recipe's `width`/`height`.
- White background rect. Main contour `#475569` at width 6; internal landmarks and region dividers `#94a3b8` at width 3 (dividers dashed `12 10`); optional light fill `#cbd5e1`. No other colours. SVGs render through `<img>`, so they cannot read CSS tokens, and this fixed palette stands in for them.
- No scripts, styles, event handlers, embedded or external images, external references, gradients, filters, masks or patterns. Each file is under 40 KB.
- Anatomical position. On anterior views the patient's right is on the viewer's left; label sides with `R`/`L` (or `OD`/`OS`). Each side is its own recipe. Never mirror one side to make the other.
- Text is limited to orientation, standard region names and standard landmarks. No numbering scheme that is a configuration choice (for example tooth numbering).
- `version` starts at 1 and increments whenever the geometry changes. Every outline starts `reviewStatus: 'unreviewed'` and needs clinical review before production use.

### abdomen
Plain outline, four quadrants and nine regions (anterior, 1000×1200).

### whole-body
Anterior, posterior, right lateral and left lateral, standing with palms forward on the anterior view (800×1600). Hands and feet are simplified.

### head-scalp
Front, back, right side and left side (1000×1200), plus vertex (1000×1000, anterior at the top), with the hairline and ears as landmarks.

### face
Frontal, right profile and left profile, with eyes, nose, lips and ears as light landmarks (1000×1200).

### neck
Anterior, posterior, right and left lateral, and right and left supraclavicular fossae, with SCM, clavicles and the trachea/thyroid region as landmarks (1200×1000). The fossa boundaries are approximate.

### thorax
Chest anterior and posterior, right and left axilla with the arm abducted (1200×1100); right and left breast clock faces as the examiner faces the patient, with the axillary tail (1200×1200).

### back
Whole back (1000×1400), plus cervical, thoracic, lumbar and sacral spine segments (1000×1200). Posterior views, patient's right on the viewer's right.

### pelvis
Right and left gluteal regions (posterior, with dashed injection-quadrant dividers) and right and left hip (anterior: ASIS, inguinal ligament, femoral triangle), all 1000×1200.

### genital-perineal
External male genitalia (anterior) and external female genitalia (lithotomy) at 1000×1200; perineum, perianal and anal-canal clock face (lithotomy, 12 o'clock anterior, 3 o'clock patient's left) at 1000×1000.

### upper-limbs
Right and left whole upper limb, anterior and posterior, in anatomical position (800×1600); right and left shoulder (anterior, 1200×1200), elbow (anterior, 1000×1200) and wrist (palmar, 1000×1200).

### hands
Right and left hand, palmar and dorsal, fingers up (1000×1400); fingernails of both hands, dorsal, thumbs inward (1400×1000).

### lower-limbs
Right and left whole lower limb, anterior and posterior (800×1600); right and left knee and ankle (anterior, 1000×1400).

### feet
Right and left foot, dorsal and plantar, toes up (800×1400); toenails of both feet, dorsal, big toes inward (1600×1000).

### ent
Right and left external ear (lateral, 1000×1200); right and left tympanic membrane (otoscopic, malleus handle and light reflex, quadrants AS/AI/PS/PI, 1000×1000); external nose (1000×1200); nasal septum (sagittal, anterior left, Little's area marked, 1200×1000); oropharynx (open mouth, 1200×1000).

### dental-oral
Adult (32) and primary (20) dentition arch charts with no tooth numbers (1200×1500 and 1200×1300); single tooth with five surfaces (1000×1000); tongue (dorsal) and palate (1000×1200); oral cavity (open mouth, 1200×1000).

### neurological
Dermatomes and cutaneous peripheral-nerve territories, anterior and posterior, in a classic textbook layout rather than the ASIA key-point map (1000×1600).

### vascular
Pulse sites on a whole-body anterior outline, with posterior sites dashed (1200×1600); superficial veins of both legs, great and small saphenous (1200×1400).

### wound-procedure
Wound surface and depth (skin cross-section plus clock face, 12 o'clock head-ward, 1400×1000); abdomen incision sites and drain/stoma sites (1200×1200); injection and line sites (whole body, anterior, 1200×1600).

### eye-external
OD and OS external eye as the examiner faces the patient: lids, aperture, caruncle, iris and pupil, with N/T labelled (1400×1000).

### cornea
OD and OS clock-face cornea: limbus, clock hours 12/3/6/9 with N/T, and a dashed pupil (1200×1200).

### anterior-segment
OD and OS slit-lamp horizontal cross-section, anterior up: cornea, anterior chamber, iris, lens and angle, with N/T (1400×1000).

### retina
OD and OS posterior pole (disc, macula, arcades) and peripheral chart (equator and ora serrata rings, 12 clock-hour radials). Fundus orientation, disc nasal (1200×1200).

### optic-disc
OD and OS enlarged disc: margin, dashed cup, rim and vessels, with ISNT sides labelled (1200×1200).

### ocular-motility
Nine diagnostic gaze positions in a 3×3 grid, patient's right on the viewer's left (1400×1200).
