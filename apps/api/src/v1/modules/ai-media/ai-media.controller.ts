import { Body, Controller, Post } from '@nestjs/common';
import { GetMediaSeoRequest } from './requests/get-media-seo.request';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { AiMediaService } from './ai-media.service';

@Controller('ai/media')
export class AiMediaController {
  constructor(private readonly aiMediaService: AiMediaService, private readonly userExtraData: UserExtraDataService) {}

  @Post('seo')
  async getMediaSeo(@Body() getMediaSeoRequest: GetMediaSeoRequest) {
    await this.userExtraData.enforceUserLimits(getMediaSeoRequest.user_id,{
      enforceAiCredits:true
    });
    return await this.aiMediaService.getMediaSeo(getMediaSeoRequest);
  }
}

