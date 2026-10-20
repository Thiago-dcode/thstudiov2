/**
 * What a visitor may see of a collection, portfolio or service: switched on by its owner and not
 * blocked by moderation. Owners and admins see the rest (see `PublicViewerService.canSeeHidden`).
 */
export const PUBLIC_ENTITY_FILTERS = { is_active: true, blocked: false } as const;

export const isHiddenFromPublic = (entity: {
  is_active?: boolean | null;
  blocked_at?: Date | string | null;
}): boolean => !entity.is_active || !!entity.blocked_at;
