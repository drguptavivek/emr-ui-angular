/** One point on the time axis (an hour, a quarter hour, a shift). Every label is controller-supplied. */
export interface TimeAxisTick {
  readonly id: string;
  readonly label: string;
  readonly sublabel?: string;
  /** The tick for "now"; the component marks it with text as well as styling. */
  readonly current?: boolean;
}

/** A step the controller offers, e.g. { id: '60', label: 'Hourly' }. */
export interface TimeAxisStep {
  readonly id: string;
  readonly label: string;
}

/**
 * A horizontal time scale that a flowsheet or trend can sit under. The component never
 * computes times: the controller supplies the visible ticks and moves the window on intent.
 */
export interface TimeAxisViewModel {
  readonly id: string;
  readonly title?: string;
  readonly ticks: readonly TimeAxisTick[];
  readonly selectedTickId?: string;
  /** Current step as words ('Hourly', '15 min'). Shown as text when no `steps` are offered. */
  readonly stepLabel?: string;
  /** Steps to choose from; when present a step chooser emits `stepChangeRequested`. */
  readonly steps?: readonly TimeAxisStep[];
  readonly selectedStepId?: string;
  readonly canShiftEarlier?: boolean;
  readonly canShiftLater?: boolean;
  /** No selection, no shifting, no step chooser. */
  readonly readOnly?: boolean;
}

export type TimeAxisIntent =
  | { readonly type: 'tickSelected'; readonly tickId: string }
  | { readonly type: 'shiftEarlierRequested' }
  | { readonly type: 'shiftLaterRequested' }
  | { readonly type: 'stepChangeRequested'; readonly stepId: string };
