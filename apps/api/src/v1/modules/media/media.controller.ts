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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateMediaRequest } from './requests/create-media.request';
import { UpdateMediaRequest } from './requests/update-media.request';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ParseJsonArrayPipe } from 'src/common/pipes/parse-json-array.pipe';
import { MediaService } from './media.service';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';

@Throttle({
  short: { limit: 50, ttl: 1000 },
  medium: { limit: 100, ttl: 10000 },
  long: { limit: 300, ttl: 60000 }
})
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }
  @Get()
  async findAll() {
    return {
      message: 'Hello World',
    };
  }

  @Get(':public_id')
  async getOneByPublicId(@Param('public_id', new ModelExistPipe('media', 'public_id')) public_id: string) {

    return await this.mediaService.getOneByPublicId(public_id);


  }

  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files'))
  async createBulk(
    @Body('items', new ParseJsonArrayPipe(CreateMediaRequest))
    createMediaItemsRequest: CreateMediaRequest[],
    @UploadedFiles() files: Express.Multer.File[],
  ) {

    if (createMediaItemsRequest.length !== files.length) {
      throw new BadRequestException('Items and files does not match')
    }
    const data = createMediaItemsRequest.map((item, i) => {
      item.media = files[i];
      return item;
    });
    return data;
  }
  @Post()
  @UseInterceptors(FileInterceptor('file'))
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
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
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
