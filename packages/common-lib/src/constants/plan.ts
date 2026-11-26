import { EnumType } from "./enums";

/**
 * Stable internal plan keys (`plans.unique_identifier`). `plans.name` is display copy and may
 * change; seeds and code match plans by these.
 */
export const PLAN_IDENTIFIERS = ['free', 'plus', 'pro'] as const;
export type PlanIdentifier = (typeof PLAN_IDENTIFIERS)[number];

/**
 * The billing periods a new subscription can be bought on, in display order. `QUARTERLY` and
 * `LIFETIME` stay in the `BILLING_TYPE` enum for legacy subscriptions and the free plan.
 */
export const PURCHASABLE_BILLING_TYPES = ['MONTHLY', 'YEARLY'] as const satisfies readonly EnumType<'BILLING_TYPE'>[];
export type PurchasableBillingType = (typeof PURCHASABLE_BILLING_TYPES)[number];
