import { Controller, Param, Get, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { PublicArtistGuard } from 'src/common/guards/public-artist.guard';
import { UserAboutPageService } from './user-about-page.service';

// 404s the about page of a hidden (banned, deactivated, pending-deletion) artist.
@UseGuards(PublicArtistGuard)
@Controller('users')
export class UserAboutPageController {
  constructor(private readonly userAboutPageService: UserAboutPageService) {}

  @Public()
  @Get(':username/about-page')
  async getByUsername(@Param('username') username: string) {
    return await this.userAboutPageService.getByUsername(username);
  }
}
