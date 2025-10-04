import { Body, Controller, Post } from '@nestjs/common';
import { CreateMediaRequest } from './requests/create-media.request';
import { CreateMediaBulkRequest } from './requests/create-media-bulk.request';

@Controller('media')
export class MediaController {


  @Post('bulk')
  async createBulk(
    @Body()
    createMediaRequest: CreateMediaBulkRequest,
  ) {
    console.log(createMediaRequest);
  }
  @Post()
  async create(
    @Body()
    createMediaRequest: CreateMediaRequest,
  ) {
    console.log(createMediaRequest);
  }
}
