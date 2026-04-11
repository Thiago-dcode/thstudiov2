import { PartialType } from '@nestjs/mapped-types';
import { CreateUserExtraDatumDto } from './create-user-extra-datum.dto';

export class UpdateUserExtraDatumDto extends PartialType(CreateUserExtraDatumDto) {}
