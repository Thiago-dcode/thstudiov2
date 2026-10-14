import { Module } from '@nestjs/common';
import { UserAboutPageController } from './user-about-page.controller';
import { UserAboutPageService } from './user-about-page.service';
import { AboutPageRepositoy } from '../about-page/about-page.repository';
import { UserRepository } from '../users/users.repository';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  // AuthCoreModule: `PublicArtistGuard` resolves the owner's token on hidden accounts.
  imports: [AuthCoreModule],
  controllers: [UserAboutPageController],
  providers: [UserAboutPageService, AboutPageRepositoy, UserRepository],
})
export class UserAboutPageModule {}
