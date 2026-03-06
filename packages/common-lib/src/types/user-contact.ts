import { UserContactSchema } from "../schemas/user-contact";

export type UserContact = UserContactSchema;

export type CreateUserContactInput = Omit<UserContact, 'id' | 'created_at' | 'updated_at'>;

export type UpdateUserContactInput = Partial<CreateUserContactInput>;
