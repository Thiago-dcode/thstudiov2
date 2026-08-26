import { USER_CONTACT_ORDER_BY_COLUMNS } from "../constants/user-contact";
import { UserContactSchema } from "../schemas/user-contact";
import { SqlOrderDirection } from "./database";
import { OffsetPaginationRequest } from "./request";

export type UserContact = UserContactSchema;

export type CreateUserContactInput = Omit<UserContact, 'id' | 'created_at' | 'updated_at'>;

export type UpdateUserContactInput = Partial<CreateUserContactInput>;

export type UserContactOrderBy = (typeof USER_CONTACT_ORDER_BY_COLUMNS)[number];

export type UserContactIndexRequest = OffsetPaginationRequest & {
    /** Matches `contact_name`, `contact_email`, `subject` and `message` (case-insensitive). */
    search?: string;
    contact_email?: string;
    /** ISO date-times; both bounds are inclusive and filter on `created_at`. */
    created_from?: string;
    created_to?: string;
    order_by?: UserContactOrderBy;
    order?: SqlOrderDirection;
};
