import { ModelExist } from "src/common/validators/model-exist.validtor";
import { MediaTranslationRequest } from "./media-translation.request";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateMediaTranslationRequest  extends MediaTranslationRequest{

  @IsNotEmpty()
  @ModelExist('media')
  @IsNumber()
  @IsPositive()
  media_id: number;

}
