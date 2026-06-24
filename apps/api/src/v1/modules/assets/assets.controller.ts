import { Controller, Get, Param } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public()
  @Get(':slug')
  async getOneBySlug(@Param('slug') slug: string) {
    return this.assetsService.getOneBySlug(slug);
  }
}
