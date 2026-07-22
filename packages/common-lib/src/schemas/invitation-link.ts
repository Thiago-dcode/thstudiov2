import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== INVITATION LINK BASE SCHEMA ====================
export type InvitationLinkSchema = {
  id: number;
  code: string;
  benefit_id: number;
  email: string | null;
  language: EnumType<'LANGUAGE_CODE'> | null;
  max_uses: number;
  current_uses: number;
  expires_at: Date | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type InvitationLinkSchemaWithoutTimestamps = Omit<InvitationLinkSchema, 'created_at' | 'updated_at'>;

const tablesInvitationLink = [TABLES_ENUM.INVITATION_LINKS] as const;
export type InvitationLinkSchemaColumns = TableColumn<typeof tablesInvitationLink, InvitationLinkSchemaWithoutTimestamps>;

// ==================== INVITATION LINK + BENEFIT JOINED SCHEMA ====================
export type InvitationLinkWithBenefitSchema = InvitationLinkSchemaWithoutTimestamps & {
  b_id: number;
  type: EnumType<'BENEFIT_TYPE'>;
  name: string;
  trial_days: number;
  stripe_coupon_id: string | null;
  b_active: boolean;
};

const tablesInvitationLinkWithBenefit = [TABLES_ENUM.INVITATION_LINKS, TABLES_ENUM.BENEFITS] as const;
export type InvitationLinkWithBenefitSchemaColumns = TableColumn<typeof tablesInvitationLinkWithBenefit, InvitationLinkWithBenefitSchema>;
