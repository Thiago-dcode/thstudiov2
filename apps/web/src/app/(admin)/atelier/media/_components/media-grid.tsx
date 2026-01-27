'use client'

import { useState } from "react";
import { Media } from "@repo/common-lib/types/media";
import { EditMediaCard } from "./edit-media-card";
import { useMedia } from "@/modules/media/providers/media.provider";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Upload } from "lucide-react";

type MediaGridProps = {
  media: Media[];
  username: string;
};

export function MediaGrid({ media, username }: MediaGridProps) {
  const { mediaPendingToUpdate, handleUploadUpdates,isLoading } = useMedia();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmUpdate = async () => { 
    setIsDialogOpen(false);
    await handleUploadUpdates();
  
  };

  const pendingCount = mediaPendingToUpdate.length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((item) => (
          <EditMediaCard key={item.id} media={item} username={username} />
        ))}
      </div>

      {pendingCount > 0 && !isLoading && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="primary"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow relative"
          >
            <Upload className="h-4 w-4" />
            <span>Update {pendingCount} {pendingCount === 1 ? 'item' : 'items'}</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {pendingCount}
            </span>
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[300px]">
          <DialogHeader>
            <DialogTitle>Confirm Updates</DialogTitle>
            <DialogDescription>
              Are you sure you want to update {pendingCount} {pendingCount === 1 ? 'media item' : 'media items'}? 
              This action will save all pending changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="base"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmUpdate}
            >
              Update All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

