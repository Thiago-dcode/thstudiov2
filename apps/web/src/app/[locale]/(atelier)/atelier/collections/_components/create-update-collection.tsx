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
import {
 generateValidSlug,
 isAValidSlugFormat,
} from "@repo/common-lib/utils/generate-valid-slug";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { Image, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { SubmitCollectionButton } from "@/app/[locale]/(atelier)/__components/submit-collection-button";
import FormComponent from "@/lib/components/form-component";
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
 const router = useRouter();
 const {
 handleSubmit,
 isPending,
 success,
 inputErrors,
 clear,
 setCollection,
 currentCollection,
 formData,
 handleSetFormData,
 deleteInputErrorProperty,
 checkSlugAvailability,
 isCheckingSlugAvailability,
 isSlugAvailable,
 user,
 mediaSelected,
 handlePushMediaSelected,
 handleRemoveMediaSelected,
 } = useCollection();

 const readOnly = Boolean(
 (currentCollection ?? defaultCollection)?.blocked_at,
 );

 useEffect(() => {
 if (defaultCollection && currentCollection?.id !== defaultCollection.id) {
 setCollection(defaultCollection);
 }
 if (!defaultCollection && currentCollection) {
 clear();
 }
 }, [defaultCollection, setCollection, currentCollection, clear]);

 useEffect(() => {
 if (success) {
 clear();
 router.push("/atelier/collections");
 }
 }, [success, clear, router.push]);

 // --- Slug logic ---
 const manuallyChangedSlug = useRef(false);
 const previousSlugRef = useRef<string | undefined>(formData?.slug);
 const [isValidSlug, setIsValidSlug] = useState<boolean | undefined>(
 undefined,
 );

 const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 deleteInputErrorProperty("title");
 const newTitle = e.target.value;
 handleSetFormData("title", newTitle);
 if (!manuallyChangedSlug.current) {
 const generatedSlug = generateValidSlug(newTitle);
 if (generatedSlug && isAValidSlugFormat(generatedSlug)) {
 handleSetFormData("slug", generatedSlug);
 } else if (!generatedSlug) {
 handleSetFormData("slug", "");
 }
 }
 };

 const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const newSlug = generateValidSlug(e.target.value, {
 preserveTrailingHyphen: true,
 });
 deleteInputErrorProperty("slug");
 handleSetFormData("slug", newSlug);
 manuallyChangedSlug.current = !!newSlug;
 };

 useEffect(() => {
 const currentSlug = formData?.slug?.trim();
 const previousSlug = previousSlugRef.current?.trim();
 const slugChanged = currentSlug !== previousSlug;

 if (currentSlug) {
 const isValid = isAValidSlugFormat(currentSlug);
 setIsValidSlug(isValid);
 if (slugChanged && isValid && !currentSlug.endsWith("-")) {
 checkSlugAvailability();
 }
 } else {
 setIsValidSlug(undefined);
 }
 previousSlugRef.current = formData?.slug;
 }, [formData?.slug, checkSlugAvailability]);

 const getSlugStatusMessage = () => {
 if (isCheckingSlugAvailability) {
 return (
 <p className="text-sm text-text-muted">Checking availability...</p>
 );
 }
 if (
 typeof isSlugAvailable === "boolean" &&
 currentCollection?.slug !== formData.slug
 ) {
 if (isSlugAvailable) {
 return (
 <p className="text-sm text-green-600">✓ This slug is available</p>
 );
 }
 return <p className="text-sm text-error">✗ This slug is already taken</p>;
 }
 return null;
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
 This collection has been blocked. You can review it here, but it
 cannot be edited until the block is lifted.
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

 <div className="flex justify-start mt-4">
 {!readOnly ? <SubmitCollectionButton /> : null}
 </div>

 {/* Text fields */}
 <div
 className={`space-y-4 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}
 >
 <FormComponent.LabelInput
 value={formData?.title || ""}
 onChange={handleTitleChange}
 error={inputErrors?.title}
 label="Title"
 required
 name="title"
 id="title"
 type="text"
 placeholder="My Collection"
 disabled={isPending}
 />

 <div className="space-y-2">
 <FormComponent.LabelInput
 value={formData?.slug || ""}
 onChange={handleSlugChange}
 error={inputErrors?.slug}
 label="Slug"
 required
 name="slug"
 id="slug"
 type="text"
 placeholder="my-collection"
 extraInfo="A slug is a URL-friendly version of your title (e.g., 'my-awesome-collection'). It should be unique as it's used in the collection's URL."
 disabled={isCheckingSlugAvailability || isPending}
 />
 {isValidSlug === false && (
 <p className="text-sm text-error">
 ✗ Invalid slug format. Example: my-collection
 </p>
 )}
 {getSlugStatusMessage()}
 </div>

 <FormComponent.LabelTextarea
 value={formData?.description || ""}
 onChange={(e) => {
 deleteInputErrorProperty("description");
 handleSetFormData("description", e.target.value);
 }}
 error={inputErrors?.description}
 rows={4}
 label="Description"
 name="description"
 id="description"
 placeholder="Describe your collection..."
 disabled={isPending}
 />

 <div className="flex items-center gap-2">
 <Checkbox
 id="collection-is-highlight"
 checked={formData.is_highlight ?? false}
 onCheckedChange={(checked) => {
 deleteInputErrorProperty("is_highlight");
 handleSetFormData("is_highlight", checked === true);
 }}
 disabled={isPending}
 />
 <Label
 htmlFor="collection-is-highlight"
 className="text-sm font-normal cursor-pointer"
 >
 Show on profile page
 </Label>
 <InfoTooltip
 content={
 <p className="text-sm">
 When enabled, this collection is highlighted on your public
 artist profile so visitors can find it more easily.
 </p>
 }
 />
 </div>

 <div className="flex items-center gap-2">
 <Checkbox
 id="collection-is-active"
 checked={formData.is_active ?? true}
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
 Active
 </Label>
 <InfoTooltip
 content={
 <p className="text-sm">
 When disabled, this collection is hidden from your public
 artist profile and listings. You can still edit it in the
 atelier.
 </p>
 }
 />
 </div>
 </div>

 {/* Media section */}
 <section
 className={`space-y-5 mt-8 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-medium text-text">Media</h3>
 {mediaSelected.length > 0 && (
 <span className="text-xs text-text-muted tabular-nums">
 {mediaSelected.length} selected
 </span>
 )}
 {mediaSelected.length > 1 && (
 <span className="text-xs text-text-muted/70">
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

 {mediaSelected.length === 0 ? (
 <div className="w-full min-h-[200px] border-2 border-dashed border-border/60 bg-fg-2/5 flex flex-col items-center justify-center gap-3 p-8">
 <Image className="size-8 text-text-muted/30" />
 <p className="text-sm text-text-muted/70">No media added yet</p>
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
 aria-label={`Remove ${m.title || "media"}`}
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
 {m.title || m.seo_filename || "Untitled"}
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
 </FormComponent.Form>
 </FormComponent.Container>
 );
};
