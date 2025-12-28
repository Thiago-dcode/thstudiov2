import { HttpException, Inject, Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { s3StorageConfig } from 'src/config/storage';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { RequestService } from 'src/common/services/request.service';
import { NEW_USER_EVENT } from '@repo/common-lib/constants/constants';
import { FindUserRequest } from './requests/find-user.request';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly planSubscriptionService: PlanSubscriptionsService,
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly requestService: RequestService,
    private readonly storageService: StorageService,
    private readonly compressService: CompressService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly notifyNewUserMail: NotifyNewUserMail,
  ) {}

  async findAll() {
    return `This action returns all user`;
  }

  protected async getAsset(path: string) {
    let asset = (await this.cacheManager.get(path)) as string;
    if (!asset) {
      asset = await this.storageService.getUrl(path);
      await this.cacheManager.set(
        path,
        asset,
        s3StorageConfig.signedUrlExpiration * 900, //Substract 10% to avoid possible s3 404
      );
    }
    return asset;
  }
  async findOne(id: number, findUserRequest?: FindUserRequest) {
    if (findUserRequest.format === 'COMPACT') {
      return await this.userRepository.findOneBy('id', id, 'COMPACT');
    }
    const result = await this.userRepository.findById(id);
    if (result?.avatar) {
      result.avatar = await this.getAsset(result.avatar);
    }
    if (result?.banner) {
      result.banner = await this.getAsset(result.banner);
    }
    return result;
  }

  async findOneByStripeId(id: string) {
    return await this.userRepository.findOneBy(
      'stripe_customer_id',
      id,
      'COMPACT',
    );
  }
  async handleStoreAsset({
    asset,
    targetSizeMb,
    path,
    targetQuality,
  }: {
    asset: Express.Multer.File;
    path: string;
    targetSizeMb: number;
    targetQuality?: number;
  }) {
    //Compress
    const targetSize = (targetSizeMb > 0 ? targetSizeMb : 1) * 1024;
    asset.buffer = await this.compressService.optimizeImageToWebp(
      asset,
      targetQuality ?? 90,
      asset.size > targetSize ? targetSize : asset.size,
    );
    const [result] = await Promise.all([
      this.storageService.write(asset, path),
      this.cacheManager.del(path),
    ]);
    if (!result) {
      throw new HttpException(
        `An error ocurred during storing asset: <<${path}>>`,
        500,
      );
    }
    return path;
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
    const [avatarPath, bannerPath] = await Promise.all([
      avatar && avatar.size > 0
        ? this.handleStoreAsset({
            asset: avatar,
            path: `users/${user.id}/avatar`,
            targetSizeMb: 1,
          })
        : Promise.resolve(undefined),
      banner && banner.size > 0
        ? this.handleStoreAsset({
            asset: banner,
            path: `users/${user.id}/banner`,
            targetSizeMb: 1,
          })
        : Promise.resolve(undefined),
    ]);
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
    const [userUpdated] = await Promise.all([
      this.userRepository.updateById(user.id, userUpdateData),
      categories && categories.length
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
        event.user,
      );
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] set free plan`, {
          result,
        });

      //Create a user extra data
      const extraData = await this.userExtraDataRepository.create({
        user_id: event.user.id,
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
