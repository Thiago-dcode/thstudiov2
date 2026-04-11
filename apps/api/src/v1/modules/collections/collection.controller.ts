import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionRequest } from './requests/create-collection.request';
import { UpdateCollectionRequest } from './requests/update-collection.request';
import { IndexCollectionRequest } from './requests/index-collection.request';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) { }

  @Public()
  @Get()
  async findAll(@Query() indexCollectionRequest: IndexCollectionRequest) {
    return await this.collectionService.findAll(indexCollectionRequest);
  }

  @Post()
  async create(@Body() createCollectionRequest: CreateCollectionRequest) {
    return await this.collectionService.create(createCollectionRequest);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCollectionRequest: UpdateCollectionRequest,
  ) {
    return await this.collectionService.update(id, updateCollectionRequest);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.collectionService.delete(id);
  }
}
