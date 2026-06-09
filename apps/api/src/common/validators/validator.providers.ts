import { ModelExistValidator } from './model-exist.validtor';
import { ModelNotExistValidator } from './model-not-exist.validtor';
import { IsEnumValidator } from './is-enum.validator';
import { ModelArrayExistValidator } from './model-array-exist.validtor';
import { IsUserAuthValidator } from './is-user-auth.validtor';
import { NotInValidator } from './not-in.validtor';

export const ValidatorProviders = [
  ModelExistValidator,
  ModelNotExistValidator,
  IsEnumValidator,
  ModelArrayExistValidator,
  IsUserAuthValidator,
  NotInValidator,
];
