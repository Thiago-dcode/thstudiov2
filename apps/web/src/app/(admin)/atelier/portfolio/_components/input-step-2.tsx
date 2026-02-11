import { Button } from "@repo/ui/components/shadcn/button"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@repo/ui/components/shadcn/drawer"
import { FileInputProvider } from "@repo/ui/contexts/file.provider"
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants"
import { Image } from "lucide-react"
import { CreateMediaDialog } from "../../media/_components/create-media-modal"
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getAllUserMediaAction } from "@/modules/media/server-actions/get-all-user-media.action"
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider"
import { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useMedia } from "@/modules/media/providers/media.provider"
import { Media } from "@repo/common-lib/types/media"
import { Spinner } from "@repo/ui/components/shadcn/spinner"
import { Check, X } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DndContext, DragEndEvent } from "@dnd-kit/core"

const SortableItem = ({
    children,
    containerClassname,
    id

}: {
    children: ReactNode,
    containerClassname?: string,
    id: string | number
}) => {

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
        useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            id={String(id)}
            {...attributes}
            {...listeners}
            className={cn("cursor-pointer", containerClassname, isDragging && "opacity-70")}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            {children}
        </div>
    );


}

export default function InputStep2() {

    const { userId, mediaSelected, handlePushMediaSelected, handleRemoveMediaSelected, handleSetFormData } = usePortfolio();
    const [open, setOpen] = useState(false);
    const { isCompleted } = useMedia();
    const [mediaObj, setMediaObj] = useState<Record<number, Media>>({});
    const media = useMemo(
        () => Object.values(mediaObj).sort((a, b) => b.id - a.id),
        [mediaObj]
    );
    const mediaItems = useMemo(() => mediaSelected.map(m => `media-${m.id}`), [mediaSelected]);
    const prevMedia = useRef<Media[]>([]);
    const prevIsCompleted = useRef(false);
    const { handleAction, isPending } = useHandleAction({
        action: async () => {

            const hasCache = prevMedia.current.length > 0;
            const cacheIsSynced = hasCache && !prevMedia.current.some((m) => !mediaObj[m.id]);
            const completedJustNow = isCompleted && !prevIsCompleted.current;
            const canRefetch = !cacheIsSynced || completedJustNow;
            prevIsCompleted.current = isCompleted

            if (canRefetch) {
                console.log("REFETCHING")
                return getAllUserMediaAction(userId);
            }

            return {
                data: prevMedia.current,
                errors: null,
                inputErrors: undefined,
            };

        },
        afterAction: async (result) => {

            if (result.data) {
                prevMedia.current = result.data;
                setMediaObj(
                    result.data.reduce((prev, m) => {
                        prev[m.id] = m;
                        return prev;
                    }, {} as Record<number, Media>)
                );
            }
        }
    });

    useEffect(() => {

        if (open || isCompleted) {
            handleAction();
        }
    }, [open, isCompleted])

    const getShapeClass = (shape?: string | null) => {
        switch (shape) {
            case 'LANDSCAPE': return 'w-[90%] aspect-video';
            case 'PORTRAIT': return 'w-[60%] aspect-[3/4]';
            case 'SQUARE':
            default: return 'w-[85%] aspect-square';
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {

        const { active, over } = event;

        // If there's no drop target or the item was dropped on itself, do nothing.
        if (!over || active.id === over.id) return;

        const oldIndex = mediaItems.indexOf(String(active.id));
        const newIndex = mediaItems.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        // Reorder selected media and persist it in the provider (single source of truth).
        handleSetFormData('media', arrayMove(mediaSelected, oldIndex, newIndex));
    }



    return <section className="space-y-5">

        {/* Header row: selected count + add button */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">Media</h3>
                {mediaSelected.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {mediaSelected.length} selected
                    </span>
                )}
                {mediaSelected.length > 1 && (
                    <span className="text-xs text-muted-foreground/70">
                        · Drag to reorder
                    </span>
                )}
            </div>
            <Drawer open={open} onOpenChange={setOpen} direction="right">
                <DrawerTrigger asChild>
                    <Button type="button" variant="secondary" className="gap-2 h-8 px-3 text-xs">
                        <Image className="size-3.5" />
                        Add media
                    </Button>
                </DrawerTrigger>
                <DrawerContent
                    className="h-full w-[600px] max-w-[90vw] right-0 left-auto rounded-l-lg rounded-t-none flex flex-col"
                >
                    {/* Drawer header */}
                    <DrawerHeader className="border-b px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <DrawerTitle className="text-base font-semibold">
                                    Add media
                                </DrawerTitle>
                                {mediaSelected.length > 0 && (
                                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent/15 text-accent text-[11px] font-medium tabular-nums">
                                        {mediaSelected.length}
                                    </span>
                                )}
                            </div>
                            <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                                <CreateMediaDialog />
                            </FileInputProvider>
                        </div>
                    </DrawerHeader>

                    {/* Drawer body */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isPending ? (
                            <div className="flex items-center justify-center py-16">
                                <Spinner className="size-8" />
                            </div>
                        ) : media.length ? (
                            <div className="space-y-3">
                                <p className="text-[11px] text-muted-foreground">
                                    Click to add to your portfolio · {media.length} available
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {media.map((m) => {
                                        const isSelected = mediaSelected.some((x) => x.id === m.id);
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handlePushMediaSelected(m)}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    "group relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-fg-2",
                                                    "transition-all duration-200 ease-out",
                                                    "hover:shadow-md hover:-translate-y-0.5",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                                                    isSelected ? "opacity-60 scale-95" : "opacity-100"
                                                )}
                                                style={{
                                                    backgroundImage: m.thumbnail ? `url(${m.thumbnail})` : undefined,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                                title={isSelected ? "Already added" : "Add to portfolio"}
                                            >
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />

                                                {/* Shape badge */}
                                                {m.shape ? (
                                                    <div className="absolute top-2 right-2 rounded-md bg-black/40 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                                                        {m.shape}
                                                    </div>
                                                ) : null}

                                                {/* Selected check */}
                                                {isSelected ? (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="flex items-center justify-center size-10 rounded-full bg-accent/80 text-white">
                                                            <Check className="size-5" />
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <Image className="size-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    No media yet
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                    Upload your first image to get started
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Drawer footer */}
                    <div className="border-t px-4 py-3 flex items-center justify-between">
                        {mediaSelected.length > 0 ? (
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {mediaSelected.length} item{mediaSelected.length !== 1 ? 's' : ''} selected
                            </p>
                        ) : (
                            <span />
                        )}
                        <DrawerClose asChild>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8">
                                <X className="size-3.5" />
                                Close
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>

        {/* Selected media grid */}
        {mediaSelected.length === 0 ? (
            <div className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-border/60 bg-fg-2/5 flex flex-col items-center justify-center gap-3 p-8">
                <Image className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/70">
                    No media added yet
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-3 text-xs gap-1.5 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-fg-2"
                    onClick={() => setOpen(true)}
                >
                    <Image className="size-3.5" />
                    Browse media
                </Button>
            </div>
        ) : (
            <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                    items={mediaItems}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {mediaSelected.map((m, index) => (
                            <div
                                key={m.id}
                                className=" bg-fg/60 rounded-xl p-4"
                            >
                                <SortableItem id={`media-${m.id}`} containerClassname="group relative">
                                    <div
                                        className={cn(
                                            "absolute top-2 left-2 z-10 inline-flex items-center justify-center",
                                            "h-5 px-1.5 rounded-md bg-black/35",
                                            "text-[10px] font-medium tabular-nums text-white/85",
                                            "pointer-events-none select-none"
                                        )}
                                        aria-hidden
                                    >
                                        {index + 1}
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${m.title || 'media'}`}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveMediaSelected(m.id);
                                        }}
                                        className={cn(
                                            "absolute top-2 right-2 z-10 inline-flex items-center justify-center",
                                            "size-7 rounded-full border border-border/50 bg-bg/70 backdrop-blur-sm",
                                            "text-muted-foreground hover:text-foreground hover:bg-bg",
                                            "opacity-0 group-hover:opacity-100 focus:opacity-100",
                                            "transition-opacity"
                                        )}
                                    >
                                        <X className="size-3.5 cursor-pointer" />
                                    </button>
                                    <div className="aspect-square w-full rounded-lg flex items-center justify-center">
                                        <div
                                            className={cn(
                                                "relative overflow-hidden rounded-sm",
                                                getShapeClass(m.shape)
                                            )}
                                        >
                                            <img
                                                src={m.thumbnail || m.url}
                                                alt={m.title || ""}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-medium text-foreground line-clamp-1 px-0.5">
                                        {m.title || m.seo_filename || 'Untitled'}
                                    </h3>
                                </SortableItem>
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        )}

    </section>


}



