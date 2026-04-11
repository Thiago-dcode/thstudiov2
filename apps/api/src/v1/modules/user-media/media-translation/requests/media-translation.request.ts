import { IsNotEmpty, IsString } from 'class-validator';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class MediaTranslationRequest {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsAvailableEnum('LANGUAGE_CODE')
  language_code: string;
}
