"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { Check, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ConfirmSubmitButtonProps = {
  isActionable: boolean;
  isPending: boolean;
  success: boolean;
  buttonLabel: string;
  dialogTitle: string;
  dialogDescription: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmSubmitButton({
  isActionable,
  isPending,
  success,
  buttonLabel,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  onConfirm,
}: ConfirmSubmitButtonProps) {
  const t = useTranslations("atelier.common");
  const [open, setOpen] = useState(false);
  const resolvedConfirmLabel = confirmLabel ?? buttonLabel;

  useEffect(() => {
    if (success) setOpen(false);
  }, [success]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!isActionable}
        onClick={() => {
          if (isActionable) setOpen(true);
        }}
        className={cn(
          "gap-1.5 h-8 px-3 text-xs",
          isActionable
            ? "bg-text text-bg hover:text-text"
            : "border-border text-text-muted",
        )}
      >
        {isPending ? (
          <Spinner className="size-3.5" />
        ) : success ? (
          <Check className="size-3.5" />
        ) : (
          <Save className="size-3.5" />
        )}
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{dialogTitle}</DialogTitle>
            <DialogDescription className="text-sm">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={() => void onConfirm()}
              className="gap-1.5"
            >
              {isPending ? (
                <Spinner className="size-3.5" />
              ) : (
                resolvedConfirmLabel
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
