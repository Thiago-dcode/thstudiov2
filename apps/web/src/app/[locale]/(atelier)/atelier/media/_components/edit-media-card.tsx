"use client";

import type { LocationInput } from "@repo/common-lib/types/location";
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
  ExternalLink,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clientEnv } from "@/env/client";
import FormComponent from "@/lib/components/form-component";
import { LocationAutocomplete } from "@/modules/locations/components/location-autocomplete";
import { featureToLocationInput } from "@/modules/locations/location-input";
import {
  canExpandMedia,
  ExpandMediaDialog,
} from "@/modules/media/components/expand-media-dialog";
import { FailedMediaOverlay } from "@/modules/media/components/failed-media-overlay";
import { useMedia } from "@/modules/media/providers/media.provider";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { MediaDrawerFooter, MediaTab, type MediaTabs } from "./media-tab";

type MediaCardProps = {
  media: Media;
  username: string;
};

const EDITABLE_TEXT_FIELDS = [
  "title",
  "description",
  "seo_title",
  "seo_description",
  "seo_alt",
] as const;
type EditableTextField = (typeof EDITABLE_TEXT_FIELDS)[number];

/** A fresh draft seeded from the saved media. `location` is left out on purpose: absent means "keep the saved place". */
function draftFromMedia(media: Media): UpdateMediaInput & { user_id: number } {
  return {
    user_id: media.user_id,
    title: media.title ?? "",
    description: media.description ?? "",
    seo_title: media.seo_title ?? "",
    seo_description: media.seo_description ?? "",
    seo_alt: media.seo_alt ?? "",
  };
}

/**
 * Whether a draft would change anything if saved. Always compared against the *saved* media —
 * never against a copy the draft has been merged into, or reverting a field would still read as
 * a change.
 */
