import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserPortfolioService } from './user-portfolio.service';

@Controller('users')
export class UserPortfolioController {
  constructor(private readonly userPortfolioService: UserPortfolioService) { }

  @Public()
  @Get(':username/portfolio/slug-exist/:slug')
  async slugExists(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.slugExists(username,slug);
  }

  @Public()
  @Get(':user_id/portfolio/:slug')
  async getById(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.userPortfolioService.getById(userId, slug);
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
    @Query('is_highlight') isHighlight?: string,
  ) {
    return await this.userPortfolioService.getAllByUsername(username, {
      is_highlight: isHighlight === '1' || isHighlight === 'true' ? true
        : isHighlight === '0' || isHighlight === 'false' ? false
          : undefined,
    });
  }
}
