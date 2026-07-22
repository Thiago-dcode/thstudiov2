"use client";

import { MAX_COLLECTION_ITEMS } from "@repo/common-lib/constants/constants";
import { MAX_HIGHLIGHT_COLLECTIONS } from "@repo/common-lib/constants/highlights";
import type {
  CollectionInput,
  CreateCollectionInput,
  FullCollection,
  FullCollectionMedia,
} from "@repo/common-lib/types/collection";
import type { Media } from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { toastErrorThrottled } from "@/lib/utils/throttled-toast";
import type { UserAuth } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdateCollectionAction } from "../server-actions/create-update-collection.action";
import { getCollectionHighlightCountAction } from "../server-actions/get-highlight-count.action";
import { slugExistsAction } from "../server-actions/slug-exists.action";

/** Builds the single-source-of-truth input from an existing collection (edit) or an empty draft (create). */
function buildCollectionInput(
  user: UserAuth,
  collection?: FullCollection,
): CollectionInput {
  if (!collection) {
    return {
      user_id: user.id,
      media: [],
    };
  }

  return {
    user_id: collection.user_id,
    title: collection.title,
    slug: collection.slug,
    description: collection.description ?? "",
    is_highlight: collection.is_highlight,
    is_active: collection.is_active,
    media: [...collection.media].sort((a, b) => a.position - b.position),
  };
}

type CollectionContextType = {
  user: UserAuth;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  /** Submits the collection without requiring a form submit event (e.g. from a confirmation dialog). */
  submitCollection: () => Promise<void>;
  handleSetFormData: (
    key: keyof CreateCollectionInput,
    value: string | number | boolean | FullCollectionMedia[],
  ) => void;
  /** Single source of truth for the whole create/update form. */
  collectionInput: CollectionInput;
  setCollectionInput: Dispatch<SetStateAction<CollectionInput>>;
  mediaSelected: FullCollectionMedia[];
  handlePushMediaSelected: (media: Media) => void;
  handleRemoveMediaSelected: (mediaId: number) => void;
  inputErrors: Record<string, string> | undefined;
  isPending: boolean;
  success: boolean;
  canSubmit: boolean;
  isSlugAvailable?: boolean;
  isCheckingSlugAvailability: boolean;
  checkSlugAvailability: () => Promise<void>;
  deleteInputErrorProperty: (key: string) => void;
  reset: () => void;
  clear: () => void;
  currentCollection: FullCollection | undefined;
  setCollection: (collection: FullCollection) => void;
  highlightCount: number;
  highlightLimit: number;
  mediaItemLimit: number;
  isMediaLimitReached: boolean;
  isLoadingHighlightCount: boolean;
  fetchHighlightCount: (options?: { force?: boolean }) => Promise<void>;
};

const CollectionContext = createContext<CollectionContextType | null>(null);

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
};

type CollectionProviderProps = {
  children: ReactNode;
  user: UserAuth;
};

