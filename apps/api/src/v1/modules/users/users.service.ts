import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { randomInt } from 'crypto';
import { normalizeUsername } from '@repo/common-lib/utils/username';
import { UpdateUserRequest } from './requests/update-user.request';
import { CreateUserImageUploadUrlRequest } from './requests/create-user-image-upload-url.request';
import { NewUserEvent } from './events/new-user.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { cleanObj } from '@repo/common-lib/utils/object';
import { LogService, maskEmailAddresses } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { SetFreeSubscriptionEvent } from '../plan-subscriptions/events/set-free-subscription.event';
import { SetInitialUserExtraDataEvent } from '../user-extra-data/events/set-initial-user-extra-data.event';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { StripeService } from 'src/common/services/stripe.service';
import { RequestService } from 'src/common/services/request.service';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_PASSWORD_RESET,
  MAX_USERNAME_RESET,
  USERNAME_RESERVATION_DAYS,
} from '@repo/common-lib/constants/limits';
import {
  ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
  CANCEL_ACCOUNT_PAYMENTS_EVENT,
  CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
  NEW_USER_EVENT,
  SET_FREE_SUBSCRIPTION_EVENT,
  SET_INITIAL_USER_EXTRA_DATA_EVENT,
  UPDATE_PROFILE_STATUS_EVENT,
} from '@repo/common-lib/constants/events';
import {
  CACHE_KEY_ACTIVE_SUBSCRIPTION,
  CACHE_KEY_PROFILE_STATUS,
  CACHE_KEY_USER_CATEGORIES,
  CACHE_KEY_USER_EXTRA_DATA,
  CACHE_KEY_USER_PUBLIC_ID,
  CACHE_KEY_USERNAME_EXISTS,
} from '@repo/common-lib/constants/cache';
import { StorageService } from '@repo/backend-lib/services/storage-service';
import { CancelAccountPaymentsEvent } from '../plan-subscriptions/events/cancel-account-payments.event';
import { FindUserRequest } from './requests/find-user.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateUserPasswordRequest } from './requests/update-user-password.request';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { AiService } from '@repo/backend-lib/services/ai-service';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';
import { ApiException } from 'src/common/exceptions/api-exception';
import { descriptiveFilename, versionedAssetPath } from 'src/common/utils/asset-path.util';
import {
  ArtistCard,
  BaseUser,
  BaseUserWithSecrets,
  CreateUserInput,
  PublicCompactUser,
  UpdateUserInput,
  UserAccountStatus,
} from '@repo/common-lib/types/user';
import { UserSchema } from '@repo/common-lib/schemas/user';
import { EnumType } from '@repo/common-lib/constants/enums';
import { addDays, addMinutes, addMonths } from 'date-fns';
import { UsernameRedirect } from '@repo/common-lib/types/username-history';
import { UsernameHistoryRepository } from '../username-history/username-history.repository';
import { IndexArtistsRequest } from './requests/index-artists.request';
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from '@repo/backend-lib/utils';
import { ProfileStatusService } from '../profile-status/profile-status.service';
import { UpdateProfileStatusEvent } from '../profile-status/events/update-profile-status.event';
import { CancelSubscriptionRenewalEvent } from '../plan-subscriptions/events/cancel-subscription-renewal.event';
import { RequestAccountDeletionRequest } from './requests/request-account-deletion.request';
import { accountDeletionDate } from '@repo/common-lib/utils/account-deletion';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { TempUploadService } from 'src/common/services/temp-upload.service';
import { withUserLock } from 'src/common/utils/user-lock';
import { ArtistPublicPagesChangedEvent } from '../edge-cache/events/artist-public-pages-changed.event';
import { AccountDeletionCodeMail } from './mails/account-deletion-code.mail';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { AccountDeletionCodeResult } from '@repo/common-lib/types/user';
import {
  CACHE_KEY_ACCOUNT_DELETION_CODE,
  CACHE_KEY_ACCOUNT_DELETION_CODE_COOLDOWN,
  CACHE_KEY_ACCOUNT_DELETION_CODES_SENT,
} from '@repo/common-lib/constants/cache';
import {
  ACCOUNT_DELETION_CODE_TTL_MINUTES,
  MAX_ACCOUNT_DELETION_CODE_ATTEMPTS,
  MAX_ACCOUNT_DELETION_CODES_PER_DAY,
  TWOFA_RESEND_COOLDOWN_SECONDS,
} from '@repo/common-lib/constants/limits';
import { apiLogConfig } from 'src/common/utils/api-logger';

