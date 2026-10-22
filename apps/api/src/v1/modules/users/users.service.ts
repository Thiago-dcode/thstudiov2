import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { CreateUserImageUploadUrlRequest } from './requests/create-user-image-upload-url.request';
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
  ACCOUNT_DELETION_GRACE_DAYS,
  ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_PASSWORD_RESET,
  MAX_USERNAME_RESET,
} from '@repo/common-lib/constants/limits';
import {
  CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
  NEW_USER_EVENT,
  SET_FREE_SUBSCRIPTION_EVENT,
  SET_INITIAL_USER_EXTRA_DATA_EVENT,
  UPDATE_PROFILE_STATUS_EVENT,
} from '@repo/common-lib/constants/events';
import {
  CACHE_KEY_USER_CATEGORIES,
  CACHE_KEY_USER_PUBLIC_ID,
  CACHE_KEY_USERNAME_EXISTS,
} from '@repo/common-lib/constants/cache';
import { FindUserRequest } from './requests/find-user.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateUserPasswordRequest } from './requests/update-user-password.request';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { AiService } from '@repo/backend-lib/services/ai-service';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { descriptiveFilename, versionedAssetPath } from 'src/common/utils/asset-path.util';
import { ArtistCard, PublicCompactUser, UpdateUserInput, UserAccountStatus } from '@repo/common-lib/types/user';
import { EnumType } from '@repo/common-lib/constants/enums';
import { addMonths } from 'date-fns';
import { IndexArtistsRequest } from './requests/index-artists.request';
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from '@repo/backend-lib/utils';
import { ProfileStatusService } from '../profile-status/profile-status.service';
import { UpdateProfileStatusEvent } from '../profile-status/events/update-profile-status.event';
import { CancelSubscriptionRenewalEvent } from '../plan-subscriptions/events/cancel-subscription-renewal.event';
import { RequestAccountDeletionRequest } from './requests/request-account-deletion.request';
import { accountDeletionDate } from '@repo/common-lib/utils/account-deletion';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { TempUploadService } from 'src/common/services/temp-upload.service';

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
    private readonly profileStatusService: ProfileStatusService,
    private readonly userSessionsService: UserSessionsService,
    private readonly tempUploads: TempUploadService,
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
      deletion_requested_at,
      deletion_warning_sent_at,
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
      // Which promotion or invitation an account signed up through: the owner's business only.
      benefit_id,
      invitation_link_id,
      ...rest
    } = user;
    return rest as T;
  }

  async findOne(id: number, findUserRequest?: FindUserRequest) {
    // Anyone signed in may read another user's (non-private) fields, but a hidden account —
    // banned, deactivated or pending deletion — is as invisible here as on its public pages.
    // The owner (the atelier reads itself through this route) and admins still see it.
    const caller = this.requestService.user;
    if (caller?.id !== id && caller?.role?.name !== 'ADMIN' && !(await this.isPublicAccount(id))) {
      throw new NotFoundException('User not found');
    }

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

  /** Public route: project to the public fields, the compact row also carries the email. */
  async getCompactedByUsername(username: string): Promise<PublicCompactUser> {
    const { id, username: compactUsername, name, surname } =
      await this.userRepository.findByUsernameCompact(username);
    return { id, username: compactUsername, name, surname };
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

  /** Presigned PUT for an avatar or banner; the browser then sends the upload id to `update`. */
  async createImageUploadUrl(id: number, { size }: CreateUserImageUploadUrlRequest) {
    // `IsUserAuthPipe` proved ownership; this also excludes banned users, like media's.
    const publicIdRow = await this.getPublicId(id);
    if (!publicIdRow) {
      throw new UnauthorizedException();
    }
    return await this.tempUploads.createUploadUrl(publicIdRow.public_id, size);
  }

  /**
   * Claims a presigned avatar/banner upload, re-encodes it to WebP, moderates it, and only then
   * stores it. A rejected or unmoderatable image throws before anything is written, leaving the
   * user's current one untouched and no orphan object behind.
   */
  private async storeProfileImage({
    user,
    uploadId,
    kind,
    nameParts,
    targetSizeMb,
  }: {
    user: { id: number; public_id: string };
    uploadId: string;
    kind: 'avatar' | 'banner';
    nameParts: (string | null | undefined)[];
    targetSizeMb: number;
  }): Promise<string> {
    const buffer = await this.tempUploads.read(
      user.public_id,
      uploadId,
      MAX_IMAGE_UPLOAD_BYTES,
    );
    let optimized: Buffer;
    try {
      optimized = await this.helpers.optimizeImage({ asset: buffer, targetSizeMb });
    } catch {
      // Sharp failing to decode is how bytes that are not an image surface here: the presigned
      // PUT accepts any body, whatever `content_type` the client declared.
      throw new BadRequestException('Uploaded file is not a valid image');
    }
    // Inline, not a CDN URL: the provider had to download a just-written key, always a CDN cache
    // miss, and timed out on it ("Unable to download content from the provided URL"). The bytes
    // are already in hand and bounded (0.3MB avatar / 1MB banner after re-encoding).
    const { moderation } = await this.aiService.moderateContent(
      `data:image/webp;base64,${optimized.toString('base64')}`,
      { user_id: user.id },
    );
    if (!moderation.is_allowed) {
      throw new MediaModerationException(moderation.reason);
    }
    // Versioned per upload: the CDN serves a stable unsigned URL per key, so reusing
    // `users/<id>/avatar` left every cache showing the previous avatar after a change.
    return await this.helpers.writeAsset(
      optimized,
      versionedAssetPath(
        `users/${user.public_id}/${descriptiveFilename(nameParts, kind)}`,
      ),
    );
  }

  async update(
    id: number,
    { avatar_upload_id, banner_upload_id, categories, remove_banner, ...rest }: UpdateUserRequest,
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException('User not found', 422);
    }
    if (user.id !== this.requestService.user.id) {
      throw new HttpException('Unauthorized', 403);
    }
    const userUpdateData: UpdateUserInput = rest;
    const nameParts = [
      rest.name ?? user.name,
      rest.surname ?? user.surname,
      rest.profession ?? user.profession,
    ];

    let avatarPath: string | undefined;
    if (avatar_upload_id) {
      avatarPath = await this.storeProfileImage({
        user,
        uploadId: avatar_upload_id,
        kind: 'avatar',
        nameParts,
        targetSizeMb: 0.3,
      });
      // Only once the replacement is accepted — a rejected upload must leave the old one in place.
      if (user.avatar) {
        await this.helpers.deleteAsset(user.avatar);
      }
    }

    // New banner, or explicit removal
    let bannerPath: string | null | undefined;
    if (banner_upload_id) {
      bannerPath = await this.storeProfileImage({
        user,
        uploadId: banner_upload_id,
        kind: 'banner',
        nameParts,
        targetSizeMb: 1,
      });
      if (user.banner) {
        await this.helpers.deleteAsset(user.banner);
      }
    } else if (remove_banner) {
      if (user.banner) {
        await this.helpers.deleteAsset(user.banner);
      }
      bannerPath = null;
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

    const mergedName =
      userUpdateData.name !== undefined ? userUpdateData.name : user.name;
    const mergedSurname =
      userUpdateData.surname !== undefined ? userUpdateData.surname : user.surname;
    const mergedProfession =
      userUpdateData.profession !== undefined
        ? userUpdateData.profession
        : user.profession;
    const hasAvatar = Boolean(
      avatarPath || (userUpdateData.avatar !== undefined ? userUpdateData.avatar : user.avatar),
    );

    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(user.id, {
        has_full_name_field: Boolean(
          typeof mergedName === 'string' &&
            mergedName.trim() &&
            typeof mergedSurname === 'string' &&
            mergedSurname.trim(),
        ),
        has_profession_field: Boolean(
          typeof mergedProfession === 'string' && mergedProfession.trim(),
        ),
        has_avatar_field: hasAvatar,
        ...(editCategories
          ? { has_categories: categories.length > 0 }
          : {}),
      }),
    );

    const shouldGenerateMetadata =user.name !=userUpdateData.name || user.surname != userUpdateData.surname || user.profession != userUpdateData.profession || user.short_biography != userUpdateData.profession;

    if(shouldGenerateMetadata){
      await QueueHelper.createGenerateSingleEntityMetadataJob(
        { entity: 'user', id: user.id, user_id: user.id },
        { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
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

    const updatedUser = await this.userRepository.updateById(user.id, {
      password: await hash(request.new_password),
      password_reset_count: effectiveCount + 1,
      next_password_reset: (!user.next_password_reset || periodExpired) ? addMonths(new Date(), 1) : user.next_password_reset,
    });
    // Sign out every other session; the caller keeps the one they changed it from.
    await this.userSessionsService.expireAllForUser(user.id, this.requestService.user.token);
    return updatedUser;
  }
  async banUser(userId: number, reason: string) {
    const bannedUser = await this.userRepository.updateById(userId, {
      banned: true,
      banned_reason: reason,
    });
    // resolveUserAuth does not read `banned`, so live sessions must be ended here.
    await this.userSessionsService.expireAllForUser(userId);
    return bannedUser;
  }

  /**
   * Flags the account for deletion. It is hidden from every public surface right away (see
   * `visibleAccountSql`) and hard-deleted by `AccountDeletionTask` after the grace period, unless the
   * owner reopens it first. Password re-entry is required: a stolen session must not be able to
   * schedule this.
   */
  async requestDeletion(userId: number, request: RequestAccountDeletionRequest) {
    const user = await this.userRepository.findOneByWithSecrets('id', userId);
    if (!user) throw new UnauthorizedException();
    if (user.deletion_requested_at) {
      throw new ConflictException('Account deletion was already requested');
    }
    if (!(await compare(request.password, user.password))) {
      throw new BadRequestException('Wrong password');
    }

    // Before flagging: if the provider call fails, nothing has changed and the user can retry.
    if (request.cancel_subscription) {
      await this.eventEmitter.emitAsync(
        CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
        new CancelSubscriptionRenewalEvent(userId),
      );
    }

    // Atomic: a concurrent second request finds the flag already set and gets the 409.
    const requestedAt = await this.userRepository.flagForDeletion(userId);
    if (!requestedAt) {
      throw new ConflictException('Account deletion was already requested');
    }
    this.logService
      .name('account-deletion')
      .info(`user [${userId}] requested account deletion`, {
        cancel_subscription: Boolean(request.cancel_subscription),
      });

    return {
      deletion_requested_at: requestedAt,
      deletion_scheduled_for: accountDeletionDate(requestedAt),
    };
  }

  /**
   * Reopens an account flagged for deletion; it becomes public again immediately. Only possible
   * before the deletion date: from then on the account belongs to the deletion job, and letting a
   * reopen race it could leave a "reopened" account whose files were already wiped.
   */
  async cancelDeletion(userId: number) {
    if (await this.userRepository.unflagDeletion(userId, ACCOUNT_DELETION_GRACE_DAYS)) {
      this.logService.name('account-deletion').info(`user [${userId}] reopened the account`);
      return { deletion_requested_at: null };
    }
    const state = await this.userRepository.getDeletionState(
      userId,
      ACCOUNT_DELETION_GRACE_DAYS,
      ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
    );
    throw new ConflictException(
      state?.flagged
        ? 'Account deletion is already in progress and can no longer be cancelled'
        : 'Account deletion was not requested',
    );
  }

  async getAccountStatus(userId: number): Promise<UserAccountStatus> {
    return await this.userRepository.getAccountStatus(userId);
  }

  /** Whether the account may appear publicly (not banned, deactivated or pending deletion). */
  async isPublicAccount(userId: number): Promise<boolean> {
    return await this.userRepository.isPublicAccount(userId);
  }

  /** Hides the account from the public without deleting anything; the atelier keeps working. */
  async deactivate(userId: number) {
    if (!(await this.userRepository.setActive(userId, false))) {
      throw new ConflictException('Account is already deactivated');
    }
    return { is_active: false };
  }

  async reactivate(userId: number) {
    if (!(await this.userRepository.setActive(userId, true))) {
      throw new ConflictException('Account is already active');
    }
    return { is_active: true };
  }

  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    try {
      // Priority: enqueue email preference upsert immediately
      await QueueHelper.createOrUpdateEmailPreferenceJob({
        email: event.user.email,
        user_id: event.user.id,
      });

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
      await this.profileStatusService.create({ user_id: event.user.id });
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
