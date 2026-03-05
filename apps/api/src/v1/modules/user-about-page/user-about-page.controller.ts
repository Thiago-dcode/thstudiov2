import { Controller, Param, Get } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UserAboutPageService } from './user-about-page.service';

@Controller('users')
export class UserAboutPageController {
  constructor(private readonly userAboutPageService: UserAboutPageService) {}

  @Public()
  @Get(':username/about-page')
  async getByUsername(@Param('username') username: string) {
    return await this.userAboutPageService.getByUsername(username);
  }
}
