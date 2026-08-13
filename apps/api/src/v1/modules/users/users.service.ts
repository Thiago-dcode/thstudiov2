import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { cleanObj } from '@repo/common-lib/utils/object';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { SetFreeSubscriptionEvent } from '../plan-subscriptions/events/set-free-subscription.event';
import { SetInitialUserExtraDataEvent } from '../user-extra-data/events/set-initial-user-extra-data.event';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { RequestService } from 'src/common/services/request.service';
import {
  CACHE_KEY_USER_CATEGORIES,
  CACHE_KEY_USER_PUBLIC_ID,
  CACHE_KEY_USERNAME_EXISTS,
  MAX_PASSWORD_RESET,
  MAX_USERNAME_RESET,
  NEW_USER_EVENT,
  CREATE_OR_UPDATE_EMAIL_PREFERENCE,
  SET_FREE_SUBSCRIPTION_EVENT,
  SET_INITIAL_USER_EXTRA_DATA_EVENT,
  GENERATE_SINGLE_ENTITY_METADATA_EVENT,
} from '@repo/common-lib/constants/constants';
import { FindUserRequest } from './requests/find-user.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateUserPasswordRequest } from './requests/update-user-password.request';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { AiService } from '../ai/ai.service';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { ArtistCard, UpdateUserInput } from '@repo/common-lib/types/user';
import { EnumType } from '@repo/common-lib/constants/enums';
import { addMonths } from 'date-fns';
import { IndexArtistsRequest } from './requests/index-artists.request';
import { CreateOrUpdateEmailPreferenceEvent } from '../email-preferences/events/create-or-update-email-preference.event';
import { GenerateSingleEntityMetadataEvent } from '../ai/events/generate-single-entity-metadata.event';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly helpers: Helpers,
    private readonly requestService: RequestService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly aiService: AiService,
  ) { }

  /** No-op when `language` already matches; safe to call on every authenticated request. */
  async updateLanguageIfChanged(id: number, language: EnumType<'LANGUAGE_CODE'>): Promise<void> {
    await this.userRepository.updateLanguageIfChanged(id, language);
  }

  async findAll(filters: IndexArtistsRequest): Promise<ArtistCard[]> {
    const artists = await this.userRepository.findAllArtists(filters);
    await Promise.all(
      artists.map(async (artist) => {
        if (artist.avatar) {
          artist.avatar = await this.helpers.getAsset(artist.avatar);
        }
      }),
    );
    return artists;
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
  /**
   * Fields only the account owner should see when fetching a user by numeric id.
   *
   * `GET /users/:id` is authenticated but not owner-restricted, so any logged-in user
   * can request any id. Previously only `email`/`banned`/`banned_reason` were stripped,
   * which left billing identifiers, account-recovery counters and the 2FA flag readable
   * for every account by simple id enumeration. Anything not needed to render another
   * user's public-facing profile is removed here.
   */
  private omitPrivateFields<T extends Record<string, any>>(
    user: T,
    id: number,
  ): T {
    if (this.requestService.user?.id === id) {
      return user;
    }
    const {
      email,
      banned,
      banned_reason,
      stripe_customer_id,
      phone_number,
      email_validated,
      twofa_enabled,
      twofa_expires_at,
      funnel_step,
      username_reset_count,
      password_reset_count,
      next_username_reset,
      next_password_reset,
      role_id,
      ...rest
    } = user;
    return rest as T;
  }

  async findOne(id: number, findUserRequest?: FindUserRequest) {
    if (findUserRequest?.format === 'COMPACT') {
      const result = await this.userRepository.findOneBy('id', id);
      return this.omitPrivateFields(result, id);
    }
    const result = await this.userRepository.findById(id);
    if (result?.avatar) {
      result.avatar = await this.helpers.getAsset(result.avatar);
    }
    if (result?.banner) {
      result.banner = await this.helpers.getAsset(result.banner);
    }
    return this.omitPrivateFields(result, id);
  }


  async getProfileByUsername(username: string) {
    const result = await this.userRepository.getUserProfile(username);
    if (!result) return null;
    if (result.avatar) {
      result.avatar = await this.helpers.getAsset(result.avatar);
    }
    if (result.banner) {
      result.banner = await this.helpers.getAsset(result.banner);
    }
    return result;
  }

  async getCompactedByUsername(username: string) {
    return await this.userRepository.findByUsernameCompact(username);
  }

  async getCompactedById(id: number) {
    return await this.userRepository.findByIdCompact(id);
  }

  async usernameExists(username: string): Promise<boolean> {
    return await this.helpers.cacheRemember(
      CACHE_KEY_USERNAME_EXISTS(username),
      this.userRepository.usernameExists(username),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24 * 7,
      },
    );
  }

  async findOneCompacted(id: number) {
    return await this.userRepository.findByIdCompact(id);
  }

  async findOneByStripeId(id: string) {
    return await this.userRepository.findOneBy('stripe_customer_id', id);
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
    const userUpdateData: UpdateUserInput = rest;
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
    if (userUpdateData.username && userUpdateData.username !== user.username) {
      const periodExpired = user.next_username_reset && new Date() >= user.next_username_reset;
      const effectiveCount = periodExpired ? 0 : user.username_reset_count;

      if (effectiveCount >= MAX_USERNAME_RESET) {
        throw new BadRequestException(
          `Username change limit reached (${MAX_USERNAME_RESET} per month). Available again on ${user.next_username_reset.toDateString()}.`,
        );
      }

      const usernameTaken = await this.userRepository.usernameExists(userUpdateData.username);
      if (usernameTaken) {
        throw new BadRequestException('Username is already taken');
      }

      await this.helpers.deleteManyCached([
        CACHE_KEY_USERNAME_EXISTS(user.username),
        CACHE_KEY_USERNAME_EXISTS(userUpdateData.username),
      ]);

      userUpdateData.username_reset_count = effectiveCount + 1;
      if (!user.next_username_reset || periodExpired) {
        userUpdateData.next_username_reset = addMonths(new Date(), 1);
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

    const shouldGenerateMetadata =user.name !=userUpdateData.name || user.surname != userUpdateData.surname || user.profession != userUpdateData.profession || user.short_biography != userUpdateData.profession;

    if(shouldGenerateMetadata){
      this.eventEmitter.emit(
        GENERATE_SINGLE_ENTITY_METADATA_EVENT,
        new GenerateSingleEntityMetadataEvent({ entity: 'user',id:user.id,user_id:user.id }),
      );
    }
    return userUpdated;
  }

  async updatePassword(userId: number, request: UpdateUserPasswordRequest) {

    const user = await this.userRepository.findOneByWithSecrets('id', userId);

    if (!user || user.id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    const periodExpired = user.next_password_reset && new Date() >= user.next_password_reset;
    const effectiveCount = periodExpired ? 0 : user.password_reset_count;

    if (effectiveCount >= MAX_PASSWORD_RESET) {
      throw new BadRequestException(
        `Password change limit reached (${MAX_PASSWORD_RESET} per month). Available again on ${user.next_password_reset.toDateString()}.`,
      );
    }

    const passwordMatch = await compare(request.old_password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Wrong password');
    }

    return await this.userRepository.updateById(user.id, {
      password: await hash(request.new_password),
      password_reset_count: effectiveCount + 1,
      next_password_reset: (!user.next_password_reset || periodExpired) ? addMonths(new Date(), 1) : user.next_password_reset,
    });


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
      // Priority: enqueue email preference upsert immediately
      this.eventEmitter.emit(
        CREATE_OR_UPDATE_EMAIL_PREFERENCE,
        new CreateOrUpdateEmailPreferenceEvent({
          email: event.user.email,
          user_id: event.user.id,
        }),
      );

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

      //Handle set free plan via event (avoids circular dependency)
      await this.eventEmitter.emitAsync(
        SET_FREE_SUBSCRIPTION_EVENT,
        new SetFreeSubscriptionEvent(event.user.id),
      );

      //Create a user extra data via event
      await this.eventEmitter.emitAsync(
        SET_INITIAL_USER_EXTRA_DATA_EVENT,
        new SetInitialUserExtraDataEvent(event.user.id),
      );
      //Notify user
      await this.mailService.sendAsync(this.notifyNewUserMail.setUser(event.user, event.user.language), {
        delay: 3 * 60 * 1000
      });
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
