import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The colours story hand-copies token values so that it stays free of `getComputedStyle`
 * and remains SSR-safe under the controlled-component rules. Hand-copied values drift, so
 * these tests make emr.css the single source of truth and fail the build when it happens.
 */
const here = new URL('.', import.meta.url).pathname;
const css = readFileSync(join(here, 'emr.css'), 'utf8');
const story = readFileSync(join(here, '..', 'stories', 'colors.stories.ts'), 'utf8');
const typeStory = readFileSync(join(here, '..', 'stories', 'typography.stories.ts'), 'utf8');
const printCss = readFileSync(join(here, 'emr-print.css'), 'utf8');

function tokensIn(selector: RegExp): Record<string, string> {
  const block = new RegExp(selector.source + String.raw`\s*\{([\s\S]*?)\n\}`).exec(css);
  if (!block) throw new Error(`token block not found for ${selector}`);
  const out: Record<string, string> = {};
  for (const [, name, value] of block[1].matchAll(/(--emr-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = tokensIn(/:root,\s*\.emr-theme-light/);
const dark = tokensIn(/\.emr-theme-dark/);

const swatchLight = Object.fromEntries(
  [...story.matchAll(/name: '(--emr-[a-z0-9-]+)', value: '([^']+)'/g)].map(m => [m[1], m[2]]),
);
const swatchDark = Object.fromEntries(
  [...story.matchAll(/'(--emr-[a-z0-9-]+)': '([^']+)'/g)].map(m => [m[1], m[2]]),
);
const constants = Object.fromEntries(
  [...story.matchAll(/name: '(--emr-[a-z-]+)', light: '([^']+)', dark: '([^']+)'/g)]
    .map(m => [m[1], { light: m[2], dark: m[3] }]),
);

// Typography tokens are documented on the Typography page instead.
const typeScale = Object.fromEntries(
  [...typeStory.matchAll(/name: '(--emr-[a-z0-9-]+)', light: '([^']+)', dark: '([^']+)', print: '([^']+)'/g)]
    .map(m => [m[1], { light: m[2], dark: m[3], print: m[4] }]),
);
const typeOther = new Set(
  [...typeStory.matchAll(/name: '(--emr-[a-z0-9-]+)', value: [\"']/g)].map(m => m[1]),
);

const documented = new Set([
  ...Object.keys(swatchLight),
  ...Object.keys(constants),
  ...Object.keys(typeScale),
  ...typeOther,
]);

describe('design token catalogue', () => {
  it('documents every token defined in emr.css', () => {
    const undocumented = Object.keys(light).filter(t => !documented.has(t)).sort();
    expect(undocumented, 'add these to colors.stories.ts').toEqual([]);
  });

  it('documents no token that emr.css does not define', () => {
    const phantom = [...documented].filter(t => !(t in light)).sort();
    expect(phantom, 'these are documented but not defined').toEqual([]);
  });

  it('matches emr.css light values exactly', () => {
    const drift = Object.entries(swatchLight)
      .filter(([t, v]) => light[t]?.toLowerCase() !== v.toLowerCase())
      .map(([t, v]) => `${t}: story=${v} css=${light[t]}`);
    expect(drift).toEqual([]);
  });

  it('matches emr.css dark values exactly', () => {
    const drift = Object.entries(swatchDark)
      .filter(([t, v]) => dark[t]?.toLowerCase() !== v.toLowerCase())
      .map(([t, v]) => `${t}: story=${v} css=${dark[t]}`);
    expect(drift).toEqual([]);
  });

  it('matches emr.css values for non-colour constants in both themes', () => {
    const drift: string[] = [];
    for (const [token, value] of Object.entries(constants)) {
      if (light[token] !== value.light) drift.push(`${token} light: story=${value.light} css=${light[token]}`);
      // layout constants are declared once and inherited by the dark theme
      const expectedDark = dark[token] ?? light[token];
      if (expectedDark !== value.dark) drift.push(`${token} dark: story=${value.dark} css=${expectedDark}`);
    }
    expect(drift).toEqual([]);
  });

  it('keeps every dark token paired with a light definition', () => {
    const orphans = Object.keys(dark).filter(t => !(t in light)).sort();
    expect(orphans, 'dark-only tokens have no light fallback').toEqual([]);
  });
  it('documents the type scale with values matching emr.css', () => {
    const drift = Object.entries(typeScale)
      .filter(([t, v]) => light[t] !== v.light)
      .map(([t, v]) => `${t}: story=${v.light} css=${light[t]}`);
    expect(drift).toEqual([]);
  });

  it('documents a print size for every type-scale step, matching emr-print.css', () => {
    const printBlock = /\.emr-print\s*\{([\s\S]*?)\n\}/.exec(printCss);
    expect(printBlock, '.emr-print block not found').not.toBeNull();
    const printTokens = Object.fromEntries(
      [...printBlock![1].matchAll(/(--emr-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
    );
    const drift = Object.entries(typeScale)
      .filter(([t, v]) => printTokens[t] !== v.print)
      .map(([t, v]) => `${t}: story=${v.print} print.css=${printTokens[t]}`);
    expect(drift).toEqual([]);
  });

  it('keeps the print type scale strictly smaller than the screen scale', () => {
    const rem = (v: string) => parseFloat(v.replace('rem', ''));
    const bigger = Object.entries(typeScale)
      .filter(([, v]) => rem(v.print) >= rem(v.light))
      .map(([t]) => t);
    expect(bigger, 'print sizes must save paper').toEqual([]);
  });
});
