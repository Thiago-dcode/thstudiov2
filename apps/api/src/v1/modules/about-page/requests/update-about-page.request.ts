import { PartialType } from '@nestjs/mapped-types';
import { CreateAboutPageRequest } from './create-about-page.request';

export class UpdateAboutPageRequest extends PartialType(CreateAboutPageRequest) {}
