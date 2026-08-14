"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  FullCollection,
  FullCollectionMedia,
} from "@repo/common-lib/types/collection";
import { isHighlightToggleDisabled } from "@repo/common-lib/utils/highlights";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { Image, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useMemo } from "react";
import { StickyFormFooter } from "@/app/[locale]/(atelier)/__components/sticky-form-footer";
import { SubmitCollectionButton } from "@/app/[locale]/(atelier)/__components/submit-collection-button";
import FormComponent from "@/lib/components/form-component";
import { useMainNav } from "@/lib/providers/main-nav.provider";
import { useCollection } from "@/modules/collections/providers/create-update-collection.provider";
import { SelectMediaDrawer } from "@/modules/media/components/select-media-drawer";

const SortableItem = ({
  children,
  containerClassname,
  id,
}: {
  children: ReactNode;
  containerClassname?: string;
  id: string | number;
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      id={String(id)}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-pointer",
        containerClassname,
        isDragging && "opacity-70",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children}
    </div>
  );
};

export const CreateOrUpdateCollection = ({
  defaultCollection,
}: {
  defaultCollection?: FullCollection;
}) => {
  const t = useTranslations("atelier.collections");
  const router = useRouter();
  const {
    handleSubmit,
    isPending,
    success,
    inputErrors,
    clear,
    setCollection,
    currentCollection,
    collectionInput,
    handleSetFormData,
    deleteInputErrorProperty,
    user,
    mediaSelected,
    handlePushMediaSelected,
    handleRemoveMediaSelected,
    highlightCount,
    highlightLimit,
    mediaItemLimit,
    isMediaLimitReached,
    isLoadingHighlightCount,
    fetchHighlightCount,
  } = useCollection();

  const { setShrinked } = useMainNav();

  const isCurrentlyHighlighted = collectionInput.is_highlight ?? false;
  const originallyHighlighted =
    (currentCollection ?? defaultCollection)?.is_highlight ?? false;
  const highlightToggleDisabled = isHighlightToggleDisabled(
    highlightCount,
    highlightLimit,
    isCurrentlyHighlighted,
    originallyHighlighted,
  );

  const readOnly = Boolean(
    (currentCollection ?? defaultCollection)?.blocked_at,
  );

  useEffect(() => {
    void fetchHighlightCount();
  }, [fetchHighlightCount]);

  useEffect(() => {
    if (defaultCollection && currentCollection?.id !== defaultCollection.id) {
      setCollection(defaultCollection);
    }
    if (!defaultCollection && currentCollection) {
      clear();
    }
  }, [defaultCollection, setCollection, currentCollection, clear]);

  useEffect(() => {
    setShrinked(true);
  }, [setShrinked]);

  useEffect(() => {
    if (success) {
      clear();
      router.push("/atelier/collections");
    }
  }, [success, clear, router.push]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    deleteInputErrorProperty("title");
    handleSetFormData("title", e.target.value);
  };

  const mediaSelectedRecord = useMemo(() => {
    const record: Record<number, FullCollectionMedia> = {};
    for (const m of mediaSelected) record[m.id] = m;
    return record;
  }, [mediaSelected]);

  const mediaItems = useMemo(
    () => mediaSelected.map((m) => `media-${m.id}`),
    [mediaSelected],
  );

  const getShapeClass = (shape?: string | null) => {
    switch (shape) {
      case "LANDSCAPE":
        return "w-[90%] aspect-video";
      case "PORTRAIT":
        return "w-[60%] aspect-[3/4]";
      default:
        return "w-[85%] aspect-square";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = mediaItems.indexOf(String(active.id));
    const newIndex = mediaItems.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    handleSetFormData(
      "media",
      arrayMove(mediaSelected, oldIndex, newIndex).map((m, i) => ({
        ...m,
        position: i + 1,
      })),
    );
  };

  return (
    <FormComponent.Container>
      {readOnly ? (
        <div
          role="status"
          className="mb-6 border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
        >
          {t("form.blockedNotice")}
        </div>
      ) : null}
      <FormComponent.Form
        onSubmit={async (e) => {
          if (readOnly) {
            e.preventDefault();
            return;
          }
          await handleSubmit(e);
        }}
        className="relative"
      >
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
            <Spinner className="size-10 text-text" />
          </div>
        )}

        {/* Text fields */}
        <div
          className={`space-y-4 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}
        >
          <div className="space-y-1">
            <FormComponent.LabelInput
              value={collectionInput.title || ""}
              onChange={handleTitleChange}
              error={inputErrors?.title}
              label={t("form.titleLabel")}
              required
              name="title"
              id="title"
              type="text"
              placeholder={t("form.titlePlaceholder")}
              extraInfo={t("form.titleInfo")}
              disabled={isPending}
            />
            {/* The title decides the permanent public address, so say so before they commit. */}
            {!defaultCollection && (
              <p className="text-xs text-text-muted">
                {t("form.titleAddressHint")}
              </p>
            )}
            {defaultCollection?.slug && (
              <p className="text-xs text-text-muted">
                {t("form.permalinkLabel")}{" "}
                <span className="font-mono">
                  /artists/{user.username}/collections/{defaultCollection.slug}
                </span>{" "}
                — {t("form.permalinkFrozenNote")}
              </p>
            )}
          </div>

          <FormComponent.LabelTextarea
            value={collectionInput.description || ""}
            onChange={(e) => {
              deleteInputErrorProperty("description");
              handleSetFormData("description", e.target.value);
            }}
            error={inputErrors?.description}
            rows={4}
            label={t("form.descriptionLabel")}
            name="description"
            id="description"
            placeholder={t("form.descriptionPlaceholder")}
            disabled={isPending}
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="collection-is-highlight"
                checked={collectionInput.is_highlight ?? false}
                onCheckedChange={(checked) => {
                  deleteInputErrorProperty("is_highlight");
                  handleSetFormData("is_highlight", checked === true);
                }}
                disabled={
                  isPending ||
                  isLoadingHighlightCount ||
                  highlightToggleDisabled
                }
              />
              <Label
                htmlFor="collection-is-highlight"
                className="text-sm font-normal cursor-pointer"
              >
                {t("form.showOnProfile")}
              </Label>
              <InfoTooltip
                content={
                  <p className="text-sm">
                    {t("form.showOnProfileInfo", { limit: highlightLimit })}
                  </p>
                }
              />
            </div>
            {!isLoadingHighlightCount && highlightToggleDisabled && (
              <p className="text-xs text-text-muted">
                {t("form.highlightLimitReached", { limit: highlightLimit })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="collection-is-active"
              checked={collectionInput.is_active ?? true}
              onCheckedChange={(checked) => {
                deleteInputErrorProperty("is_active");
                handleSetFormData("is_active", checked === true);
              }}
              disabled={isPending}
            />
            <Label
              htmlFor="collection-is-active"
              className="text-sm font-normal cursor-pointer"
            >
              {t("form.active")}
            </Label>
            <InfoTooltip
              content={<p className="text-sm">{t("form.activeInfo")}</p>}
            />
          </div>
        </div>

        {/* Media section */}
        <section
          className={`space-y-5 mt-8 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text">
                {t("media.sectionLabel")}
              </h3>
              {mediaSelected.length > 1 && (
                <span className="text-xs text-text-muted/70">
                  {t("media.dragToReorder")}
                </span>
              )}
            </div>
            <SelectMediaDrawer
              userId={user.id}
              mediaSelected={mediaSelectedRecord}
              onSelect={handlePushMediaSelected}
              maxSelection={mediaItemLimit}
              addButtonDisabled={isMediaLimitReached}
            />
          </div>

          <div className="flex items-center gap-0.5">
            <InfoTooltip
              iconClassName="size-3.5"
              content={
                <p className="text-sm">
                  {t("media.countInfo", { limit: mediaItemLimit })}
                </p>
              }
            />
            <p
              className={cn(
                "text-xs tabular-nums",
                isMediaLimitReached ? "text-error" : "text-text-muted",
              )}
            >
              {t("media.countLabel", {
                count: mediaSelected.length,
                limit: mediaItemLimit,
              })}
            </p>
          </div>

          {mediaSelected.length === 0 ? (
            <div className="w-full min-h-[200px] border-2 border-dashed border-border/60 bg-fg-2/5 flex flex-col items-center justify-center gap-3 p-8">
              <Image className="size-8 text-text-muted/30" />
              <p className="text-sm text-text-muted/70">{t("media.noMedia")}</p>
            </div>
          ) : (
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext
                items={mediaItems}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaSelected.map((m, index) => (
                    <div key={m.id} className="bg-fg/60 p-4">
                      <SortableItem
                        id={`media-${m.id}`}
                        containerClassname="group relative"
                      >
                        <div
                          className={cn(
                            "absolute top-2 left-2 z-10 inline-flex items-center justify-center",
                            "h-5 px-1.5 bg-black/35",
                            "text-[10px] font-medium tabular-nums text-white/85",
                            "pointer-events-none select-none",
                          )}
                          aria-hidden
                        >
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          aria-label={t("media.removeMedia", {
                            label: m.title || t("media.mediaFallback"),
                          })}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveMediaSelected(m.id);
                          }}
                          className={cn(
                            "absolute top-2 right-2 z-10 inline-flex items-center justify-center",
                            "size-7 border border-border/50 bg-bg/70 backdrop-blur-sm",
                            "text-text-muted hover:text-text hover:bg-bg",
                            "opacity-0 group-hover:opacity-100 focus:opacity-100",
                            "transition-opacity",
                          )}
                        >
                          <X className="size-3.5 cursor-pointer" />
                        </button>
                        <div className="aspect-square w-full flex items-center justify-center">
                          <div
                            className={cn(
                              "relative overflow-hidden",
                              getShapeClass(m.shape),
                            )}
                          >
                            <img
                              src={m.thumbnail || undefined}
                              alt={m.title || ""}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <h3 className="text-xs font-medium text-text line-clamp-1 px-0.5">
                          {m.title || m.seo_filename || t("media.untitled")}
                        </h3>
                      </SortableItem>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        {inputErrors && Object.keys(inputErrors).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(inputErrors).map(([field, message]) => (
              <span
                key={field}
                className="inline-flex items-center gap-1.5 bg-error/10 px-2.5 py-1 text-xs text-error"
                title={message}
              >
                <span className="size-1.5 bg-error" />
                {field}
              </span>
            ))}
          </div>
        )}

        {!readOnly ? (
          <StickyFormFooter>
            <div className="flex items-center justify-end">
              <SubmitCollectionButton />
            </div>
          </StickyFormFooter>
        ) : null}
      </FormComponent.Form>
    </FormComponent.Container>
  );
};
