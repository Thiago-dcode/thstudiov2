import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanSubscriptionRequest } from './create-plan-subscription.request';

export class UpdatePlanSubscriptionRequest extends PartialType(CreatePlanSubscriptionRequest) {}

