import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  CollectionPortfolioItem,
  MediaPortfolioItem,
  PortfolioItem,
} from "@repo/common-lib/types/portfolio";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Image, X } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { SelectCollectionDrawer } from "@/modules/collections/components/select-collection-drawer";
import { SelectMediaDrawer } from "@/modules/media/components/select-media-drawer";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { PortfolioLayoutControls } from "./portfolio-layout-controls";

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

function getMediaShapeClass(shape?: string | null) {
  switch (shape) {
    case "LANDSCAPE":
      return "w-[90%] aspect-video";
    case "PORTRAIT":
      return "w-[60%] aspect-[3/4]";
    default:
      return "w-[85%] aspect-square";
  }
}

function portfolioItemLabel(row: PortfolioItem): string {
  switch (row.item) {
    case "media":
      return row.title || row.seo_filename || "Untitled";
    case "collection":
      return row.title || "Untitled";
  }
}

function resolvePortfolioItemComponent(row: PortfolioItem): ReactNode {
  switch (row.item) {
    case "media":
      return (
        <div
          className={cn(
            "relative overflow-hidden",
            getMediaShapeClass(row.shape),
          )}
        >
          <img
            src={row.thumbnail || undefined}
            alt={row.seo_alt || row.title || row.seo_filename || ""}
            className="w-full h-full object-cover"
          />
        </div>
      );
    case "collection": {
      return (
        <CollectionCard className="w-[80%]" collection={row} isAtelier={true} />
      );
    }
  }
}

export default function InputStep2() {
  const {
    user,
    portfolioInput,
    portfolioItemCount,
    portfolioItemLimit,
    isPortfolioItemsLimitReached,
    handleShiftPortfolioItem,
    handleSetPortfolioItems,
    handleRemovePortfolioItem,
  } = usePortfolio();

  const portfolioItems = portfolioInput.portfolioItems;

  const ItemsRecords = useMemo(() => {
    const mediaRecord: Record<number, MediaPortfolioItem> = {};
    const collectionRecord: Record<number, CollectionPortfolioItem> = {};
    for (const item of portfolioItems) {
      switch (item.item) {
        case "media":
          mediaRecord[item.id] = item;
          break;
        case "collection":
          collectionRecord[item.id] = item;
          break;
      }
    }
    return {
      mediaRecord,
      collectionRecord,
    };
  }, [portfolioItems]);



  const buildItemId = (item: PortfolioItem) => `${item.item}-${item.id}`;
  const sortableIds = useMemo(
    () => portfolioItems.map((item) => buildItemId(item)),
    [portfolioItems, buildItemId],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    handleSetPortfolioItems(arrayMove(portfolioItems, oldIndex, newIndex));
  };

  return (
    <section className="space-y-4">
      {/* Layout controls + add buttons */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <PortfolioLayoutControls />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
          <SelectCollectionDrawer
            userId={user.id}
            collectionsSelected={ItemsRecords.collectionRecord}
            onSelect={(collection) => {
              handleShiftPortfolioItem({
                ...collection,
                item: "collection",
              });
            }}
            addButtonDisabled={isPortfolioItemsLimitReached}
          />
          <SelectMediaDrawer
            userId={user.id}
            mediaSelected={ItemsRecords.mediaRecord}
            onSelect={(media) => {
              handleShiftPortfolioItem({ ...media, item: "media" });
            }}
            addButtonDisabled={isPortfolioItemsLimitReached}
          />
        </div>
      </div>

      {/* Item count + reorder hint */}
      <div className="flex flex-wrap items-center gap-1.5">
        <InfoTooltip
          iconClassName="size-3.5"
          content={
            <p className="text-sm">
              This count includes each media you add directly, plus every media
              item inside any collection you add. For example, one collection
              with 10 images counts as 10 items toward the limit of{" "}
              {portfolioItemLimit}.
            </p>
          }
        />
        <p
          className={cn(
            "text-xs! tabular-nums",
            isPortfolioItemsLimitReached ? "text-error" : "text-text-muted",
          )}
        >
          {portfolioItemCount} / {portfolioItemLimit} items
        </p>
        {portfolioItems.length > 1 && (
          <span className="text-xs! text-text-muted/70">
            · Drag to reorder
          </span>
        )}
      </div>


      {/* Selected media grid */}
      {portfolioItems.length === 0 ? (
        <div className="w-full min-h-[200px] border-2 border-dashed border-border/60 bg-fg-2/5 flex flex-col items-center justify-center gap-3 p-8">
          <Image className="size-8 text-text-muted/30" />
          <p className="text-sm text-text-muted/70">
            No media or collections added yet
          </p>
        </div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {portfolioItems.map((item, index) => {
                return (
                  <div
                    key={buildItemId(item)}
                    className="bg-fg/60 p-2.5 sm:p-4"
                  >
                    <SortableItem
                      id={buildItemId(item)}
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
                        aria-label={`Remove ${portfolioItemLabel(item)}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemovePortfolioItem(item.id, item.item);
                        }}
                        className={cn(
                          "absolute top-2 right-2 z-10 inline-flex items-center justify-center",
                          "size-7 border border-border/50 bg-bg/70 backdrop-blur-sm",
                          "text-text-muted hover:text-text hover:bg-bg",
                          "opacity-100 transition-opacity",
                          "sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100",
                        )}
                      >
                        <X className="size-3.5 cursor-pointer" />
                      </button>
                      <div className="aspect-square w-full flex items-center justify-center">
                        {resolvePortfolioItemComponent(item)}
                      </div>
                      <h3 className="text-xs! font-medium text-text line-clamp-1 px-0.5">
                        {portfolioItemLabel(item)}
                      </h3>
                    </SortableItem>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
