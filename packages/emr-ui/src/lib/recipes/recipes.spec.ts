import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

/**
 * L5 anatomy recipes: the drawing standard every outline set must meet.
 * Run one group while drawing: `pnpm vitest run packages/emr-ui/src/lib/recipes -t <group>`.
 */
const anatomyRoot = join(process.cwd(), 'packages/emr-ui/src/lib/recipes/anatomy');
const assetRoot = join(anatomyRoot, 'assets');
const docFile = join(process.cwd(), 'docs/catalog/L5-recipes.md');

/** The outline palette. SVGs render through <img>, so they cannot read CSS tokens; this fixed set stands in. */
const OUTLINE_PALETTE = ['#ffffff', '#475569', '#94a3b8', '#cbd5e1'] as const;

const recipeFiles = readdirSync(anatomyRoot).filter(name => name.endsWith('.recipes.ts'));
const groups = await Promise.all(recipeFiles.map(async file => {
  const module = (await import(join(anatomyRoot, file))) as Record<string, unknown>;
  const recipes = Object.values(module).find(Array.isArray) as AnatomyTemplateRecipe[] | undefined;
  return { file, group: file.replace(/\.recipes\.ts$/, ''), recipes: recipes ?? [], source: readFileSync(join(anatomyRoot, file), 'utf8') };
}));
const allRecipes = groups.flatMap(group => group.recipes);

function svgFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? svgFiles(join(directory, entry.name)) : entry.name.endsWith('.svg') ? [join(directory, entry.name)] : []);
}

const forbidden: readonly [RegExp, string][] = [
  [/<script\b/i, 'script'],
  [/<foreignObject\b/i, 'foreignObject'],
  [/<image\b/i, 'embedded image'],
  [/<style\b/i, 'style element'],
  [/\sstyle=/i, 'style attribute'],
  [/\son[a-z]+\s*=/i, 'event handler'],
  [/(?:xlink:)?href\s*=\s*["'](?!#)/i, 'external reference'],
  [/url\(\s*["']?(?!#)/i, 'external url()'],
  [/<(?:linearGradient|radialGradient|filter|mask|pattern)\b/i, 'gradient/filter/mask/pattern'],
  [/@import|data:/i, 'import or data URI'],
];

describe('L5 anatomy recipes', () => {
  it('has at least one recipe group', () => {
    expect(groups.length).toBeGreaterThan(0);
  });

  it('uses unique, stable kebab-case ids across every group', () => {
    const ids = allRecipes.map(recipe => recipe.id);
    expect(new Set(ids).size, 'duplicate recipe ids').toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('pairs every SVG asset with exactly one recipe', () => {
    const referenced = new Set(allRecipes.map(recipe => recipe.asset));
    const orphans = svgFiles(assetRoot).map(file => relative(assetRoot, file)).filter(asset => !referenced.has(asset));
    expect(orphans, 'SVG assets with no recipe').toEqual([]);
  });

  it('documents every group in docs/catalog/L5-recipes.md', () => {
    const doc = existsSync(docFile) ? readFileSync(docFile, 'utf8') : '';
    for (const { group } of groups) expect(doc.split('\n').some(line => line.trim() === `### ${group}`), `missing '### ${group}'`).toBe(true);
  });

  for (const { file, group, recipes, source } of groups) {
    describe(group, () => {
      it('is data only: no Angular, no runtime imports', () => {
        expect(source).not.toMatch(/@angular/);
        for (const line of source.split('\n').filter(text => /^\s*import\b/.test(text))) expect(line).toMatch(/^\s*import type\b/);
        expect(recipes.length, `${file} must export a non-empty readonly recipe array`).toBeGreaterThan(0);
      });

      for (const recipe of recipes) {
        it(`${recipe.id}: metadata is complete and consistent`, () => {
          expect(recipe.group).toBe(group);
          expect(recipe.asset).toBe(`${group}/${recipe.id}.svg`);
          expect(Number.isInteger(recipe.version) && recipe.version >= 1).toBe(true);
          for (const field of ['label', 'region', 'view', 'description'] as const) expect(recipe[field].trim().length, field).toBeGreaterThan(0);
          expect(recipe.description.length, 'description should say what the outline shows').toBeGreaterThanOrEqual(30);
          expect(['left', 'right', 'bilateral', 'midline', 'not-applicable']).toContain(recipe.laterality);
          expect(recipe.provenance.author.trim().length).toBeGreaterThan(0);
          expect(recipe.provenance.licence.trim().length).toBeGreaterThan(0);
          expect(recipe.provenance.reviewStatus, 'outlines start unreviewed').toBe('unreviewed');
        });

        it(`${recipe.id}: SVG matches its recipe and the drawing standard`, () => {
          const path = join(assetRoot, recipe.asset);
          expect(existsSync(path), `${recipe.asset} missing`).toBe(true);
          const svg = readFileSync(path, 'utf8');
          expect(basename(path)).toBe(`${recipe.id}.svg`);
          expect(svg.length, 'keep outlines lean (< 40 KB)').toBeLessThan(40_000);

          const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
          const attr = (name: string) => root.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
          expect(attr('xmlns')).toBe('http://www.w3.org/2000/svg');
          expect(Number(attr('width')), 'width').toBe(recipe.width);
          expect(Number(attr('height')), 'height').toBe(recipe.height);
          expect(attr('viewBox')).toBe(`0 0 ${recipe.width} ${recipe.height}`);
          expect(recipe.width >= 600 && recipe.width <= 2000 && recipe.height >= 600 && recipe.height <= 2000, 'size within 600–2000px').toBe(true);
          expect(svg, 'needs a <title>').toMatch(/<title>[^<]+<\/title>/);

          for (const [pattern, label] of forbidden) expect(svg, `${recipe.asset}: ${label} is not allowed`).not.toMatch(pattern);
          const colours = [...svg.matchAll(/(?:fill|stroke|stop-color|color)="([^"]+)"/gi)].map(match => match[1].toLowerCase());
          const outside = colours.filter(colour => colour !== 'none' && !(OUTLINE_PALETTE as readonly string[]).includes(colour));
          expect(outside, `${recipe.asset}: colours outside the outline palette`).toEqual([]);
          expect(svg.match(/#[0-9a-f]{3,8}\b/gi)?.filter(hex => !(OUTLINE_PALETTE as readonly string[]).includes(hex.toLowerCase())) ?? []).toEqual([]);
        });
      }
    });
  }
});
