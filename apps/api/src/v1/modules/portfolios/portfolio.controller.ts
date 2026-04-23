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
import { IsResourceBlockedPipe } from 'src/pipes/is-resource-blocked.pipe';

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) { }

  @Public()
  @Get()
  async findAll(@Query() indexPortfolioRequest: IndexPortfolioRequest) {
    return await this.portfolioService.findAll(indexPortfolioRequest);
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
    @Param('id', ParseIntPipe, new IsResourceBlockedPipe('portfolios')) id: number,
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
