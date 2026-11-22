import {
  Body,
  Controller,
  Get,
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
import { IMAGE_UPLOAD_OPTIONS } from 'src/common/utils/upload-limits';
import { SortModulesRequest } from 'src/common/requests/sort-modules.request';
import { UpdateModuleStatusRequest } from 'src/common/requests/update-module-status.request';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get('highlight-count')
  async countHighlights() {
    return await this.serviceService.countHighlights();
  }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail', IMAGE_UPLOAD_OPTIONS))
  async create(
    @Body() createServiceRequest: CreateServiceRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    createServiceRequest.thumbnail = thumbnail;
    return await this.serviceService.create(createServiceRequest);
  }

  // Declared above `:id` so 'sort' is never parsed as a service id. Owners may reorder blocked
  // services (they still appear in their list), so there is no blocked pipe here.
  @Patch('sort')
  async sort(@Body() request: SortModulesRequest) {
    return await this.serviceService.updatePositions(request);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('services')) id: number,
    @Body() request: UpdateModuleStatusRequest,
  ) {
    return await this.serviceService.updateStatus(id, request);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail', IMAGE_UPLOAD_OPTIONS))
  async update(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('services')) id: number,
    @Body() updateServiceRequest: UpdateServiceRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    updateServiceRequest.thumbnail = thumbnail;
    return await this.serviceService.update(id, updateServiceRequest);
  }
}
