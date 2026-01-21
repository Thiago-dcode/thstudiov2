import { Controller, Param, ParseIntPipe, Get } from '@nestjs/common';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { AboutPageService } from '../about-page/about-page.service';

@Controller('users')
export class AboutPageController {
  constructor(private readonly aboutPageService: AboutPageService) {}

  @Public()
  @Get(':id/about-page')
  async findAboutPage(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'))
    id: number,
  ) {
    return await this.aboutPageService.findOneByUser(id);
  }
}
