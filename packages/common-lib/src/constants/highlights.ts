export const MAX_HIGHLIGHT_PORTFOLIOS = 3 as const;
export const MAX_HIGHLIGHT_COLLECTIONS = 4 as const;
export const MAX_HIGHLIGHT_SERVICES = 4 as const;

export const HIGHLIGHT_LIMITS = {
  portfolios: MAX_HIGHLIGHT_PORTFOLIOS,
  collections: MAX_HIGHLIGHT_COLLECTIONS,
  services: MAX_HIGHLIGHT_SERVICES,
} as const;
