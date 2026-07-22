import { EnumType } from "../constants/enums";
import { InvitationLinkSchema } from "../schemas/invitation-link";
import { Benefit } from "./benefit";

export type InvitationLink = Omit<InvitationLinkSchema, 'created_at' | 'updated_at'>;

export type FullInvitationLink = InvitationLink & {
  benefit: Benefit;
};


export type PublicCreateInvitationLinkInput = {
  benefit_type: EnumType<'BENEFIT_TYPE'>;
  max_uses?: number;
  active?: boolean;
  days_to_expire?: number;
  email?: string;
  language?: EnumType<'LANGUAGE_CODE'>;
}
export type CreateInvitationLinkInput = Omit<InvitationLinkSchema, 'id' | 'created_at' | 'updated_at' | 'current_uses'>;

export type UpdateInvitationLinkInput = Partial<{
  max_uses: number;
  active: boolean;
  email: string | null;
  language: EnumType<'LANGUAGE_CODE'> | null;
  current_uses: number;
  expires_at: Date | null;
}>;


