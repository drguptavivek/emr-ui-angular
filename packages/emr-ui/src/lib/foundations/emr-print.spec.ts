import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The print structural rules are authored twice — scoped to `.emr-print` for the
 * on-screen preview, and unscoped inside `@media print` for real printing. If the two
 * drift, the Storybook preview stops representing what actually comes out of the printer.
 * These tests make that impossible.
 */
const css = readFileSync(join(new URL('.', import.meta.url).pathname, 'emr-print.css'), 'utf8');

function between(begin: string, end: string): string {
  const s = css.indexOf(begin);
  const e = css.indexOf(end);
  expect(s, `${begin} marker missing`).toBeGreaterThan(-1);
  expect(e, `${end} marker missing`).toBeGreaterThan(s);
  return css.slice(s + begin.length, e).trim();
}

const scoped = between('/* @emr-print:scoped:begin */', '/* @emr-print:scoped:end */');
const media = between('/* @emr-print:media:begin */', '/* @emr-print:media:end */');

describe('print layer', () => {
  it('keeps the scoped preview rules identical to the @media print rules', () => {
    // `.emr-print--form ` is shared by both blocks, so protect it before stripping.
    const normalised = scoped
      .replace(/\.emr-print--form /g, ' FORM ')
      .replace(/\.emr-print /g, '')
      .replace(/ FORM /g, '.emr-print--form ');
    expect(normalised).toBe(media);
  });

  it('never leaves collapsed content hidden on paper', () => {
    // A collapsed section printed as collapsed is silently omitted clinical data.
    expect(media).toMatch(/\[hidden\]/);
    expect(media).toMatch(/display: revert !important/);
    expect(media).toMatch(/details/);
  });

  it('never leaves scrollable overflow clipped on paper', () => {
    expect(media).toMatch(/overflow: visible !important/);
    expect(media).toMatch(/max-height: none !important/);
  });

  it('collapses interactive touch targets to save paper', () => {
    const printBlock = /\.emr-print\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(printBlock).toMatch(/--emr-control-height:\s*auto/);
    expect(printBlock).toMatch(/--emr-compact-height:\s*auto/);
  });

  it('keeps badge text legible without ink-heavy fills', () => {
    // Badges may lose their fill only because every badge also carries a text
    // label — the "never colour alone" rule is what makes greyscale safe.
    expect(media).toMatch(/\.emr-badge/);
    expect(media).toMatch(/background: transparent !important/);
    expect(media).toMatch(/border: 1px solid #666 !important/);
  });

  it('avoids splitting a clinical record across a page break', () => {
    expect(media).toMatch(/break-inside: avoid/);
    expect(media).toMatch(/page-break-inside: avoid/);
  });

  it('repeats table headers across pages', () => {
    expect(media).toMatch(/thead \{ display: table-header-group; \}/);
  });

  it('declares a page size and margin', () => {
    expect(css).toMatch(/@page \{[\s\S]*?size: A4;[\s\S]*?margin: 12mm;[\s\S]*?\}/);
  });
});

/**
 * A print rule that targets a class no template emits is dead code — and dead print
 * rules fail silently, by omitting clinical data from paper. Every `.emr-*` class the
 * print layer selects must be a class a component actually renders (or a root class
 * the consumer applies, listed below).
 */
describe('print selectors target real DOM', () => {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const lib = join(new URL('.', import.meta.url).pathname, '..');

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap(name => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return walk(full);
      return name.endsWith('.component.ts') ? [full] : [];
    });
  }
  const templates = walk(lib).map(file => readFileSync(file, 'utf8')).join('\n');
  const emittedClasses = new Set<string>();
  // class="a b", host: { class: 'a b' }, [class.a]="..."
  for (const [, list] of templates.matchAll(/class(?:=|:\s*)["'`]([^"'`]+)["'`]/g)) {
    for (const cls of list.split(/\s+/)) if (cls.startsWith('emr-')) emittedClasses.add(cls);
  }
  for (const [, cls] of templates.matchAll(/\[class\.(emr-[a-zA-Z0-9_-]+)\]/g)) emittedClasses.add(cls);
  for (const [, cls] of templates.matchAll(/['"`](emr-[a-zA-Z0-9_-]+)['"`]/g)) emittedClasses.add(cls);

  // Applied by the consumer on a root element, not emitted by a component.
  const consumerRootClasses = new Set(['emr-print', 'emr-print--form', 'emr-print--letter', 'emr-theme-dark', 'emr-theme-light']);

  const selectorLists = [...css.matchAll(/(^|[}{;]|\*\/)\s*([^{}/@][^{};]*?)\s*\{/gm)].map(m => m[2]);
  const selected = new Set<string>();
  for (const list of selectorLists) {
    for (const [, cls] of list.matchAll(/\.(emr-[a-zA-Z0-9_-]+)/g)) selected.add(cls);
  }

  it('finds the classes the print layer depends on', () => {
    expect(selected.has('emr-section-card__content')).toBe(true);
    expect(selected.has('emr-table-wrap')).toBe(true);
    expect(selected.has('emr-matrix')).toBe(true);
  });

  it('only selects classes a component template emits', () => {
    const ghosts = [...selected].filter(cls => !emittedClasses.has(cls) && !consumerRootClasses.has(cls));
    expect(ghosts, `print rules target classes nothing renders: ${ghosts.join(', ')}`).toEqual([]);
  });

  it('restores collapsed section content and un-hides responsive tables', () => {
    expect(media).toMatch(/\.emr-section-card__content\[hidden\]/);
    expect(media).toMatch(/\.emr-table-wrap,\s*\.emr-matrix table\s*\{\s*display: revert !important/);
  });

  it('keeps checkbox and radio glyphs in the default print context', () => {
    const beforeForm = media.slice(0, media.indexOf('.emr-print--form'));
    expect(beforeForm).toMatch(/input\[type='checkbox'\],\s*input\[type='radio'\]\s*\{\s*appearance: auto !important/);
  });
});
