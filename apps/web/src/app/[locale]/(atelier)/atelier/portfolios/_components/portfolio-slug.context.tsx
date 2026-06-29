"use client";

import { createContext, useContext } from "react";

type PortfolioSlugContextType = {
  checkSlugAvailability: (slug: string) => Promise<void>;
  isSlugAvailable?: boolean;
  isCheckingSlugAvailability: boolean;
};

export const PortfolioSlugContext =
  createContext<PortfolioSlugContextType | null>(null);

export const usePortfolioSlug = () => {
  const context = useContext(PortfolioSlugContext);
  if (!context) {
    throw new Error(
      "usePortfolioSlug must be used within CreateOrUpdatePortfolio",
    );
  }
  return context;
};
