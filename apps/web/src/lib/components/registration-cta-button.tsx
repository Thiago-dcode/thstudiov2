"use client";

import type { WaitListCreateResponse } from "@repo/common-lib/types/wait-list";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import {
  WaitListForm,
  WaitListSuccessDialog,
} from "@/modules/wait-list/components/wait-list-form";
import { WaitListSteps } from "@/modules/wait-list/components/wait-list-steps";

type RegistrationCtaButtonProps = {
  size?: "sm" | "lg";
  className?: string;
  intent?: "getStarted" | "createPortfolio";
  label?: string;
  /** Runs when the button navigates (atelier, register) — not when it opens the wait-list
   * dialog. The mobile drawer passes `closeDrawer` here, and the dialog renders inside the
   * drawer: closing it on that click unmounted the dialog the moment it opened. */
  onNavigate?: () => void;
};

export function RegistrationCtaButton({
  size = "sm",
  className,
  intent = "getStarted",
  label: labelOverride,
  onNavigate,
}: RegistrationCtaButtonProps) {
  const { session } = useSession();
  const { isRegisterClose } = useAppStatus();
  const registrationIsClosed = !isRegisterClose;
  const tCta = useTranslations("landing.cta");
  const tFooter = useTranslations("footer");
  const tWebHeader = useTranslations("webHeader");
  const tWaitList = useTranslations("landing.hero");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<WaitListCreateResponse | null>(
    null,
  );

  const handleWaitListSuccess = useCallback((data: WaitListCreateResponse) => {
    setSuccessData(data);
    setDialogOpen(false);
    setSuccessOpen(true);
  }, []);

  const iconClassName = size === "sm" ? "size-3.5" : "size-4";

  if (session) {
    return (
      <Button asChild size={size} className={cn(className)}>
        <Link href="/atelier" onClick={onNavigate}>
          {tWebHeader("goToAtelier")}
          <ArrowRight className={iconClassName} />
        </Link>
      </Button>
    );
  }

  const registerLabel =
    intent === "createPortfolio" ? tCta("button") : tFooter("cta.getStarted");
  const waitListLabel = tCta("waitListButton");
  const label =
    labelOverride ?? (registrationIsClosed ? waitListLabel : registerLabel);

  if (registrationIsClosed) {
    return (
      <>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size={size} className={cn(className)}>
              {label}
              <ArrowRight className={iconClassName} />
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-w-2xl w-screen max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto overflow-x-hidden">
            <DialogHeader className="gap-2 pr-8 text-left sm:pr-10 sm:text-left">
              <DialogTitle className="font-serif text-2xl! font-light leading-tight tablet:text-3xl!">
                {tWaitList("waitList.dialog.title")}
              </DialogTitle>
              <DialogDescription className="text-sm! leading-snug text-text-muted tablet:text-base!">
                {tWaitList("waitList.dialog.description")}
              </DialogDescription>
            </DialogHeader>
            <WaitListSteps />
            <div className="flex flex-col gap-2">
              <WaitListForm
                onSuccess={handleWaitListSuccess}
                className="flex-col! sm:flex-row! sm:items-start [&_button]:w-full sm:[&_button]:w-auto"
              />
              <p className="text-left text-xs text-text-muted">
                {tWaitList("waitList.dialog.privacy")}
              </p>
            </div>
          </DialogContent>
        </Dialog>
        <WaitListSuccessDialog
          open={successOpen}
          onOpenChange={setSuccessOpen}
          data={successData}
        />
      </>
    );
  }

  return (
    <Button asChild variant="accent" size={size} className={cn(className)}>
      <Link href="/auth/register" onClick={onNavigate}>
        {label}
        <ArrowRight className={iconClassName} />
      </Link>
    </Button>
  );
}
