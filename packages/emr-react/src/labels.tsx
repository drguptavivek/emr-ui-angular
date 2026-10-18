'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { DateDisplayFormat } from './l1-inputs.logic';

/**
 * Every string a component renders on its own. Field labels, options and messages come from
 * the definition and model; these are the few built-ins, overridable per locale (e.g. Hindi).
 */
export interface EmrLabels {
  /** Locale's date display order (en-IN: dd-mm-yyyy). Values stay ISO; keypad digits are read in this order. */
  dateFormat: DateDisplayFormat;
  /** Accessible names of the two halves of a date-time field. */
  dateLabel: string;
  timeLabel: string;
  yes: string;
  select: string;
  close: string;
  required: string;
  add: string;
  remove: string;
  show: string;
  hide: string;
  noEntries: string;
  entry: (index: number) => string;
  assessmentStatus: (fieldLabel: string) => string;
  unregisteredRenderer: (key: string) => string;
}

export const emrEnglishLabels: EmrLabels = {
  dateFormat: 'dd-mm-yyyy',
  dateLabel: 'Date',
  timeLabel: 'Time',
  yes: 'Yes',
  select: 'Select',
  close: 'Close',
  required: 'required',
  add: 'Add',
  remove: 'Remove',
  show: 'Show',
  hide: 'Hide',
  noEntries: 'No entries recorded.',
  entry: index => `Entry ${index}`,
  assessmentStatus: label => `${label} assessment status`,
  unregisteredRenderer: key => `Custom renderer “${key}” is not registered.`,
};

const EmrLabelsContext = createContext<EmrLabels>(emrEnglishLabels);

export function EmrLabelsProvider({ labels, children }: { labels: Partial<EmrLabels>; children: ReactNode }) {
  const value = useMemo(() => ({ ...emrEnglishLabels, ...labels }), [labels]);
  return <EmrLabelsContext.Provider value={value}>{children}</EmrLabelsContext.Provider>;
}

export function useEmrLabels(): EmrLabels {
  return useContext(EmrLabelsContext);
}
