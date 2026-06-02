import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateWaitListRequest } from './requests/create-wait-list.request';
import { InviteWaitListBatchRequest } from './requests/invite-wait-list-batch.request';
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

  @UseGuards(AdminGuard)
  @Post('invite-batch')
  async inviteBatch(@Body() body: InviteWaitListBatchRequest) {
    return this.waitListService.inviteBatch(body.count);
  }
}