function draftDiffersFromSaved(draft: UpdateMediaInput, saved: Media): boolean {
  // The place is compared by label: the client never holds the saved row's geocoder id.
  if (
    "location" in draft &&
    (draft.location?.formatted ?? null) !== (saved.location?.formatted ?? null)
  ) {
    return true;
  }
  return EDITABLE_TEXT_FIELDS.some(
    (key) => (draft[key] ?? "") !== (saved[key] ?? ""),
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function EditMediaCard({ media, username }: MediaCardProps) {
  const t = useTranslations("atelier.media.card");
  // One block shared with the search filter, so a card and its filter chip always read the same.
  const tMedia = useTranslations("atelier.media");
  const tCommon = useTranslations("atelier.common");
  // What the server has — updated only when a save or AI run lands. Unsaved edits live in the
  // provider's upload entry (the draft), never in here.
  const [savedMedia, setSavedMedia] = useState(media);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaTabs>("overall");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
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
        (m) => m.id === savedMedia.id || m.data?.id === savedMedia.id,
      ),
    [mediaUploads, savedMedia.id],
  );

  // The page re-rendered with the server's row (e.g. after a batch edit that left a draft alone).
  useEffect(() => {
    setSavedMedia((prev) => (prev === media ? prev : { ...prev, ...media }));
  }, [media]);

  // A save or AI run landed: that is the new saved state.
  const landedMedia = currentMediaUpload?.data;
  useEffect(() => {
    if (landedMedia) setSavedMedia((prev) => ({ ...prev, ...landedMedia }));
  }, [landedMedia]);

  // Once `data` lands the entry is a record of what was saved, not a draft: its input is stale.
  const draft =
    currentMediaUpload &&
    !currentMediaUpload.data &&
    !currentMediaUpload.deleted
      ? currentMediaUpload.input
      : null;
  const hasUnsavedChanges = !!draft && draftDiffersFromSaved(draft, savedMedia);

  const inputErrors = currentMediaUpload?.error?.inputErrors;

  const isPending =
    currentMediaUpload?.pending ||
    (currentMediaUpload?.data
      ? MediaHelper.isLoading(currentMediaUpload.data)
      : false);

  // AI Credits calculation — weighted by this media's type, so a video (cost 3) is correctly
  // blocked when only 1-2 credits remain even though `hasCredits` alone would say yes.
  const hasEnoughCredits = aiCreditsInfo.canAfford(savedMedia.media_type);

  const handleGenerateSeo = useCallback(async () => {
    if (!savedMedia.user_id || !savedMedia.id || !hasEnoughCredits) return;
    // Always show the SEO tab when generating
    setActiveTab("seo");
    await generateSeoSingleMedia(savedMedia);
  }, [savedMedia, generateSeoSingleMedia, hasEnoughCredits]);

  // Format date - use updated_at if available, otherwise fallback to created_at
  const formattedDate = useMemo(() => {
    const dateValue = savedMedia.updated_at || savedMedia.created_at;
    if (!dateValue) return null;
    try {
      return format(new Date(dateValue), "MMM d, yyyy");
    } catch {
      return null;
    }
  }, [savedMedia.updated_at, savedMedia.created_at]);

  const mediaPublicPath = savedMedia.public_id
    ? `/artists/${username}/media/${savedMedia.public_id}`
    : null;
  const mediaPublicUrl = useMemo(() => {
    if (!mediaPublicPath || !username) return null;
    return new URL(mediaPublicPath, clientEnv.NEXT_PUBLIC_APP_URL).href;
  }, [mediaPublicPath, username]);

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

  const discardDraft = () => {
    if (draft && currentMediaUpload) {
      removeMediaUpload(currentMediaUpload.unique_id);
    }
    setIsEditing(false);
    setShowDiscardDialog(false);
  };

  // Only ask when there is something to lose — after a save, or with no edits, just leave.
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
      return;
    }
    discardDraft();
  };

  const handleUpdate = async () => {
    if (!currentMediaUpload || !hasUnsavedChanges) return;
    await uploadSingleMedia(currentMediaUpload.unique_id);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleUpdate();
  };

  const patchDraft = (patch: UpdateMediaInput) => {
    if (!savedMedia.id || !savedMedia.user_id || isPending) return;

    const nextInput = { ...(draft ?? draftFromMedia(savedMedia)), ...patch };

    // Edited back to what is saved: drop the draft, so nothing reads as pending.
    if (!draftDiffersFromSaved(nextInput, savedMedia)) {
      if (draft && currentMediaUpload) {
        removeMediaUpload(currentMediaUpload.unique_id);
      }
      return;
    }

    upsertMediaUpload({
      input: nextInput,
      id: savedMedia.id,
      action: "edit",
      pending: false,
      data: undefined,
      error: undefined,
      previewUrl: savedMedia.thumbnail || undefined,
      unique_id: currentMediaUpload?.unique_id ?? generateUniqueMediaId(),
    });
  };

  // The draft's value when there is one, otherwise the saved one.
  const getFieldValue = (key: EditableTextField): string =>
    String((draft ? draft[key] : savedMedia[key]) ?? "");

  const handleInputChange = (key: EditableTextField, value: string) => {
    if (getFieldValue(key) === value) return;
    patchDraft({ [key]: value });
  };

  /** The place the edit would save: the staged pick when there is one, else the saved place. */
  const stagedLocation =
    draft && "location" in draft
      ? (draft.location ?? null)
      : (savedMedia.location ?? null);

  const handleLocationChange = (location: LocationInput | null) => {
    patchDraft({ location });
  };

  const handleDelete = async () => {
    const result = await deleteSingleMedia(savedMedia);
    if (result.data) {
      setShowDeleteDialog(false);
      setIsDrawerOpen(false);
    } else {
      toast.error(result.errors?.[0] ?? t("deleteFailed"));
    }
  };

  const handleTabChange = (value: string) => {
    if (isPending) return;
    setActiveTab(value as MediaTabs);
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
            <div className="space-y-2">
              <LocationAutocomplete
                id="location"
                label={t("locationLabel")}
                labelClassName="text-sm font-medium text-text"
                placeholder={t("locationPlaceholder")}
                selectedLabel={stagedLocation?.formatted}
                onSelect={(feature) => {
                  // An unusable pick is ignored — it must never read as "clear".
                  const location = featureToLocationInput(feature);
                  if (location) handleLocationChange(location);
                }}
                onClear={() => handleLocationChange(null)}
                disabled={isPending}
              />
              <span className="block text-xs text-text-muted">
                {t("locationInfo")}
              </span>
            </div>
          </>
        );
      case "seo":
        return (
          <>
            <FormComponent.LabelInput
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
              <p className="text-xs font-mono text-text bg-fg-2 px-3 py-2 break-all">
                {savedMedia.seo_filename}
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
            {savedMedia.title && (
              <DetailField label={t("titleLabel")}>
                <p className="text-sm text-text leading-relaxed">
                  {savedMedia.title}
                </p>
              </DetailField>
            )}
            {savedMedia.description && (
              <DetailField label={t("descriptionLabel")}>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {savedMedia.description}
                </p>
              </DetailField>
            )}
            {savedMedia.location && (
              <DetailField label={t("locationLabel")}>
                <p className="text-sm text-text">
                  {savedMedia.location.formatted}
                </p>
              </DetailField>
            )}
            {/* Short facts pair up so the panel isn't one long column on a phone. */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {savedMedia.media_type && (
                <DetailField label={t("typeLabel")}>
                  <p className="text-sm text-text">
                    {tMedia(`mediaType.${savedMedia.media_type}`)}
                  </p>
                </DetailField>
              )}
              {savedMedia.compression_level && (
                <DetailField label={t("compressionLabel")}>
                  <p className="text-sm text-text">
                    {tMedia(`compressionLevel.${savedMedia.compression_level}`)}
                  </p>
                </DetailField>
              )}
              {savedMedia.bytes != null && savedMedia.bytes > 0 && (
                <DetailField label={t("sizeLabel")}>
                  <p className="text-sm text-text">
                    {bytesToMB(savedMedia.bytes).toFixed(2)} MB
                  </p>
                </DetailField>
              )}
              {formattedDate && (
                <DetailField label={t("lastUpdated")}>
                  <p className="text-sm text-text">{formattedDate}</p>
                </DetailField>
              )}
            </div>
            {mediaPublicUrl && (
              <DetailField label={t("urlLabel")}>
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
              </DetailField>
            )}
          </>
        );
      case "seo":
        return (
          <>
            {savedMedia.seo_title && (
              <DetailField label={t("seoTitleLabel")}>
                <p className="text-sm text-text leading-relaxed">
                  {savedMedia.seo_title}
                </p>
              </DetailField>
            )}
            {savedMedia.seo_description && (
              <DetailField label={t("seoDescriptionLabel")}>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {savedMedia.seo_description}
                </p>
              </DetailField>
            )}
            {savedMedia.seo_alt && (
              <DetailField label={t("altTextLabel")}>
                <p className="text-sm text-text leading-relaxed">
                  {savedMedia.seo_alt}
                </p>
              </DetailField>
            )}
            <DetailField label={t("filenameLabel")}>
              <p className="text-xs font-mono text-text bg-fg-2 px-3 py-2 break-all">
                {savedMedia.seo_filename}
              </p>
            </DetailField>
          </>
        );
    }
  };

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

  const canExpand = canExpandMedia(savedMedia);

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

  const mediaAlt =
    savedMedia.seo_alt || savedMedia.title || t("altFallback", { username });

  return (
    <Drawer
      direction="right"
      open={isDrawerOpen}
      onOpenChange={handleDrawerOpenChange}
      // vaul's keyboard handling is built for bottom sheets: on phones it writes a pixel height
      // onto the panel when a field is focused and keeps it after the keyboard closes, which
      // pushes the pinned footer below the screen. A full-height side panel doesn't need it.
      repositionInputs={false}
    >
      <div
        className={cn(
          "relative border",
          savedMedia.status === "FAILED"
            ? "border-error/40"
            : "border-black/10",
        )}
      >
        {/* A draft left behind when the drawer was closed can be saved straight from the tile. */}
        {hasUnsavedChanges && !isPending && !currentMediaUpload?.error ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            variant="secondary"
            size="icon"
            aria-label={t("saveChanges")}
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
            savedMedia.status === "FAILED"
              ? savedMedia.failed_reason || t("failedAria")
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
            {savedMedia.thumbnail ? (
              <img
                src={savedMedia.thumbnail}
                alt={mediaAlt}
                className={cn(
                  "w-full h-full object-contain group-hover:scale-105 transition-transform duration-200",
                  savedMedia.status === "FAILED" && "opacity-40",
                )}
              />
            ) : (
              <div className="flex items-center justify-center text-text-muted text-xs bg-fg-2 w-full h-full">
                {t("noPreview")}
              </div>
            )}
            {savedMedia.status === "FAILED" && (
              <FailedMediaOverlay reason={savedMedia.failed_reason} />
            )}
            {/* Stated on every card, not just animations: the atelier is where a mixed
                  library gets managed, and the tile itself only ever shows a still poster. */}
            <MediaTypeBadge
              mediaType={savedMedia.media_type}
              label={
                savedMedia.media_type
                  ? tMedia(`mediaType.${savedMedia.media_type}`)
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
              {savedMedia.title || savedMedia.seo_filename || t("untitled")}
            </h3>
            {savedMedia.status === "FAILED" ? (
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
          media={savedMedia}
          alt={mediaAlt}
          open={isExpandOpen}
          onOpenChange={handleExpandOpenChange}
        />
      </div>
      {/* Full-screen on phones, a side panel from `sm`. The height comes from `inset-y-0` alone:
          a fixed box pinned to both edges follows the visible viewport as mobile toolbars show and
          hide, where a viewport-unit height can outgrow it and hide the footer. The shared
          drawer's drag handle is meant for bottom sheets, so it is hidden on this side panel. */}
      <DrawerContent className="inset-y-0 right-0 left-auto mt-0 h-auto max-h-none w-full sm:w-150 sm:max-w-[90vw] [&>div:first-child]:hidden">
        <DrawerHeader className="shrink-0 gap-3 border-b px-4 py-3 text-left sm:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <DrawerTitle className="flex min-w-0 flex-1 items-center gap-2 text-base!">
              <span className="truncate">
                {isEditing
                  ? t("editMedia")
                  : savedMedia.title ||
                    savedMedia.seo_filename ||
                    t("mediaPreview")}
              </span>
              {!isEditing && mediaPublicPath && (
                <a
                  href={mediaPublicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("viewPublicPage")}
                  title={t("viewPublicPage")}
                  className="-m-1.5 shrink-0 p-1.5 text-text-muted transition-colors hover:text-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </DrawerTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 px-2.5 text-error hover:bg-error/10 hover:text-error"
                onClick={() => setShowDeleteDialog(true)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" />
                <span className="hidden text-xs font-medium sm:inline">
                  {t("delete")}
                </span>
              </Button>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-9 px-3"
                onClick={handleGenerateSeo}
                disabled={isPending || !hasEnoughCredits}
              >
                {isPending ? (
                  <Spinner />
                ) : (
                  <Sparkles className="size-3.5 shrink-0" />
                )}
                <span className="text-xs font-medium whitespace-nowrap">
                  {t("generateSeo")}
                </span>
              </Button>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs",
                    hasEnoughCredits
                      ? "text-text-muted"
                      : "text-error font-medium",
                  )}
                >
                  {aiCreditsInfo.consumed}/{aiCreditsInfo.total}
                  {!hasEnoughCredits && t("noCreditsSuffix")}
                </span>
                <InfoTooltip
                  content={
                    hasEnoughCredits
                      ? t("generateSeoTooltip")
                      : t("noCreditsAvailable", {
                          imageCost: aiCreditsInfo.costFor("IMAGE"),
                          videoCost: aiCreditsInfo.costFor("VIDEO"),
                        })
                  }
                  openDelay={200}
                  iconClassName="w-3.5 h-3.5"
                />
              </div>
            </div>
          )}
        </DrawerHeader>
        {isEditing ? (
          <FormComponent.Form
            key={savedMedia.id}
            onSubmit={handleSubmit}
            className="h-auto min-h-0 flex-1 gap-0"
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
                className="h-11 flex-1 hover:bg-fg-2 hover:text-text sm:h-10"
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="h-11 flex-1 sm:h-10"
                disabled={isPending || !hasUnsavedChanges}
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
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="h-11 flex-1 hover:bg-fg-2 hover:text-text sm:h-10"
                >
                  {t("close")}
                </Button>
              </DrawerClose>
              <Button
                onClick={() => setIsEditing(true)}
                variant="default"
                className="h-11 flex-1 sm:h-10"
              >
                <Pencil className="size-3.5" />
                {t("edit")}
              </Button>
            </MediaDrawerFooter>
          </>
        )}
      </DrawerContent>

      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="max-w-md z-100">
          <DialogHeader>
            <DialogTitle>{t("discardTitle")}</DialogTitle>
            <DialogDescription>{t("discardBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="base" onClick={() => setShowDiscardDialog(false)}>
              {t("keepEditing")}
            </Button>
            <Button variant="default" onClick={discardDraft}>
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
