import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AssetsService } from './assets.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';

@Throttle(PUBLIC_READ_THROTTLE)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public()
  @Get(':slug')
  async getOneBySlug(@Param('slug') slug: string) {
    return this.assetsService.getOneBySlug(slug);
  }
}
