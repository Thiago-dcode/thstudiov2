import type { EnumType } from "@repo/common-lib/constants/enums";

export const BENEFIT_CONFIG: Record<
 EnumType<"BENEFIT_TYPE">,
 { label: string; months: number }
> = {
 EARLY_USER: { label: "Early User", months: 3 },
 VIP: { label: "VIP", months: 6 },
 FOUNDER: { label: "FOUNDER", months: 12 },
};
