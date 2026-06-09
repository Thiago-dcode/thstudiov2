import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateWaitListRequest } from './requests/create-wait-list.request';
import { InviteWaitListBatchRequest } from './requests/invite-wait-list-batch.request';
import { ValidateWaitListRequest } from './requests/validate-wait-list.request';
import { WaitListService } from './wait-list.service';

@Controller('wait-list')
export class WaitListController {
  constructor(private readonly waitListService: WaitListService) { }

  @Public()
  @Post()
  async create(@Body() body: CreateWaitListRequest) {
    return this.waitListService.create(body);
  }

  @Public()
  @Get('position')
  async getCurrentPosition() {
    return this.waitListService.getCurrentPosition();
  }

  // GET /api/v1/wait-list/invitation/{code} -> { email } for prefilling registration
  @Public()
  @Get('invitation/:code')
  async getEmailByInvitationCode(@Param('code') code: string) {
    if (!code) return null;
    return this.waitListService.getEmailByInvitationCode(code);
  }

  @Public()
  @Post('validate')
  async validate(@Body() body: ValidateWaitListRequest) {
    return this.waitListService.validate(body.token);
  }

  @UseGuards(AdminGuard)
  @Post('invite-batch')
  async inviteBatch(@Body() body: InviteWaitListBatchRequest) {
    return this.waitListService.inviteBatch(body.count);
  }
}
