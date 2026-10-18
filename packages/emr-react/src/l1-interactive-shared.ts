import { Platform } from 'react-native';

/** Built-in strings of the interactive primitives. Override any subset per locale via each component's `labels` prop. */
export const interactiveLabelDefaults = {
  tabsAria: 'Sections',
  searchLabel: 'Search',
  searchPlaceholder: 'Type to search',
  searchButton: 'Search',
  searching: 'Searching…',
  selectedOptions: 'Selected options',
  remove: 'Remove',
  removeItem: (label: string) => `Remove ${label}`,
  noMatches: 'No matching options',
  required: 'required',
  likertOption: (point: number, text: string) => `${point} – ${text}`,
  stagesAria: 'Stages',
  stageStatus: (label: string, assistive?: string) => (assistive ? `${label} (${assistive})` : label),
  timeAxisTitle: 'Time axis',
  noTimes: 'No times supplied.',
  step: 'Step',
  stepValue: (label: string) => `Step: ${label}`,
  earlier: 'Earlier',
  later: 'Later',
  current: 'Current',
  selected: 'selected',
  increment: 'Increase',
  decrement: 'Decrease',
};
export type InteractiveLabels = typeof interactiveLabelDefaults;

export interface WebKeyEvent { key: string; preventDefault(): void }

/** Web-only DOM props (tabIndex, onKeyDown) that react-native-web forwards; native gets nothing. */
export function webProps(props: object): object | null {
  return Platform.OS === 'web' ? props : null;
}
