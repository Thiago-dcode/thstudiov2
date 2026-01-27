import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GetMediaSeoRequest } from './requests/get-media-seo.request';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService, private readonly userExtraData: UserExtraDataService) {}

  @Post('media/seo')
  async getMediaSeo(@Body() getMediaSeoRequest: GetMediaSeoRequest) {
    await this.userExtraData.enforceUserLimits(getMediaSeoRequest.user_id,{
      enforceAiCredists:true
    });
    return await this.aiService.getMediaSeo(getMediaSeoRequest);
  }
}