export const CollectionProvider = ({
  children,
  user,
}: CollectionProviderProps) => {
  const t = useTranslations("atelier.collections");
  const [currentCollection, setCurrentCollection] = useState<
    FullCollection | undefined
  >(undefined);

  const [collectionInput, setCollectionInput] = useState<CollectionInput>(() =>
    buildCollectionInput(user),
  );

  const setCollection = useCallback(
    (collection: FullCollection) => {
      setCurrentCollection(collection);
      setCollectionInput(buildCollectionInput(user, collection));
    },
    [user],
  );

  const idTimeOut = useRef<NodeJS.Timeout>(null);
  const highlightCountMemo = useRef<ActionReturn<
    number | null,
    undefined
  > | null>(null);
  const forceHighlightFetchRef = useRef(false);
  const highlightLimit = MAX_HIGHLIGHT_COLLECTIONS;

  const {
    handleAction: handleHighlightCountAction,
    result: highlightCountResult,
    isPending: isLoadingHighlightCount,
    cleanResult: cleanHighlightResult,
  } = useHandleAction({
    action: async () => {
      if (highlightCountMemo.current && !forceHighlightFetchRef.current) {
        return highlightCountMemo.current;
      }
      forceHighlightFetchRef.current = false;
      return await getCollectionHighlightCountAction();
    },
    afterAction: async (data) => {
      highlightCountMemo.current = data;
    },
  });

  const fetchHighlightCount = useCallback(
    async (options?: { force?: boolean }) => {
      if (options?.force) {
        highlightCountMemo.current = null;
        forceHighlightFetchRef.current = true;
        cleanHighlightResult();
      }
      await handleHighlightCountAction();
    },
    [handleHighlightCountAction, cleanHighlightResult],
  );

  const highlightCount = highlightCountResult?.data ?? 0;

  const {
    handleAction,
    isPending,
    success,
    deleteInputErrorProperty,
    inputErrors,
    reset,
  } = useHandleAction({
    action: async () => {
      const media = collectionInput.media.map((m, idx) => ({
        id: m.id,
        position: idx + 1,
      }));

      const payload: Partial<CreateCollectionInput> = {
        title: (collectionInput.title ?? "") as string,
        slug: (collectionInput.slug ?? "") as string,
        description: (collectionInput.description ?? "") as string,
        user_id: (collectionInput.user_id ?? user.id) as number,
        is_highlight: collectionInput.is_highlight ?? false,
        is_active: collectionInput.is_active ?? true,
        media: media.length ? media : undefined,
      };

      return await createOrUpdateCollectionAction(payload, currentCollection);
    },
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) {
          toast.error(error);
        }
      } else if (result.data) {
        await fetchHighlightCount({ force: true });
        clear();
        toast.success(
          currentCollection ? t("toastUpdated") : t("toastCreated"),
        );
      }
    },
    beforeAction: async () => {
      reset();
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handleAction();
    },
    [handleAction],
  );

  const submitCollection = useCallback(async () => {
    await handleAction();
  }, [handleAction]);

  const slugChecksMemo = useRef<
    Record<string, ActionReturn<boolean | null, undefined>>
  >({});
  const {
    handleAction: handleActionSlug,
    result: resultSlugExist,
    isPending: isPendingSlugExists,
    cleanResult,
    cleanErrors,
  } = useHandleAction({
    action: async () => {
      const slugToCheck = collectionInput.slug || "";
      if (slugChecksMemo.current[slugToCheck]) {
        return slugChecksMemo.current[slugToCheck];
      }
      return await slugExistsAction(user.username, slugToCheck);
    },
    afterAction: async (data) => {
      slugChecksMemo.current[collectionInput.slug || ""] = data;
    },
  });

  const checkSlugAvailability = useCallback(async () => {
    if (
      !collectionInput.slug ||
      isPendingSlugExists ||
      collectionInput.slug === currentCollection?.slug
    )
      return;
    if (idTimeOut.current) clearTimeout(idTimeOut.current);
    idTimeOut.current = setTimeout(() => {
      cleanResult();
      cleanErrors();
      handleActionSlug();
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
    }, 1000);
  }, [
    collectionInput.slug,
    isPendingSlugExists,
    cleanResult,
    cleanErrors,
    handleActionSlug,
    currentCollection?.slug,
  ]);

  const handleSetFormData = useCallback(
    (key: keyof CreateCollectionInput, value: any) => {
      if (key === "slug") {
        cleanResult();
        cleanErrors();
      }
      setCollectionInput((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [cleanErrors, cleanResult],
  );

  const handlePushMediaSelected = useCallback((m: Media) => {
    setCollectionInput((prev) => {
      const current = prev.media;
      if (current.length >= MAX_COLLECTION_ITEMS) {
        toastErrorThrottled(
          `Collections can have up to ${MAX_COLLECTION_ITEMS} media items`,
        );
        return prev;
      }
      if (current.some((x) => x.id === m.id)) return prev;
      const media: FullCollectionMedia = { ...m, position: current.length + 1 };
      return { ...prev, media: [...current, media] };
    });
  }, []);

  const handleRemoveMediaSelected = useCallback((mediaId: number) => {
    setCollectionInput((prev) => ({
      ...prev,
      media: prev.media.filter((media) => media.id !== mediaId),
    }));
  }, []);

  const mediaSelected = useMemo(() => {
    return [...collectionInput.media].sort((a, b) => a.position - b.position);
  }, [collectionInput.media]);

  const isMediaLimitReached = mediaSelected.length >= MAX_COLLECTION_ITEMS;

  const hasFormChanged = useMemo(() => {
    if (!currentCollection) return false;
    if (collectionInput.title !== currentCollection.title) return true;
    if (collectionInput.slug !== currentCollection.slug) return true;
    if (
      (collectionInput.description ?? "") !==
      (currentCollection.description ?? "")
    )
      return true;
    if (collectionInput.is_highlight !== currentCollection.is_highlight)
      return true;
    if ((collectionInput.is_active ?? true) !== currentCollection.is_active)
      return true;

    const currentMedia = collectionInput.media;
    const originalMedia = [...currentCollection.media].sort(
      (a, b) => a.position - b.position,
    );
    if (currentMedia.length !== originalMedia.length) return true;
    for (let i = 0; i < currentMedia.length; i++) {
      if (
        currentMedia[i].id !== originalMedia[i].id ||
        currentMedia[i].position !== originalMedia[i].position
      )
        return true;
    }

    return false;
  }, [collectionInput, currentCollection]);

  const requiredFieldsPresent = !!(
    collectionInput.title &&
    collectionInput.slug &&
    collectionInput.media.length
  );

  const canSubmit = useMemo(() => {
    if (!requiredFieldsPresent) return false;
    if (currentCollection) return hasFormChanged;
    return true;
  }, [requiredFieldsPresent, currentCollection, hasFormChanged]);

  const clear = useCallback(() => {
    setCollectionInput(buildCollectionInput(user));
    setCurrentCollection(undefined);
    reset();
    cleanErrors();
    cleanResult();
    slugChecksMemo.current = {};
    if (idTimeOut.current) {
      clearTimeout(idTimeOut.current);
      idTimeOut.current = null;
    }
  }, [user, reset, cleanErrors, cleanResult]);

  const contextValue: CollectionContextType = {
    user,
    handleSubmit,
    submitCollection,
    handleSetFormData,
    collectionInput,
    setCollectionInput,
    mediaSelected,
    handlePushMediaSelected,
    handleRemoveMediaSelected,
    inputErrors,
    isPending,
    success,
    canSubmit,
    isSlugAvailable:
      typeof resultSlugExist?.data === "boolean"
        ? !resultSlugExist.data
        : undefined,
    isCheckingSlugAvailability: isPendingSlugExists,
    checkSlugAvailability,
    deleteInputErrorProperty,
    reset,
    clear,
    currentCollection,
    setCollection,
    highlightCount,
    highlightLimit,
    mediaItemLimit: MAX_COLLECTION_ITEMS,
    isMediaLimitReached,
    isLoadingHighlightCount,
    fetchHighlightCount,
  };

  return (
    <CollectionContext.Provider value={contextValue}>
      {children}
    </CollectionContext.Provider>
  );
};
