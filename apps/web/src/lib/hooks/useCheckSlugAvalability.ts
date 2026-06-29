import type { ActionReturn } from "@repo/common-lib/types/response";
import { useCallback, useRef } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";

export const useCheckSlugAvalability = ({
  actionFn,
}: {
  actionFn: (slug: string) => Promise<ActionReturn<boolean | null, undefined>>;
}) => {
  const idTimeOut = useRef<NodeJS.Timeout>(null);
  const slugToCheck = useRef<string>(undefined);
  const slugChecksMemo = useRef<
    Record<string, ActionReturn<boolean | null, undefined>>
  >({});
  const { handleAction, result, isPending, cleanResult, cleanErrors } =
    useHandleAction({
      action: async () => {
        // Normalize slug before checking to match how it's stored in DB (without trailing hyphens)

        const slug = slugToCheck.current || "";
        if (slug && slugChecksMemo.current[slug]) {
          return slugChecksMemo.current[slug];
        }
        return await actionFn(slug);
      },
      afterAction: async (data) => {
        const slug = slugToCheck.current;
        if (slug) slugChecksMemo.current[slug] = data;
      },
    });

  const resetSlugResult = useCallback(() => {
    cleanResult();
    cleanErrors();
  }, [cleanResult, cleanErrors]);

  const resetSlugCheck = useCallback(() => {
    if (idTimeOut.current) {
      clearTimeout(idTimeOut.current);
      idTimeOut.current = null;
    }
    slugToCheck.current = undefined;
    slugChecksMemo.current = {};
    resetSlugResult();
  }, [resetSlugResult]);

  const checkSlugAvailability = useCallback(
    async (slug: string) => {
      if (!slug || isPending || slug === slugToCheck.current) return;
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
      idTimeOut.current = setTimeout(() => {
        slugToCheck.current = slug;
        cleanResult();
        cleanErrors();
        handleAction();
        if (idTimeOut.current) clearTimeout(idTimeOut.current);
      }, 1000);
    },
    [isPending, cleanResult, cleanErrors, handleAction],
  );

  return {
    checkSlugAvailability,
    resetSlugCheck,
    resetSlugResult,
    isAvailable: typeof result?.data === "boolean" ? result.data : undefined,
    isLoading: isPending,
  };
};
