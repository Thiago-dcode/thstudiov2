"use client";

import type { Media } from "@repo/common-lib/types/media";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
 createContext,
 type ReactNode,
 useCallback,
 useContext,
 useMemo,
 useState,
} from "react";

// Type definitions for selection data
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type SelectedMedia = {
 // TODO: Define selected media structure
};

// Context type
type SelectMediaContextType = {
 // State
 selectedMedia: Record<number, Media>;
 canSelect: boolean;
 setCanSelect: (value: boolean) => void;
 // Selection methods
 selectMedia: (media: Media) => void;
 deselectMedia: (mediaId: number) => void;
 toggleMediaSelection: (media: Media) => void;
 clearSelection: () => void;
 // Query methods
 isMediaSelected: (mediaId: number) => boolean;
 getSelectedMediaIds: () => number[];
 // Selection configuration
 maxSelection?: number;
 setMaxSelection: (max?: number) => void;
 // Computed values
 selectionCount: number;
};

const SelectMediaContext = createContext<SelectMediaContextType | null>(null);

// Hook to use select media context
export const useSelectMedia = () => {
 const context = useContext(SelectMediaContext);
 if (!context) {
 throw new Error("useSelectMedia must be used within a SelectMediaProvider");
 }
 return context;
};

// Provider component
export const SelectMediaProvider = ({ children }: { children: ReactNode }) => {
 // State declarations
 const [selectedMedia, setSelectedMedia] = useState<Record<number, Media>>({});
 const [maxSelection, setMaxSelection] = useState<number | undefined>(
 undefined,
 );
 const [canSelect, setCanSelect] = useState(false);

 // Selection methods
 const selectMedia = useCallback((media: Media) => {
 setSelectedMedia((prev) => {
 return { ...prev, [media.id]: media };
 });
 }, []);

 const deselectMedia = useCallback((mediaId: number) => {
 setSelectedMedia((prev) => {
 const { [mediaId]: _, ...rest } = prev;
 return rest;
 });
 }, []);

 const toggleMediaSelection = useCallback((media: Media) => {
 setSelectedMedia((prev) => {
 if (prev[media.id]) {
 const { [media.id]: _, ...rest } = prev;
 return rest;
 } else {
 return { ...prev, [media.id]: media };
 }
 });
 }, []);

 const clearSelection = useCallback(() => {
 setSelectedMedia({});
 }, []);

 // Query methods
 const isMediaSelected = useCallback(
 (mediaId: number): boolean => {
 return !!selectedMedia[mediaId];
 },
 [selectedMedia],
 );

 const getSelectedMediaIds = useCallback((): number[] => {
 return Object.keys(selectedMedia).map(Number);
 }, [selectedMedia]);

 // Computed values
 const selectionCount: number = useMemo(() => {
 return Object.keys(selectedMedia).length;
 }, [selectedMedia]);

 const value: SelectMediaContextType = {
 selectedMedia,
 canSelect,
 setCanSelect,
 selectMedia,
 deselectMedia,
 toggleMediaSelection,
 clearSelection,
 isMediaSelected,
 getSelectedMediaIds,
 maxSelection,
 setMaxSelection,
 selectionCount,
 };

 return (
 <SelectMediaContext.Provider value={value}>
 {children}
 </SelectMediaContext.Provider>
 );
};

export const SelectableMedia = ({
 media,
 children,
}: {
 media: Media;
 children: ReactNode;
}) => {
 const { canSelect, isMediaSelected, toggleMediaSelection } = useSelectMedia();

 // When selection mode is off, render children as-is
 if (!canSelect) return <>{children}</>;

 const checked = isMediaSelected(media.id);

 return (
 <div className="relative">
 <div className="absolute top-2 right-2 z-10 bg-fg-2/30 shadow-sm p-1">
 <Checkbox
 checked={checked}
 onCheckedChange={() => toggleMediaSelection(media)}
 />
 </div>
 {children}
 </div>
 );
};

export default SelectMediaProvider;
