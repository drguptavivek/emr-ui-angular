import type { ClinicalFieldValue } from './clinical-form.models.js';
import type { EmrFieldDefinition } from './field-contract.models.js';
import type { EmrNodePath } from './node-path.js';
import { pathsEqual } from './node-path.js';

/**
 * One validation verdict, path-addressed. See `docs/field-contract.md` §
 * "Validation" — rules live on the contract, evaluation lives in the
 * controller, the UI only renders these messages.
 */
export interface EmrValidationMessage {
  readonly path: EmrNodePath;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  /** Which `FieldValidationRule` produced this message, if any. */
  readonly ruleId?: string;
  readonly source?: 'mechanical' | 'clinical' | 'terminology' | 'server';
}

/**
 * A conditional-visibility rule. `question` is a path rather than a flat id
 * so a rule may reference a field inside a section or a specific repeat.
 */
export interface EmrEnableWhen {
  readonly question: EmrNodePath;
  readonly operator: 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<=';
  readonly answer: ClinicalFieldValue;
}

/** Controller-owned validation port. The UI never evaluates a rule itself. */
export interface EmrValidationPort {
  validate(
    definition: EmrFieldDefinition,
    value: ClinicalFieldValue,
    path: EmrNodePath,
    signal?: AbortSignal
  ): Promise<readonly EmrValidationMessage[]>;
}

/** All messages addressed to exactly `path` (not descendants of it). */
export function messagesAt(
  messages: readonly EmrValidationMessage[],
  path: EmrNodePath
): readonly EmrValidationMessage[] {
  return messages.filter((message) => pathsEqual(message.path, path));
}

/** Whether any `error`-severity message is addressed to exactly `path`. */
export function hasErrorAt(messages: readonly EmrValidationMessage[], path: EmrNodePath): boolean {
  return messages.some((message) => message.severity === 'error' && pathsEqual(message.path, path));
}
