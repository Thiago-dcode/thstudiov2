'use client'

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { deletePortfolioAction } from "@/modules/portfolios/server-actions/delete-portfolio.action"
import { Button } from "@repo/ui/components/shadcn/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/shadcn/dialog"
import { Spinner } from "@repo/ui/components/shadcn/spinner"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "@repo/ui/sonner"
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider"

type DeletePortfolioDialogProps = {
    portfolioId: number;
    portfolioTitle: string;
}

export const DeletePortfolioDialog = ({
    portfolioId,
    portfolioTitle,
}: DeletePortfolioDialogProps) => {
    const router = useRouter();
    const { isPending: isPortfolioPending } = usePortfolio();
    const [open, setOpen] = useState(false);

    const { handleAction, isPending } = useHandleAction({
        action: async () => {
            return await deletePortfolioAction(portfolioId);
        },
        afterAction: async (result) => {
            if (result.errors) {
                result.errors.forEach((error) => toast.error(error));
            } else if (result.data) {
                toast.success("Portfolio deleted");
                setOpen(false);
                router.push('/atelier/portfolios');
                router.refresh();
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !isPending && !isPortfolioPending && setOpen(v)}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    disabled={isPortfolioPending}
                    aria-label="Delete portfolio"
                >
                    <Trash2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">Delete portfolio</DialogTitle>
                    <DialogDescription className="text-sm">
                        <strong className="text-foreground font-medium">{portfolioTitle}</strong> will be permanently deleted. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending || isPortfolioPending}
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending || isPortfolioPending}
                        onClick={handleAction}
                    >
                        {isPending ? <Spinner className="size-3.5" /> : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
