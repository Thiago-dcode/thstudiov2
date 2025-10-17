
export type BaseUser = {
    id: number;
    email: string;
    username: string;
    email_validated: boolean;
    twofa_enabled: boolean;
    twofa_code?: string;
    twofa_expires_at?: Date;
  };