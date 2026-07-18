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
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Check, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export const SubmitPortfolioButton = () => {
  const {
    canSubmit,
    isPending,
    success,
    currentPortfolio,
    isHydrated,
    submitPortfolio,
  } = usePortfolio();
  const [open, setOpen] = useState(false);
  const isUpdate = Boolean(currentPortfolio);

  useEffect(() => {
    if (success) setOpen(false);
  }, [success]);

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isHydrated || !canSubmit || isPending}
          className="gap-1.5 h-8 px-3 text-xs bg-text text-bg hover:text-text"
        >
          {isPending ? (
            <Spinner className="size-3.5" />
          ) : success ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          {isUpdate ? "Update" : "Save"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isUpdate ? "Update portfolio" : "Save portfolio"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isUpdate
              ? "Your changes will be saved and applied to your live portfolio."
              : "Your portfolio will be created and saved to your account."}
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={() => void submitPortfolio()}
            className="gap-1.5"
          >
            {isPending ? (
              <Spinner className="size-3.5" />
            ) : isUpdate ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
