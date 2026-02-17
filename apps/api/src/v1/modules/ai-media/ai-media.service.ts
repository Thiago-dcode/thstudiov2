import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AddressService } from '../addresses/address.service';
import { MediaService } from '../media/media.service';
import { COUNTRY_TO_LANGUAGES } from '@repo/common-lib/constants/enums';

@Injectable()
export class AiMediaService {
  constructor(
    private readonly aiService: AiService,
    private readonly addressService: AddressService,
    private readonly mediaService: MediaService,
  ) {}

  /** Generate SEO JSON for a media image */
  public async getMediaSeo(request: { media_id: number; user_id: number }) {
    const [imageUrl, userAddress] = await Promise.all([
      this.mediaService.getAsset(request.media_id),
      this.addressService.findOneByUser(request.user_id),
    ]);

    let language = 'English';

    if (userAddress && userAddress.country_code) {
      language = COUNTRY_TO_LANGUAGES[userAddress.country_code.toLowerCase()] || 'English';
    }

    const seoFilds =  await this.aiService.getMediaSeo(imageUrl, language, {
      media_id: request.media_id,
      user_id: request.user_id,
    });

    return this.mediaService.update(request.media_id,seoFilds.seo)
  }
}

