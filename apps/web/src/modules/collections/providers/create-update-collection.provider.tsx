"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef } from "react";
import { CreateCollectionInput, FullCollection } from "@repo/common-lib/types/collection";
import { Media, MediaPortfolio } from "@repo/common-lib/types/media";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdateCollectionAction } from "../server-actions/create-update-collection.action";
import { slugExistsAction } from "../server-actions/slug-exists.action";
import { ActionReturn } from "@repo/common-lib/types/response";
import { toast } from "@repo/ui/sonner";
import { User } from "@repo/common-lib/types/user";
import { UserAuth } from "@/modules/auth/auth.types";

type CollectionFormData = Partial<
  Omit<CreateCollectionInput, 'media'> & {
    media?: MediaPortfolio[];
  }
>;

type CollectionContextType = {
  user: UserAuth;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleSetFormData: (key: keyof CreateCollectionInput, value: string | number | boolean | MediaPortfolio[]) => void;
  formData: CollectionFormData;
  mediaSelected: MediaPortfolio[];
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
  const [currentCollection, setCurrentCollection] = useState<FullCollection | undefined>(undefined);

  const [formData, setFormData] = useState<CollectionFormData>({
    user_id: user.id,
  });

  const setCollection = useCallback((collection: FullCollection) => {
    setCurrentCollection(collection);
    setFormData({
      user_id: collection.user_id,
      title: collection.title,
      slug: collection.slug,
      description: collection.description ?? undefined,
      is_highlight: collection.is_highlight,
      is_active: collection.is_active,
      media: collection.media.sort((a, b) => a.position - b.position),
    });
  }, []);

  const idTimeOut = useRef<NodeJS.Timeout>(null);

  const { handleAction, isPending, success, deleteInputErrorProperty, inputErrors, reset } = useHandleAction({
    action: async () => {
      const media = (formData.media ?? []).map((m, idx) => ({
        id: m.id,
        position: idx + 1,
      }));

      const payload: Partial<CreateCollectionInput> = {
        title: (formData.title ?? "") as string,
        slug: (formData.slug ?? "") as string,
        description: (formData.description ?? undefined) as string | undefined,
        user_id: (formData.user_id ?? user.id) as number,
        is_highlight: formData.is_highlight ?? false,
        is_active: formData.is_active ?? true,
        media: media.length ? media : undefined,
      };

      return await createOrUpdateCollectionAction(payload, currentCollection);
    },
    afterAction: async (result) => {
      if (result.errors) {
        result.errors.forEach((error) => toast.error(error));
      } else if (result.data) {
        clear();
        toast.success(currentCollection ? "Collection updated successfully" : "Collection created successfully");
      }
    },
    beforeAction: async () => {
      reset();
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleAction();
  }, [handleAction]);

  const slugChecksMemo = useRef<Record<string, ActionReturn<boolean, undefined>>>({});
  const { handleAction: handleActionSlug, result: resultSlugExist, isPending: isPendingSlugExists, cleanResult, cleanErrors } = useHandleAction({
    action: async () => {
      const slugToCheck = formData.slug || '';
      if (slugChecksMemo.current[slugToCheck]) {
        return slugChecksMemo.current[slugToCheck];
      }
      return await slugExistsAction(user.username, slugToCheck);
    },
    afterAction: async (data) => {
      slugChecksMemo.current[formData.slug || ''] = data;
    },
  });

  const checkSlugAvailability = useCallback(async () => {
    if (!formData || !formData.slug || isPendingSlugExists || formData.slug === currentCollection?.slug) return;
    if (idTimeOut.current) clearTimeout(idTimeOut.current);
    idTimeOut.current = setTimeout(() => {
      cleanResult();
      cleanErrors();
      handleActionSlug();
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
    }, 1000);
  }, [formData, isPendingSlugExists, cleanResult, cleanErrors, handleActionSlug]);

  const handleSetFormData = useCallback((key: keyof CreateCollectionInput, value: any) => {
    if (key === 'slug') {
      cleanResult();
      cleanErrors();
    }
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  }, [cleanErrors, cleanResult]);

  const handlePushMediaSelected = useCallback((m: Media) => {
    const current = formData.media ?? [];
    if (current.some((x) => x.id === m.id)) return;
    const media: MediaPortfolio = { ...m, position: current.length + 1 };
    handleSetFormData('media', [...current, media]);
  }, [formData.media, handleSetFormData]);

  const handleRemoveMediaSelected = useCallback((mediaId: number) => {
    const current = formData.media ?? [];
    handleSetFormData('media', current.filter((media) => media.id !== mediaId));
  }, [formData.media, handleSetFormData]);

  const mediaSelected = useMemo(() => {
    return formData.media ? formData.media.sort((a, b) => a.position - b.position) : [];
  }, [formData.media]);

  const hasFormChanged = useMemo(() => {
    if (!currentCollection) return false;
    if (formData.title !== currentCollection.title) return true;
    if (formData.slug !== currentCollection.slug) return true;
    if ((formData.description ?? undefined) !== (currentCollection.description ?? undefined)) return true;
    if (formData.is_highlight !== currentCollection.is_highlight) return true;
    if ((formData.is_active ?? true) !== currentCollection.is_active) return true;

    const currentMedia = formData.media ?? [];
    const originalMedia = [...currentCollection.media].sort((a, b) => a.position - b.position);
    if (currentMedia.length !== originalMedia.length) return true;
    for (let i = 0; i < currentMedia.length; i++) {
      if (currentMedia[i].id !== originalMedia[i].id || currentMedia[i].position !== originalMedia[i].position) return true;
    }

    return false;
  }, [formData, currentCollection]);

  const requiredFieldsPresent = !!(formData.title && formData.slug && formData.media?.length);

  const canSubmit = useMemo(() => {
    if (!requiredFieldsPresent) return false;
    if (currentCollection) return hasFormChanged;
    return true;
  }, [requiredFieldsPresent, currentCollection, hasFormChanged]);

  const clear = useCallback(() => {
    setFormData({ user_id: user.id });
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
    handleSetFormData,
    formData,
    mediaSelected,
    handlePushMediaSelected,
    handleRemoveMediaSelected,
    inputErrors,
    isPending,
    success,
    canSubmit,
    isSlugAvailable: typeof resultSlugExist?.data === 'boolean' ? !resultSlugExist.data : undefined,
    isCheckingSlugAvailability: isPendingSlugExists,
    checkSlugAvailability,
    deleteInputErrorProperty,
    reset,
    clear,
    currentCollection,
    setCollection,
  };

  return (
    <CollectionContext.Provider value={contextValue}>
      {children}
    </CollectionContext.Provider>
  );
};
