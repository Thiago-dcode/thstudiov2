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
import { IsResourceBlockedPipe } from 'src/pipes/is-resource-blocked.pipe';

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
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('services')) id: number,
    @Body() updateServiceRequest: UpdateServiceRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    updateServiceRequest.thumbnail = thumbnail;
    return await this.serviceService.update(id, updateServiceRequest);
  }
}
