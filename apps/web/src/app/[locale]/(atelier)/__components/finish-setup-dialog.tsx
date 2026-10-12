"use client";

import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/limits";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ButtonFinishFunnel,
  ContainerFormFunnel,
  FunnelProvider,
} from "@/app/[locale]/get-started/_components/funnel.provider";
import { Link } from "@/i18n/navigation";
import type { UserAuth } from "@/modules/auth/auth.types";
import { isOnboardingPending } from "@/modules/auth/auth.utils";

export const FinishSetupDialog = ({
  user,
  onOpenChange,
}: {
  user: UserAuth;
  onOpenChange?: (open: boolean) => void;
}) => {
  const t = useTranslations("atelier.common");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const pending = isOnboardingPending(user.funnel_step);
  const visible = mounted && open && pending;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onOpenChange?.(visible);
  }, [visible, onOpenChange]);

  if (!mounted || !pending) return null;
  return (
    <Dialog open={visible} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <DialogTitle className="text-2xl font-semibold">
            {t("completeProfileTitle")}
          </DialogTitle>
          <p className="text-text-muted">{t("completeProfileDescription")}</p>

          <Button asChild variant="default" className="w-full font-bold">
            <Link
              href={"/get-started"}
              className="flex items-center justify-center gap-2"
            >
              {t("continueSettingUp")} <ArrowRight className="size-4" />
            </Link>
          </Button>

          <FunnelProvider
            defaultCanContinue={true}
            user={user}
            lastStep={FUNNEL_LAST_STEP}
          >
            <ContainerFormFunnel>
              <ButtonFinishFunnel text={t("skipForNow")} />
            </ContainerFormFunnel>
          </FunnelProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};
