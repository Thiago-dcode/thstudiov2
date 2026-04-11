import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserCollectionService } from './user-collection.service';
import { IndexCollectionRequest } from '../collections/requests/index-collection.request';

@Controller('users')
export class UserCollectionController {
  constructor(private readonly userCollectionService: UserCollectionService) { }

  @Public()
  @Get(':username/collection/slug-exist/:slug')
  async slugExists(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.slugExists(username, slug);
  }

  @Public()
  @Get(':user_id/collection/:slug')
  async getById(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.getById(userId, slug);
  }

  @Public()
  @Get(':username/collections/:slug')
  async getByUsername(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.getByUsername(username, slug);
  }

  @Public()
  @Get(':username/collections')
  async getAllByUsername(
    @Param('username') username: string,
    @Query() query: IndexCollectionRequest,
  ) {
    return await this.userCollectionService.getAllByUsername(username, query);
  }
}
