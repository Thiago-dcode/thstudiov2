"use client";

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MAX_SORT_MODULE_ITEMS } from "@repo/common-lib/constants/sort-module";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { ArrowDownUp, ChevronDown, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useMemo, useState } from "react";

export type SortableControls = {
  dragHandle: ReactNode | null;
  isDragging: boolean;
};

type SortableModuleProps<T> = {
  items: T[];
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  renderItem: (item: T, controls: SortableControls) => ReactNode;
  onSave: (items: SortModuleItem[]) => void | Promise<void>;
  isSaving: boolean;
  /** List layout (e.g. a grid). */
  className?: string;
  itemClassName?: string;
  /**
   * One-click orderings shown in an "Auto-order" menu. Each returns ids in the new order; applying
   * one only changes the local order, so the artist still reviews it and presses "Update order".
   */
  autoOrders?: {
    key: string;
    label: string;
    order: (items: T[]) => number[];
  }[];
};

const ICON_BUTTON = "h-11 w-11 p-0";

type SortableItemProps = {
  id: number;
  label: string;
  reorderable: boolean;
  className?: string;
  children: (controls: SortableControls) => ReactNode;
};

function SortableItem({
  id,
  label,
  reorderable,
  className,
  children,
}: SortableItemProps) {
  const t = useTranslations("atelier.common.sortable");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !reorderable });

  // Only the handle gets the listeners, so a tap on the card body never starts a drag on touch.
  const dragHandle = reorderable ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      ref={setActivatorNodeRef}
      aria-label={t("dragHandleLabel", { label })}
      className={cn(
        ICON_BUTTON,
        "cursor-grab touch-none focus-visible:ring-2 focus-visible:ring-border-em",
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden="true" />
    </Button>
  ) : null;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "min-w-0 motion-reduce:transition-none!",
        isDragging && "relative z-20 opacity-60 shadow-[var(--shadow-strong)]",
        className,
      )}
    >
      {children({ dragHandle, isDragging })}
    </li>
  );
}

/**
 * Generic drag-to-reorder list with a keyboard path (dnd-kit KeyboardSensor on the handle).
 * Local state is only the ordered ids: cards are looked up from the current `items`, so server-side
 * changes to a card (toggles, titles) show through without resetting an unsaved order.
 */
export function SortableModule<T>({
  items,
  getId,
  getLabel,
  renderItem,
  onSave,
  isSaving,
  className,
  itemClassName,
  autoOrders,
}: SortableModuleProps<T>) {
  const t = useTranslations("atelier.common.sortable");
  const dndId = useId();

  const serverIds = items.map(getId);
  const serverKey = serverIds.join(",");
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  const [localIds, setLocalIds] = useState<number[]>(serverIds);

  // Adjust state while rendering: the server order changed, so it wins over the local one.
  if (serverKey !== prevServerKey) {
    setPrevServerKey(serverKey);
    setLocalIds(serverIds);
  }

  const itemsById = useMemo(
    () => new Map(items.map((item) => [getId(item), item])),
    [items, getId],
  );
  const orderedIds = localIds.filter((id) => itemsById.has(id));
  const isDirty = orderedIds.join(",") !== serverKey;
  const reorderable =
    orderedIds.length >= 2 && orderedIds.length <= MAX_SORT_MODULE_ITEMS;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const labelOf = (id: unknown) => {
    const item = itemsById.get(Number(id));
    return item ? getLabel(item) : "";
  };
  const positionOf = (id: unknown) => orderedIds.indexOf(Number(id)) + 1;
  const total = orderedIds.length;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("pickedUp", {
        label: labelOf(active.id),
        position: positionOf(active.id),
        total,
      }),
    onDragOver: ({ active, over }) =>
      over
        ? t("movedOver", {
            label: labelOf(active.id),
            position: positionOf(over.id),
            total,
          })
        : undefined,
    onDragEnd: ({ active, over }) =>
      t("dropped", {
        label: labelOf(active.id),
        position: positionOf(over?.id ?? active.id),
        total,
      }),
    onDragCancel: ({ active }) =>
      t("cancelled", {
        label: labelOf(active.id),
        position: positionOf(active.id),
        total,
      }),
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = orderedIds.indexOf(Number(active.id));
    const to = orderedIds.indexOf(Number(over.id));
    if (from < 0 || to < 0) return;
    setLocalIds(arrayMove(orderedIds, from, to));
  };

  const applyAutoOrder = (order: (items: T[]) => number[]) => {
    const visible = orderedIds.map((id) => itemsById.get(id) as T);
    const next = order(visible);
    // Apply only a true permutation of the cards on screen: a duplicated or missing id would hide a card.
    const isPermutation =
      next.length === orderedIds.length &&
      new Set(next).size === next.length &&
      next.every((id) => itemsById.has(id));
    if (isPermutation) setLocalIds(next);
  };

  const handleSave = () =>
    onSave(orderedIds.map((module_id, position) => ({ module_id, position })));

  return (
    <div className="flex flex-col gap-4">
      {reorderable ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-muted">{t("hint")}</p>
          {autoOrders?.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group h-8"
                  disabled={isSaving}
                >
                  <ArrowDownUp aria-hidden="true" />
                  {t("autoOrder")}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={6}
                className="min-w-48"
              >
                {autoOrders.map(({ key, label, order }) => (
                  <DropdownMenuItem
                    key={key}
                    className="text-xs"
                    onSelect={() => applyAutoOrder(order)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {isDirty ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={isSaving}
                onClick={() => setLocalIds(serverIds)}
              >
                {t("reset")}
              </Button>
              <Button
                type="button"
                variant="accent"
                size="sm"
                className="h-8"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Spinner aria-hidden="true" role="presentation" />
                ) : null}
                {t("save")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: t("instructions") },
        }}
      >
        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
          <ul className={className}>
            {orderedIds.map((id) => {
              const item = itemsById.get(id) as T;
              return (
                <SortableItem
                  key={id}
                  id={id}
                  label={getLabel(item)}
                  reorderable={reorderable}
                  className={itemClassName}
                >
                  {(controls) => renderItem(item, controls)}
                </SortableItem>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
