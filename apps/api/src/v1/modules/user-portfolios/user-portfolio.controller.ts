import {
  Controller,
  Get,
  Param,
  ParseIntPipe,

} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserPortfolioService } from './user-portfolio.service';

@Controller('users/portfolios')
export class UserPortfolioController {
  constructor(private readonly userPortfolioService: UserPortfolioService) { }

  @Get('slug-exists/:user_id/:slug')
  async slugExists(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.slugExists(slug, userId);
  }

  @Public()
  @Get('get-by-id/:user_id/:slug')
  async getById(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.getById(userId, slug);
  }
  @Public()
  @Get('get-by-username/:username/:slug')
  async getByUsername(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.getByUsername(username, slug);
  }



}
