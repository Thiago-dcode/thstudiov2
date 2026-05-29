import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateWaitListRequest } from './requests/create-wait-list.request';
import { WaitListService } from './wait-list.service';

@Controller('wait-list')
export class WaitListController {
  constructor(private readonly waitListService: WaitListService) { }

  @Public()
  @Post()
  async create(@Body() body: CreateWaitListRequest) {
    return this.waitListService.create(body);
  }
}
