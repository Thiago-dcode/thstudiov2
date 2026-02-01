import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressRequest } from './create-address.request';

export class UpdateAddressRequest extends PartialType(CreateAddressRequest) {}

