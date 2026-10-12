"use client";

import type { UserAuth } from "@repo/common-lib/types/auth";
import type { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import type { BaseUser, User } from "@repo/common-lib/types/user";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { readStorage, writeStorage } from "@/lib/utils/browser-storage";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getUserBenefitAction } from "../server-actions/get-user-benefit.action";

/** "Maybe later" in the atelier hides the gift for this long; it comes back until redeemed. */
const ATELIER_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

// In the funnel the modal only announces the gift (it is claimed on the plan step), so once
// seen it stays dismissed there; in the atelier it is a reminder and comes back after a snooze.
const getSnoozeKey = (userId: number, inAtelier: boolean) =>
  `benefit-modal-snoozed:${userId}:${inAtelier ? "atelier" : "funnel"}`;

const isSnoozed = (key: string) => {
  const until = Number(readStorage("local", key));
  return Number.isFinite(until) && until > Date.now();
};

export const UserBenefitModal = ({
  user,
  subscriptionPath,
  onOpenChange,
}: {
  user: User | BaseUser | UserAuth;
  subscriptionPath?: string;
  onOpenChange?: (open: boolean) => void;
}) => {
  const t = useTranslations("userBenefitModal");
  const tBenefit = useTranslations("benefitSubscriptionDialog");
  const [userBenefit, setUserBenefit] = useState<BenefitWithRedeemed | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const hasFetched = useRef(false);

  const { handleAction } = useHandleAction({
    action: async () => {
      return await getUserBenefitAction(user.id);
    },
    afterAction: async (result) => {
      if (result.data) {
        setUserBenefit(result.data);
      }
    },
  });

  useEffect(() => {
    if (userBenefit) return;

    if ("benefit" in user && user.benefit !== null) {
      setUserBenefit(user.benefit);
      return;
    }

    // Guard against the unstable `handleAction` reference re-triggering this
    // effect on every render, which would spam the API and trip the throttler.
    if (hasFetched.current) return;
    hasFetched.current = true;
    handleAction();
  }, [user, userBenefit, handleAction]);

  const snoozeKey = getSnoozeKey(user.id, !!subscriptionPath);

  useEffect(() => {
    if (userBenefit && !userBenefit.redeemed && !isSnoozed(snoozeKey))
      setOpen(true);
  }, [userBenefit, snoozeKey]);

  const hidden =
    !userBenefit || userBenefit.redeemed || pathname === subscriptionPath;
  const visible = open && !hidden;

  useEffect(() => {
    onOpenChange?.(visible);
  }, [visible, onOpenChange]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) return;
    writeStorage(
      "local",
      snoozeKey,
      String(
        subscriptionPath
          ? Date.now() + ATELIER_SNOOZE_MS
          : Number.MAX_SAFE_INTEGER,
      ),
    );
  };

  if (hidden) return null;

  const benefitTypeKey =
    `benefitTypes.${userBenefit.type}` as `benefitTypes.${typeof userBenefit.type}`;
  const label = tBenefit.has(benefitTypeKey)
    ? tBenefit(benefitTypeKey)
    : userBenefit.type;
  const months = Math.round(userBenefit.trial_days / 30);

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center bg-fg">
            <Gift className="size-8 text-text" />
          </div>

          <DialogHeader className="items-center gap-2">
            <DialogTitle className="text-2xl font-semibold">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-base text-text-muted">
              {t.rich("description", {
                label,
                months,
                name: (chunks) => (
                  <span className="font-semibold text-text">{chunks}</span>
                ),
                free: (chunks) => (
                  <span className="font-semibold text-accent">{chunks}</span>
                ),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex w-full items-center gap-3 border border-border bg-fg px-4 py-3 text-left text-sm text-text-muted">
            <Sparkles className="size-5 shrink-0 text-text" />
            <span>
              {subscriptionPath ? t("claimBelow") : t("claimAfterSetup")}
            </span>
          </div>

          {subscriptionPath ? (
            <div className="flex w-full flex-col gap-2">
              <Button asChild variant="default" className="w-full font-bold">
                <Link
                  href={subscriptionPath}
                  // Seen and acted on: don't pop again on the next page if they browse away.
                  onClick={() => handleOpenChange(false)}
                  className="flex items-center justify-center gap-2"
                >
                  {t("claimNow")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-text-muted"
                onClick={() => handleOpenChange(false)}
              >
                {t("maybeLater")}
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full font-bold"
              onClick={() => handleOpenChange(false)}
            >
              {t("gotItThanks")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
