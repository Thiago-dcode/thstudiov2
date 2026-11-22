/**
 * True when a visitor may not see the entity: switched off by its owner or blocked by moderation.
 * Shared by the api (visibility rules) and the web (the atelier "View" state).
 */
export const isHiddenFromPublic = (entity: {
  is_active?: boolean | null;
  blocked_at?: Date | string | null;
}): boolean => !entity.is_active || !!entity.blocked_at;
