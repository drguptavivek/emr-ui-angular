import type { ConsentReceiptViewModel } from '@drguptavivek/emr-controller';

/** Printable, read-only consent summary. Every string is pre-resolved by the app; the component decides nothing. */
export type EmrConsentReceiptModel = ConsentReceiptViewModel;

export interface EmrConsentReceiptLabels {
  purpose: string;
  decision: string;
  patient: string;
}

export interface EmrConsentReceiptProps {
  model: EmrConsentReceiptModel;
  labels?: Partial<EmrConsentReceiptLabels>;
}
