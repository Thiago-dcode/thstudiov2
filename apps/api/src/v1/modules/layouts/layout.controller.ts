import { Controller, Get, Query } from '@nestjs/common';
import { IndexLayoutsRequest } from './requests/index-layouts.request';
import { LayoutService } from './layout.service';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get()
  findAll(@Query() indexLayoutsRequest: IndexLayoutsRequest) {
    return this.layoutService.findAll(indexLayoutsRequest);
  }
}
