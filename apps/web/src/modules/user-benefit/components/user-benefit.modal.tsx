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
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getUserBenefitAction } from "../server-actions/get-user-benefit.action";

export const UserBenefitModal = ({
  user,
  subscriptionPath,
}: {
  user: User | BaseUser | UserAuth;
  subscriptionPath?: string;
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

  useEffect(() => {
    if (userBenefit) setOpen(true);
  }, [userBenefit]);

  if (!userBenefit || userBenefit.redeemed || pathname === subscriptionPath)
    return null;

  const benefitTypeKey =
    `benefitTypes.${userBenefit.type}` as `benefitTypes.${typeof userBenefit.type}`;
  const label = tBenefit.has(benefitTypeKey)
    ? tBenefit(benefitTypeKey)
    : userBenefit.type;
  const months = Math.round(userBenefit.trial_days / 30);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                  className="flex items-center justify-center gap-2"
                >
                  {t("claimNow")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-text-muted"
                onClick={() => setOpen(false)}
              >
                {t("maybeLater")}
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full font-bold"
              onClick={() => setOpen(false)}
            >
              {t("gotItThanks")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
