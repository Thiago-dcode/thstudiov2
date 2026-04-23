import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserPortfolioService } from './user-portfolio.service';
import { IndexPortfolioRequest } from './requests/index-portfolio.request';

@Controller('users')
export class UserPortfolioController {
  constructor(private readonly userPortfolioService: UserPortfolioService) { }

  @Public()
  @Get(':username/portfolios/slug-exist/:slug')
  async slugExists(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.slugExists(username,slug);
  }

  // @Public()
  // @Get(':user_id/portfolios/:slug')
  // async getById(
  //   @Param('user_id', ParseIntPipe) userId: number,
  //   @Param('slug') slug: string,
  // ) {
  //   return await this.userPortfolioService.getById(userId, slug);
  // }

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
