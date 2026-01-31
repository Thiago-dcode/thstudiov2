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
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Sparkles, Upload } from "lucide-react";
import { SelectableMedia, useSelectMedia } from "@/modules/media/providers/select-media.provider";
import { cn } from "@repo/ui/lib/utils";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

type MediaGridProps = {
  media: Media[];
  username: string;
};

export function MediaGrid({ media, username }: MediaGridProps) {
  const { mediaPendingToUpdate, handleUploadUpdates, isLoading, generateManySeoMedia } = useMedia();
  const { canSelect, selectedMedia, selectionCount, setCanSelect, clearSelection } = useSelectMedia()
  const { aiCreditsInfo,refresh } = useUserMetrics();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerateSeoDialogOpen, setIsGenerateSeoDialogOpen] = useState(false);

  const MAX_AI_GENERATE = 10;

  const creditsAvailable = aiCreditsInfo ? aiCreditsInfo.total - aiCreditsInfo.consumed : 0;
  const creditsNeeded = selectionCount;
  const hasEnoughCredits = creditsAvailable >= creditsNeeded;
  const isOverAiLimit = selectionCount > MAX_AI_GENERATE;

  const handleConfirmUpdate = async () => {
    setIsDialogOpen(false);
    await handleUploadUpdates();
  };

  const handleGenerateSeo = async () => {
    setIsGenerateSeoDialogOpen(false);
    setCanSelect(false);
    clearSelection();
    await generateManySeoMedia(Object.values(selectedMedia));
    refresh()
  }

  const pendingCount = mediaPendingToUpdate.length;

  return (
    <>
      <div className="relative">
        <div className="mb-4 flex items-center justify-between sticky top-0 z-90 bg-fg/70 p-4">
          {canSelect ? (
            <Dialog open={isGenerateSeoDialogOpen} onOpenChange={setIsGenerateSeoDialogOpen}>
              <DialogTrigger asChild >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectionCount || isLoading}
                  className={cn(
                    "bg-accent text-accent-fg border-accent hover:bg-accent/90 hover:text-accent-fg",
                    "transition-colors duration-200 h-8 px-2.5"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {!isLoading ? <span className="text-xs font-medium">
                    {selectionCount ? 'GENERATE AI SEO FOR ' + selectionCount + ' MEDIA' : "GENERATE AI SEO"}
                  </span> : <Spinner />}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate AI SEO</DialogTitle>
                  <DialogDescription>
                    Generate AI-powered SEO metadata for {selectionCount} {selectionCount === 1 ? 'selected media item' : 'selected media items'}?
                  </DialogDescription>
                </DialogHeader>
                {aiCreditsInfo && (
                  <div className="px-6 py-3 bg-fg-2/50 rounded-md space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits available:</span>
                      <span className="font-medium">{creditsAvailable}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits needed:</span>
                      <span className={cn("font-medium", !hasEnoughCredits && "text-destructive")}>
                        {creditsNeeded}
                      </span>
                    </div>
                    {isOverAiLimit && (
                      <p className="text-xs text-destructive mt-2">
                        Limit: select up to {MAX_AI_GENERATE} items (remove {selectionCount - MAX_AI_GENERATE}).
                      </p>
                    )}
                    {!hasEnoughCredits && (
                      <p className="text-xs text-destructive mt-2">
                        Insufficient credits. You need {creditsNeeded - creditsAvailable} more credits.
                      </p>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="base"
                    onClick={() => setIsGenerateSeoDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!hasEnoughCredits || isOverAiLimit || isLoading}
                    onClick={async () => {
                      await handleGenerateSeo()
                    }}
                  >
                    Generate SEO
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
          <Button
            variant={canSelect ? "outline" : "primary"}
            size="sm"
            disabled={isLoading}
            onClick={() => {
              setCanSelect(!canSelect)
              if (canSelect) {
                clearSelection()
              }
            }}
          >
            {canSelect ? "Cancel selection" : "Select media"}
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => {

            if (!canSelect) return <EditMediaCard key={`media-card-${item.id}`} media={item} username={username} />

            return <SelectableMedia key={`media-selectable-${item.id}`} media={item}><EditMediaCard key={item.id} media={item} username={username} /> </SelectableMedia>
          })}
        </div>
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
              onClick={async () => {
                await handleConfirmUpdate()
              }}
            >
              Update All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

