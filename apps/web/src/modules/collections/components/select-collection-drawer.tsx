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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getAllUserCollectionsAction } from "@/modules/collections/server-actions/get-all-user-collections.action";

export const SelectCollectionDrawer = ({
 userId,
 collectionsSelected,
 onSelect,
}: {
 userId: number;
 collectionsSelected: Record<number, unknown>;
 onSelect: (collection: Collection) => void;
}) => {
 const [open, setOpen] = useState(false);
 const [collections, setCollections] = useState<Collection[]>([]);
 const collectionMap = useRef(new Map<number, Collection>());
 const firstFetchDone = useRef(false);
 const collectionsSelectedLength = useMemo(
 () => Object.keys(collectionsSelected).length,
 [collectionsSelected],
 );
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
 >
 <LayoutGrid className="size-3.5" />
 Add collection
 </Button>
 </DrawerTrigger>
 <DrawerContent className="h-full w-[600px] max-w-[90vw] right-0 left-auto flex flex-col">
 <DrawerHeader className="border-b px-4 py-3">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <DrawerTitle className="text-base font-semibold">
 Add collection
 </DrawerTitle>
 {collectionsSelectedLength > 0 && (
 <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 bg-fg-1 text-text text-[11px] font-medium tabular-nums">
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
 aria-label="Refresh collections"
 >
 <RefreshCw
 className={cn("size-3.5", isPending && "animate-spin")}
 />
 </Button>
 </div>
 </div>
 </DrawerHeader>

 <div className="flex-1 overflow-y-auto p-4">
 {isPending && collections.length === 0 ? (
 <div className="flex items-center justify-center py-16">
 <Spinner className="size-8" />
 </div>
 ) : collections.length > 0 ? (
 <div className="space-y-3">
 <p className="text-[11px] text-text-muted">
 Click to add to your portfolio · {collections.length} available
 </p>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {collections.map((c) => {
 const isSelected = collectionsSelected[c.id];
 const thumbnail = c.media?.[0]?.thumbnail;
 return (
 <button
 key={c.id}
 type="button"
 onClick={() => (!isSelected ? onSelect(c) : null)}
 aria-pressed={!!isSelected}
 className={cn(
 "group relative aspect-square w-full overflow-hidden border border-border bg-fg-2",
 "transition-all duration-200 ease-out",
 "hover:shadow-md hover:-translate-y-0.5",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
 isSelected ? "opacity-60 scale-95" : "opacity-100",
 )}
 style={{
 backgroundImage: thumbnail
 ? `url(${thumbnail})`
 : undefined,
 backgroundSize: "cover",
 backgroundPosition: "center",
 }}
 title={isSelected ? "Already added" : "Add to portfolio"}
 >
 <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />

 <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2.5 pb-2 pt-6">
 <p className="text-[11px] font-medium text-white line-clamp-1">
 {c.title}
 </p>
 {c.media?.length > 0 && (
 <p className="text-[10px] text-white/70">
 {c.media.length} item
 {c.media.length !== 1 ? "s" : ""}
 </p>
 )}
 </div>

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
 {isPending ? "Loading..." : "Load more"}
 </Button>
 </div>
 )}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-16 gap-2">
 <LayoutGrid className="size-8 text-text-muted/40" />
 <p className="text-sm text-text-muted">No collections yet</p>
 <p className="text-xs text-text-muted/70">
 Create your first collection to get started
 </p>
 </div>
 )}
 </div>

 <div className="border-t px-4 py-3 flex items-center justify-between">
 {collectionsSelectedLength > 0 ? (
 <p className="text-xs text-text-muted tabular-nums">
 {collectionsSelectedLength} item
 {collectionsSelectedLength !== 1 ? "s" : ""} selected
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
 Close
 </Button>
 </DrawerClose>
 </div>
 </DrawerContent>
 </Drawer>
 );
};
