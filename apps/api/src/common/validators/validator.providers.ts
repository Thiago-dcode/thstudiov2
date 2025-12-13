import { ModelExistValidator } from './model-exist.validtor';
import { ModelNotExistValidator } from './model-not-exist.validtor';
import { IsEnumValidator } from './is-enum.validator';
import { ModelArrayExistValidator } from './model-array-exist.validtor';

export const ValidatorProviders = [ModelExistValidator, ModelNotExistValidator, IsEnumValidator, ModelArrayExistValidator];
