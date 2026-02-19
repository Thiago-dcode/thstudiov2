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
    const { isPending: isPortfolioPending } = usePortfolio()
    const [open, setOpen] = useState(false);

    const { handleAction, isPending } = useHandleAction({
        action: async () => {
            return await deletePortfolioAction(portfolioId);
        },
        afterAction: async (result) => {
            if (result.errors) {
                result.errors.forEach((error) => toast.error(error));
            } else if (result.data) {
                toast.success("Portfolio deleted successfully");
                setOpen(false);
                router.push('/atelier/portfolio');
                router.refresh();
            }
        },
    });

    const isLoading = isPortfolioPending && isPending;

    return (
        <Dialog open={open} onOpenChange={(v) => !isLoading && setOpen(v)}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                {!isLoading ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Delete Portfolio</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{portfolioTitle}</strong>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-end gap-3 mt-4">
                            <Button
                                disabled={isLoading}
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                            
                                disabled={isLoading}
                                variant="destructive"
                                onClick={handleAction}
                            >
                                Delete
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <Spinner className="size-10" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
