import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

export type UserContactSchema = {
  id: number;
  contact_name: string;
  contact_email: string;
  user_id: number;
  message: string;
  subject: string;
  created_at: Date;
  updated_at: Date;
};

const tablesUserContact = [TABLES_ENUM.USER_CONTACTS] as const;
export type UserContactSchemaColumns = TableColumn<typeof tablesUserContact, UserContactSchema>;
