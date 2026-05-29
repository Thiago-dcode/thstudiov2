import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { IndexWaitListRequest } from '../wait-list/requests/index-wait-list.request';
import { WaitListService } from '../wait-list/wait-list.service';

@Controller('wait-list')
@UseGuards(AdminGuard)
export class AdminWaitListController {
  constructor(private readonly waitListService: WaitListService) { }

  @Get()
  async findAll(@Query() query: IndexWaitListRequest) {
    return this.waitListService.findAll(query);
  }
}
