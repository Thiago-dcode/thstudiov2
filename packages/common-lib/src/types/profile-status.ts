import { ProfileStatusSchema } from '../schemas/profile-status';

export type ProfileStatus = Omit<ProfileStatusSchema, 'created_at' | 'updated_at'>;

export type CreateProfileStatusInput = {
  user_id: number;
  has_full_name_field?: boolean;
  has_profession_field?: boolean;
  has_avatar_field?: boolean;
  has_location?: boolean;
  has_categories?: boolean;
  has_portfolio?: boolean;
  has_about_page?: boolean;
};

export type UpdateProfileStatusInput = Partial<
  Omit<ProfileStatus, 'id' | 'user_id'>
>;
