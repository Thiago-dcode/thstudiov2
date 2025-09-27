import { BaseUser } from "../users/users.types";

export type UserAuth = BaseUser & {
  token: string;
};