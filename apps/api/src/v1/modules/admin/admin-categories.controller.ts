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

@Controller('categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @Body() body: CreateCategoryRequest,
    @UploadedFile() thumbnail: Express.Multer.File | undefined,
  ) {
    body.thumbnail = thumbnail;
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryRequest,
    @UploadedFile() thumbnail: Express.Multer.File | undefined,
  ) {
    body.thumbnail = thumbnail;
    return this.categoriesService.update(id, body);
  }
}
