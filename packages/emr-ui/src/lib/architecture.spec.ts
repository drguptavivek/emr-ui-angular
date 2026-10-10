import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const libraryRoot = join(process.cwd(), 'packages/emr-ui/src/lib');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

const uiSources = sourceFiles(libraryRoot);
const sourceText = uiSources.map((file) => ({ file, text: readFileSync(file, 'utf8') }));

describe('EMR UI architecture boundary', () => {
  it('contains no application integration or persistence dependencies', () => {
    const forbidden = [
      /from\s+['"]@angular\/router['"]/, 
      /\bHttpClient(?:Module)?\b/,
      /\bRouter(?:Link|Outlet|Module)?\b/,
      /\b(?:localStorage|sessionStorage)\b/,
      /(?:\b|\.)(?:fetch|XMLHttpRequest)\s*\(/,
      /\bprovideHttpClient\b/,
      /\b(?:window|globalThis|self|navigator)\s*\./,
      /\bdocument\s*\.\s*(?:body|querySelector|querySelectorAll|getElementById|getElementsBy\w+|activeElement|createElement|addEventListener|cookie|write)\b/,
      /\b(?:showOpenFilePicker|webkitdirectory|createObjectURL)\b/,
    ];

    for (const { file, text } of sourceText) {
      for (const pattern of forbidden) {
        expect(text, `${relative(process.cwd(), file)} must remain presentational`).not.toMatch(pattern);
      }
    }
  });

  it('does not define repository, domain-service, or API clients inside UI components', () => {
    for (const { file, text } of sourceText) {
      expect(text, relative(process.cwd(), file)).not.toMatch(/\b(?:class|interface)\s+\w*(?:Repository|Service|ApiClient)\b/);
      expect(text, relative(process.cwd(), file)).not.toMatch(/@Inject\s*\(/);
    }
  });

  it('keeps UI event contracts explicit through outputs rather than hidden mutation', () => {
    for (const { file, text } of sourceText) {
      expect(text, relative(process.cwd(), file)).not.toMatch(/\b(?:HttpClient|Router|Storage)\b/);
    }
    const interactive = sourceText.filter(({ file }) =>
      /(?:emr-button\.component|emr-choice\.component|emr-inputs\.component|emr-search-select\.component|emr-tabs\.component|emr-left-nav\.component|emr-right-flyout\.component|emr-patient-|emr-timeline\.component|emr-clinical-|emr-order-|emr-hierarchy-|emr-favourites-|emr-staged-|emr-family-|emr-document-|emr-field-generator|emr-terminology-search|emr-validation-rule-editor|emr-field-library-picker|emr-template-)/.test(file)
    );
    for (const { file, text } of interactive) {
      // Decorator @Output() or signal output<T>() — signal outputs are the migration target.
      expect(text, relative(process.cwd(), file)).toMatch(/@Output\(\)|=\s*output</);
    }
  });

  it('does not use mutable collection operations on inputs in component source', () => {
    for (const { file, text } of sourceText) {
      // UI components may derive arrays, but must not mutate input collections in place.
      expect(text, relative(process.cwd(), file)).not.toMatch(/\bthis\.\w+\.(?:push|pop|shift|unshift|splice|sort|reverse)\s*\(/);
    }
  });

  it('styles components with design tokens only, never colour literals', () => {
    // Hex, rgb()/rgba()/hsl()/hsla() literals (including `var(--emr-x, #fff)` fallbacks) break dark mode and theming.
    // Colours live in foundations/emr.css. Clinical colour DATA belongs in models/stories, not component source.
    const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;
    const componentSources = sourceText.filter(({ file }) => file.endsWith('.component.ts'));
    expect(componentSources.length).toBeGreaterThan(0);
    for (const { file, text } of componentSources) {
      text.split('\n').forEach((line, index) => {
        expect(line, `${relative(process.cwd(), file)}:${index + 1} hard-codes a colour; use an --emr-* token`).not.toMatch(colourLiteral);
      });
    }
  });

  it('keeps component-local styles encapsulated', () => {
    // ViewEncapsulation.None is fine for components styled only by emr.css classes, but combined with
    // local `styles:` it leaks those rules into every consumer. ::ng-deep pierces another component's
    // internals: give the inner component an input instead (e.g. EmrSearchSelect `labelHidden`).
    // ponytail: four older components predate this rule; migrate them, then empty this list.
    const grandfathered = new Set([
      'domain/emr-diagnostic-result-summary.component.ts',
      'domain/emr-document-upload-queue.component.ts',
      'domain/emr-family-pedigree.component.ts',
      'domain/emr-staged-checklist.component.ts',
    ]);
    for (const { file, text } of sourceText.filter(({ file }) => file.endsWith('.component.ts'))) {
      const name = relative(libraryRoot, file);
      expect(text, name).not.toMatch(/::ng-deep|ViewEncapsulation\.ShadowDom/);
      if (/ViewEncapsulation\.None/.test(text) && /\bstyles:/.test(text)) {
        expect(grandfathered.has(name), `${name}: unencapsulated local styles`).toBe(true);
      }
    }
  });
});
