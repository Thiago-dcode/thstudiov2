'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger, DrawerClose, DrawerHeader } from "@repo/ui/components/shadcn/drawer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Button } from "@repo/ui/components/shadcn/button";
import FormComponent from "@/lib/components/form-component";
import { bytesToMB } from '@repo/common-lib/utils/bytes';
import { ExternalLink, Eye, Sparkles, Trash2, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import { useSearchParams } from "next/navigation";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { useMedia, UploadMedia } from "@/modules/media/providers/media.provider";
import { MediaTab, MediaDrawerFooter, MediaTabs } from "./media-tab";


type MediaCardProps = {
  media: Media;
  username: string;
  onDeleted?: (mediaId: number) => void;
};
type Tabs = MediaTabs;

export function EditMediaCard({ media, username, onDeleted }: MediaCardProps) {
  const [currentMedia, setCurrentMedia] = useState(media);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaTabs>('overall');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const seoTitleRef = useRef<HTMLInputElement>(null);
  const seoDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const seoAltRef = useRef<HTMLInputElement>(null);
  const seoFilenameRef = useRef<HTMLInputElement>(null);
  const { refresh, aiCreditsInfo } = useUserMetrics();
  const { upsertMediaUpload, removeMediaUpload, mediaUploads, uploadSingleMedia, generateSeoSingleMedia, deleteSingleMedia, generateUniqueMediaId } = useMedia()
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const mediaParam = searchParams.get('m');
    if (mediaParam && mediaParam === media.public_id) {
        setIsDrawerOpen(true);
    }
  }, [searchParams, media.public_id]);


  const currentMediaUpload = useMemo(
    () => mediaUploads.find(m => m.id === currentMedia.id || m.data?.id === currentMedia.id),
    [mediaUploads, currentMedia.id]
  );

  // Helper variables for cleaner access
  const inputErrors = currentMediaUpload?.error?.inputErrors;

  // AI Credits calculation
  const creditsAvailable = aiCreditsInfo ? aiCreditsInfo.total - aiCreditsInfo.consumed : 0;
  const hasEnoughCredits = creditsAvailable >= 1;

  const handleGenerateSeo = useCallback(async () => {
    if (!currentMedia.user_id || !currentMedia.id) {
      return;
    }
    if (!hasEnoughCredits) {
      return;
    }
    // Always show the SEO tab when generating
    setActiveTab('seo');
    const result = await generateSeoSingleMedia(currentMedia);
    if (result.data) {
      await refresh();
    };

  }, [currentMedia, currentMediaUpload, generateSeoSingleMedia, refresh, hasEnoughCredits]);

  const isPending = currentMediaUpload?.pending;
  // Format date - use updated_at if available, otherwise fallback to created_at
  const formattedDate = useMemo(() => {
    const dateValue = currentMedia.updated_at || currentMedia.created_at;
    if (!dateValue) return null;
    try {
      return format(new Date(dateValue), 'MMM d, yyyy');
    } catch {
      return null;
    }
  }, [currentMedia.updated_at, currentMedia.created_at]);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setCurrentMedia(media);
    if (currentMediaUpload) {
      removeMediaUpload(currentMediaUpload.unique_id);
    }
    setIsEditing(false);
    setShowCancelDialog(false);
  };

  const handleUpdate = async () => {
    if (!currentMediaUpload || !currentMedia.id) {
      return;
    }
    await uploadSingleMedia(currentMediaUpload.unique_id);
  };

  // Handle form submission - upload the media using the provider
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleUpdate();
  };


  const handleInputChange = (key: keyof UpdateMediaInput, value: string) => {
    if (!currentMedia.id || !currentMedia.user_id || isPending) return;
    if ((currentMediaUpload?.input[key] ?? currentMedia[key as keyof Media]) === value) return;

    // Get existing media upload or create a new one with all required fields
    const existingUpload = currentMediaUpload || {
      input: {
        user_id: currentMedia.user_id,
        title: currentMedia.title || undefined,
        description: currentMedia.description || undefined,
        seo_title: currentMedia.seo_title || undefined,
        seo_description: currentMedia.seo_description || undefined,
        seo_alt: currentMedia.seo_alt || undefined,
        seo_filename: currentMedia.seo_filename || '',
      },
      id: currentMedia.id,
      pending: false,
      action: 'edit' as const,
      unique_id: generateUniqueMediaId(),
    };

    // Update the input field with the new value
    // For seo_filename, preserve existing value if new value is empty (since it's required in CreateMediaInputWithFile)

    const updatedUpload: UploadMedia = {
      ...existingUpload,
      action: 'edit',
      data: undefined,
      error: undefined,
      pending: false,
      onSuccess: async () => {
        setIsEditing(false);

      },
      previewUrl: currentMedia.thumbnail || undefined,
      input: {
        ...existingUpload.input,
        [key]: value,
      },
    };

    // Check if nothing has changed by comparing input fields with currentMedia
    const inputFields: (keyof UpdateMediaInput)[] = ['title', 'description', 'seo_title', 'seo_description', 'seo_alt', 'seo_filename'];
    let hasChanged = false;

    for (const key of inputFields) {
      const updatedValue = updatedUpload.input[key];
      const currentValue = currentMedia[key as keyof Media];

      // Normalize undefined/null/empty string for comparison
      const normalizedUpdated = updatedValue ?? '';
      const normalizedCurrent = currentValue ?? '';

      if (normalizedUpdated !== normalizedCurrent) {
        hasChanged = true;
        break;
      }
    }

    if (!hasChanged) {
      if (currentMediaUpload) {
        removeMediaUpload(currentMediaUpload.unique_id);
      }
      return;
    }

    upsertMediaUpload(updatedUpload);
  };
  const handleDelete = async () => {
    setDeletePopoverOpen(false);
    setIsDrawerOpen(false);
    const result = await deleteSingleMedia(currentMedia);
    if (result.data) {
      onDeleted?.(currentMedia.id);
    }
    refresh();
  };

  const handleTabChange = (value: string) => {
    if (isPending) return;
    setActiveTab(value as Tabs);
  };

  // Get the current value for a field (from upload if exists, otherwise from currentMedia)
  const getFieldValue = (key: keyof UpdateMediaInput): string => {
    if (currentMediaUpload?.input && key in currentMediaUpload.input) {
      return String(currentMediaUpload.input[key] ?? '');
    }
    return String(currentMedia[key] || '');
  };

  const renderEditTabContent = (tab: MediaTabs) => {
    switch (tab) {
      case 'overall':
        return (
          <>
            <FormComponent.LabelInput
              id="title"
              name="title"
              label="Title"
              value={getFieldValue('title')}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter title"
              labelClassName="text-sm font-medium text-foreground"
              error={inputErrors?.title}
              disabled={isPending}
            />
            <FormComponent.LabelTextarea
              id="description"
              name="description"
              label="Description"
              value={getFieldValue('description')}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              rows={6}
              labelClassName="text-sm font-medium text-foreground"
              error={inputErrors?.description}
              disabled={isPending}
            />
          </>
        );
      case 'seo':
        return (
          <>
            <FormComponent.LabelInput
              ref={seoTitleRef}
              id="seo_title"
              name="seo_title"
              label="SEO Title"
              value={getFieldValue('seo_title')}
              onChange={(e) => handleInputChange('seo_title', e.target.value)}
              placeholder="Enter SEO title"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="The title that appears in search engine results and browser tabs. Helps improve search visibility."
              error={inputErrors?.seo_title}
              disabled={isPending}
            />
            <FormComponent.LabelTextarea
              ref={seoDescriptionRef}
              id="seo_description"
              name="seo_description"
              label="SEO Description"
              value={getFieldValue('seo_description')}
              onChange={(e) => handleInputChange('seo_description', e.target.value)}
              placeholder="Enter SEO description"
              rows={5}
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="A brief summary that appears in search results. Helps users understand what the image is about before clicking."
              error={inputErrors?.seo_description}
              disabled={isPending}
            />
            <FormComponent.LabelInput
              ref={seoAltRef}
              id="seo_alt"
              name="seo_alt"
              label="Alt Text"
              value={getFieldValue('seo_alt')}
              onChange={(e) => handleInputChange('seo_alt', e.target.value)}
              placeholder="Enter alt text for accessibility"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="A text description of the image for screen readers and when images fail to load. Improves accessibility and SEO."
              error={inputErrors?.seo_alt}
              disabled={isPending}
            />
            <FormComponent.LabelInput
              ref={seoFilenameRef}
              id="seo_filename"
              name="seo_filename"
              label="Filename"
              value={getFieldValue('seo_filename')}
              onChange={(e) => handleInputChange('seo_filename', e.target.value)}
              placeholder="Enter filename"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="The filename used for SEO purposes. Can be edited to improve search visibility."
              error={inputErrors?.seo_filename}
              disabled={isPending}
            />
          </>
        );
    }
  };

  const renderPreviewTabContent = (tab: MediaTabs) => {
    switch (tab) {
      case 'overall':
        return (
          <>
            {currentMedia.title && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Title</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.title}</p>
              </div>
            )}
            {currentMedia.description && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Description</Label>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentMedia.description}</p>
              </div>
            )}
            {formattedDate && (
              <div className="space-y-2 pt-4">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Last Updated</Label>
                <p className="text-sm text-foreground">{formattedDate}</p>
              </div>
            )}
          </>
        );
      case 'seo':
        return (
          <>
            {currentMedia.seo_title && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">SEO Title</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.seo_title}</p>
              </div>
            )}
            {currentMedia.seo_description && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">SEO Description</Label>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentMedia.seo_description}</p>
              </div>
            )}
            {currentMedia.seo_alt && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Alt Text</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.seo_alt}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Filename</Label>
              <p className="text-xs font-mono text-foreground bg-fg-2 px-3 py-2 rounded-md">{currentMedia.seo_filename}</p>
            </div>
          </>
        );
    }
  };


  useEffect(() => {
    if (!currentMediaUpload) return;
    setCurrentMedia({
      ...currentMedia,
      ...currentMediaUpload.input,
      ...currentMediaUpload.data,

    });
  }, [currentMediaUpload])

  return (
    <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <div className="relative border border-black/10">
        {currentMediaUpload && !currentMediaUpload.deleted && !isPending && !currentMediaUpload.data && !currentMediaUpload.error ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            variant="secondary"
            size="icon"
            disabled={isPending}
            className="absolute top-2 left-2 z-20 shadow-md rounded-full"
          >

            <Upload className="h-4 w-4" />

          </Button>
        ) : null}
        <DrawerTrigger asChild disabled={isPending}>
          <article
            className={cn(
              "group flex flex-col p-2",
              isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            onClick={(e) => {
              if (isPending) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {/* Image Section - Floating */}
            <div className="relative aspect-square flex items-center justify-center overflow-hidden rounded-lg mb-2">
              {currentMedia.thumbnail ? (
                <img
                  src={currentMedia.thumbnail}
                  alt={currentMedia.seo_alt || currentMedia.title || `${username} media`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground text-xs bg-fg-2 rounded-lg w-full h-full">
                  No preview
                </div>
              )}
              {/* Loading Overlay */}
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
                  <Spinner className="size-12 text-white" />
                </div>
              )}
            </div>

            {/* Title and Date - Stacked at Bottom */}
            <div className="flex flex-col">
              <h3 className="text-xs font-medium text-foreground line-clamp-1">
                {currentMedia.title || currentMedia.seo_filename || 'Untitled'}
              </h3>
              {formattedDate && (
                <p className="text-[10px] text-muted-foreground">
                  {formattedDate}
                </p>
              )}
            </div>
          </article>
        </DrawerTrigger>
      </div>
      <DrawerContent
        className="h-full w-[600px] max-w-[90vw] right-0 left-auto rounded-l-lg rounded-t-none opacity-90 z-100"

      >
        <DrawerHeader className="border-b p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-end justify-start gap-2">
              <DrawerTitle className="font-semibold flex items-center gap-1.5">
                {isEditing ? 'Edit Media' : (currentMedia.title || currentMedia.seo_filename || 'Media Preview')}
                {!isEditing && currentMedia.public_id && (
                  <a
                    href={`/artists/${username}/media/${currentMedia.public_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="size-3.5" />
                  </a>
                )}
              </DrawerTitle>
              {currentMedia.bytes && !isEditing && (
                <p className="text-xs text-muted-foreground text-center">
                  ({bytesToMB(currentMedia.bytes).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className={cn(
                      "transition-colors duration-200 h-8 px-2.5",
                      !hasEnoughCredits && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleGenerateSeo}
                    disabled={isPending || !hasEnoughCredits}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">
                      {isPending ? <Spinner /> : "Generate Ai SEO"}
                    </span>
                  </Button>
                  <div className="flex items-center gap-0.5">
                    <InfoTooltip
                      content={
                        !hasEnoughCredits
                          ? "No AI credits available. You need at least 1 credit to generate SEO metadata. Please upgrade your plan or wait for credits to reset."
                          : "Automatically generate SEO fields with AI. Analyzes your image content and generates optimized titles, descriptions, alt text, and filenames for better search visibility."
                      }
                      openDelay={200}
                      iconClassName="w-3 h-3"
                    />
                    {aiCreditsInfo && (
                      <span className={cn(
                        "text-[10px] ml-0.5",
                        !hasEnoughCredits ? "text-destructive font-medium" : "text-muted-foreground"
                      )}>
                        {aiCreditsInfo.consumed}/{aiCreditsInfo.total}
                        {!hasEnoughCredits && " (No credits)"}
                      </span>
                    )}
                  </div>
                </div>
              ) :

                <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2.5">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Delete</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 z-100" align="end">
                    <p className="text-sm text-muted-foreground mb-3">Are you sure you want to delete this media?</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDeletePopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={isPending}
                        onClick={handleDelete}
                      >
                        {isPending ? <Spinner /> : 'Delete'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              }

            </div>
          </div>
        </DrawerHeader>
        {isEditing ? (
          <FormComponent.Form
            key={currentMedia.id}
            onSubmit={handleSubmit}
            className=""
          >
            <MediaTab
              activeTab={activeTab}
              onTabChange={handleTabChange}
              renderTabContent={renderEditTabContent}
              disabled={isPending}
            />
            <MediaDrawerFooter>
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1 hover:bg-fg-2 hover:text-foreground"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="flex-1"
                disabled={isPending || !currentMediaUpload || !currentMedia}
              >
                {isPending ? <Spinner /> : 'Save Changes'}
              </Button>
            </MediaDrawerFooter>
          </FormComponent.Form>
        ) : (
          <>
            <MediaTab
              activeTab={activeTab}
              onTabChange={handleTabChange}
              renderTabContent={renderPreviewTabContent}
            />
            <MediaDrawerFooter>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="default"
                  className="flex-1"
                >
                  Edit
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1 hover:bg-fg-2 hover:text-foreground">
                    Close
                  </Button>
                </DrawerClose>
              </div>
            </MediaDrawerFooter>
          </>
        )}
      </DrawerContent>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md max-h-[300px] z-100">
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="base"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="default"
              onClick={confirmCancel}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}

