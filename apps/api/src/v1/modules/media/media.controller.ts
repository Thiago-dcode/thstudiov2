import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CreateMediaRequest } from './requests/create-media.request';
import { UpdateMediaRequest } from './requests/update-media.request';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ParseJsonArrayPipe } from 'src/common/pipes/parse-json-array.pipe';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @Get()
  async findAll() {
    return {
      message: 'Hello World',
    };
  }

  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files'))
  async createBulk(
    @Body('items', new ParseJsonArrayPipe(CreateMediaRequest))
    createMediaItemsRequest: CreateMediaRequest[],
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    
    if(createMediaItemsRequest.length !== files.length){
       throw new BadRequestException('Items and files does not match')
    }
    const data = createMediaItemsRequest.map((item,i)=>{
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
    console.log('Raw body received:', updateMediaRequest);
    console.log('Type of updateMediaRequest:', updateMediaRequest.constructor.name);
    return await this.mediaService.update(id, updateMediaRequest);
  }
}
