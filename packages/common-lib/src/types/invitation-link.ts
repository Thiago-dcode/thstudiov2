import { InvitationLinkSchema } from "../schemas/invitation-link";
import { Benefit } from "./benefit";

export type InvitationLink = Omit<InvitationLinkSchema, 'created_at' | 'updated_at'>;

export type FullInvitationLink = InvitationLink & {
  benefit: Benefit;
};


export type PublicCreateInvitationLinkInput = {
  benefit_id:number,
  max_uses?:number,
  active?:boolean,
  expire_at?:Date,

}
export type CreateInvitationLinkInput = Omit<InvitationLinkSchema, 'id' | 'created_at' | 'updated_at' | 'current_uses'>;

export type UpdateInvitationLinkInput = Partial<PublicCreateInvitationLinkInput> & {
  current_uses?:number,
};


