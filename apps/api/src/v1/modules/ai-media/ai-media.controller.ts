import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetMediaSeoRequest } from './requests/get-media-seo.request';
import { AiMediaService } from './ai-media.service';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';

@Controller('ai/media')
@UseGuards(AiConsumptionGuard)
export class AiMediaController {
  constructor(private readonly aiMediaService: AiMediaService) {}

  @Post('seo')
  async getMediaSeo(@Body() getMediaSeoRequest: GetMediaSeoRequest) {
    return await this.aiMediaService.getMediaSeo(getMediaSeoRequest);
  }
}

