"use client";

import type { PublicCompactUser } from "@repo/common-lib/types/user";
import { createContext, type ReactNode, useContext } from "react";

type ArtistContextType = {
  artist: PublicCompactUser | null;
};

const ArtistContext = createContext<ArtistContextType | null>(null);

export const useArtist = () => {
  const context = useContext(ArtistContext);
  if (!context) {
    throw new Error("useArtist must be used within an ArtistProvider");
  }
  return context;
};

/**
 * The artist whose pages are being viewed, for client components such as the contact dialog. The
 * data comes from the server (the artist layout) on purpose: it used to be read through a server
 * action on mount, and that action's response was a revalidated full RSC re-render of the page,
 * which inserted the whole head metadata block a second time.
 */
export const ArtistProvider = ({
  artist,
  children,
}: {
  artist: PublicCompactUser | null;
  children: ReactNode;
}) => (
  <ArtistContext.Provider value={{ artist }}>{children}</ArtistContext.Provider>
);
