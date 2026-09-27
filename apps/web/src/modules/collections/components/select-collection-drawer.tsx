import type { Collection } from "@repo/common-lib/types/collection";
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
import { cn } from "@repo/ui/lib/utils";
import { Check, LayoutGrid, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getAllUserCollectionsAction } from "@/modules/collections/server-actions/get-all-user-collections.action";

export const SelectCollectionDrawer = ({
  userId,
  collectionsSelected,
  onSelect,
  onDeselect,
  addButtonDisabled = false,
}: {
  userId: number;
  /** In the order the caller shows them, so the drawer's "Selected" row mirrors the page. */
  collectionsSelected: Collection[];
  onSelect: (collection: Collection) => void;
  onDeselect: (collectionId: number) => void;
  addButtonDisabled?: boolean;
}) => {
  const t = useTranslations("atelier.collections.drawer");
  const tCommon = useTranslations("atelier.common");
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const collectionMap = useRef(new Map<number, Collection>());
  const firstFetchDone = useRef(false);
  const collectionsSelectedLength = collectionsSelected.length;
  // Selected items render from the caller's list, not from the fetched pages, so something
  // picked earlier (or saved on an edit) stays visible before its page has been loaded.
  const availableCollections = useMemo(() => {
    const selectedIds = new Set(collectionsSelected.map((c) => c.id));
    return collections.filter((c) => !selectedIds.has(c.id));
  }, [collections, collectionsSelected]);
  const currentPage = useRef(1);
  const nextPage = useRef<undefined | number>(undefined);

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      if (!firstFetchDone.current) firstFetchDone.current = true;
      return getAllUserCollectionsAction(userId, {
        per_page: 25,
        page: currentPage.current,
        paginated: true,
        blocked: false,
        is_active: true,
      });
    },
    afterAction: async (result) => {
      if (result.data) {
        for (const item of result.data) {
          collectionMap.current.set(item.id, item);
        }
        setCollections(Array.from(collectionMap.current.values()));
        nextPage.current = result.pagination?.next_page;
      }
    },
  });

  const resetAndFetch = useCallback(() => {
    currentPage.current = 1;
    nextPage.current = undefined;
    collectionMap.current.clear();
    setCollections([]);
    handleAction();
  }, [handleAction]);

  const handleRefresh = () => resetAndFetch();

  const handleLoadMore = () => {
    if (nextPage.current) {
      currentPage.current = nextPage.current;
      handleAction();
    }
  };

  useEffect(() => {
    if (open && !firstFetchDone.current) {
      handleAction();
    }
  }, [open, handleAction]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="gap-2 h-8 px-3 text-xs"
          disabled={addButtonDisabled}
        >
          <LayoutGrid className="size-3.5" />
          {t("addCollection")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-[600px] max-w-[90vw] right-0 left-auto flex flex-col">
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-base font-semibold">
                {t("title")}
              </DrawerTitle>
              {collectionsSelectedLength > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 bg-fg text-text text-[11px] font-medium tabular-nums">
                  {collectionsSelectedLength}
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
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {collectionsSelectedLength > 0 && (
            <section className="space-y-3">
              <SectionHeading
                title={t("selectedHeading")}
                count={collectionsSelectedLength}
                hint={t("selectedHint")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {collectionsSelected.map((c) => (
                  <CollectionTile
                    key={c.id}
                    collection={c}
                    onRemove={() => onDeselect(c.id)}
                    title={c.title}
                    removeLabel={t("removeFromSelection")}
                    itemCountLabel={t("itemCount", {
                      count: c.media?.length ?? 0,
                    })}
                  />
                ))}
              </div>
            </section>
          )}

          {isPending && collections.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" />
            </div>
          ) : collections.length > 0 ? (
            <section className="space-y-3">
              {collectionsSelectedLength > 0 && (
                <SectionHeading
                  title={t("availableHeading")}
                  count={availableCollections.length}
                />
              )}
              <p className="text-[11px] text-text-muted">
                {t("hint", { count: availableCollections.length })}
              </p>
              {availableCollections.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableCollections.map((c) => (
                    <CollectionTile
                      key={c.id}
                      collection={c}
                      onClick={() => onSelect(c)}
                      title={t("addToPortfolio")}
                      itemCountLabel={t("itemCount", {
                        count: c.media?.length ?? 0,
                      })}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-text-muted">
                  {t("allSelected")}
                </p>
              )}
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
            </section>
          ) : collectionsSelectedLength === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <LayoutGrid className="size-8 text-text-muted/40" />
              <p className="text-sm text-text-muted">{t("emptyTitle")}</p>
              <p className="text-xs text-text-muted/70">{t("emptySubtitle")}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t px-4 py-3 flex items-center justify-between">
          {collectionsSelectedLength > 0 ? (
            <p className="text-xs text-text-muted tabular-nums">
              {t("itemsSelected", { count: collectionsSelectedLength })}
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

const SectionHeading = ({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint?: string;
}) => (
  <div className="flex items-baseline justify-between gap-3">
    <h3 className="text-[11px] font-medium uppercase tracking-wide text-text">
      {title}
      <span className="ml-1.5 text-text-muted tabular-nums">{count}</span>
    </h3>
    {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
  </div>
);

const CollectionTile = ({
  collection,
  onClick,
  onRemove,
  title,
  removeLabel,
  itemCountLabel,
}: {
  collection: Collection;
  title: string;
  itemCountLabel: string;
} & (
  | { onClick: () => void; onRemove?: never; removeLabel?: never }
  | { onClick?: never; onRemove: () => void; removeLabel: string }
)) => {
  // A selected tile is not a toggle: removing goes through its own small button, so a stray
  // tap while scrolling the drawer cannot drop something from the selection.
  const selected = onRemove !== undefined;
  const thumbnail = collection.media?.[0]?.thumbnail;
  const tileClassName = cn(
    "group relative block aspect-square w-full overflow-hidden border bg-fg-2",
    "transition-all duration-200 ease-out",
    selected
      ? "border-text ring-2 ring-text"
      : cn(
          "border-border hover:shadow-md hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        ),
  );
  const tileStyle = {
    backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  const content = (
    <>
      {!selected && (
        <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
      )}

      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2.5 pb-2 pt-6 text-left">
        <p className="text-[11px] font-medium text-white line-clamp-1">
          {collection.title}
        </p>
        {collection.media?.length > 0 && (
          <p className="text-[10px] text-white/70">{itemCountLabel}</p>
        )}
      </div>

      {/* Selected check — top-left; the remove button holds top-right */}
      {selected ? (
        <div className="absolute top-2 left-2 flex items-center justify-center size-7 bg-text text-fg">
          <Check className="size-4" />
        </div>
      ) : null}
    </>
  );

  if (!selected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={tileClassName}
        style={tileStyle}
        title={title}
      >
        {content}
      </button>
    );
  }

  return (
    // The remove button is a sibling of the tile, not inside it, so it stays its own
    // focusable control.
    <div className="relative">
      <div className={tileClassName} style={tileStyle} title={title}>
        {content}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className={cn(
          "absolute top-2 right-2 z-10 inline-flex items-center justify-center",
          "size-7 border border-border/50 bg-bg/80 backdrop-blur-sm",
          "text-text-muted hover:text-text hover:bg-bg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};
