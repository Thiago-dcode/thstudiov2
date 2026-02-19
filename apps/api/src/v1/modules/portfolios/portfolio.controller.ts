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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioRequest } from './requests/create-portfolio.request';
import { UpdatePortfolioRequest } from './requests/update-portfolio.request';
import { IndexPortfolioRequest } from './requests/index-portfolio.request';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) { }

  @Public()
  @Get()
  async findAll(@Query() indexPortfolioRequest: IndexPortfolioRequest) {
    return await this.portfolioService.findAll(indexPortfolioRequest);
  }

  @Get('slug-exists/:user_id/:slug')
  async slugExists(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.portfolioService.slugExists(slug, userId);
  }

  @Public()
  @Get(':user_id/:slug')
  async getBySlug(
    @Param('user_id', ParseIntPipe) userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.portfolioService.getBySlug(slug, userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() createPortfolioRequest: CreatePortfolioRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    // if(!thumbnail){
    //   throw new BadRequestException('Thumbnail is required');
    // }
    createPortfolioRequest.thumbnail = thumbnail;
    return await this.portfolioService.create(createPortfolioRequest);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePortfolioRequest: UpdatePortfolioRequest,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    updatePortfolioRequest.thumbnail = thumbnail;
    return await this.portfolioService.update(id, updatePortfolioRequest);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.portfolioService.delete(id);
  }
}
