import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicArtistGuard } from 'src/common/guards/public-artist.guard';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';
import { Public } from 'src/common/decorators/public.decorator';
import { UserServiceService } from './user-service.service';
import { IndexUserServiceRequest } from './requests/index-service.request';

// Class-level, unlike `UserController`: every route here is a public artist read,
// so there are no account endpoints that need to stay on the stricter global
// defaults. These are hit once per artist sub-page render and the responses are
// Redis-cached, so the global write-sized budget throttled real visitors.
@Throttle(PUBLIC_READ_THROTTLE)
// 404s every `:username` route of a hidden (banned, deactivated, pending-deletion) artist.
@UseGuards(PublicArtistGuard)
@Controller('users')
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @Public()
  @Get(':user_id/service/:slug')
  async getById(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userServiceService.getById(userId, slug);
  }

  @Public()
  @Get(':username/services/:slug/metadata')
  async getServiceMetadata(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userServiceService.getSeoMetadata(username, slug);
  }

  @Public()
  @Get(':username/services/:slug')
  async getByUsername(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userServiceService.getByUsername(username, slug);
  }

  @Public()
  @Get(':username/services')
  async getAllByUsername(
    @Param('username') username: string,
    @Query() query: IndexUserServiceRequest,
  ) {
    return await this.userServiceService.getAllByUsername(username, query);
  }
}
