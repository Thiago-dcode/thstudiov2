import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServiceService } from './service.service';
import { CreateServiceRequest } from './requests/create-service.request';
import { UpdateServiceRequest } from './requests/update-service.request';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() createServiceRequest: CreateServiceRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    createServiceRequest.thumbnail = thumbnail;
    return await this.serviceService.create(createServiceRequest);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceRequest: UpdateServiceRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    updateServiceRequest.thumbnail = thumbnail;
    return await this.serviceService.update(id, updateServiceRequest);
  }
}
