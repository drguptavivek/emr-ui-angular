import type {
  EmrConsentReceiptModel,
  EmrConsentReceiptParty,
  EmrConsentReceiptScope,
} from '@drguptavivek/emr-controller';

export type {
  EmrConsentReceiptModel,
  EmrConsentReceiptParty,
  EmrConsentReceiptScope,
};

export interface EmrConsentReceiptLabels {
  purpose: string;
  decision: string;
  patient: string;
}

export interface EmrConsentReceiptProps {
  model: EmrConsentReceiptModel;
  labels?: Partial<EmrConsentReceiptLabels>;
}
