import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/limits";
import type { Media } from "@repo/common-lib/types/media";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { MediaTypeBadge } from "@repo/ui/components/custom/media-type-badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { FileInputProvider } from "@repo/ui/contexts/file.provider";
import { cn } from "@repo/ui/lib/utils";
import { Check, Image, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreateMediaDialog } from "@/app/[locale]/(atelier)/atelier/media/_components/create-media-modal";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { FailedMediaOverlay } from "@/modules/media/components/failed-media-overlay";
import { getAllUserMediaAction } from "@/modules/media/server-actions/get-all-user-media.action";
import { useSubscribeToUserNotification } from "@/modules/user-notifications/hooks/useSubscribeToUserNotification";

const SHAPE_OPTIONS = ENUMS.MEDIA_SHAPE;
type ShapeFilter = EnumType<"MEDIA_SHAPE"> | undefined;

export const SelectMediaDrawer = ({
  userId,
  mediaSelected,
  onSelect,
  maxSelection,
  addButtonDisabled = false,
}: {
  userId: number;
  mediaSelected: Record<number, unknown>;
  onSelect: (media: Media) => void;
  maxSelection?: number;
  addButtonDisabled?: boolean;
}) => {
  const t = useTranslations("atelier.media.drawer");
  const tCommon = useTranslations("atelier.common");
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>(undefined);
  const mediaMap = useRef(new Map<number, Media>());
  const firstFetchDone = useRef(false);
  const mediaSelectedLength = useMemo(
    () => Object.keys(mediaSelected).length,
    [mediaSelected],
  );
  const isSelectionLimitReached =
    maxSelection !== undefined && mediaSelectedLength >= maxSelection;
  const currentPage = useRef(1);
  const nextPage = useRef<undefined | number>(undefined);
  const shapeRef = useRef<ShapeFilter>(undefined);

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      if (!firstFetchDone.current) firstFetchDone.current = true;
      return getAllUserMediaAction(userId, {
        per_page: 25,
        page: currentPage.current,
        paginated: true,
        shape: shapeRef.current,
        completed: true,
        blocked: false,
        is_active: true,
      });
    },
    afterAction: async (result) => {
      if (result.data) {
        for (const item of result.data) {
          mediaMap.current.set(item.id, item);
        }
        setMedia(Array.from(mediaMap.current.values()));
        nextPage.current = result.pagination?.next_page;
      }
    },
  });

  const resetAndFetch = useCallback(() => {
    currentPage.current = 1;
    nextPage.current = undefined;
    mediaMap.current.clear();
    setMedia([]);
    handleAction();
  }, [handleAction]);

  const handleRefresh = () => resetAndFetch();

  const handleLoadMore = () => {
    if (nextPage.current) {
      currentPage.current = nextPage.current;
      handleAction();
    }
  };

  const handleShapeFilter = useCallback(
    (shape: ShapeFilter) => {
      setShapeFilter(shape);
      shapeRef.current = shape;
      resetAndFetch();
    },
    [resetAndFetch],
  );

  useEffect(() => {
    if (open && !firstFetchDone.current) {
      handleAction();
    }
  }, [open, handleAction]);

  const upsertDrawerMedia = (payload: Media) => {
    mediaMap.current.set(payload.id, payload);
    setMedia((prev) => {
      const existIndex = prev.findIndex((m) => m.id === payload.id);
      if (existIndex === -1) {
        return [payload, ...prev];
      }
      const next = [...prev];
      next[existIndex] = payload;
      return next;
    });
  };

  const removeDrawerMedia = useCallback((id: number) => {
    mediaMap.current.delete(id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useSubscribeToUserNotification({
    callbackId: "select-media-drawer",
    createUpdateMediaCallback: upsertDrawerMedia,
    generateMetadataMediaCallback: upsertDrawerMedia,
    onDeleteMediaCallback: ({ id }) => removeDrawerMedia(id),
  });

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="gap-2 h-8 px-3 text-xs"
          disabled={addButtonDisabled || isSelectionLimitReached}
        >
          <Image className="size-3.5" />
          {t("title")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-[600px] max-w-[90vw] right-0 left-auto flex flex-col">
        {/* Drawer header */}
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-base font-semibold">
                {t("title")}
              </DrawerTitle>
              {mediaSelectedLength > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 bg-fg text-text text-[11px] font-medium tabular-nums">
                  {maxSelection !== undefined
                    ? `${mediaSelectedLength} / ${maxSelection}`
                    : mediaSelectedLength}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={isPending}
                onClick={handleRefresh}
                aria-label={t("refreshAria")}
              >
                <RefreshCw
                  className={cn("size-3.5", isPending && "animate-spin")}
                />
              </Button>
            </div>
            <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
              <CreateMediaDialog />
            </FileInputProvider>
          </div>
        </DrawerHeader>

        {/* Shape filter */}
        <div className="border-b px-4 py-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleShapeFilter(undefined)}
            disabled={isPending}
            className={cn(
              "h-7 px-2.5 text-[11px] font-medium transition-colors",
              !shapeFilter
                ? "bg-fg text-text"
                : "text-text-muted hover:text-text hover:bg-fg-2",
            )}
          >
            {t("filterAll")}
          </button>
          {SHAPE_OPTIONS.map((shape) => (
            <button
              key={shape}
              type="button"
              onClick={() => handleShapeFilter(shape)}
              disabled={isPending}
              className={cn(
                "h-7 px-2.5 text-[11px] font-medium capitalize transition-colors",
                shapeFilter === shape
                  ? "bg-fg text-text"
                  : "text-text-muted hover:text-text hover:bg-fg-2",
              )}
            >
              {shape.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isPending && media.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" />
            </div>
          ) : media.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] text-text-muted">
                {t("hint", { count: media.length })}
                {maxSelection !== undefined
                  ? ` ${t("hintMax", { max: maxSelection })}`
                  : ""}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((m) => {
                  const isSelected = mediaSelected[m.id];
                  const isLoading = MediaHelper.isLoading(m);
                  if (m.status === "FAILED") {
                    return (
                      <div
                        key={m.id}
                        className="relative aspect-square w-full overflow-hidden border border-error/40 bg-fg-2"
                        role="img"
                        aria-label={m.failed_reason || t("failedAria")}
                      >
                        {m.thumbnail ? (
                          <img
                            src={m.thumbnail}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 size-full object-cover opacity-40"
                          />
                        ) : null}
                        <FailedMediaOverlay reason={m.failed_reason} />
                      </div>
                    );
                  }
                  return (
                    <button
                      disabled={isLoading}
                      key={m.id}
                      type="button"
                      onClick={() =>
                        !isSelected && !isSelectionLimitReached && !isLoading
                          ? onSelect(m)
                          : null
                      }
                      aria-pressed={!!isSelected}
                      aria-busy={isLoading}
                      className={cn(
                        "group relative aspect-square w-full overflow-hidden border border-border bg-fg-2",
                        "transition-all duration-200 ease-out",
                        "hover:shadow-md hover:-translate-y-0.5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                        isLoading && "cursor-not-allowed",
                        isSelected ? "opacity-60 scale-95" : "opacity-100",
                      )}
                      title={
                        isLoading
                          ? tCommon("loading")
                          : isSelected
                            ? t("alreadyAdded")
                            : t("addToPortfolio")
                      }
                    >
                      {/* An <img>, not a CSS `background-image`. Storage keys can contain
                          characters (spaces, parentheses) that are legal in a `src` but are an
                          invalid token inside `url(...)`, where they take the whole declaration
                          down and leave the tile blank. */}
                      {m.thumbnail ? (
                        <img
                          src={m.thumbnail}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : null}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20 group-disabled:group-hover:bg-black/0" />

                      {/* Shape badge */}
                      {m.shape ? (
                        <div className="absolute top-2 right-2 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                          {m.shape}
                        </div>
                      ) : null}

                      {/* Animated media badge — the tile itself shows the static poster */}
                      <MediaTypeBadge mediaType={m.media_type} />

                      {/* Loading overlay */}
                      {isLoading ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                          <Spinner className="size-8 text-white" />
                        </div>
                      ) : null}

                      {/* Selected check */}
                      {isSelected ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex items-center justify-center size-10 bg-text text-fg">
                            <Check className="size-5" />
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {nextPage.current !== undefined && (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8"
                    disabled={isPending}
                    onClick={handleLoadMore}
                  >
                    {isPending && <Spinner className="size-3.5" />}
                    {isPending ? tCommon("loading") : tCommon("loadMore")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Image className="size-8 text-text-muted/40" />
              <p className="text-sm text-text-muted">{t("emptyTitle")}</p>
              <p className="text-xs text-text-muted/70">{t("emptySubtitle")}</p>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="border-t px-4 py-3 flex items-center justify-between">
          {mediaSelectedLength > 0 ? (
            <p className="text-xs text-text-muted tabular-nums">
              {maxSelection !== undefined
                ? t("itemsSelectedWithMax", {
                    count: mediaSelectedLength,
                    max: maxSelection,
                  })
                : t("itemsSelected", { count: mediaSelectedLength })}
            </p>
          ) : (
            <span />
          )}
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
            >
              <X className="size-3.5" />
              {tCommon("close")}
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
