import { Injectable } from '@nestjs/common';
import { Helpers } from 'src/common/services/helpers.service';
import { AboutPageRepositoy } from '../about-page/about-page.repository';
import { UserRepository } from '../users/users.repository';
import { AboutPage } from '@repo/common-lib/types/about-page';

@Injectable()
export class UserAboutPageService {
  constructor(
    private readonly aboutPageRepository: AboutPageRepositoy,
    private readonly userRepository: UserRepository,
    private readonly helpers: Helpers,
  ) {}

  async getByUsername(username: string): Promise<AboutPage | null> {
    const profile = await this.userRepository.getUserProfile(username);
    if (!profile) return null;

    const aboutPage = await this.aboutPageRepository.getFirstByUser(profile.id);
    if (!aboutPage) return null;

    if (aboutPage.photo) {
      aboutPage.photo = await this.helpers.getAsset(aboutPage.photo);
    }

    return aboutPage;
  }
}
