import {  IsNumber } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class GetMediaSeoRequest {
    @IsNumber()
    @ModelExist('media')
    media_id: number

    @IsNumber()
    @ModelExist('users')
    user_id: number
}

