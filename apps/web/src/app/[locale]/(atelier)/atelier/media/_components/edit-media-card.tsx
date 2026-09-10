"use client";

import type { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { bytesToMB } from "@repo/common-lib/utils/bytes";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { MediaTypeBadge } from "@repo/ui/components/custom/media-type-badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { format } from "date-fns";
import {
  Check,
  Copy,
  Eye,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientEnv } from "@/env/client";
import FormComponent from "@/lib/components/form-component";
import {
  canExpandMedia,
  ExpandMediaDialog,
} from "@/modules/media/components/expand-media-dialog";
import { FailedMediaOverlay } from "@/modules/media/components/failed-media-overlay";
import {
  type UploadMedia,
  useMedia,
} from "@/modules/media/providers/media.provider";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { MediaDrawerFooter, MediaTab, type MediaTabs } from "./media-tab";

type MediaCardProps = {
  media: Media;
  username: string;
};
type Tabs = MediaTabs;

export function EditMediaCard({ media, username }: MediaCardProps) {
  const t = useTranslations("atelier.media.card");
  // One block shared with the search filter, so a card and its filter chip always read the same.
  const tMedia = useTranslations("atelier.media");
  const tCommon = useTranslations("atelier.common");
  const [currentMedia, setCurrentMedia] = useState(media);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaTabs>("overall");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const seoTitleRef = useRef<HTMLInputElement>(null);
  const seoDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const seoAltRef = useRef<HTMLInputElement>(null);
  const { aiCreditsInfo } = useUserMetrics();
  const {
    upsertMediaUpload,
    removeMediaUpload,
    mediaUploads,
    uploadSingleMedia,
    generateSeoSingleMedia,
    deleteSingleMedia,
    generateUniqueMediaId,
  } = useMedia();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  // Closing the expand preview can ghost-click whatever sits under the overlay — the tile
  // itself (re-opening the preview) or the pen (opening the editor).
  const suppressTileClickRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const mediaParam = searchParams.get("m");
    if (mediaParam && mediaParam === media.public_id) {
      setIsDrawerOpen(true);
    }
  }, [searchParams, media.public_id]);

  const currentMediaUpload = useMemo(
    () =>
      mediaUploads.find(
        (m) => m.id === currentMedia.id || m.data?.id === currentMedia.id,
      ),
    [mediaUploads, currentMedia.id],
  );

  // Helper variables for cleaner access
  const inputErrors = currentMediaUpload?.error?.inputErrors;

  // AI Credits calculation — weighted by this media's type, so a video (cost 3) is correctly
  // blocked when only 1-2 credits remain even though `hasCredits` alone would say yes.
  const hasEnoughCredits = aiCreditsInfo.canAfford(currentMedia.media_type);

  const handleGenerateSeo = useCallback(async () => {
    if (!currentMedia.user_id || !currentMedia.id) {
      return;
    }
    if (!hasEnoughCredits) {
      return;
    }
    // Always show the SEO tab when generating
    setActiveTab("seo");
    await generateSeoSingleMedia(currentMedia);
  }, [currentMedia, generateSeoSingleMedia, hasEnoughCredits]);

  const isPending =
    currentMediaUpload?.pending ||
    (currentMediaUpload?.data
      ? MediaHelper.isLoading(currentMediaUpload.data)
      : false);

  // Format date - use updated_at if available, otherwise fallback to created_at
  const formattedDate = useMemo(() => {
    const dateValue = currentMedia.updated_at || currentMedia.created_at;
    if (!dateValue) return null;
    try {
      return format(new Date(dateValue), "MMM d, yyyy");
    } catch {
      return null;
    }
  }, [currentMedia.updated_at, currentMedia.created_at]);

  const mediaPublicUrl = useMemo(() => {
    if (!currentMedia.public_id || !username) return null;
    return new URL(
      `/artists/${username}/media/${currentMedia.public_id}`,
      clientEnv.NEXT_PUBLIC_APP_URL,
    ).href;
  }, [currentMedia.public_id, username]);

  const handleCopyUrl = useCallback(async () => {
    if (!mediaPublicUrl) return;
    try {
      await navigator.clipboard.writeText(mediaPublicUrl);
      setUrlCopied(true);
      toast.success(t("urlCopied"));
      window.setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      toast.error(t("urlCopyFailed"));
    }
  }, [mediaPublicUrl, t]);

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
    if (
      (currentMediaUpload?.input[key] ?? currentMedia[key as keyof Media]) ===
      value
    )
      return;

    // Get existing media upload or create a new one with all required fields
    const existingUpload = currentMediaUpload || {
      input: {
        user_id: currentMedia.user_id,
        title: currentMedia.title ?? "",
        description: currentMedia.description ?? "",
        seo_title: currentMedia.seo_title ?? "",
        seo_description: currentMedia.seo_description ?? "",
        seo_alt: currentMedia.seo_alt ?? "",
      },
      id: currentMedia.id,
      pending: false,
      action: "edit" as const,
      unique_id: generateUniqueMediaId(),
    };

    const updatedUpload: UploadMedia = {
      ...existingUpload,
      action: "edit",
      data: undefined,
      error: undefined,
      pending: false,
      previewUrl: currentMedia.thumbnail || undefined,
      input: {
        ...existingUpload.input,
        [key]: value,
      },
    };
    // Check if nothing has changed by comparing input fields with currentMedia
    const inputFields: (keyof UpdateMediaInput)[] = [
      "title",
      "description",
      "seo_title",
      "seo_description",
      "seo_alt",
    ];
    let hasChanged = false;

    for (const key of inputFields) {
      const updatedValue = updatedUpload.input[key];
      const currentValue = currentMedia[key as keyof Media];

      // Normalize undefined/null/empty string for comparison
      const normalizedUpdated = updatedValue ?? "";
      const normalizedCurrent = currentValue ?? "";

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
    const result = await deleteSingleMedia(currentMedia);
    if (result.data) {
      setShowDeleteDialog(false);
      setIsDrawerOpen(false);
    } else {
      toast.error(result.errors?.[0] ?? t("deleteFailed"));
    }
  };

  const handleTabChange = (value: string) => {
    if (isPending) return;
    setActiveTab(value as Tabs);
  };

  // Get the current value for a field (from upload if exists, otherwise from currentMedia)
  const getFieldValue = (key: keyof UpdateMediaInput): string => {
    if (currentMediaUpload?.input && key in currentMediaUpload.input) {
      return String(currentMediaUpload.input[key] ?? "");
    }
    return String(currentMedia[key] || "");
  };

  const renderEditTabContent = (tab: MediaTabs) => {
    switch (tab) {
      case "overall":
        return (
          <>
            <FormComponent.LabelInput
              id="title"
              name="title"
              label={t("titleLabel")}
              value={getFieldValue("title")}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t("titlePlaceholder")}
              labelClassName="text-sm font-medium text-text"
              error={inputErrors?.title}
              disabled={isPending}
            />
            <FormComponent.LabelTextarea
              id="description"
              name="description"
              label={t("descriptionLabel")}
              value={getFieldValue("description")}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={6}
              labelClassName="text-sm font-medium text-text"
              error={inputErrors?.description}
              disabled={isPending}
            />
          </>
        );
      case "seo":
        return (
          <>
            <FormComponent.LabelInput
              ref={seoTitleRef}
              id="seo_title"
              name="seo_title"
              label={t("seoTitleLabel")}
              value={getFieldValue("seo_title")}
              onChange={(e) => handleInputChange("seo_title", e.target.value)}
              placeholder={t("seoTitlePlaceholder")}
              labelClassName="text-sm font-medium text-text"
              extraInfo={t("seoTitleInfo")}
              error={inputErrors?.seo_title}
              disabled={isPending}
            />
            <FormComponent.LabelTextarea
              ref={seoDescriptionRef}
              id="seo_description"
              name="seo_description"
              label={t("seoDescriptionLabel")}
              value={getFieldValue("seo_description")}
              onChange={(e) =>
                handleInputChange("seo_description", e.target.value)
              }
              placeholder={t("seoDescriptionPlaceholder")}
              rows={5}
              labelClassName="text-sm font-medium text-text"
              extraInfo={t("seoDescriptionInfo")}
              error={inputErrors?.seo_description}
              disabled={isPending}
            />
            <FormComponent.LabelInput
              ref={seoAltRef}
              id="seo_alt"
              name="seo_alt"
              label={t("altTextLabel")}
              value={getFieldValue("seo_alt")}
              onChange={(e) => handleInputChange("seo_alt", e.target.value)}
              placeholder={t("altTextPlaceholder")}
              labelClassName="text-sm font-medium text-text"
              extraInfo={t("altTextInfo")}
              error={inputErrors?.seo_alt}
              disabled={isPending}
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-text">
                {t("filenameLabel")}
              </Label>
              <p className="text-xs font-mono text-text bg-fg-2 px-3 py-2">
                {currentMedia.seo_filename}
              </p>
              <p className="text-xs text-text-muted">{t("filenameInfo")}</p>
            </div>
          </>
        );
    }
  };

  const renderPreviewTabContent = (tab: MediaTabs) => {
    switch (tab) {
      case "overall":
        return (
          <>
            {currentMedia.title && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("titleLabel")}
                </Label>
                <p className="text-sm text-text leading-relaxed">
                  {currentMedia.title}
                </p>
              </div>
            )}
            {currentMedia.description && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("descriptionLabel")}
                </Label>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {currentMedia.description}
                </p>
              </div>
            )}
            {currentMedia.media_type && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("typeLabel")}
                </Label>
                <p className="text-sm text-text">
                  {tMedia(`mediaType.${currentMedia.media_type}`)}
                </p>
              </div>
            )}
            {currentMedia.compression_level && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("compressionLabel")}
                </Label>
                <p className="text-sm text-text">
                  {tMedia(`compressionLevel.${currentMedia.compression_level}`)}
                </p>
              </div>
            )}
            {currentMedia.bytes != null && currentMedia.bytes > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("sizeLabel")}
                </Label>
                <p className="text-sm text-text">
                  {bytesToMB(currentMedia.bytes).toFixed(2)} MB
                </p>
              </div>
            )}
            {mediaPublicUrl && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("urlLabel")}
                </Label>
                <div className="flex items-center bg-fg-2">
                  <p
                    className="min-w-0 flex-1 truncate px-3 py-2 text-xs font-mono text-text"
                    title={mediaPublicUrl}
                  >
                    {mediaPublicUrl}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 focus-visible:ring-2 focus-visible:ring-border-em focus-visible:outline-none"
                    onClick={handleCopyUrl}
                    aria-label={urlCopied ? t("urlCopied") : t("copyUrl")}
                  >
                    {urlCopied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            {formattedDate && (
              <div className="space-y-2 pt-4">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("lastUpdated")}
                </Label>
                <p className="text-sm text-text">{formattedDate}</p>
              </div>
            )}
          </>
        );
      case "seo":
        return (
          <>
            {currentMedia.seo_title && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("seoTitleLabel")}
                </Label>
                <p className="text-sm text-text leading-relaxed">
                  {currentMedia.seo_title}
                </p>
              </div>
            )}
            {currentMedia.seo_description && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("seoDescriptionLabel")}
                </Label>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {currentMedia.seo_description}
                </p>
              </div>
            )}
            {currentMedia.seo_alt && (
              <div className="space-y-2">
                <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  {t("altTextLabel")}
                </Label>
                <p className="text-sm text-text leading-relaxed">
                  {currentMedia.seo_alt}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                {t("filenameLabel")}
              </Label>
              <p className="text-xs font-mono text-text bg-fg-2 px-3 py-2">
                {currentMedia.seo_filename}
              </p>
            </div>
          </>
        );
    }
  };

  useEffect(() => {
    if (!currentMediaUpload) return;
    setCurrentMedia((prev) => ({
      ...prev,
      ...currentMediaUpload.input,
      ...currentMediaUpload.data,
    }));
  }, [currentMediaUpload]);

  const handleDrawerOpenChange = (open: boolean) => {
    if (open && suppressTileClickRef.current) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleExpandOpenChange = (open: boolean) => {
    setIsExpandOpen(open);
    if (open) return;
    // Dismissing the preview overlay can deliver a click to the tile underneath.
    suppressTileClickRef.current = true;
    window.setTimeout(() => {
      suppressTileClickRef.current = false;
    }, 100);
  };

  const canExpand = canExpandMedia(currentMedia);

  const handleTileClick = () => {
    if (isPending || suppressTileClickRef.current) return;
    if (canExpand) {
      setIsExpandOpen(true);
      return;
    }
    // Media that never produced an asset (still processing, or FAILED) has nothing to preview.
    // Fall back to the drawer so the tile is never a dead click.
    setIsDrawerOpen(true);
  };

  return (
    <Drawer
      direction="right"
      open={isDrawerOpen}
      onOpenChange={handleDrawerOpenChange}
    >
      <div
        className={cn(
          "relative border",
          currentMedia.status === "FAILED"
            ? "border-error/40"
            : "border-black/10",
        )}
      >
        {currentMediaUpload &&
        !currentMediaUpload.deleted &&
        !isPending &&
        !currentMediaUpload.data &&
        !currentMediaUpload.error ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            variant="secondary"
            size="icon"
            disabled={isPending}
            className="absolute top-2 left-2 z-20 shadow-md"
          >
            <Upload className="h-4 w-4" />
          </Button>
        ) : null}
        {/* The tile opens the full-size preview; the pen in the corner opens the editor.
            A div rather than an <article>: the whole tile is now one button, and an
            interactive role on a non-interactive element is neither valid nor lintable. */}
        <div
          className={cn(
            "group flex flex-col p-2",
            isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
          role="button"
          tabIndex={isPending ? -1 : 0}
          aria-label={
            currentMedia.status === "FAILED"
              ? currentMedia.failed_reason || t("failedAria")
              : canExpand
                ? tCommon("expandMedia")
                : t("editMedia")
          }
          onClick={handleTileClick}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            handleTileClick();
          }}
        >
          {/* Image Section - Floating */}
          <div className="relative aspect-square flex items-center justify-center overflow-hidden mb-2">
            {currentMedia.thumbnail ? (
              <img
                src={currentMedia.thumbnail}
                alt={
                  currentMedia.seo_alt ||
                  currentMedia.title ||
                  t("altFallback", { username })
                }
                className={cn(
                  "w-full h-full object-contain group-hover:scale-105 transition-transform duration-200",
                  currentMedia.status === "FAILED" && "opacity-40",
                )}
              />
            ) : (
              <div className="flex items-center justify-center text-text-muted text-xs bg-fg-2 w-full h-full">
                {t("noPreview")}
              </div>
            )}
            {currentMedia.status === "FAILED" && (
              <FailedMediaOverlay reason={currentMedia.failed_reason} />
            )}
            {/* Stated on every card, not just animations: the atelier is where a mixed
                  library gets managed, and the tile itself only ever shows a still poster. */}
            <MediaTypeBadge
              mediaType={currentMedia.media_type}
              label={
                currentMedia.media_type
                  ? tMedia(`mediaType.${currentMedia.media_type}`)
                  : undefined
              }
              showForAllTypes
            />
            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Spinner className="size-12 text-white" />
              </div>
            )}
          </div>

          {/* Title and Date - Stacked at Bottom */}
          <div className="flex flex-col">
            <h3 className="text-sm! font-medium text-text line-clamp-1">
              {currentMedia.title || currentMedia.seo_filename || t("untitled")}
            </h3>
            {currentMedia.status === "FAILED" ? (
              <p className="text-[10px]! text-error">{t("failed")}</p>
            ) : formattedDate ? (
              <p className="text-[10px]! text-text-muted">{formattedDate}</p>
            ) : null}
          </div>
        </div>
        {/* Sibling of the tile, not a child: nested, one click would fire both the preview and
            the drawer. `top-4 right-4` keeps it inset from the image (tile `p-2`). */}
        {!isPending && (
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label={t("editMedia")}
              className="absolute top-4 right-4 z-20 flex cursor-pointer items-center justify-center bg-black/50 p-1.5 text-white transition-colors duration-200 hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <Pencil className="size-3.5" />
            </button>
          </DrawerTrigger>
        )}
        {/* Triggerless: the tile owns the click, so there is no corner button to render. */}
        <ExpandMediaDialog
          media={currentMedia}
          alt={
            currentMedia.seo_alt ||
            currentMedia.title ||
            t("altFallback", { username })
          }
          open={isExpandOpen}
          onOpenChange={handleExpandOpenChange}
        />
      </div>
      <DrawerContent className="h-full w-150 max-w-[90vw] right-0 left-auto opacity-90 ">
        <DrawerHeader className="border-b p-2">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <DrawerTitle className="font-semibold flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate">
                {isEditing
                  ? t("editMedia")
                  : currentMedia.title ||
                    currentMedia.seo_filename ||
                    t("mediaPreview")}
              </span>
              {!isEditing && currentMedia.public_id && (
                <a
                  href={`/artists/${username}/media/${currentMedia.public_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="size-3.5" />
                </a>
              )}
            </DrawerTitle>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {isEditing ? (
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className={cn(
                      "h-8 shrink-0 px-2.5 transition-colors duration-200",
                      !hasEnoughCredits && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={handleGenerateSeo}
                    disabled={isPending || !hasEnoughCredits}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-medium whitespace-nowrap">
                      {isPending ? <Spinner /> : t("generateSeo")}
                    </span>
                  </Button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <InfoTooltip
                      content={
                        !hasEnoughCredits
                          ? t("noCreditsAvailable", {
                              imageCost: aiCreditsInfo.costFor("IMAGE"),
                              videoCost: aiCreditsInfo.costFor("VIDEO"),
                            })
                          : t("generateSeoTooltip")
                      }
                      openDelay={200}
                      iconClassName="w-3 h-3"
                    />
                    <span
                      className={cn(
                        "text-[10px] ml-0.5",
                        !hasEnoughCredits
                          ? "text-error font-medium"
                          : "text-text-muted",
                      )}
                    >
                      {aiCreditsInfo.consumed}/{aiCreditsInfo.total}
                      {!hasEnoughCredits && t("noCreditsSuffix")}
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:text-error hover:bg-error/10 h-8 px-2.5"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs font-medium">{t("delete")}</span>
                </Button>
              )}
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
                className="flex-1 hover:bg-fg-2 hover:text-text"
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="flex-1"
                disabled={isPending || !currentMediaUpload || !currentMedia}
              >
                {isPending ? <Spinner /> : t("saveChanges")}
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
                  {t("edit")}
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-fg-2 hover:text-text"
                  >
                    {t("close")}
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
            <DialogTitle>{t("discardTitle")}</DialogTitle>
            <DialogDescription>{t("discardBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="base" onClick={() => setShowCancelDialog(false)}>
              {t("keepEditing")}
            </Button>
            <Button variant="default" onClick={confirmCancel}>
              {t("discardChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md z-100">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>{t("deleteConfirm")}</p>
                <ul className="space-y-2 list-disc pl-4">
                  <li>{t("deleteWarningMetadata")}</li>
                  <li>{t("deleteWarningUsage")}</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="base"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? <Spinner /> : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
