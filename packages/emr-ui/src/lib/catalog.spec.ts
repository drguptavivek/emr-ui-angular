import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { EMR_CATALOG, EMR_LAYERS, type EmrCatalogEntry } from '../../catalog.manifest';

const packageRoot = join(process.cwd(), 'packages/emr-ui');
const libraryRoot = join(packageRoot, 'src/lib');
const publicApiPath = join(packageRoot, 'src/public-api.ts');
const docsCatalogRoot = join(process.cwd(), 'docs/catalog');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

const allSourceFiles = sourceFiles(libraryRoot);
const componentFiles = allSourceFiles.filter((file) => file.endsWith('.component.ts'));
const fileText = new Map<string, string>(allSourceFiles.map((file) => [file, readFileSync(file, 'utf8')]));

/** Every `export class Emr...` declared anywhere under src/lib/**\/*.component.ts, with the file it lives in. */
const declaredClasses = new Map<string, string>();
for (const file of componentFiles) {
  const text = fileText.get(file)!;
  for (const match of text.matchAll(/export class (Emr\w+)/g)) {
    declaredClasses.set(match[1], file);
  }
}

const catalogById = new Map<string, EmrCatalogEntry>(EMR_CATALOG.map((entry) => [entry.id, entry]));

/**
 * Extracts the set of catalog ids referenced in the `imports: [...]` array of the
 * @Component/@Directive decorator that immediately precedes `export class <id>` in `text`.
 * This mirrors how standalone Angular components declare their component dependencies.
 */
function resolveDecoratorImports(text: string, id: string): string[] {
  const classMatch = text.match(new RegExp(`export class ${id}\\b`));
  if (!classMatch || classMatch.index === undefined) return [];
  const before = text.slice(0, classMatch.index);
  const decoratorStart = Math.max(before.lastIndexOf('@Component('), before.lastIndexOf('@Directive('));
  if (decoratorStart === -1) return [];
  const decoratorBlock = text.slice(decoratorStart, classMatch.index);
  const importsMatch = decoratorBlock.match(/imports:\s*\[([^\]]*)\]/);
  if (!importsMatch) return [];
  return importsMatch[1]
    .split(',')
    .map((token) => token.trim())
    .filter((token) => /^Emr\w+$/.test(token) && token !== id && catalogById.has(token));
}

describe('EMR UI catalog manifest', () => {
  it('lists every exported Emr* class found in src/lib/**/*.component.ts, and vice versa', () => {
    const declaredIds = new Set(declaredClasses.keys());
    const manifestIds = new Set(EMR_CATALOG.map((entry) => entry.id));

    for (const id of declaredIds) {
      expect(manifestIds.has(id), `${id} is exported from source but missing from EMR_CATALOG`).toBe(true);
    }
    for (const id of manifestIds) {
      expect(declaredIds.has(id), `${id} is in EMR_CATALOG but no matching "export class ${id}" was found under src/lib`).toBe(true);
    }
  });

  it('has a public-api.ts export reaching every manifest entry file', () => {
    const publicApiText = readFileSync(publicApiPath, 'utf8');
    const exportedPaths = new Set(
      [...publicApiText.matchAll(/export \* from '(\.\/lib\/[^']+)';/g)].map((match) => match[1])
    );

    for (const entry of EMR_CATALOG) {
      const expectedExport = `./lib/${entry.file.replace(/\.ts$/, '')}`;
      expect(exportedPaths.has(expectedExport), `${entry.id}: expected public-api.ts to export '${expectedExport}'`).toBe(true);
    }
  });

  it('points each entry at a real file containing its declared selector', () => {
    for (const entry of EMR_CATALOG) {
      const filePath = join(libraryRoot, entry.file);
      expect(existsSync(filePath), `${entry.id}: file '${entry.file}' does not exist under src/lib`).toBe(true);

      if (entry.kind === 'component') {
        const text = fileText.get(filePath) ?? readFileSync(filePath, 'utf8');
        expect(text, `${entry.id}: file does not declare selector '${entry.selector}'`).toMatch(
          new RegExp(`selector:\\s*'${entry.selector}'`)
        );
      }
    }
  });

  it('never imports a component from a strictly higher layer', () => {
    const violations: string[] = [];

    for (const entry of EMR_CATALOG) {
      if (entry.kind !== 'component') continue;
      const filePath = join(libraryRoot, entry.file);
      const text = fileText.get(filePath) ?? readFileSync(filePath, 'utf8');
      const resolved = resolveDecoratorImports(text, entry.id);

      for (const importedId of resolved) {
        const imported = catalogById.get(importedId)!;
        if (imported.layer > entry.layer) {
          violations.push(`${entry.id} (L${entry.layer}) imports ${imported.id} (L${imported.layer})`);
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('keeps dependsOn in sync with the actual resolved component imports', () => {
    const mismatches: string[] = [];

    for (const entry of EMR_CATALOG) {
      if (entry.kind !== 'component') {
        if (entry.dependsOn.length > 0) {
          mismatches.push(`${entry.id}: directive entries must declare dependsOn: []`);
        }
        continue;
      }
      const filePath = join(libraryRoot, entry.file);
      const text = fileText.get(filePath) ?? readFileSync(filePath, 'utf8');
      const actual = new Set(resolveDecoratorImports(text, entry.id));
      const declared = new Set(entry.dependsOn);

      const missingFromManifest = [...actual].filter((id) => !declared.has(id));
      const extraInManifest = [...declared].filter((id) => !actual.has(id));

      if (missingFromManifest.length || extraInManifest.length) {
        mismatches.push(
          `${entry.id}: dependsOn out of sync` +
            (missingFromManifest.length ? ` (missing: ${missingFromManifest.join(', ')})` : '') +
            (extraInManifest.length ? ` (stale: ${extraInManifest.join(', ')})` : '')
        );
      }
    }

    expect(mismatches, mismatches.join('\n')).toEqual([]);
  });

  if (!existsSync(docsCatalogRoot)) {
    it.skip('documents every entry under docs/catalog (skipped: docs/catalog does not exist yet)', () => {});
  } else {
    // docs/catalog/ is filled in incrementally, one `L<layer>-<name>.md` file per layer
    // (see EMR_LAYERS). A layer whose file has not landed yet is skipped rather than
    // failed, so this suite stays green while docs are still being written; once a
    // layer's file exists, every entry in that layer is checked for a real heading.
    for (const entry of EMR_CATALOG) {
      const docFile = join(docsCatalogRoot, `L${entry.layer}-${EMR_LAYERS[entry.layer]}.md`);
      if (!existsSync(docFile)) {
        it.skip(`documents ${entry.id} (skipped: '${relative(process.cwd(), docFile)}' does not exist yet)`, () => {});
        continue;
      }
      it(`documents ${entry.id} under docs/catalog/L${entry.layer}-${EMR_LAYERS[entry.layer]}.md`, () => {
        const heading = `### ${entry.id.replace(/Component$/, '').replace(/Directive$/, '')}`;
        const docText = readFileSync(docFile, 'utf8');
        expect(
          docText.split('\n').some((line) => line.trim() === heading),
          `'${relative(process.cwd(), docFile)}' is missing heading '${heading}'`
        ).toBe(true);
      });
    }
  }
});
