import type { EmrNodePath } from '@drguptavivek/emr-controller';

/** Breadcrumb text for a node path. Repeat indices are 0-based in the path but shown 1-based to people. */
export function pathBreadcrumb(path: EmrNodePath): string {
  return path.map(s => (typeof s === 'number' ? String(s + 1) : s)).join(' › ');
}
