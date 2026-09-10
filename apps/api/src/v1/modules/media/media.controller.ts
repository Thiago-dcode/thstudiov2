import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { IsResourceBlockedPipe } from 'src/pipes/is-resource-blocked.pipe';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IndexMediaRequest } from '../user-media/requests/index-media.request';
import { MediaService } from './media.service';
import { CreateMediaAsyncRequest } from './requests/create-media-async.request';
import { CreateMediaUploadUrlRequest } from './requests/create-media-upload-url.request';
import { UpdateMediaRequest } from './requests/update-media.request';

@Throttle({
  short: { limit: 50, ttl: 1000 },
  medium: { limit: 100, ttl: 10000 },
  long: { limit: 300, ttl: 60000 }
})
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Public()
  @Get()
  async findAll(@Query() query: IndexMediaRequest) {
    return await this.mediaService.findAll(query);
  }

  @Public()
  @Get(':public_id/metadata')
  async getMediaMetadata(@Param('public_id') public_id: string) {
    return await this.mediaService.getSeoMetadata(public_id);
  }

  @Public()
  @Get(':public_id')
  async getOneByPublicId(@Param('public_id', new ModelExistPipe('media', 'public_id')) public_id: string) {

    return await this.mediaService.getOneByPublicId(public_id);


  }

  // There is deliberately no multipart `POST /media`, and no file ever reaches this process.
  // That route accepted the upload itself and ran the thumbnail, the moderation call and the
  // FULL compression inline in the request — a 201-frame 1080p GIF is ~12s of libvips on the
  // process serving every other route. It had no callers left once the browser started PUTting
  // to S3 directly, so it was pure exposure.
  //
  // The MIME allowlist that multer's `fileFilter` and `MediaTypeGuard` used to apply lives on
  // the DTOs now: both this body and `upload-url`'s carry `@IsIn(ALLOWED_FILE_TYPES)`.
  @Post('async')
  async createAsync(@Body() createMediaRequest: CreateMediaAsyncRequest) {
    return await this.mediaService.createAsync(createMediaRequest);
  }

  // Issues the presigned PUT the browser uploads directly to, ahead of the `async` call above.
  @Post('upload-url')
  async createUploadUrl(@Body() createUploadUrlRequest: CreateMediaUploadUrlRequest) {
    return await this.mediaService.createUploadUrl(createUploadUrlRequest);
  }
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('media')) id: number,
    @Body() updateMediaRequest: UpdateMediaRequest,
  ) {
    return await this.mediaService.update(id, updateMediaRequest);
  }

  @Patch(':id/async')
  async updateAsync(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('media')) id: number,
    @Body() updateMediaRequest: UpdateMediaRequest,
  ) {
    return await this.mediaService.updateAsync(id, updateMediaRequest);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.mediaService.delete(id);
    return { message: 'Media deleted successfully' };
  }
}
