import { Injectable } from '@nestjs/common';
import { Helpers } from 'src/common/services/helpers.service';
import { AboutPageRepositoy } from './about-page.repository';
import { CreateAboutPageRequest } from './requests/create-about-page.request';
import {
  CreateAboutPageInput,
  UpdateAboutPageInput,
} from '@repo/common-lib/types/about-page';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { UpdateAboutPageRequest } from './requests/update-about-page.request';
import { UserService } from '../users/users.service';

@Injectable()
export class AboutPageService {
  constructor(
    private readonly aboutPageRepository: AboutPageRepositoy,
    private readonly userService: UserService,
    private readonly helpers: Helpers,
  ) {}

  public async findOneByUser(id: number) {
    const result = await this.aboutPageRepository.getFirstByUser(id);
    if (result && result.photo) {
      result.photo = await this.helpers.getAsset(result.photo);
    }
    return result;
  }
  public async create({ photo, ...rest }: CreateAboutPageRequest) {
    const data: CreateAboutPageInput = rest;
    if (photo) {
      const [user_public_id, id] = await Promise.all([
        this.userService.getPublicId(data.user_id),
        generateUUID(),
      ]);
      data.photo = `users/${user_public_id}/about_page/${id}`;
      await this.helpers.setAsset({
        asset: photo,
        path: data.photo!,
        targetSizeMb: 0.5,
        targetQuality: 90,
      });
    }
    return await this.aboutPageRepository.create(data);
  }
  public async update(id: number, { photo, ...rest }: UpdateAboutPageRequest) {
    const data: UpdateAboutPageInput = rest;
    const aboutPage = await this.aboutPageRepository.getOneById(id);
    if (photo) {
      //delete previous
      if (aboutPage.photo) {
        await this.helpers.deleteAsset(aboutPage.photo);
      }
      const id = await generateUUID();
      data.photo = await this.helpers.setAsset({
        asset: photo,
        path: `users/${aboutPage.user_id}/about_page/${id}`,
        targetSizeMb: 0.5,
        targetQuality: 90,
      });
    }
    return await this.aboutPageRepository.updateAndGet(id, data);
  }
}
