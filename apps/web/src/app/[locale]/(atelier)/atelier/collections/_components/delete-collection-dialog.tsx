'use client'

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { deleteCollectionAction } from "@/modules/collections/server-actions/delete-collection.action"
import { useCollection } from "@/modules/collections/providers/create-update-collection.provider"
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

type DeleteCollectionDialogProps = {
    collectionId: number;
    collectionTitle: string;
}

export const DeleteCollectionDialog = ({
    collectionId,
    collectionTitle,
}: DeleteCollectionDialogProps) => {
    const router = useRouter();
    const { isPending: isCollectionPending } = useCollection();
    const [open, setOpen] = useState(false);

    const { handleAction, isPending } = useHandleAction({
        action: async () => {
            return await deleteCollectionAction(collectionId);
        },
        afterAction: async (result) => {
            if (result.errors) {
                result.errors.forEach((error) => toast.error(error));
            } else if (result.data) {
                toast.success("Collection deleted");
                setOpen(false);
                router.push('/atelier/collections');
                router.refresh();
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !isPending && !isCollectionPending && setOpen(v)}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-text-muted hover:text-error hover:bg-error/10"
                    disabled={isCollectionPending}
                    aria-label="Delete collection"
                >
                    <Trash2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">Delete collection</DialogTitle>
                    <DialogDescription className="text-sm">
                        <strong className="text-text font-medium">{collectionTitle}</strong> will be permanently deleted. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending || isCollectionPending}
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending || isCollectionPending}
                        onClick={handleAction}
                    >
                        {isPending ? <Spinner className="size-3.5" /> : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
