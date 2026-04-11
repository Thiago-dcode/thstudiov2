import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserBenefitService } from './user-benefit.service';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';

@Controller('users')
export class UserBenefitController {
  constructor(private readonly userBenefitService: UserBenefitService) { }

  @Get(':user_id/benefits')
  async getByUserId(
    @Param('user_id', ParseIntPipe, IsUserAuthPipe) userId: number,
  ) {
    return this.userBenefitService.getByUserId(userId);
  }
}
