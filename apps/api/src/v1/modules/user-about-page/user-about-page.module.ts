import { Module } from '@nestjs/common';
import { UserAboutPageController } from './user-about-page.controller';
import { UserAboutPageService } from './user-about-page.service';
import { AboutPageRepositoy } from '../about-page/about-page.repository';
import { UserRepository } from '../users/users.repository';

@Module({
  controllers: [UserAboutPageController],
  providers: [UserAboutPageService, AboutPageRepositoy, UserRepository],
})
export class UserAboutPageModule {}
