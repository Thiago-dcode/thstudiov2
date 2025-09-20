import { ModelExistValidator } from './model-exist.validtor';
import { ModelNotExistValidator } from './model-not-exist.validtor';

export const ValidatorProviders = [ModelExistValidator, ModelNotExistValidator];
