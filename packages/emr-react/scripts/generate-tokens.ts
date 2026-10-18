/**
 * emr.css is the single source of truth for tokens. This turns its two theme blocks into
 * plain objects React Native can use: `44px` → 44, `0.875rem` → 14, hex and shorthands stay
 * strings. Typography is declared once on the light block and inherited by dark, so it is
 * merged into both. tokens.spec.ts regenerates in memory and fails on drift.
 *
 *   node packages/emr-react/scripts/generate-tokens.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

const cssPath = new URL('../../emr-ui/src/lib/foundations/emr.css', import.meta.url);
const outPath = new URL('../src/tokens.ts', import.meta.url);

function block(css: string, selector: RegExp): Record<string, string> {
  const match = new RegExp(selector.source + String.raw`\s*\{([\s\S]*?)\n\}`).exec(css);
  if (!match) throw new Error(`token block not found for ${selector}`);
  const out: Record<string, string> = {};
  for (const [, name, value] of match[1].matchAll(/--emr-([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[name] = value.trim();
  return out;
}

const camel = (name: string) => name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function convert(value: string): string | number {
  const px = /^(-?[\d.]+)px$/.exec(value);
  if (px) return Number(px[1]);
  const rem = /^(-?[\d.]+)rem$/.exec(value);
  if (rem) return Number(rem[1]) * 16;
  if (/^-?[\d.]+$/.test(value)) return Number(value);
  return value;
}

function themeObject(tokens: Record<string, string>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(tokens).map(([name, value]) => [camel(name), convert(value)]));
}

export function buildTokensModule(css: string): string {
  const light = block(css, /:root,\s*\.emr-theme-light/);
  const dark = { ...light, ...block(css, /\.emr-theme-dark/) };
  const lightObj = themeObject(light);
  const darkObj = themeObject(dark);
  const missing = Object.keys(lightObj).filter(key => !(key in darkObj));
  if (missing.length) throw new Error(`dark theme missing ${missing.join(', ')}`);
  const field = (key: string) => `  ${key}: ${typeof lightObj[key] === 'number' ? 'number' : 'string'};`;
  const entries = (obj: Record<string, string | number>) =>
    Object.entries(obj).map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join('\n');
  return `// GENERATED from packages/emr-ui/src/lib/foundations/emr.css — do not edit.
// Regenerate: node packages/emr-react/scripts/generate-tokens.ts

export interface EmrTokens {
${Object.keys(lightObj).map(field).join('\n')}
}

export const emrLightTokens: EmrTokens = {
${entries(lightObj)}
};

export const emrDarkTokens: EmrTokens = {
${entries(darkObj)}
};
`;
}

export function readEmrCss(): string {
  return readFileSync(cssPath, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(outPath, buildTokensModule(readEmrCss()));
  console.log(`wrote ${outPath.pathname}`);
}
