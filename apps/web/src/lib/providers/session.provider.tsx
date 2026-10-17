"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { UserAuth } from "@/modules/auth/auth.types";

type SessionContextType = {
  session: UserAuth | null;
};

const SessionContext = createContext<SessionContextType | null>(null);

/**
 * The session is read once on the server (root layout) and handed down, instead of every client
 * component calling the `userSession` server action on mount. Those calls ran one at a time, and
 * any of them whose request also wrote a cookie (the proxy's locale/language cookies, a refreshed
 * token) came back with a full re-render of the current page.
 *
 * Signing in or out goes through server actions that set the cookie, which re-renders the layout,
 * so this value follows the cookie without any client-side refetch.
 */
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export const SessionProvider = ({
  children,
  session,
}: {
  children: ReactNode;
  session: UserAuth | null;
}) => {
  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
};
