export interface EmrPatientSummaryShape {
  lastSpectacleRx?: unknown;
  lastGlaucomaScreen?: unknown;
  lastDrScreen?: unknown;
  openReferrals?: readonly unknown[];
  openBookings?: readonly unknown[];
  openEpisodes?: readonly unknown[];
}

/** True when at least one summary block would render; drives the "New patient" empty state. */
export function hasSummary(s: EmrPatientSummaryShape | undefined): boolean {
  if (!s) return false;
  return !!(s.lastSpectacleRx || s.lastGlaucomaScreen || s.lastDrScreen || s.openReferrals?.length || s.openBookings?.length || s.openEpisodes?.length);
}

/** Non-empty strings only, so a missing value never renders as a blank label. */
export function present(...values: (string | undefined)[]): string[] {
  return values.filter((v): v is string => !!v);
}
