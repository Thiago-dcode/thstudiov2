import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPasswordRecoveryAttemptRequest {
 @IsString()
 @IsNotEmpty()
 code: string;
}
