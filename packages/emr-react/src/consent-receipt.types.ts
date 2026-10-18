import type { EmrBadge } from '@drguptavivek/emr-controller';

/** Printable, read-only consent summary. Every string is pre-resolved by the app; the component decides nothing. */
export interface EmrConsentReceiptModel {
  title: string;
  patientName: string;
  identifiers: { label: string; display: string }[];
  dateLabel: string;
  noticeVersionLabel: string;
  categories: {
    label: string;
    purposes: { label: string; decisionLabel: string; statusBadge?: EmrBadge }[];
  }[];
  /** How the patient changes a decision, e.g. the desk or helpline. Supplied by the app. */
  howToChange: string;
  footer?: string;
}

export interface EmrConsentReceiptLabels {
  purpose: string;
  decision: string;
  patient: string;
}

export interface EmrConsentReceiptProps {
  model: EmrConsentReceiptModel;
  labels?: Partial<EmrConsentReceiptLabels>;
}
