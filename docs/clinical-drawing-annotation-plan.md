# Clinical Drawing and Annotation Catalogue — Implementation Plan

Date: 9 October 2026

Status:
- Phase 1 (shared foundation) implemented 9 October 2026.
- Phase 2 anatomy and ophthalmic outline sets implemented 10 October 2026: 105 views in 24 L5 sets, all unreviewed.
- The compact toolbar and annotation list exist as standalone components; the canvas has not adopted them yet (Phase 4).
- Phases 3–5 remain. No framework migration is authorised.

## Goal

Build a modular Storybook catalogue for anatomical drawings, clinical photograph annotation, ophthalmic imaging records and specialty charts. All components follow our EMR design system and controlled presentation architecture. Anatomical views are reusable data recipes and assets, rather than separate copies of the drawing editor.

## Design and architecture

- Own colours, typography, spacing, icons, layouts and interaction states. Use light slate surfaces, soothing accents, no teal, equal control heights and strict alignment. Clinical mark colours use labelled legends and never convey meaning alone.
- Components receive immutable view models and emit typed intents. Controllers own clinical interpretation, terminology, validation, durable history, persistence and export orchestration.
- The editor may own transient pointer gestures, focus, viewport and drawing previews. Committed annotations and undo/redo history use the controlled contract.
- Retain framework-neutral TypeScript models. The existing Angular renderer is the starting point; a React renderer is a separate work package if subsequently approved.
- Multiple drawing engines are permitted behind adapters. Evaluate the existing SVG editor, Fabric.js and Konva against actual interaction requirements before selecting an engine. Specialist imaging may use a separate adapter. Lazy-load engines by workflow.
- Persist our own versioned annotation format, not engine-specific canvas objects.
- Support mainstream browsers through standards-based interaction and explicit browser testing. Canvas/SVG renderers still require a browser environment; browser compatibility does not imply native-platform support. Guard renderer initialization for SSR.

## Component families

1. Anatomical schematic annotation: one editor with selectable, versioned anatomical backgrounds.
2. Clinical photograph and device-image annotation: the same annotation contracts over immutable image/frame references.
3. Region selection and specialty charting: purpose-built controls for tooth surfaces, body regions and structured clinical findings.
4. Recording compositions: combine diagrams/images, findings, measurements, remarks and attachments without moving clinical logic into UI.

## Anatomical template catalogue

| Group | Templates and detail views |
| --- | --- |
| Whole body | Anterior, posterior, right and left lateral; overview linked to regional detail |
| Head and scalp | Front, back, vertex, right and left side |
| Face | Frontal, right and left profile; facial detail |
| ENT | Right/left external ear, preauricular and mastoid areas; separate right/left tympanic membranes; external nose and nasal/septal schematic; throat |
| Neck | Anterior, posterior, right/left lateral; right/left clavicular and supraclavicular areas |
| Thorax | Anterior/posterior chest; right/left axilla; breast diagrams with clock-face and nipple/areola detail |
| Abdomen | Plain outline, four quadrants, nine regions, optional surgical detail |
| Upper limbs | Right/left upper arms and forearms, anterior/posterior; shoulder, elbow and wrist detail |
| Hands | Right/left palmar and dorsal views; fingers and nails |
| Back | Whole back and cervical, thoracic, lumbar and sacral detail |
| Pelvis | Right/left gluteal regions; hip detail |
| Lower limbs | Right/left thigh, knee, leg and ankle; anterior/posterior and appropriate lateral views |
| Feet | Right/left dorsal and plantar views; toes and nails |
| Genital and perineal | Separate external male/female anatomy; perineal and perianal views; anal-canal schematic and clock-face |
| Dental and oral | Adult/primary dentition, individual tooth surfaces, tongue, gums, buccal mucosa, palate and tonsillar region |
| Neurological | Dermatome, peripheral-nerve and sensory-distribution maps |
| Vascular | Limb pulse-site and superficial-vein schematics |
| Wound/procedure | Wound surface and depth schematic; incision, drain, stoma, catheter and injection-site maps |

Each view is its own standalone `.svg` asset file (one view per file, never a sprite or a combined sheet), paired with a data-only L5 recipe entry. Every template records stable ID, asset version, provenance/licence, anatomical region, view, laterality where applicable, fixed coordinate bounds and accessible description. Illustrations require clinical review before production use. Diagram dimensions do not imply patient measurements.

## Ophthalmology catalogue

