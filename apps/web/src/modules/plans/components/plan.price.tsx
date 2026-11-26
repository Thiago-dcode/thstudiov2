import type { PlanPrice as PlanPriceType } from "@repo/common-lib/types/plan";
import {
  getPurchasablePrices,
  getYearlySaving,
} from "@repo/common-lib/utils/calculatePrice";
import { useFormatter, useTranslations } from "next-intl";
import { YearlySavingTag } from "./yearly-saving-tag";

export const PlanPrice = ({
  prices,
  isFree,
}: {
  prices: PlanPriceType[];
  isFree: boolean;
}) => {
  const t = useTranslations("plans.price");
  const format = useFormatter();
  const formatEur = (value: number) =>
    format.number(value, { style: "currency", currency: "EUR" });

  // The headline is what a month costs when paid monthly; the yearly saving is stated
  // underneath from the real price rows, never folded into the headline.
  const monthly = getPurchasablePrices(prices).find(
    (price) => price.billing_type === "MONTHLY",
  );
  const saving = getYearlySaving(prices);

  return (
    <div className="flex w-full flex-col gap-1">
      {isFree ? (
        <span className="text-3xl font-bold text-text">{t("free")}</span>
      ) : (
        <>
          {/* No active monthly row means no honest monthly headline: show nothing rather than €0. */}
          {monthly ? (
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold tabular-nums text-text">
                {formatEur(monthly.price)}
              </span>
              <span className="text-sm text-text-muted">{t("perMonth")}</span>
            </div>
          ) : null}
          {saving ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted tabular-nums">
              {t("yearlyNote", {
                monthly: formatEur(saving.monthlyEquivalent),
              })}
              <YearlySavingTag prices={prices} />
            </span>
          ) : null}
          <span className="text-xs text-text-muted">{t("vatIncluded")}</span>
        </>
      )}
    </div>
  );
};
