import {  IsNumber } from 'class-validator';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class GenerateMediaMetadataRequest {
    @IsNumber()
    @ModelExist('media')
    media_id: number

    // `@IsUserAuth()` was missing here (unlike CreateMediaRequest): `user_id` came
    // straight from the body, so any authenticated user could spend another user's AI
    // credits — and the LLM call fires before the ownership check inside
    // `MediaService.update`, so the platform paid for the OpenAI request regardless.
    @IsNumber()
    @ModelExist('users')
    @IsUserAuth()
    user_id: number
}
