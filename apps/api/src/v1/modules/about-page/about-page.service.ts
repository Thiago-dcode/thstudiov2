import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { AiService } from '../ai/ai.service';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { RequestService } from 'src/common/services/request.service';
import { UPDATE_PROFILE_STATUS_EVENT } from '@repo/common-lib/constants/events';
import { UpdateProfileStatusEvent } from '../profile-status/events/update-profile-status.event';

@Injectable()
export class AboutPageService {
  constructor(
    private readonly aboutPageRepository: AboutPageRepositoy,
    private readonly userService: UserService,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
    private readonly requestService: RequestService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async findOneByUser(id: number) {
    const result = await this.aboutPageRepository.getFirstByUser(id);
    if (result && result.photo) {
      result.photo = await this.helpers.getAsset(result.photo);
    }
    return result;
  }

  public async create({ photo, ...rest }: CreateAboutPageRequest) {
    // Never trust client-supplied user_id — always bind to the authenticated caller.
    const userId = this.requestService.user.id;
    const data: CreateAboutPageInput = { ...rest, user_id: userId };
    if (photo) {
      const [user_public_id, id] = await Promise.all([
        this.userService.getPublicId(userId),
        generateUUID(),
      ]);
      const photoPath = `users/${user_public_id}/about_page/${id}`;
      await this.helpers.setAsset({
        asset: photo,
        path: photoPath,
        targetSizeMb: 0.5,
        targetQuality: 90,
      });
      const photoUrl = await this.helpers.getAsset(photoPath);
      const { moderation } = await this.aiService.moderateContent(photoUrl, {
        user_id: userId,
      });
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(photoPath);
        throw new MediaModerationException(moderation.reason);
      }
      data.photo = photoPath;
    }
    const aboutPage = await this.aboutPageRepository.create(data);
    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(userId, { has_about_page: true }),
    );
    return aboutPage;
  }

  public async update(id: number, { photo, ...rest }: UpdateAboutPageRequest) {
    const data: UpdateAboutPageInput = rest;
    const aboutPage = await this.aboutPageRepository.getOneById(id);
    if (aboutPage.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }
    if (photo) {
      const newId = await generateUUID();
      const newPhotoPath = await this.helpers.setAsset({
        asset: photo,
        path: `users/${aboutPage.user_id}/about_page/${newId}`,
        targetSizeMb: 0.5,
        targetQuality: 90,
      });
      const photoUrl = await this.helpers.getAsset(newPhotoPath);
      const { moderation } = await this.aiService.moderateContent(photoUrl, {
        user_id: aboutPage.user_id,
      });
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(newPhotoPath);
        throw new MediaModerationException(moderation.reason);
      }
      // Only delete the old photo after the new one passes moderation
      if (aboutPage.photo) {
        await this.helpers.deleteAsset(aboutPage.photo);
      }
      data.photo = newPhotoPath;
    }
    return await this.aboutPageRepository.updateAndGet(id, data);
  }
}
