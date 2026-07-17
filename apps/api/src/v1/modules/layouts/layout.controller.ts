import { Controller, Get } from '@nestjs/common';
import { LayoutService } from './layout.service';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get()
  async findAll() {
    return await this.layoutService.findAllActive();
  }
}
