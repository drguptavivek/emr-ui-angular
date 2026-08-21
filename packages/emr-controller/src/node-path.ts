/**
 * Addressing for nested capture surfaces — sections, repeatable groups, matrices.
 *
 * A path is a sequence of segments: a `string` names a linkId (a field or a
 * container), a `number` names a zero-based repeat index. See
 * `docs/field-contract.md` § "Addressing children" for the design rationale.
 *
 * ```ts
 * ['weight']                      // a plain field
 * ['vitals', 'weight']            // a field inside a section
 * ['medications', 2, 'dose']      // the 3rd medication's dose
 * ['acuity', 'iop', 'od']         // a matrix cell: matrix -> row -> column
 * ```
 *
 * `EmrNodePath` is the wire form used everywhere in memory. `serializePath` /
 * `parsePath` derive a string key — for `Map`/`Record` indexing and logs — and
 * are exact inverses of one another.
 *
 * ## Serialization scheme
 *
 * A string segment is written as a bare identifier joined to its predecessor
 * with `.` (e.g. `medications.dose`), UNLESS it is the first segment, in which
 * case no leading `.` is written. A numeric segment is always written as
 * `[<n>]`, with no separator before the bracket, so it reads as an index into
 * whatever precedes it (`medications[2]`). Because the very first segment has
 * no predecessor, a leading numeric segment still needs a bracket to be
 * distinguishable from a string, so it is written as `[0]` with nothing
 * before it.
 *
 * To keep `parsePath` unambiguous and `serializePath`/`parsePath` exact
 * inverses, a string segment that itself contains a character with syntactic
 * meaning (`.`, `[`, `]`) or the escape character (`\`) has those characters
 * escaped with a leading backslash before being written. On parse, the
 * backslash is consumed and the following character is taken literally.
 */

export type EmrPathSegment = string | number;
export type EmrNodePath = readonly EmrPathSegment[];

export class EmrNodePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmrNodePathError';
  }
}

const SPECIAL_CHARS = new Set(['.', '[', ']', '\\']);

function escapeSegment(segment: string): string {
  let out = '';
  for (const char of segment) {
    if (SPECIAL_CHARS.has(char)) out += '\\';
    out += char;
  }
  return out;
}

/** Serialize an {@link EmrNodePath} to its canonical string key. */
export function serializePath(path: EmrNodePath): string {
  let out = '';
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    if (typeof segment === 'number') {
      if (!Number.isInteger(segment) || segment < 0) {
        throw new EmrNodePathError(
          `Path segment at index ${i} must be a non-negative integer, got ${String(segment)}.`
        );
      }
      out += `[${segment}]`;
    } else {
      if (i > 0) out += '.';
      out += escapeSegment(segment);
    }
  }
  return out;
}

/**
 * Parse a canonical path key back into an {@link EmrNodePath}. Exact inverse
 * of {@link serializePath}. Throws {@link EmrNodePathError} on malformed
 * input rather than returning a partial path.
 */
export function parsePath(key: string): EmrNodePath {
  const segments: EmrPathSegment[] = [];
  let i = 0;
  const len = key.length;

  while (i < len) {
    if (key[i] === '[') {
      const close = key.indexOf(']', i + 1);
      if (close === -1) {
        throw new EmrNodePathError(`Unclosed '[' at index ${i} in path key "${key}".`);
      }
      const digits = key.slice(i + 1, close);
      if (!/^\d+$/.test(digits)) {
        throw new EmrNodePathError(
          `Expected a non-negative integer inside brackets at index ${i} in path key "${key}", got "${digits}".`
        );
      }
      segments.push(Number(digits));
      i = close + 1;
      if (i < len) {
        if (key[i] === '.') {
          i += 1;
        } else if (key[i] !== '[') {
          throw new EmrNodePathError(
            `Expected '.' or '[' after ']' at index ${i} in path key "${key}".`
          );
        }
      }
      continue;
    }

    // A string segment: read until an unescaped '.' or '['.
    let out = '';
    let sawChar = false;
    while (i < len) {
      const char = key[i]!;
      if (char === '\\') {
        if (i + 1 >= len) {
          throw new EmrNodePathError(`Trailing escape character at index ${i} in path key "${key}".`);
        }
        out += key[i + 1];
        sawChar = true;
        i += 2;
        continue;
      }
      if (char === '.' || char === '[') break;
      if (char === ']') {
        throw new EmrNodePathError(`Unexpected ']' at index ${i} in path key "${key}".`);
      }
      out += char;
      sawChar = true;
      i += 1;
    }
    if (!sawChar) {
      throw new EmrNodePathError(`Empty segment at index ${i} in path key "${key}".`);
    }
    segments.push(out);
    if (i < len && key[i] === '.') {
      i += 1;
      if (i >= len) {
        throw new EmrNodePathError(`Trailing '.' in path key "${key}".`);
      }
    }
  }

  return segments;
}

/** Structural equality of two paths. */
export function pathsEqual(a: EmrNodePath, b: EmrNodePath): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Whether `prefix` is a prefix of `path`, structurally. A path is a prefix of
 * itself; the empty path is a prefix of every path.
 */
export function isPrefixOf(prefix: EmrNodePath, path: EmrNodePath): boolean {
  if (prefix.length > path.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== path[i]) return false;
  }
  return true;
}

/** Append one segment to a parent path, returning a new path. */
export function childPath(parent: EmrNodePath, segment: EmrPathSegment): EmrNodePath {
  return [...parent, segment];
}
