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
