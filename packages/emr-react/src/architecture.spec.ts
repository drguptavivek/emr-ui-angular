import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { EMR_CATALOG } from '../../emr-ui/catalog.manifest';

const reactSrcRoot = join(process.cwd(), 'packages/emr-react/src');

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx')) return [];
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

const reactSources = listSourceFiles(reactSrcRoot).map((file) => ({
  file,
  rel: relative(process.cwd(), file),
  text: readFileSync(file, 'utf8'),
}));

function resolveModuleFile(baseDir: string, spec: string): string | null {
  for (const ext of ['.tsx', '.ts', '.web.tsx', '.web.ts']) {
    const candidate = join(baseDir, `${spec}${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function collectExportedNames(filePath: string, visited = new Set<string>()): Set<string> {
  if (visited.has(filePath)) return new Set();
  visited.add(filePath);
  const text = readFileSync(filePath, 'utf8');
  const names = new Set<string>();

  for (const m of text.matchAll(/export\s+(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const cleaned = part.replace(/\btype\b/g, '').trim();
      if (!cleaned) continue;
      const asParts = cleaned.split(/\s+as\s+/);
      names.add((asParts[1] ?? asParts[0]).trim());
    }
  }
  for (const m of text.matchAll(/export\s+\*\s+from\s+['"](\.\/[^'"]+)['"]/g)) {
    const target = resolveModuleFile(reactSrcRoot, m[1]);
    if (target) {
      for (const n of collectExportedNames(target, visited)) {
        names.add(n);
      }
    }
  }
  return names;
}

describe('EMR React architecture boundary', () => {
  it('starts every .tsx component module with use client', () => {
    const tsxFiles = reactSources.filter(({ file }) => file.endsWith('.tsx'));
    expect(tsxFiles.length).toBeGreaterThan(0);
    for (const { rel, text } of tsxFiles) {
      expect(
        text.trimStart().startsWith("'use client';") || text.trimStart().startsWith('"use client";'),
        `${rel} must start with 'use client';`
      ).toBe(true);
    }
  });

  it('uses only type-only imports and re-exports from @drguptavivek/emr-controller in .tsx components', () => {
    // Component .tsx files must only import/export types from @drguptavivek/emr-controller; pure .logic.ts helpers may delegate to controller predicates (e.g. isEmptyValue).
    const runtimeImport = /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/;
    const tsxFiles = reactSources.filter(({ file }) => file.endsWith('.tsx'));
    for (const { rel, text } of tsxFiles) {
      expect(text, `${rel} must only import/export types from @drguptavivek/emr-controller`).not.toMatch(runtimeImport);
    }
  });

  it('contains no persistence, network, routing, or service dependencies', () => {
    const forbidden = [
      /\b(?:localStorage|sessionStorage|indexedDB)\b/,
      /(?:\b|\.)(?:fetch|XMLHttpRequest)\s*\(/,
      /\b(?:class|interface)\s+\w*(?:Repository|Service|ApiClient)\b/,
    ];
    for (const { rel, text } of reactSources) {
      for (const pattern of forbidden) {
        expect(text, `${rel} must remain presentational`).not.toMatch(pattern);
      }
    }
  });

  it('does not declare ViewModel, Model, or Intent contracts directly inside emr-react', () => {
    // All ViewModels, Models, and Intents belong in @drguptavivek/emr-controller and may only be re-exported via `export type { ... }`.
    const localContractDeclaration = /(?:^|\n)\s*export\s+(?:interface|type)\s+\w*(?:ViewModel|Model|Intent)\b/;
    for (const { rel, text } of reactSources) {
      expect(
        text,
        `${rel} declares a ViewModel, Model, or Intent locally; move it to @drguptavivek/emr-controller`
      ).not.toMatch(localContractDeclaration);
    }
  });

  it('exports a React counterpart from index.ts for every entry in catalog.manifest.ts', () => {
    const exportedNames = collectExportedNames(join(reactSrcRoot, 'index.ts'));
    for (const entry of EMR_CATALOG) {
      if (entry.id === 'EmrClinicalCellRendererDirective') {
        // Represented by the `customRenderers?: EmrCustomRenderers` prop on EmrClinicalForm / EmrRepeatableGroup / EmrTypedField.
        expect(exportedNames.has('EmrCustomRenderers')).toBe(true);
        expect(exportedNames.has('EmrClinicalForm')).toBe(true);
        expect(exportedNames.has('EmrRepeatableGroup')).toBe(true);
        expect(exportedNames.has('EmrTypedField')).toBe(true);
        continue;
      }
      if (entry.id === 'EmrBadgeComponent') {
        expect(exportedNames.has('EmrBadgeView')).toBe(true);
        continue;
      }
      const reactName = entry.id.replace(/Component$/, '');
      expect(
        exportedNames.has(reactName),
        `Missing emr-react export ${reactName} for catalog entry ${entry.id}`
      ).toBe(true);
    }
  });
});
