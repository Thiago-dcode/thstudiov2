import type { EnumType } from "@repo/common-lib/constants/enums";

// Display label only — the free-month count always comes from the benefit's
// own `trial_days` (single source of truth shared with the wait-list emails),
// never hardcoded here.
export const BENEFIT_CONFIG: Record<
  EnumType<"BENEFIT_TYPE">,
  { label: string }
> = {
  EARLY_USER: { label: "Early User" },
  VIP: { label: "VIP" },
  FOUNDER: { label: "FOUNDER" },
};
