import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { RequestService } from 'src/common/services/request.service';
import {
  CACHE_KEY_USER_CATEGORIES,
  CACHE_KEY_USER_PUBLIC_ID,
  NEW_USER_EVENT,
} from '@repo/common-lib/constants/constants';
import { FindUserRequest } from './requests/find-user.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateUserPasswordRequest } from './requests/update-user-password.request';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { AiService } from '../ai/ai.service';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly planSubscriptionService: PlanSubscriptionsService,
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly helpers: Helpers,
    private readonly requestService: RequestService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly aiService: AiService,
  ) { }

  async findAll() {
    return `This action returns all user`;
  }

  async getPublicId(userId: number) {
    return await this.helpers.cacheRemember(
      CACHE_KEY_USER_PUBLIC_ID(userId),
      this.userRepository.getPublicId(userId),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 48,
      },
    );
  }
  async findOne(id: number, findUserRequest?: FindUserRequest) {
    if (findUserRequest?.format === 'COMPACT') {
      return await this.userRepository.findOneBy('id', id, 'COMPACT');
    }
    const result = await this.userRepository.findById(id);
    if (result?.avatar) {
      result.avatar = await this.helpers.getAsset(result.avatar);
    }
    if (result?.banner) {
      result.banner = await this.helpers.getAsset(result.banner);
    }
    return result;
  }

  async findOneCompacted(id: number) {
    return await this.userRepository.findByIdCompact(id);
  }

  async findOneByStripeId(id: string) {
    return await this.userRepository.findOneBy(
      'stripe_customer_id',
      id,
      'COMPACT',
    );
  }

  async update(
    id: number,
    { avatar, banner, categories, ...rest }: UpdateUserRequest,
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException('User not found', 422);
    }
    if (user.id !== this.requestService.user.id) {
      throw new HttpException('Unauthorized', 403);
    }
    const userUpdateData: Omit<
      UpdateUserRequest,
      'avatar' | 'banner' | 'categories'
    > & {
      avatar?: string;
      banner?: string;
    } = rest;
    // Handle avatar upload with content moderation
    let avatarPath: string | undefined;
    if (avatar && avatar.size > 0) {
      avatarPath = await this.helpers.setAsset({
        asset: avatar,
        path: `users/${user.public_id}/avatar`,
        targetSizeMb: 0.3,
      });
      const avatarUrl = await this.helpers.getAsset(avatarPath);
      const { moderation } = await this.aiService.moderateContent(avatarUrl, {
        user_id: id,
      });
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(avatarPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    // Handle banner upload with content moderation
    let bannerPath: string | undefined;
    if (banner && banner.size > 0) {
      bannerPath = await this.helpers.setAsset({
        asset: banner,
        path: `users/${user.public_id}/banner`,
        targetSizeMb: 1,
      });
      const bannerUrl = await this.helpers.getAsset(bannerPath);
      const { moderation: bannerModeration } = await this.aiService.moderateContent(bannerUrl, {
        user_id: id,
      });
      if (!bannerModeration.is_allowed) {
        await this.helpers.deleteAsset(bannerPath);
        throw new MediaModerationException(bannerModeration.reason);
      }
    }

    userUpdateData.avatar = avatarPath;
    userUpdateData.banner = bannerPath;
    // Remove undefined values
    cleanObj(userUpdateData);

    if (userUpdateData.email) {
      const userExist = await this.userRepository.findOneBy(
        'email',
        userUpdateData.email,
      );
      if (userExist && userExist.id !== user.id) {
        throw new HttpException(`Email not available`, 422);
      }
    }
    const editCategories = categories && categories.length;
    if (editCategories) {
      await this.helpers.deleteCached(CACHE_KEY_USER_CATEGORIES(user.id), {
        appended_language: true,
      });
    }
    const [userUpdated] = await Promise.all([
      this.userRepository.updateById(user.id, userUpdateData),
      editCategories
        ? this.userRepository.attach('user_categories', {
          modelCol: 'user_id',
          modelValue: user.id,
          attachCol: 'category_id',
          valuesToAttach: categories,
          removePrevious: true,
        })
        : Promise.resolve(true),
    ]);
    return userUpdated;
  }

  async updatePassword(userId: number, request: UpdateUserPasswordRequest) {

    const user = await this.userRepository.findOneByColumnWithSecrets('id', userId);

    if (!user || user.id !== this.requestService.user.id) {
      throw new UnauthorizedException()
    }

    const passwordMatch = await compare(request.old_password, user.password);
    if (!passwordMatch) {

      throw new BadRequestException('Wrong password');
    }

    return await this.userRepository.updateById(user.id, {
      password: await hash(request.new_password)
    })


  }
  async banUser(userId: number, reason: string) {
    return await this.userRepository.updateById(userId, {
      banned: true,
      banned_reason: reason,
    });
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }

  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    try {
      //Create stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: event.user.email,
        business_name: event.user.username,
      });
      this.logService
        .name('new-user')
        .info(
          `${NEW_USER_EVENT} user [${event.user.id}] Stripe customer created`,
          stripeCustomer,
        );
      //UPDATE USER
      await this.userRepository.updateById(event.user.id, {
        stripe_customer_id: stripeCustomer.id,
      });

      //Handle set free plan
      const result = await this.planSubscriptionService.setFreeSubscription(
        event.user.id,
      );
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] set free plan`, {
          result,
        });

      //Create a user extra data
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const extraData = await this.userExtraDataRepository.create({
        user_id: event.user.id,
        next_ai_credits_reset: nextMonth,
      });
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] extra data`, {
          extraData,
        });
      //Notify user
      await this.mailService.send(this.notifyNewUserMail.setUser(event.user));
    } catch (error) {
      this.logService
        .name('new-user')
        .error(
          `${NEW_USER_EVENT} user [${event.user.id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }
}
