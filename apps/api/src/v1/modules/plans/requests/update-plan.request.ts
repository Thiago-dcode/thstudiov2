import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanRequest } from './create-plan.request';

export class UpdatePlanRequest extends PartialType(CreatePlanRequest) {}
