import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

export type UserOauthProviderSchema = {
  id: number;
  user_id: number;
  provider: EnumType<'OAUTH_PROVIDERS'>;
  provider_user_id: string;
  email: string;
  scopes: string[];
  refresh_token: string | null; // ciphertext at rest
  created_at: Date;
  updated_at: Date;
};

export type UserOauthProviderSchemaWithoutTimestamps = Omit<UserOauthProviderSchema, 'created_at' | 'updated_at'>;

const tablesUserOauthProvider = [TABLES_ENUM.USER_OAUTH_PROVIDERS] as const;
export type UserOauthProviderSchemaColumns = TableColumn<typeof tablesUserOauthProvider, UserOauthProviderSchemaWithoutTimestamps>;