/** One lock for sending and checking deletion codes, so their reads and writes never interleave. */
const deletionLockKey = (userId: number) => `account-deletion:${userId}`;

/** What the cache holds for a pending deletion code. Never the code itself. */
type PendingDeletionCode = { hash: string; attempts: number; issued_at: string; expires_at: string };

/** `users.public_id` is a UUID; anything else must never reach a recursive storage delete. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Generated usernames are at most 20 chars: a base of up to 12, then an 8-char random suffix. */
const USERNAME_BASE_MAX_LENGTH = 12;

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
    private readonly usernameHistoryRepository: UsernameHistoryRepository,
    private readonly storageService: StorageService,
    private readonly accountDeletionCodeMail: AccountDeletionCodeMail,
  ) { }

  /**
   * The artist's public pages show what just changed: purge their edge cache. Fire-and-forget; the
   * listener never throws. `usernames` adds names the processor cannot resolve on its own.
   */
  private emitArtistPagesChanged(userId: number, usernames?: string[]): void {
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(userId, usernames),
    );
  }

  /** No-op when `language` already matches; safe to call on every authenticated request. */
  async updateLanguageIfChanged(id: number, language: EnumType<'LANGUAGE_CODE'>): Promise<void> {
    await this.userRepository.updateLanguageIfChanged(id, language);
  }

  // Raw repository pass-throughs for the auth flows: no side effects, events or cache purges.
  findOneBy(column: keyof UserSchema, value: any): Promise<BaseUser> {
    return this.userRepository.findOneBy(column, value);
  }

  /** Includes `password`, `twofa_code` and `twofa_attempts`: never return it to a client. */
  findOneByWithSecrets(column: string, value: any): Promise<BaseUserWithSecrets> {
    return this.userRepository.findOneByWithSecrets(column, value);
  }

  create(user: CreateUserInput): Promise<BaseUser> {
    return this.userRepository.create(user);
  }

  updateById(id: number, user: UpdateUserInput): Promise<BaseUser> {
    return this.userRepository.updateById(id, user);
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
      // Whether the username is still the random sign-up one: onboarding state, owner only.
      username_auto_generated,
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
    // Owner only: settings hides "change password" for OAuth accounts, which have none.
    if (result && caller?.id === id) {
      (result as typeof result & { has_password?: boolean }).has_password =
        await this.userRepository.hasPassword(id);
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

  /**
   * The part of `prefix` that `generateUniqueUsername` keeps: accents folded, anything outside
   * `[a-z0-9]` dropped, cut to leave room for the suffix. An empty result means the username would
   * be the meaningless `user…` fallback, so callers treat it as "no name to build from" (e.g.
   * `Иван` or a whitespace-only name).
   */
  static usernameBase(prefix: string | null | undefined): string {
    return normalizeUsername(prefix ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, USERNAME_BASE_MAX_LENGTH);
  }

  /**
   * A free username built from `prefix` plus a random suffix, e.g. `juan` → `juank3x9q2mf`. Valid
   * for the register rules (3–20 chars, `[a-z0-9]`): accents are folded and anything else dropped,
   * and an empty prefix falls back to `user`. 8 suffix chars give 36^8 (~2.8e12) options, so the
   * first try is free in practice; the loop only covers the rare collision. It reads the DB, not
   * the 7-day `usernameExists` cache, and skips names reserved for another user's redirects.
   */
  async generateUniqueUsername(prefix: string): Promise<string> {
    const SUFFIX_LENGTH = 8;
    const MAX_ATTEMPTS = 5;
    const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const base = UserService.usernameBase(prefix) || 'user';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      let suffix = '';
      for (let i = 0; i < SUFFIX_LENGTH; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
      const candidate = `${base}${suffix}`;

      const [taken, reserved] = await Promise.all([
        this.userRepository.usernameExists(candidate),
        this.usernameHistoryRepository.isReservedForOtherUser(candidate),
      ]);
      if (!taken && !reserved) return candidate;
    }
    throw new ConflictException('Could not generate a unique username');
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
    return this.moderateAndStoreProfileImage({ user, buffer, kind, nameParts, targetSizeMb });
  }

  /** Re-encode, moderate, store: shared by presigned uploads and provider avatars. */
  private async moderateAndStoreProfileImage({
    user,
    buffer,
    kind,
    nameParts,
    targetSizeMb,
  }: {
    user: { id: number; public_id: string };
    buffer: Buffer;
    kind: 'avatar' | 'banner';
    nameParts: (string | null | undefined)[];
    targetSizeMb: number;
  }): Promise<string> {
    let optimized: Buffer;
    try {
      optimized = await this.helpers.optimizeImage({ asset: buffer, targetSizeMb });
    } catch {
      // Sharp failing to decode is how bytes that are not an image surface here: the presigned
      // PUT accepts any body, whatever `content_type` the client declared.
      this.logService.warn(
        'Profile image rejected',
        { user_id: user.id, kind, reason: 'invalid_image' },
        { operation: 'profile-image' },
      );
      throw new BadRequestException('Uploaded file is not a valid image');
    }
    // Inline, not a CDN URL: the provider had to download a just-written key, always a CDN cache
    // miss, and timed out on it ("Unable to download content from the provided URL"). The bytes
    // are already in hand and bounded (0.3MB avatar / 1MB banner after re-encoding).
    const { moderation } = await this.aiService.moderateContent(
      `data:image/webp;base64,${optimized.toString('base64')}`,
      { user_id: user.id },
      apiLogConfig(),
    );
    if (!moderation.is_allowed) {
      this.logService.warn(
        'Profile image rejected',
        { user_id: user.id, kind, reason: 'moderation' },
        { operation: 'profile-image' },
      );
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

  /**
   * Imports the sign-in provider's profile picture as the user's avatar, only while they have none.
   * Best effort and never throws: the caller does not wait for it, and sign-in must not depend on
   * it. `url` must already be checked against the provider's image hosts (the caller does that).
   * The bytes go through the same re-encode and moderation as an upload.
   */
  async importProviderAvatar({
    user,
    url,
    provider,
    nameParts,
  }: {
    user: { id: number; public_id: string };
    url: string;
    provider: string;
    nameParts: (string | null | undefined)[];
  }): Promise<void> {
    const fields = { operation: 'profile-image' };
    try {
      if (await this.userRepository.getAvatar(user.id)) return;

      const buffer = await this.downloadImage(url, MAX_IMAGE_UPLOAD_BYTES);
      const path = await this.moderateAndStoreProfileImage({
        user,
        buffer,
        kind: 'avatar',
        nameParts,
        targetSizeMb: 0.3,
      });

      // Conditional: an avatar uploaded while this ran wins, and ours is removed.
      if (!(await this.userRepository.setAvatarIfEmpty(user.id, path))) {
        await this.helpers.deleteAsset(path);
        this.logService.info('Provider avatar skipped', { user_id: user.id, provider, reason: 'avatar_already_set' }, fields);
        return;
      }

      this.eventEmitter.emit(
        UPDATE_PROFILE_STATUS_EVENT,
        new UpdateProfileStatusEvent(user.id, { has_avatar_field: true }),
      );
      this.emitArtistPagesChanged(user.id);
      this.logService.success('Provider avatar imported', { user_id: user.id, provider }, fields);
    } catch (error: unknown) {
      // A rejected image already logged its warn in `moderateAndStoreProfileImage`.
      if (error instanceof MediaModerationException || error instanceof BadRequestException) return;
      this.logService.error(
        'Provider avatar import failed',
        {
          user_id: user.id,
          provider,
          error_name: error instanceof Error ? error.name : typeof error,
          error_message: error instanceof Error ? error.message : String(error),
          // fetch wraps the real reason (`unexpected redirect`, ENOTFOUND, timeout) in `cause`.
          error_cause:
            error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
        },
        fields,
      );
    }
  }

  /**
   * GET `url` into memory, at most `maxBytes`. No redirects: the caller vetted the host, and a
   * redirect could point anywhere (internal addresses included).
   */
  private async downloadImage(url: string, maxBytes: number): Promise<Buffer> {
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: { accept: 'image/*' },
    });
    if (!response.ok || !response.body) {
      throw new Error(`Avatar download answered ${response.status}`);
    }
    if (!response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error('Avatar download is not an image');
    }
    if (Number(response.headers.get('content-length') ?? 0) > maxBytes) {
      throw new Error('Avatar download too large');
    }

    // Content-Length can lie or be missing: count the bytes as they arrive.
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Avatar download too large');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Runs after the new username is saved. The old one stays reserved for the user for
   * `USERNAME_RESERVATION_DAYS` (its URLs redirect to the new one meanwhile); a reservation they
   * had on the new one is dropped, since that name is live again. The "exists" cache is cleared only
   * now, so a read racing the write cannot re-cache the old state.
   */
  private async reservePreviousUsername(
    userId: number,
    previousUsername: string,
    newUsername: string,
  ): Promise<void> {
    await this.usernameHistoryRepository.release(userId, newUsername);
    await this.usernameHistoryRepository.reserve({
      user_id: userId,
      username: previousUsername,
      reserved_until: addDays(new Date(), USERNAME_RESERVATION_DAYS),
    });
    await this.helpers.deleteManyCached([
      CACHE_KEY_USERNAME_EXISTS(previousUsername),
      CACHE_KEY_USERNAME_EXISTS(newUsername),
    ]);
  }

  /**
   * The current username behind a reserved old one (`null` when there is none).
   *
   * Deliberately uncached. The answer depends on the owner's visibility (ban, deactivation,
   * deletion request), and a cached answer would keep revealing a hidden account's new name until
   * it expired. It is only asked for usernames that do not exist, and it is one unique-index
   * lookup, so there is nothing worth caching.
   */
  async findUsernameRedirect(username: string): Promise<UsernameRedirect> {
    return await this.usernameHistoryRepository.findRedirect(username);
  }

  async update(id: number, request: UpdateUserRequest) {
    // A username change is a check-then-write on the monthly count: two parallel renames would
    // both pass it. The username dialog sends nothing else, so the locked section stays short.
    if (!request.username) return this.updateUnlocked(id, request);
    return withUserLock(`username-change:${id}`, 30_000, () => this.updateUnlocked(id, request));
  }

  private async updateUnlocked(
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
    const previousUsername = user.username;
    const usernameChanged = Boolean(
      userUpdateData.username && userUpdateData.username !== previousUsername,
    );
    if (usernameChanged) {
      const periodExpired = user.next_username_reset && new Date() >= user.next_username_reset;
      const effectiveCount = periodExpired ? 0 : user.username_reset_count;

      if ((effectiveCount >= MAX_USERNAME_RESET) && !user.username_auto_generated) {
        throw new BadRequestException(
          `Username change limit reached (${MAX_USERNAME_RESET} per month). Available again on ${user.next_username_reset.toDateString()}.`,
        );
      }

      // A name another user moved away from in the last `USERNAME_RESERVATION_DAYS` is still theirs;
      // one this user moved away from is not blocked, so they can take it back.
      const [usernameTaken, usernameReserved] = await Promise.all([
        this.userRepository.usernameExists(userUpdateData.username),
        this.usernameHistoryRepository.isReservedForOtherUser(userUpdateData.username, user.id),
      ]);
      if (usernameTaken || usernameReserved) {
        throw ApiException.usernameTaken();
      }

      if (!user.username_auto_generated) userUpdateData.username_reset_count = effectiveCount + 1;
      if (!user.next_username_reset || periodExpired) {
        userUpdateData.next_username_reset = addMonths(new Date(), 1);
      }
      userUpdateData.username_auto_generated = false;
    }


    const editCategories = categories && categories.length;
    if (editCategories) {
      await this.helpers.deleteCached(CACHE_KEY_USER_CATEGORIES(user.id), {
        appended_language: true,
      });
    }

    const [userUpdated] = await Promise.all([
      // The checks above are a read: two users racing for the same free name both pass them, and
      // the unique index on `users.username` rejects the second write. That is a 409, not a 500.
      this.userRepository.updateById(user.id, userUpdateData).catch((error: unknown) => {
        if (usernameChanged && error instanceof DbUniqueViolationException) {
          throw ApiException.usernameTaken();
        }
        throw error;
      }),
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

    if (usernameChanged) {
      await this.reservePreviousUsername(user.id, previousUsername, userUpdateData.username);
      // Public handles, not PII: the audit trail behind the username redirects.
      this.logService.info(
        'Username changed',
        {
          user_id: user.id,
          previous_username: previousUsername,
          username: userUpdateData.username,
          username_reset_count: userUpdateData.username_reset_count,
        },
        { operation: 'username-change' },
      );
    }

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

    const shouldGenerateMetadata = user.name != userUpdateData.name || user.surname != userUpdateData.surname || user.profession != userUpdateData.profession || user.short_biography != userUpdateData.profession;

    if (shouldGenerateMetadata) {
      await QueueHelper.createGenerateSingleEntityMetadataJob(
        { entity: 'user', id: user.id, user_id: user.id },
        { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
        apiLogConfig(),
      );
    }
    // After the rename's reservation and cache clear. Both names are passed so the purge covers
    // the old URLs (now 308s) even if the reservation read lags.
    this.emitArtistPagesChanged(
      user.id,
      usernameChanged ? [previousUsername, userUpdateData.username] : undefined,
    );
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

    // OAuth-only accounts have no password to match (bcrypt throws on a null hash).
    const passwordMatch = !!user.password && (await compare(request.old_password, user.password));
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
    this.logService.info(
      'Password changed',
      { user_id: user.id, other_sessions_revoked: true },
      { operation: 'password-change' },
    );
    return updatedUser;
  }
  async banUser(userId: number, reason: string) {
    const bannedUser = await this.userRepository.updateById(userId, {
      banned: true,
      banned_reason: reason,
    });
    // resolveUserAuth does not read `banned`, so live sessions must be ended here.
    await this.userSessionsService.expireAllForUser(userId);
    this.emitArtistPagesChanged(userId);
    this.logService.warn('User banned', { user_id: userId, reason }, { operation: 'ban' });
    return bannedUser;
  }

  /**
   * Emails the code that confirms an account deletion, replacing any pending one. One approach for
   * every account: OAuth accounts have no password to re-enter, and proving the inbox works for all.
   * The code is stored hashed in Redis for `ACCOUNT_DELETION_CODE_TTL_MINUTES`. The resend cooldown
   * has its own key: burning or using the code must not reset it, or codes could be cycled freely.
   */
  async sendDeletionCode(userId: number): Promise<AccountDeletionCodeResult> {
    return withUserLock(deletionLockKey(userId), 30_000, () => this.sendDeletionCodeLocked(userId), {
      waitMs: 5_000,
    });
  }

  private async sendDeletionCodeLocked(userId: number): Promise<AccountDeletionCodeResult> {
    const fields = { operation: 'account-deletion' };
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.deletion_requested_at) {
      throw new ConflictException('Account deletion was already requested');
    }

    const cooldownKey = CACHE_KEY_ACCOUNT_DELETION_CODE_COOLDOWN(userId);
    const lastSentAt = await this.helpers.getCached<string>(cooldownKey);
    if (lastSentAt) {
      const waitSeconds = Math.max(
        1,
        TWOFA_RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000),
      );
      throw new HttpException(`Please wait ${waitSeconds} seconds before asking for a new code`, 429);
    }

    // With the cooldown alone a stolen session could still get 1,440 codes (7,200 guesses) a day.
    const sentKey = CACHE_KEY_ACCOUNT_DELETION_CODES_SENT(userId);
    const sent = await this.helpers.getCached<{ count: number; window_ends_at: string }>(sentKey);
    const sentWindowMs = sent ? new Date(sent.window_ends_at).getTime() - Date.now() : 0;
    if (sent && sentWindowMs > 0 && sent.count >= MAX_ACCOUNT_DELETION_CODES_PER_DAY) {
      this.logService.warn('Account deletion code refused', { user_id: userId, reason: 'daily_limit' }, fields);
      throw new ApiException(
        API_ERRORS.ACCOUNT_DELETION_CODE_DAILY_LIMIT,
        'Too many codes today, try again tomorrow',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Digits only, like the 2FA code: easy to read off a phone, number pad on mobile.
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const issuedAt = new Date();
    const expiresAt = addMinutes(issuedAt, ACCOUNT_DELETION_CODE_TTL_MINUTES);
    const key = CACHE_KEY_ACCOUNT_DELETION_CODE(userId);
    const record: PendingDeletionCode = {
      hash: await hash(code),
      attempts: 0,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
    await Promise.all([
      this.helpers.setCached(key, record, ACCOUNT_DELETION_CODE_TTL_MINUTES * 60_000),
      this.helpers.setCached(cooldownKey, issuedAt.toISOString(), TWOFA_RESEND_COOLDOWN_SECONDS * 1000),
    ]);

    try {
      await this.mailService.send(
        this.accountDeletionCodeMail.setData({ email: user.email, name: user.name ?? null, code }, user.language),
      );
    } catch (error: unknown) {
      // Awaited, unlike 2FA: the dialog asks for the code next, so a lost mail must say so now.
      // The cooldown goes too: nothing reached the inbox, so an immediate retry is fair.
      await this.helpers.deleteManyCached([key, cooldownKey]).catch(() => undefined);
      this.logService.error(
        'Failed to send account deletion code',
        {
          user_id: userId,
          error_name: error instanceof Error ? error.name : typeof error,
          error_message: maskEmailAddresses(error instanceof Error ? error.message : String(error)),
        },
        fields,
      );
      throw new ServiceUnavailableException('Could not send the code, try again later');
    }

    // Counted once the mail went out: a failed send costs the user nothing.
    await this.helpers.setCached(
      sentKey,
      sent && sentWindowMs > 0
        ? { ...sent, count: sent.count + 1 }
        : { count: 1, window_ends_at: new Date(Date.now() + 86_400_000).toISOString() },
      sent && sentWindowMs > 0 ? sentWindowMs : 86_400_000,
    );

    // Never the code.
    this.logService.info('Account deletion code sent', { user_id: userId }, fields);
    return {
      expires_at: expiresAt,
      resend_available_at: new Date(issuedAt.getTime() + TWOFA_RESEND_COOLDOWN_SECONDS * 1000),
    };
  }

  /**
   * Checks the pending deletion code without using it up. A wrong code counts an attempt; the code
   * is burned after `MAX_ACCOUNT_DELETION_CODE_ATTEMPTS`, and with the cooldown and daily cap
   * that leaves at most 25 guesses a day. Must
   * run under the deletion lock: the read-check-write of `attempts` is not atomic on its own.
   */
  private async verifyDeletionCode(userId: number, code: string): Promise<void> {
    const fields = { operation: 'account-deletion' };
    const key = CACHE_KEY_ACCOUNT_DELETION_CODE(userId);
    const pending = await this.helpers.getCached<PendingDeletionCode>(key);
    const remainingMs = pending ? new Date(pending.expires_at).getTime() - Date.now() : 0;
    if (!pending || remainingMs <= 0) {
      this.logService.warn('Account deletion rejected', { user_id: userId, reason: 'no_pending_code' }, fields);
      throw new BadRequestException('Invalid or expired code');
    }

    if (!(await compare(code, pending.hash))) {
      const attempts = pending.attempts + 1;
      const burned = attempts >= MAX_ACCOUNT_DELETION_CODE_ATTEMPTS;
      if (burned) {
        await this.helpers.deleteCached(key);
      } else {
        await this.helpers.setCached(key, { ...pending, attempts }, remainingMs);
      }
      this.logService.warn('Account deletion rejected', { user_id: userId, reason: 'wrong_code', attempts, code_burned: burned }, fields);
      throw new BadRequestException('Invalid or expired code');
    }
  }

  /**
   * Flags the account for deletion. It is hidden from every public surface right away (see
   * `visibleAccountSql`) and hard-deleted by `AccountDeletionTask` after the grace period, unless the
   * owner reopens it first. Needs the code emailed by `sendDeletionCode`: a stolen session must not
   * be able to schedule this. Serialized per user, so parallel guesses each count an attempt and
   * parallel correct submissions can't both cancel the subscription.
   */
  async requestDeletion(userId: number, request: RequestAccountDeletionRequest) {
    return withUserLock(deletionLockKey(userId), 30_000, () => this.requestDeletionLocked(userId, request), {
      waitMs: 5_000,
    });
  }

  private async requestDeletionLocked(userId: number, request: RequestAccountDeletionRequest) {
    const user = await this.userRepository.findOneBy('id', userId);
    if (!user) throw new UnauthorizedException();
    if (user.deletion_requested_at) {
      throw new ConflictException('Account deletion was already requested');
    }
    await this.verifyDeletionCode(userId, request.code);
    const codeKey = CACHE_KEY_ACCOUNT_DELETION_CODE(userId);

    // Before flagging, and before using the code up: if the provider call fails, nothing has
    // changed and the user can retry with the same code.
    if (request.cancel_subscription) {
      await this.eventEmitter.emitAsync(
        CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
        new CancelSubscriptionRenewalEvent(userId),
      );
    }

    // Atomic: a request that raced in some other way finds the flag already set and gets the 409.
    const requestedAt = await this.userRepository.flagForDeletion(userId);
    // Single use, whatever the outcome from here.
    await this.helpers.deleteCached(codeKey);
    if (!requestedAt) {
      throw new ConflictException('Account deletion was already requested');
    }
    this.logService.info(
      'Account deletion requested',
      { user_id: userId, cancel_subscription: Boolean(request.cancel_subscription) },
      { operation: 'account-deletion' },
    );
    this.emitArtistPagesChanged(userId);

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
      this.logService.info('Account deletion cancelled', { user_id: userId }, {
        operation: 'account-deletion',
      });
      this.emitArtistPagesChanged(userId);
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

  /**
   * Hard delete, run by the account-deletion job once the grace period is over. Every step is
   * idempotent, so a retry after a partial failure just finishes the job: payments first (a failure
   * there must not leave a billed customer without an account), then the user's whole storage
   * folder, then the rows in one atomic statement, then caches.
   *
   * Safe against a concurrent "reopen": that is refused once the deletion date has passed
   * (`UserRepository.unflagDeletion`), and this only runs past it — both on the database clock —
   * and the final delete re-checks the condition under a row lock anyway.
   *
   * `forceDelete` skips every deletion-state check (flagged, grace period over), both here and in
   * the final delete: the account goes now, whatever its state. Every other step still runs.
   */
  async deleteAccount(
    userId: number,
    forceDelete = false,
  ): Promise<{ deleted: boolean; reason?: string }> {
    // Per-call operation: never the name builder on this shared DI logger.
    const op = { operation: 'hard-delete' };
    const log = {
      info: (message: string, extra?: Record<string, unknown>) => this.logService.info(message, { user_id: userId, ...extra }, op),
      warn: (message: string, extra?: Record<string, unknown>) => this.logService.warn(message, { user_id: userId, ...extra }, op),
      error: (message: string, extra?: Record<string, unknown>) => this.logService.error(message, { user_id: userId, ...extra }, op),
    };
    // Every early return is logged: "why didn't it delete" is the usual question.
    const skip = (reason: string) => {
      log.info('Account deletion step skipped', { step: 'hard-delete', reason });
      return { deleted: false, reason };
    };

    if (!forceDelete) {
      const state = await this.userRepository.getDeletionState(
        userId,
        ACCOUNT_DELETION_GRACE_DAYS,
        ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
      );
      if (!state) return skip('not-found');
      if (!state.flagged) return skip('reopened');
      if (!state.due) return skip('not-due');
    }

    // `findById` throws 404 on a missing row; forced, nothing above has checked it exists.
    const user = await this.userRepository.findById(userId).catch((error: unknown) => {
      if (error instanceof HttpException && error.getStatus() === 404) return null;
      throw error;
    });
    if (!user) return skip('not-found');
    // The prefix below is deleted recursively: never let a malformed id widen it to `users/`.
    if (!UUID_PATTERN.test(user.public_id)) {
      throw new Error(`Refusing to delete storage for user [${userId}]: unexpected public_id`);
    }
    log.info('Hard-deleting account', { force_delete: forceDelete });

    // Handled by `PlanSubscriptionsService` (which imports this module, hence the event). Its
    // listener rethrows, so a billing failure rejects here and the job retries. No listener at all
    // would resolve with `[]` and silently skip billing: refuse that instead.
    const handled = await this.eventEmitter.emitAsync(
      CANCEL_ACCOUNT_PAYMENTS_EVENT,
      new CancelAccountPaymentsEvent(userId, user.stripe_customer_id ?? null),
    );
    if (handled.length === 0) {
      throw new Error(`No listener cancelled the payments of user [${userId}]`);
    }

    // Trailing slash: `users/<uuid>` would otherwise also match a sibling key starting with it.
    const storageDeleted = await this.storageService.deleteDirectory(`users/${user.public_id}/`);
    if (!storageDeleted) {
      // Throw before touching the DB: the folder must not outlive the row that points at it.
      throw new Error(`Could not delete storage folder of user [${userId}]`);
    }
    log.info('Account storage deleted', { prefix_kind: 'user' });
    // Uploads never claimed live in the private bucket, outside that folder. Best-effort: its
    // lifecycle rule expires them within days anyway, so a failure here — including a missing
    // PRIVATE_BUCKET, which throws — must not abort a deletion whose media is already gone.
    const uploadsDeleted = await this.tempUploads
      .deleteUser(user.public_id)
      .catch(() => false);
    if (!uploadsDeleted) {
      log.error('Could not delete pending uploads');
    }

    // Read before the delete: the row and its `username_history` (FK cascade) go with it, and the
    // edge purge below can no longer resolve them. Only the purge needs this, so a failed read is
    // logged and the deletion goes ahead: the old names' pages then fall back to the edge TTL.
    const reservedUsernames = await this.usernameHistoryRepository
      .findReservedByUser(userId)
      .catch((error: unknown) => {
        log.warn('Could not read the reserved usernames for the edge purge', {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
        return [] as string[];
      });

    const rowsDeleted = await this.userRepository.hardDeleteById(userId, ACCOUNT_DELETION_GRACE_DAYS, {
      force: forceDelete,
    });
    if (!rowsDeleted) {
      // Not forced: only reachable through a manual DB edit between the checks above and here.
      // Forced: the row itself vanished in between (a concurrent delete).
      log.error(
        forceDelete
          ? 'User was not deleted: row no longer exists at delete time'
          : 'User was not deleted: no longer flagged/due at delete time',
      );
      return { deleted: false, reason: 'changed-during-delete' };
    }

    await this.helpers.deleteManyCached([
      CACHE_KEY_USER_PUBLIC_ID(userId),
      CACHE_KEY_USERNAME_EXISTS(user.username),
      CACHE_KEY_USER_CATEGORIES(userId),
      CACHE_KEY_USER_EXTRA_DATA(userId),
      CACHE_KEY_PROFILE_STATUS(userId),
      CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
    ]);
    this.emitArtistPagesChanged(userId, [user.username, ...reservedUsernames]);

    log.info('Account deleted');
    return { deleted: true };
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
    this.emitArtistPagesChanged(userId);
    return { is_active: false };
  }

  async reactivate(userId: number) {
    if (!(await this.userRepository.setActive(userId, true))) {
      throw new ConflictException('Account is already active');
    }
    this.emitArtistPagesChanged(userId);
    return { is_active: true };
  }

  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    // A visit to `/artists/{name}` before anyone owned it cached "does not exist" for a week, which
    // would 404 the new owner's page. Logged, not thrown: onboarding below must still run.
    // Per-call operation: never the name builder on this shared DI logger.
    const fields = { operation: 'new-user' };
    await this.helpers
      .deleteManyCached([CACHE_KEY_USERNAME_EXISTS(event.user.username)])
      .catch((error: unknown) =>
        this.logService.error(
          'Username cache clear failed for new user',
          { user_id: event.user.id, error_name: error instanceof Error ? error.name : typeof error },
          fields,
        ),
      );
    // Which step failed decides the level: without a Stripe customer the account can never pay.
    let step = 'email-preferences';
    try {
      // Priority: enqueue email preference upsert immediately
      await QueueHelper.createOrUpdateEmailPreferenceJob({
        email: event.user.email,
        user_id: event.user.id,
      }, apiLogConfig());

      //Create stripe customer
      step = 'stripe-customer';
      // The event carries a core user without profile fields. Email sign-ups have no name yet and a
      // random username, which must not become the customer's name, so it is left unset.
      const profile = await this.userRepository.findByIdCompact(event.user.id);
      const customerName = [profile.name, profile.surname]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
      const stripeCustomer = await stripe.customers.create({
        email: event.user.email,
        ...(customerName ? { business_name: customerName } : {}),
        metadata: StripeService.traceMetadata(event.user.id),
      });
      // Ids only: the customer object carries email, phone and address.
      this.logService.info(
        'Stripe customer created',
        { user_id: event.user.id, stripe_customer_id: stripeCustomer.id },
        fields,
      );
      //UPDATE USER
      step = 'store-customer';
      await this.userRepository.updateById(event.user.id, {
        stripe_customer_id: stripeCustomer.id,
      });

      //Handle set free plan via event (avoids circular dependency)
      step = 'free-plan';
      await this.eventEmitter.emitAsync(
        SET_FREE_SUBSCRIPTION_EVENT,
        new SetFreeSubscriptionEvent(event.user.id),
      );

      //Create a user extra data via event
      step = 'extra-data';
      await this.eventEmitter.emitAsync(
        SET_INITIAL_USER_EXTRA_DATA_EVENT,
        new SetInitialUserExtraDataEvent(event.user.id),
      );
      step = 'profile-status';
      await this.profileStatusService.create({ user_id: event.user.id });
      //Notify user
      step = 'welcome-mail';
      // Rendered now and delivered after the delay, so a name saved meanwhile is not in it; without
      // a name the mail uses its nameless greeting, never the random username.
      await this.mailService.sendAsync(this.notifyNewUserMail.setUser(profile, profile.language), {
        delay: 3 * 60 * 1000
      }, apiLogConfig());
      this.logService.info('New user onboarding completed', { user_id: event.user.id }, fields);
    } catch (error) {
      const failure = {
        step,
        error_name: error instanceof Error ? error.name : typeof error,
        // Stripe rejects some addresses with "Invalid email address: <value>".
        error_message: maskEmailAddresses(error instanceof Error ? error.message : 'Unknown error'),
      };
      // Until someone runs `dbcli create:stripe-customers`, this account cannot subscribe.
      if (step === 'stripe-customer' || step === 'store-customer') {
        this.logService.critical('Stripe customer creation failed for new user', { user_id: event.user.id, ...failure }, fields);
      } else {
        this.logService.error('New user onboarding failed', { user_id: event.user.id, ...failure }, fields);
      }
      throw error;
    }
  }
}
