import { BaseUser } from "../users.types";

export class NewUserEvent {

  constructor(public readonly user: BaseUser) {}
}
