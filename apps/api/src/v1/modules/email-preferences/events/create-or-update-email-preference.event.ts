export type CreateOrUpdateEmailPreferencePayload = {
  email: string;
  user_id?: number;
  transactional?: boolean;
  marketing?: boolean;
  notifications?: boolean;
  waitlist_updates?: boolean;
};

export class CreateOrUpdateEmailPreferenceEvent {
  constructor(public readonly payload: CreateOrUpdateEmailPreferencePayload) {}
}
