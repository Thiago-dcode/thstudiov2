import { IsNotEmpty, IsString } from 'class-validator';

export class FindInvitationLinkByCodeRequest {
  @IsString()
  @IsNotEmpty()
  code: string;
}

