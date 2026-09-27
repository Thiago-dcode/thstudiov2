import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';
import { Public } from 'src/common/decorators/public.decorator';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { UserCollectionService } from './user-collection.service';
import { IndexCollectionRequest } from '../collections/requests/index-collection.request';

// Class-level, unlike `UserController`: every route here is a public artist read,
// so there are no account endpoints that need to stay on the stricter global
// defaults. These are hit once per artist sub-page render and the responses are
// Redis-cached, so the global write-sized budget throttled real visitors.
@Throttle(PUBLIC_READ_THROTTLE)
@Controller('users')
export class UserCollectionController {
  constructor(private readonly userCollectionService: UserCollectionService) { }

  @Public()
  @Get(':user_id/collection/:slug')
  async getById(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.getById(userId, slug);
  }

  /**
   * The atelier editor's read. Not public: unlike the artist page it includes media the owner
   * switched off, and a save replaces the whole media list — so the editor must see all of it.
   */
  @Get(':user_id/collections/:slug/edit')
  async getForOwner(
    @Param('user_id', ParseIntPipe, IsUserAuthPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.getForOwner(userId, slug);
  }

  @Public()
  @Get(':username/collections/:slug/metadata')
  async getCollectionMetadata(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userCollectionService.getSeoMetadata(username, slug);
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