| Composition | Drawing/image surface | Structured recording |
| --- | --- | --- |
| External eye | OD/OS lids and external eye | Findings, site and remarks |
| Cornea | OD/OS corneal clock-face | Staining, opacity, infiltrate, sutures and controller-defined findings |
| Anterior segment | Conjunctiva and anterior-segment cross-section | Findings and procedure notes |
| Retina | OD/OS posterior pole and peripheral retinal chart | Finding location, extent and associated notes |
| Optic disc | Disc detail and fundus photograph | Controller-supplied disc findings and measurements |
| OCT | B-scan and en-face images with frame identity | Scan metadata, supplied metrics, interpretation and report attachments |
| Refraction | Optical (power) cross per eye, drawn from the structured values; optional axis illustration | OD/OS sphere, cylinder, axis, add, prism, visual acuity and remarks |
| Retinoscopy | Retinoscopy cross per eye (neutralising powers on the two principal meridians) | Working distance and gross/net findings |
| Spectacle prescription | Existing horizontal OD/OS recording | Prescription fields and instructions |
| Motility | Ocular motility chart | Gaze-position findings |
| Perimetry | Result image with optional overlays | Test metadata, supplied results and interpretation |

Refraction and measurements stay structured; drawing complements them. Standard notations such as the optical cross and the retinoscopy cross are structured-value renderings: the controller supplies the powers and axes, and the component draws them; they are not free drawing. Initial OCT support covers raster exports and supplied reports. DICOM parsing, windowing, volumetric navigation and segmentation are separately scoped imaging work.

## Shared editor capabilities

- One shared, extremely compact editor chrome for every annotation surface: a single dense row of icon-only buttons (select, move, eraser, text, shape tools, colour/width, undo/redo, zoom/fit). Each button has an accessible name and tooltip and a 44px hit area, and uses shared icons and tokens. Beside or below the canvas sits a compact, numbered list of annotations. Specialty views reuse this chrome rather than restyling it.
- Select/move, text, arrow, line, curve, ellipse/circle, rectangle, polygon and freehand tools.
- Independent layers with label/class assignment, selection, hide/show, lock, delete and reorder.
- Consistent undo/redo, zoom/pan, fit/reset view, save status and export actions.
- Numbered findings list linked to marks; keyboard selection and text descriptions.
- Equal-size paired panels with persistent right/left or OD/OS labels. Never infer laterality from mirroring.
- Multiple views in one record, including a body-map finding linked to a close-up photo.
- Previous/current comparison with dates, independent overlays and stable image identity. Registration across different photographs is not assumed.
- Clear loading, missing-image, error, read-only and unsaved states.

## Durable contracts and measurement rules

Extend the existing annotation contract with:

- Document/encounter references supplied by the controller, revision and author/time metadata.
- Background kind, stable asset/image ID and version, series/frame identity where applicable, intrinsic dimensions and orientation.
- Source-image coordinates or precisely defined normalized coordinates. Overlay and pointer calculations use the actual rendered image rectangle, including letterboxing and viewport transforms.
- Stable annotation/finding IDs, geometry, style, class references, notes and links to other views or structured records.
- Optional calibration with explicit units and provenance. Only calibrated images support real-world measurement; uncalibrated dimensions remain image-space values.
- Original-image reference, editable annotation document and optional flattened export as distinct artifacts.

URLs and local upload handles are transient display resources, not durable image identity. Controllers resolve uploads, terminology bindings, persistence, revision history and export adapters. Handle existing schema versions explicitly and determine whether a migration is needed before changing saved data.

## Implementation gaps — status after Phase 1

Resolved in Phase 1:

- Duplicate UI/controller types: the canvas now imports every type from `annotation.models.ts`. Its layers are the durable `AnnotationLayerRecord` union.
- Letterbox misregistration: the canvas takes the background's intrinsic aspect ratio, and the overlay `viewBox` is the image's pixel size. Pointer, image and overlay share one rectangle. A Playwright test checks this at 360, 768 and 1280px.
- Hard-coded teal: removed from the component and the stories. `brushColor` is now a required, controller-supplied value; the component holds no colour constants.
- Embedded anatomy and labels: the fallback outlines moved to `stories/annotation.fixtures.ts`, as unreviewed placeholders. The component has no built-in templates or classes, and shows an empty state instead.
- Upload handling: the component no longer reads files. `nativeFilesSelected` was never a violation, because api-conventions §2.4 sanctions it. What crossed the boundary was the `FileReader` → template step, which now belongs to the controller.
- Durable contract: `AnnotationDocument` is now schema v2, with a required `background` (image id and intrinsic size). Deserialization validates every layer's shape and geometry; v1 is rejected because no v1 data was ever persisted.

