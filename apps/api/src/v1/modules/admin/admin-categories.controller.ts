import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CategoriesService } from '../categories/categories.service';
import { CreateCategoryRequest } from '../categories/requests/create-category.request';
import { UpdateCategoryRequest } from '../categories/requests/update-category.request';
import { IMAGE_UPLOAD_OPTIONS } from 'src/common/utils/upload-limits';

@Controller('categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail', IMAGE_UPLOAD_OPTIONS))
  create(
    @Body() body: CreateCategoryRequest,
    @UploadedFile() thumbnail: Express.Multer.File | undefined,
  ) {
    body.thumbnail = thumbnail;
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail', IMAGE_UPLOAD_OPTIONS))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryRequest,
    @UploadedFile() thumbnail: Express.Multer.File | undefined,
  ) {
    body.thumbnail = thumbnail;
    return this.categoriesService.update(id, body);
  }
}
