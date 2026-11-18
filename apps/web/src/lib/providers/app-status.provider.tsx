"use client";

import { toast } from "@repo/ui/sonner";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  Suspense,
  useContext,
  useEffect,
} from "react";
import {
  AUTH_URL_ERROR_PARAM,
  isAuthUrlError,
} from "@/modules/auth/auth-url-errors";

type AppStatusContextType = {
  isRegisterClose: boolean;
};

const AppStatusContext = createContext<AppStatusContextType | null>(null);

export const useAppStatus = () => {
  const context = useContext(AppStatusContext);
  if (!context) {
    throw new Error("useAppStatus must be used within an AppStatusProvider");
  }
  return context;
};

/**
 * Shows a redirect's `?error=<code>` once as a toast, then drops it from the URL so a reload or a
 * shared link doesn't show it again. Only the codes in `AUTH_URL_ERRORS` are shown; anything else
 * is ignored, so a crafted link can't put text on the page.
 */
const UrlErrorToast = () => {
  const searchParams = useSearchParams();
  const t = useTranslations("authUrlErrors");
  const error = searchParams.get(AUTH_URL_ERROR_PARAM);

  useEffect(() => {
    if (!error) return;
    if (isAuthUrlError(error)) {
      // Next tick: `<Toaster />` mounts after this subtree and drops toasts sent before it does.
      setTimeout(() => toast.error(t(error)), 0);
    }
    // `history.replaceState` updates `useSearchParams` without a navigation or a server render.
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTH_URL_ERROR_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, [error, t]);

  return null;
};

export const AppStatusProvider = ({
  children,
  isRegisterClose,
}: {
  children: ReactNode;
  isRegisterClose: boolean;
}) => {
  return (
    <AppStatusContext.Provider value={{ isRegisterClose }}>
      {children}
      {/* Its own boundary: `useSearchParams` must not opt the whole page out of static rendering. */}
      <Suspense fallback={null}>
        <UrlErrorToast />
      </Suspense>
    </AppStatusContext.Provider>
  );
};
