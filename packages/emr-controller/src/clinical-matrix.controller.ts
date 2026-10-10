import { StateController } from './contracts.js';
import {
  ClinicalCellState,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues
} from './models.js';

type ClinicalMatrixExternalIntent = Extract<ClinicalMatrixIntent, { type: 'cellFocused' | 'customCellIntent' }>;

export interface ClinicalMatrixControllerState {
  schema: ClinicalMatrixSchema;
  values: ClinicalMatrixValues;
  lastExternalIntent?: ClinicalMatrixExternalIntent;
}

export type ClinicalCellValidator = (
  state: Readonly<ClinicalMatrixControllerState>,
  rowId: string,
  columnId: string
) => string | undefined;

export class ClinicalMatrixController extends StateController<
  ClinicalMatrixControllerState,
  ClinicalMatrixIntent
> {
  constructor(
    schema: ClinicalMatrixSchema,
    values: ClinicalMatrixValues,
    private readonly validateCell?: ClinicalCellValidator
  ) {
    super({ schema, values });
  }

  dispatch(intent: ClinicalMatrixIntent): void {
    switch (intent.type) {
    case 'cellEditRequested': {
      this.setState(state => {
        const schemaRow = state.schema.rows.find(row => row.id === intent.rowId);
        const schemaColumn = state.schema.columns.find(column => column.id === intent.columnId);
        if (!schemaRow || !schemaColumn) return state;
        if (schemaRow.applicableColumnIds && !schemaRow.applicableColumnIds.includes(intent.columnId)) {
          return state;
        }
        const row = state.values[intent.rowId];
        if (!row) return state;
        const previous = row.cells[intent.columnId];
        if (!previous || previous.readOnly || previous.disabled) return state;
        const nextCell: ClinicalCellState = { ...previous, value: intent.value };
        const intermediate = {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: {
              ...row,
              cells: { ...row.cells, [intent.columnId]: nextCell }
            }
          }
        };
        const error = this.validateCell?.(
          intermediate,
          intent.rowId,
          intent.columnId
        );
        return {
          ...intermediate,
          values: {
            ...intermediate.values,
            [intent.rowId]: {
              ...intermediate.values[intent.rowId],
              cells: {
                ...intermediate.values[intent.rowId]?.cells,
                [intent.columnId]: { ...nextCell, error }
              }
            }
          }
        } as ClinicalMatrixControllerState;
      });
      break;
    }
    case 'cellAssessmentStatusEditRequested': {
      this.setState(state => {
        const row = state.values[intent.rowId];
        const previous = row?.cells[intent.columnId];
        const presentation = state.schema.rows
          .find(candidate => candidate.id === intent.rowId)
          ?.assessmentStatusOptions?.find(option => option.value === intent.status);
        if (!row || !previous || previous.readOnly || previous.disabled) return state;
        if (intent.status !== null && !presentation) return state;
        const { assessmentStatus: _cleared, ...withoutStatus } = previous;
        return {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: {
              ...row,
              cells: {
                ...row.cells,
                [intent.columnId]: presentation ? { ...previous, assessmentStatus: presentation } : withoutStatus
              }
            }
          }
        };
      });
      break;
    }
    case 'remarkEditRequested': {
      this.setState(state => {
        const row = state.values[intent.rowId];
        if (!row || row.remarkReadOnly || row.remarkDisabled) return state;
        return {
          ...state,
          values: {
            ...state.values,
            [intent.rowId]: { ...row, remark: intent.remark }
          }
        };
      });
      break;
    }
    case 'cellFocused':
    case 'customCellIntent':
      this.setState(state => ({ ...state, lastExternalIntent: intent }));
      break;
    default:
      this.assertNever(intent);
    }
  }

  private assertNever(intent: never): never {
    throw new Error(`Unsupported clinical matrix intent: ${JSON.stringify(intent)}`);
  }
}
