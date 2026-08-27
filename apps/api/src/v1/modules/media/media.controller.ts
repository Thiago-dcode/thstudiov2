import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateMediaRequest } from './requests/create-media.request';
import { UpdateMediaRequest } from './requests/update-media.request';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsResourceBlockedPipe } from 'src/pipes/is-resource-blocked.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { imageUploadOptions } from 'src/common/utils/upload-options';
import { IndexMediaRequest } from '../user-media/requests/index-media.request';

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

  @Post()
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async create(
    @Body() createMediaRequest: CreateMediaRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    createMediaRequest.media = file;
    return await this.mediaService.create(createMediaRequest);
  }
  @Post('async')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async createAsync(
    @Body() createMediaRequest: CreateMediaRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    createMediaRequest.media = file;
    return await this.mediaService.createAsync(createMediaRequest);
  }
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('media')) id: number,
    @Body() updateMediaRequest: UpdateMediaRequest,
  ) {
    return await this.mediaService.update(id, updateMediaRequest);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.mediaService.delete(id);
    return { message: 'Media deleted successfully' };
  }
}
