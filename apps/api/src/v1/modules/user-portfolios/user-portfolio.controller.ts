import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';
import { Public } from 'src/common/decorators/public.decorator';
import { UserPortfolioService } from './user-portfolio.service';
import { IndexPortfolioRequest } from './requests/index-portfolio.request';

// Class-level, unlike `UserController`: every route here is a public artist read,
// so there are no account endpoints that need to stay on the stricter global
// defaults. These are hit once per artist sub-page render and the responses are
// Redis-cached, so the global write-sized budget throttled real visitors.
@Throttle(PUBLIC_READ_THROTTLE)
@Controller('users')
export class UserPortfolioController {
  constructor(private readonly userPortfolioService: UserPortfolioService) { }

  // @Public()
  // @Get(':user_id/portfolios/:slug')
  // async getById(
  //   @Param('user_id', ParseIntPipe) userId: number,
  //   @Param('slug') slug: string,
  // ) {
  //   return await this.userPortfolioService.getById(userId, slug);
  // }

  @Public()
  @Get(':username/portfolios/:slug/metadata')
  async getPortfolioMetadata(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.getSeoMetadata(username, slug);
  }

  @Public()
  @Get(':username/portfolios/:slug')
  async getByUsername(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.getByUsername(username, slug);
  }

  @Public()
  @Get(':username/portfolios')
  async getAllByUsername(
    @Param('username') username: string,
    @Query() query: IndexPortfolioRequest,
  ) {
    return await this.userPortfolioService.getAllByUsername(username, query);
  }
}
