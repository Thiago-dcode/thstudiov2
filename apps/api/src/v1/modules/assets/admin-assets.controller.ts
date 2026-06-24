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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AssetsService } from './assets.service';
import { CreateAssetRequest } from './requests/create-asset.request';
import { UpdateAssetRequest } from './requests/update-asset.request';

@Throttle({
  short: { limit: 50, ttl: 1000 },
  medium: { limit: 100, ttl: 10000 },
  long: { limit: 300, ttl: 60000 },
})
@Controller('assets')
@UseGuards(AdminGuard)
export class AdminAssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get()
  async findAll() {
    return this.assetsService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createAssetRequest: CreateAssetRequest,
    @UploadedFile() file: Express.Multer.File  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    createAssetRequest.asset = file;

    return this.assetsService.create(file, createAssetRequest);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetRequest: UpdateAssetRequest,
  ) {
    return this.assetsService.update(id, updateAssetRequest);
  }

  @Delete(':slug')
  async delete(@Param('slug') slug: string) {
    await this.assetsService.deleteBySlug(slug);
    return { message: 'Asset deleted successfully' };
  }
}
