import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTokensModule, readEmrCss } from '../scripts/generate-tokens.ts';
import { emrDarkTokens, emrLightTokens } from './tokens';

describe('React tokens', () => {
  it('match emr.css (run scripts/generate-tokens.ts if this fails)', () => {
    const committed = readFileSync(new URL('./tokens.ts', import.meta.url), 'utf8');
    expect(committed).toBe(buildTokensModule(readEmrCss()));
  });

  it('convert units to React Native numbers', () => {
    expect(emrLightTokens.controlHeight).toBe(44);
    expect(emrLightTokens.textMd).toBe(14);
    expect(emrDarkTokens.textMd).toBe(14); // inherited from the light block
    expect(emrDarkTokens.surface).not.toBe(emrLightTokens.surface);
  });
});
