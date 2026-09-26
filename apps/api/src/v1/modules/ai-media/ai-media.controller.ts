import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AiMediaService } from './ai-media.service';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';
import { IsNumberPipe } from 'src/pipes/is-number.pipe';
import { IsUserOwnerPipe } from 'src/pipes/is-user-owner';
import { GenerateManyMediaMetadataRequest } from './requests/generate-many-media-metadata.request';

@Controller('ai/media')
@UseGuards(AiConsumptionGuard)
export class AiMediaController {
  constructor(private readonly aiMediaService: AiMediaService) { }

  /**
   * One request for many media. Declared before `:id/metadata` so `metadata` is a literal
   * segment rather than a media id.
   */
  @Post('metadata')
  async generateManyMediaMetadata(@Body() body: GenerateManyMediaMetadataRequest) {
    return await this.aiMediaService.generateManyMediaMetadata(body.media);
  }

  @Post(':id/metadata')
  async generateMediaMetadata(
    @Param('id', new IsNumberPipe(), IsUserOwnerPipe('media')) id: number,
  ) {
    return await this.aiMediaService.generateMediaMetadata(id);
  }
}
