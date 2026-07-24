"use client";

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
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";

type RegistrationCtaButtonProps = {
  size?: "sm" | "lg";
  className?: string;
  intent?: "getStarted" | "createPortfolio";
  label?: string;
  onClick?: () => void;
};

export function RegistrationCtaButton({
  size = "sm",
  className,
  intent = "getStarted",
  label: labelOverride,
  onClick,
}: RegistrationCtaButtonProps) {
  const { session } = useSession();
  const { isRegisterClose } = useAppStatus();
  const registrationIsClosed = !isRegisterClose;
  const tCta = useTranslations("landing.cta");
  const tFooter = useTranslations("footer");
  const tWebHeader = useTranslations("webHeader");
  const tWaitListDialog = useTranslations("waitListDialog");
  const [dialogOpen, setDialogOpen] = useState(false);

  const iconClassName = size === "sm" ? "size-3.5" : "size-4";

  if (session) {
    return (
      <Button asChild variant="accent" size={size} className={cn(className)}>
        <Link href="/atelier" onClick={onClick}>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="accent"
            size={size}
            className={cn(className)}
            onClick={onClick}
          >
            {label}
            <ArrowRight className={iconClassName} />
          </Button>
        </DialogTrigger>
        <DialogContent className="flex w-full max-w-xl flex-col gap-5 px-5 py-5 sm:gap-8 sm:px-8 sm:py-6">
          <DialogHeader>
            <DialogTitle>{tWaitListDialog("title")}</DialogTitle>
            <DialogDescription>
              {tWaitListDialog("description")}
            </DialogDescription>
          </DialogHeader>
          <WaitListForm from="register" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button asChild variant="accent" size={size} className={cn(className)}>
      <Link href="/auth/register" onClick={onClick}>
        {label}
        <ArrowRight className={iconClassName} />
      </Link>
    </Button>
  );
}
