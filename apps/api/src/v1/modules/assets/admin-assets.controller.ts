import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AssetsService } from './assets.service';
import { CreateAssetRequest } from './requests/create-asset.request';

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
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() createAssetRequest: CreateAssetRequest,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files.find(f => f.fieldname === 'file');
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const thumbnail = files.find(f => f.fieldname === 'thumbnail');

    return this.assetsService.create(file, thumbnail, createAssetRequest);
  }

  @Delete(':slug')
  async delete(@Param('slug') slug: string) {
    await this.assetsService.deleteBySlug(slug);
    return { message: 'Asset deleted successfully' };
  }
}
