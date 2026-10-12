"use client";

import { useCallback, useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/utils/browser-storage";
import type { UserAuth } from "@/modules/auth/auth.types";
import { isOnboardingPending } from "@/modules/auth/auth.utils";
import { UserBenefitModal } from "@/modules/user-benefit/components/user-benefit.modal";
import { useOnboardingOverlays } from "@/modules/users/providers/onboarding-overlays.provider";
import { FinishSetupDialog } from "./finish-setup-dialog";

type Choice = "finish-setup" | "benefit" | null;

const sessionKey = (userId: number) => `atelier-onboarding-dialog:${userId}`;

/**
 * At most one onboarding dialog per visit, highest priority first: finishing setup, then the
 * unredeemed gift. Without this both opened at once on entering the atelier, with the setup
 * guide floating on top. A dialog shown this browser session is not followed by another, so
 * skipping setup lands the user in a calm atelier rather than straight into the next popup.
 */
export const AtelierOnboardingDialogs = ({
  user,
  subscriptionPath,
}: {
  user: UserAuth;
  subscriptionPath: string;
}) => {
  const { setDialogOpen } = useOnboardingOverlays();
  const [choice, setChoice] = useState<Choice>(null);

  // Decided in the browser (it reads sessionStorage). Once a dialog has opened the flag is set,
  // so a later re-run (e.g. funnel_step changing after "skip for now") keeps the first choice.
  useEffect(() => {
    if (readStorage("session", sessionKey(user.id))) return;
    setChoice(
      isOnboardingPending(user.funnel_step) ? "finish-setup" : "benefit",
    );
  }, [user.id, user.funnel_step]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (open) writeStorage("session", sessionKey(user.id), "1");
    },
    [setDialogOpen, user.id],
  );

  // Never leave the guide hidden behind a dialog that unmounted.
  useEffect(() => () => setDialogOpen(false), [setDialogOpen]);

  if (choice === "finish-setup")
    return <FinishSetupDialog user={user} onOpenChange={handleOpenChange} />;
  if (choice === "benefit")
    return (
      <UserBenefitModal
        user={user}
        subscriptionPath={subscriptionPath}
        onOpenChange={handleOpenChange}
      />
    );
  return null;
};
