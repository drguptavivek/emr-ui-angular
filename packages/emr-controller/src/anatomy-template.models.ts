import type { EmrClinicalImageTemplate } from './annotation.models.js';

/**
 * Data-only description of one anatomical outline view (an L5 recipe).
 *
 * Each view is its own standalone SVG asset; the recipe carries its identity and
 * metadata. Recipes never hold a URL: where assets are served from is a deployment
 * fact the controller supplies to `anatomyTemplateToImage`.
 */
export interface AnatomyTemplateRecipe {
  /** Stable kebab-case id; also the asset file name (`<id>.svg`). Never reused. */
  id: string;
  /** Bump whenever the outline geometry changes: saved marks are tied to it. */
  version: number;
  /** Outline set this view belongs to, e.g. `whole-body`, `hands`, `cornea`. */
  group: string;
  label: string;
  /** Anatomical region, e.g. `thorax`, `right hand`. */
  region: string;
  /** View or projection, e.g. `anterior`, `palmar`, `vertex`, `cross-section`. */
  view: string;
  /** Side shown. Paired views are separate recipes; never infer a side by mirroring. */
  laterality: 'left' | 'right' | 'bilateral' | 'midline' | 'not-applicable';
  /** Asset path relative to the anatomy asset root: `<group>/<id>.svg`. */
  asset: string;
  /** Intrinsic size; must equal the SVG's `width`, `height` and `viewBox`. */
  width: number;
  height: number;
  /** Accessible description of what the outline shows. */
  description: string;
  provenance: {
    author: string;
    licence: string;
    /** Every outline starts unreviewed; only clinical review promotes it. */
    reviewStatus: 'unreviewed' | 'clinically-reviewed';
  };
}

/**
 * Resolve a recipe into a canvas background. `assetBaseUrl` is wherever the deployment
 * serves the anatomy assets (e.g. `/assets/anatomy`); the recipe id is the durable identity.
 */
export function anatomyTemplateToImage(recipe: AnatomyTemplateRecipe, assetBaseUrl: string): EmrClinicalImageTemplate {
  return {
    id: recipe.id,
    label: recipe.label,
    imageUrl: `${assetBaseUrl.replace(/\/+$/, '')}/${recipe.asset}`,
    width: recipe.width,
    height: recipe.height,
    altText: recipe.description,
  };
}
