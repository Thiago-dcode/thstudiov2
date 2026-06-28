export const MAX_HIGHLIGHT_PORTFOLIOS = 5 as const;
export const MAX_HIGHLIGHT_COLLECTIONS = 5 as const;
export const MAX_HIGHLIGHT_SERVICES = 5 as const;

export const HIGHLIGHT_LIMITS = {
  portfolios: MAX_HIGHLIGHT_PORTFOLIOS,
  collections: MAX_HIGHLIGHT_COLLECTIONS,
  services: MAX_HIGHLIGHT_SERVICES,
} as const;
