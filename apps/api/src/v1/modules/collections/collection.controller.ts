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
import { IsResourceBlockedPipe } from 'src/pipes/is-resource-blocked.pipe';
import { SortModulesRequest } from 'src/common/requests/sort-modules.request';
import { UpdateModuleStatusRequest } from 'src/common/requests/update-module-status.request';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) { }

  @Public()
  @Get()
  async findAll(@Query() indexCollectionRequest: IndexCollectionRequest) {
    return await this.collectionService.findAll(indexCollectionRequest);
  }

  @Get('highlight-count')
  async countHighlights() {
    return await this.collectionService.countHighlights();
  }

  @Post()
  async create(@Body() createCollectionRequest: CreateCollectionRequest) {
    return await this.collectionService.create(createCollectionRequest);
  }

  // Declared above `:id` so 'sort' is never parsed as a collection id. Owners may reorder blocked
  // collections (they still appear in their list), so there is no blocked pipe here.
  @Patch('sort')
  async sort(@Body() request: SortModulesRequest) {
    return await this.collectionService.updatePositions(request);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('collections')) id: number,
    @Body() request: UpdateModuleStatusRequest,
  ) {
    return await this.collectionService.updateStatus(id, request);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('collections')) id: number,
    @Body() updateCollectionRequest: UpdateCollectionRequest,
  ) {
    return await this.collectionService.update(id, updateCollectionRequest);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.collectionService.delete(id);
  }
}
