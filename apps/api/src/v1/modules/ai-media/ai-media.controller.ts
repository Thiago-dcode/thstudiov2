import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GenerateMediaMetadataRequest } from './requests/generate-media-metadata.request';
import { AiMediaService } from './ai-media.service';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';

@Controller('ai/media')
@UseGuards(AiConsumptionGuard)
export class AiMediaController {
  constructor(private readonly aiMediaService: AiMediaService) {}

  @Post('metadata')
  async generateMediaMetadata(@Body() generateMediaMetadataRequest: GenerateMediaMetadataRequest) {
    return await this.aiMediaService.generateMediaMetadata(generateMediaMetadataRequest);
  }
}
