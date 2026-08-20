export type SpectaclePrescriptionFieldType = 'text' | 'decimal' | 'integer' | 'select';

export interface SpectaclePrescriptionField {
  id: string;
  label: string;
  type: SpectaclePrescriptionFieldType;
  unit?: string;
  placeholder?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  readOnly?: boolean;
  disabled?: boolean;
}

export interface SpectaclePrescriptionEye {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface SpectaclePrescriptionViewModel {
  id: string;
  label: string;
  description?: string;
  fields: readonly SpectaclePrescriptionField[];
  eyes: readonly SpectaclePrescriptionEye[];
  values: Readonly<Record<string, Readonly<Record<string, string | undefined>>>>;
  notes?: Readonly<Record<string, string | undefined>>;
  errors?: Readonly<Record<string, string | undefined>>;
  warnings?: Readonly<Record<string, string | undefined>>;
  readOnly?: boolean;
}

export type SpectaclePrescriptionIntent =
  | { type: 'cellFocused'; eyeId: string; fieldId: string }
  | { type: 'cellEditRequested'; eyeId: string; fieldId: string; value: string }
  | { type: 'notesEditRequested'; eyeId: string; value: string };
