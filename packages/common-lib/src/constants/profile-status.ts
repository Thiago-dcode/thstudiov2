/**
 * Steps that make up profile completion. When every flag is true the row is
 * closed (`is_closed`), and the setup guide is no longer shown.
 */
export const PROFILE_STATUS_FLAGS = [
  'has_full_name_field',
  'has_profession_field',
  'has_avatar_field',
  'has_location',
  'has_categories',
  'has_media',
  'has_portfolio',
  'has_about_page',
] as const;

export type ProfileStatusFlag = (typeof PROFILE_STATUS_FLAGS)[number];
