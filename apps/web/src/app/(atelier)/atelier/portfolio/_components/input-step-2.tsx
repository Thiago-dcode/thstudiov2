import { Image } from "lucide-react"
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider"
import { ReactNode, useMemo } from "react"
import { MediaPortfolio } from "@repo/common-lib/types/media"
import { X } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { SelectMediaDrawer } from "@/modules/media/components/select-media-drawer"

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

    const { user, mediaSelected, handlePushMediaSelected, handleRemoveMediaSelected, handleSetFormData } = usePortfolio();

    const mediaSelectedRecord = useMemo(() => {
        const record: Record<number, MediaPortfolio> = {};
        for (const m of mediaSelected) record[m.id] = m;
        return record;
    }, [mediaSelected]);

    const mediaItems = useMemo(() => mediaSelected.map(m => `media-${m.id}`), [mediaSelected]);

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

        if (!over || active.id === over.id) return;

        const oldIndex = mediaItems.indexOf(String(active.id));
        const newIndex = mediaItems.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        handleSetFormData('media', arrayMove(mediaSelected, oldIndex, newIndex).map((m, i) => ({
            ...m,
            position: i + 1
        })));
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
            <SelectMediaDrawer
                userId={user.id}
                mediaSelected={mediaSelectedRecord}
                onSelect={handlePushMediaSelected}
            />
        </div>

        {/* Selected media grid */}
        {mediaSelected.length === 0 ? (
            <div className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-border/60 bg-fg-2/5 flex flex-col items-center justify-center gap-3 p-8">
                <Image className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/70">
                    No media added yet
                </p>
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
                                                src={m.thumbnail || undefined}
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



