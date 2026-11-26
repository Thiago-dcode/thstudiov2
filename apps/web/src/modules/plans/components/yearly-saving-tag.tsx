import type { PlanPrice } from "@repo/common-lib/types/plan";
import { getYearlySaving } from "@repo/common-lib/utils/calculatePrice";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { getFreeMonths } from "../plans.utils";

/**
 * Small inverse tag that names what paying yearly saves ("2 months free"), computed from the
 * plan's real price rows. Falls back to the percent when the saving is not a whole number of
 * months, and renders nothing when yearly is not cheaper.
 */
export const YearlySavingTag = ({
  prices,
  className,
}: {
  prices: PlanPrice[];
  className?: string;
}) => {
  const t = useTranslations("plans.price");
  const saving = getYearlySaving(prices);
  if (!saving) return null;
  const freeMonths = getFreeMonths(prices);

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center bg-text px-2 py-0.5 text-xs font-medium text-bg",
        className,
      )}
    >
      {freeMonths
        ? t("monthsFree", { months: freeMonths })
        : t("savePercent", { percent: saving.percent })}
    </span>
  );
};
