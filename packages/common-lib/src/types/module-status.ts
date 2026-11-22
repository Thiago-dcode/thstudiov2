/**
 * Quick-toggle input shared by every module with highlight/active switches
 * (portfolios now; collections and services later). At least one key must be present.
 */
export type ModuleStatusInput = {
  is_highlight?: boolean;
  is_active?: boolean;
};

/** The stored values after a quick toggle. */
export type ModuleStatus = {
  id: number;
  is_highlight: boolean;
  is_active: boolean;
};
