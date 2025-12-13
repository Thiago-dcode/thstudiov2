import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CreateMediaRequest } from './requests/create-media.request';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('media')
export class MediaController {
  @Get()
  async findAll() {
    return {
      message: 'Hello World',
    };
  }

  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files'))
  async createBulk(
    @Body(new ParseArrayPipe({ items: CreateMediaRequest, separator: ',' }))
    createMediaRequest: CreateMediaRequest[],
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log(createMediaRequest);
    console.log(files);
  }
  @Post()
  async create(
    @Body()
    createMediaRequest: CreateMediaRequest,
  ) {
    console.log(createMediaRequest);
  }
}
