import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

export type WaitListSchema = {
  id: number;
  email: string;
  token: string;
  position: number | null;
  status: EnumType<'WAIT_LIST_STATUS'>;
  redeemed_at: Date | null;
  expires_at: Date | null;
  validated_at: Date | null;
  invitation_link_id: number | null;
  invitation_email_sent_at: Date | null;
  welcome_email_sent_at: Date | null;
  last_reminder_email_sent_at: Date | null;
  reminder_count: number;
  language: EnumType<'LANGUAGE_CODE'>;
  created_at: Date;
  updated_at: Date;
};

export type WaitListSchemaWithoutTimestamps = Omit<WaitListSchema, 'created_at' | 'updated_at'>;

const tablesWaitList = [TABLES_ENUM.WAIT_LIST] as const;
export type WaitListSchemaColumns = TableColumn<typeof tablesWaitList, WaitListSchemaWithoutTimestamps>;
