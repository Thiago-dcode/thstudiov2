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
import { toast } from "@repo/ui/sonner";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { deletePortfolioAction } from "@/modules/portfolios/server-actions/delete-portfolio.action";

type DeletePortfolioDialogProps = {
  portfolioId: number;
  portfolioTitle: string;
};

export const DeletePortfolioDialog = ({
  portfolioId,
  portfolioTitle,
}: DeletePortfolioDialogProps) => {
  const t = useTranslations("atelier.portfolios.deletePortfolio");
  const router = useRouter();
  const { isPending: isPortfolioPending } = usePortfolio();
  const [open, setOpen] = useState(false);

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      return await deletePortfolioAction(portfolioId);
    },
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) {
          toast.error(error);
        }
      } else if (result.data) {
        toast.success(t("successToast"));
        setOpen(false);
        router.push("/atelier/portfolios");
        router.refresh();
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !isPending && !isPortfolioPending && setOpen(v)}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-text-muted hover:text-error hover:bg-error/10"
          disabled={isPortfolioPending}
          aria-label={t("ariaLabel")}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{t("title")}</DialogTitle>
          <DialogDescription className="text-sm">
            {t.rich("description", {
              title: portfolioTitle,
              strong: (chunks) => (
                <strong className="text-text font-medium">{chunks}</strong>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending || isPortfolioPending}
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending || isPortfolioPending}
            onClick={handleAction}
          >
            {isPending ? <Spinner className="size-3.5" /> : t("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
