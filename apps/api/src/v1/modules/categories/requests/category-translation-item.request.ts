import { IsNotEmpty, IsString } from 'class-validator';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class CategoryTranslationItem {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsAvailableEnum('LANGUAGE_CODE')
  language_code: string;
}