Open, and carried into later phases:

- Layers are not keyed by background, so marks survive a background switch (Phase 4, multi-view).
- Undo/redo history is still component-owned and resets on every `model` change (Phase 4, controlled revision history).
- The text label size ignores `fontSize` because of the deliberate 48px CSS literal. Emoji icon buttons instead of the shared icon set, and no axe coverage for the canvas yet (Phase 5).
- The L5 recipe layer has no folder, catalogue page or `catalog.spec.ts` rule yet (Phase 2 starts it).

## Delivery phases and ownership

### Phase 1 — Shared foundation

Parent owns architecture and canonical contracts in `packages/emr-controller/src/annotation.models.ts`, exports and migration decisions. Add structural validation and meaningful serialization tests. Refactor the editor to consume these contracts and correct image coordinates before adding more workflows.

### Phase 2 — First useful catalogue

After contracts settle, assign parallel implementers exclusive ownership:

1. General anatomy recipes/assets/stories: whole body, abdomen, paired arms/legs, hands/feet, head/neck and thorax.
2. Ophthalmic recipes/assets/stories: cornea, anterior segment, retina and optic disc, including paired-eye layouts.
3. Photo/imaging compositions/stories: dermatology, wounds, surgical photographs, fundus and initial OCT recording.

Use separate recipe, asset and story files. The parent integrates shared styles, exports and catalogue manifest to avoid concurrent edits there.

### Phase 3 — Specialty controls and remaining views

Add ENT details, breast, dental/oral, genital/perineal, joint, neurological and vascular views. Implement dedicated tooth/surface selection and other structured chart controls where free drawing is insufficient. Compose existing refraction, prescription and diagnostic-result components with images.

### Phase 4 — Linked records and comparison

Add cross-view finding links, serial comparisons, controlled revision history, save/load demonstration journeys and export adapters. Use fake repositories and synthetic imagery in Storybook.

### Phase 5 — Integration and quality gate

Update public exports, catalogue manifest, documentation and representative Storybook tests. Run the repository checks, UI/controller builds, Storybook build and relevant visual/accessibility tests. Obtain a read-only code-quality audit; resolve material findings and rerun affected checks.

## Storybook structure

- Clinical Drawing / Anatomy Picker
- Clinical Drawing / Whole Body, Head & Neck, Thorax, Abdomen, Upper Limbs, Back & Pelvis, Lower Limbs, Genital & Perineal
- Clinical Drawing / ENT, Dental, Neurological, Vascular, Procedures
- Ophthalmology / Cornea, Anterior Segment, Retina, Optic Disc, OCT Recording, Refraction, Motility, Perimetry
- Clinical Images / Dermatology, Wounds, Surgical Photos, Serial Comparison
- Annotation / Tools, Layers, Linked Findings, Save & Reload

Each family demonstrates blank, populated, read-only, loading/error, missing source, long labels, keyboard operation and 360/768/1280 layouts. Use the existing theme infrastructure while keeping the requested light slate appearance as the primary design. Use synthetic fixtures and reviewed/licensed anatomy assets.

## Acceptance criteria

- Anatomy views reuse one controlled editor rather than copied specialty editors.
- Marks remain registered to source coordinates after resize, zoom, pan, rotation and save/reload.
- Laterality and orientation remain visible and correct in paired views and exports.
- Layer operations, controlled undo/redo and linked findings work without mutating inputs.
- A body-map mark can link to a close-up image and structured finding.
- Calibrated and uncalibrated measurements are clearly distinguished.
- Refraction, OCT findings and specialty charts use structured records where appropriate.
- Keyboard-accessible controls, meaningful descriptions, visible focus and colour-independent legends are verified.
- UI performs no networking, storage, clinical inference or terminology lookup.
- Equal heights, alignment, shared icons and design tokens hold across supported layouts.
- Browser compatibility and SSR-safe initialization are tested for supported renderers; no native-platform claims are implied.

## Decisions reserved for implementation

- Drawing-engine selection, based on an editor prototype exercising transforms, text, layer operations and controlled serialization.
- Whether to add a React renderer; this plan does not replace Angular automatically.
- Asset sourcing and clinical review process.
- Supported specialty vocabularies, tooth numbering conventions and clinical symbol legends, supplied through configuration.
- Persistence adapters, export formats and any DICOM/device integration.
