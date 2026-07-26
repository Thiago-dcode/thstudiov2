import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserServiceService } from './user-service.service';
import { IndexUserServiceRequest } from './requests/index-service.request';

@Controller('users')
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @Public()
  @Get(':username/service/slug-exist/:slug')
  async slugExists(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userServiceService.slugExists(username, slug);
  }

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
